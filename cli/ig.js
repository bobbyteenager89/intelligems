#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Resolve real path through symlinks so __dirname works when invoked via ~/.local/bin/ig
const SCRIPT_DIR = path.dirname(fs.realpathSync(__filename));
const CONTENT_DIR = path.join(SCRIPT_DIR, '..', 'content');
const BUDGET_HOURS = 40;
const BUDGET_RESET_DAY = 7;
const PORT = 3040;
const CATEGORIES = ['research', 'strategy', 'meeting', 'admin', 'content', 'building'];

function getCurrentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayShort() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Parse duration string to hours:
 * "2h" -> 2.0
 * "45m" -> 0.75
 * "1.5h" -> 1.5
 * "1h30m" -> 1.5
 * "1230-430" -> time range (hours between)
 */
function parseDuration(str) {
  str = str.trim().toLowerCase();

  // Time range: 1230-430 or 230-530
  if (/^\d{3,4}-\d{3,4}$/.test(str)) {
    const [startStr, endStr] = str.split('-');
    const parseTime = (s) => {
      s = s.padStart(4, '0');
      const h = parseInt(s.slice(0, -2), 10);
      const m = parseInt(s.slice(-2), 10);
      return h + m / 60;
    };
    const start = parseTime(startStr);
    let end = parseTime(endStr);
    if (end < start) end += 12; // handle PM
    return Math.round((end - start) * 4) / 4; // round to nearest 15 min
  }

  // "1h30m"
  const combined = str.match(/^(\d+)h(\d+)m$/);
  if (combined) return parseInt(combined[1]) + parseInt(combined[2]) / 60;

  // "2h" or "2.5h"
  const hoursOnly = str.match(/^(\d+\.?\d*)h$/);
  if (hoursOnly) return parseFloat(hoursOnly[1]);

  // "45m"
  const minsOnly = str.match(/^(\d+)m$/);
  if (minsOnly) return Math.round((parseInt(minsOnly[1]) / 60) * 4) / 4; // nearest 15

  // Plain number
  const num = parseFloat(str);
  if (!isNaN(num)) return num;

  throw new Error(`Cannot parse duration: "${str}"`);
}

function parseTimeTable(content) {
  const entries = [];
  for (const line of content.split('\n')) {
    const match = line.match(/^\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
    if (!match) continue;
    const [, date, timeBlock, hoursStr, category, description] = match.map(s => s.trim());
    if (date === 'Date' || date.startsWith('-')) continue;
    const hours = parseFloat(hoursStr);
    if (isNaN(hours)) continue;
    entries.push({ date, timeBlock, hours, category: category.toLowerCase(), description });
  }
  return entries;
}

function getMonthlyLog(yearMonth) {
  const filePath = path.join(CONTENT_DIR, `time/${yearMonth}.md`);
  if (!fs.existsSync(filePath)) return { entries: [], totalHours: 0, byCategory: {} };

  const content = fs.readFileSync(filePath, 'utf-8');
  const entries = parseTimeTable(content);
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const byCategory = {};
  for (const e of entries) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.hours;
  }
  return { entries, totalHours, byCategory };
}

function appendEntry(yearMonth, date, timeBlock, hours, category, description) {
  const filePath = path.join(CONTENT_DIR, `time/${yearMonth}.md`);
  const row = `| ${date} | ${timeBlock} | ${hours.toFixed(2)} | ${category.charAt(0).toUpperCase() + category.slice(1)} | ${description} |`;

  if (!fs.existsSync(filePath)) {
    const monthName = new Date(yearMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
    const content = `# ${monthName}\n\n| Date | Time Block | Hours | Category | Description |\n|------|------------|-------|----------|-------------|\n${row}\n`;
    fs.writeFileSync(filePath, content, 'utf-8');
  } else {
    const existing = fs.readFileSync(filePath, 'utf-8').trimEnd();
    fs.writeFileSync(filePath, existing + '\n' + row + '\n', 'utf-8');
  }
}

function getDaysUntilReset() {
  const today = new Date();
  const day = today.getDate();
  if (day <= BUDGET_RESET_DAY) return BUDGET_RESET_DAY - day;
  const nextReset = new Date(today.getFullYear(), today.getMonth() + 1, BUDGET_RESET_DAY);
  return Math.ceil((nextReset - today) / (1000 * 60 * 60 * 24));
}

function getThisWeekEntries(entries) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  monday.setHours(0, 0, 0, 0);

  return entries.filter(e => {
    const [mm, dd] = e.date.split('/').map(Number);
    const entryDate = new Date(today.getFullYear(), mm - 1, dd);
    return entryDate >= monday;
  });
}

// Commands

function cmdLog(args) {
  if (args.length < 3) {
    console.error('Usage: ig log <duration> <category> "<description>"');
    process.exit(1);
  }

  const [durationStr, categoryRaw, ...rest] = args;
  const description = rest.join(' ').replace(/^["']|["']$/g, '');
  const category = categoryRaw.toLowerCase();

  if (!CATEGORIES.includes(category)) {
    console.error(`Unknown category: ${category}`);
    console.error(`Valid: ${CATEGORIES.join(', ')}`);
    process.exit(1);
  }

  let hours;
  try {
    hours = parseDuration(durationStr);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  const yearMonth = getCurrentYearMonth();
  const today = getTodayShort();
  const timeBlock = durationStr;

  appendEntry(yearMonth, today, timeBlock, hours, category, description);

  const log = getMonthlyLog(yearMonth);
  const remaining = BUDGET_HOURS - log.totalHours;

  console.log(`Logged ${hours.toFixed(2)}h ${category} -- ${description}`);
  console.log(`  ${log.totalHours.toFixed(1)} / ${BUDGET_HOURS}h used · ${remaining.toFixed(1)}h remaining`);
}

function cmdStatus() {
  const yearMonth = getCurrentYearMonth();
  const log = getMonthlyLog(yearMonth);
  const remaining = BUDGET_HOURS - log.totalHours;
  const pct = Math.round((log.totalHours / BUDGET_HOURS) * 100);
  const daysUntilReset = getDaysUntilReset();

  const bar = '#'.repeat(Math.floor(pct / 5)) + '.'.repeat(20 - Math.floor(pct / 5));

  console.log('');
  console.log(`  ${log.totalHours.toFixed(1)} / ${BUDGET_HOURS}h  [${bar}] ${pct}%`);
  console.log(`  ${remaining.toFixed(1)}h remaining · resets in ${daysUntilReset}d`);
  console.log('');

  if (Object.keys(log.byCategory).length > 0) {
    const sorted = Object.entries(log.byCategory).sort(([, a], [, b]) => b - a);
    for (const [cat, h] of sorted) {
      console.log(`  ${cat.padEnd(12)} ${h.toFixed(2)}h`);
    }
    console.log('');
  }
}

function cmdReport(args) {
  const copyToClipboard = args.includes('--copy');
  const yearMonth = getCurrentYearMonth();
  const log = getMonthlyLog(yearMonth);
  const weekEntries = getThisWeekEntries(log.entries);

  if (weekEntries.length === 0) {
    console.log('No entries this week yet.');
    return;
  }

  const byCat = {};
  for (const e of weekEntries) {
    byCat[e.category] = (byCat[e.category] || 0) + e.hours;
  }
  const weekTotal = weekEntries.reduce((s, e) => s + e.hours, 0);

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const lines = [
    `## Weekly Report -- ${today}`,
    '',
    '### Time Summary',
    '| Category | Hours |',
    '|----------|-------|',
    ...Object.entries(byCat)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, h]) => `| ${cat.charAt(0).toUpperCase() + cat.slice(1)} | ${h.toFixed(2)} |`),
    `| **Total** | **${weekTotal.toFixed(2)}** |`,
    '',
    `**Cumulative:** ${log.totalHours.toFixed(2)} of ${BUDGET_HOURS} hours`,
    '',
    '### This Week',
    ...weekEntries.map(e => `- ${e.date} · ${e.category} · ${e.hours}h · ${e.description}`),
  ].join('\n');

  console.log(lines);

  if (copyToClipboard) {
    try {
      execSync(`echo ${JSON.stringify(lines)} | pbcopy`);
      console.log('\nCopied to clipboard');
    } catch {
      console.error('\nFailed to copy to clipboard');
    }
  }
}

function cmdOpen() {
  console.log(`Opening localhost:${PORT}...`);
  execSync(`open http://localhost:${PORT}`);
}

// Main
const [, , command, ...args] = process.argv;

switch (command) {
  case 'log':
    cmdLog(args);
    break;
  case 'status':
    cmdStatus();
    break;
  case 'report':
    cmdReport(args);
    break;
  case 'open':
    cmdOpen();
    break;
  default:
    console.log('ig -- Intelligems time tracker');
    console.log('');
    console.log('Commands:');
    console.log('  ig log <duration> <category> "<description>"');
    console.log('  ig status');
    console.log('  ig report [--copy]');
    console.log('  ig open');
    console.log('');
    console.log('Duration formats: 2h, 45m, 1.5h, 1h30m, 1230-430');
    console.log('Categories:', CATEGORIES.join(', '));
    break;
}
