import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

function parseTimeTable(content: string) {
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

function parseTasksFromContent(content: string) {
  const tasks = [];
  for (const line of content.split('\n')) {
    const match = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
    if (match) tasks.push({ text: match[2].trim(), completed: match[1] === 'x' });
  }
  return tasks;
}

async function seed() {
  console.log('Seeding time entries...');

  const timeDir = path.join(process.cwd(), 'content/time');
  for (const file of fs.readdirSync(timeDir)) {
    if (!file.endsWith('.md')) continue;
    const yearMonth = file.replace('.md', '');
    const content = fs.readFileSync(path.join(timeDir, file), 'utf-8');
    const entries = parseTimeTable(content);
    for (const entry of entries) {
      await db.insert(schema.timeEntries).values({
        date: entry.date,
        timeBlock: entry.timeBlock,
        hours: entry.hours,
        category: entry.category,
        description: entry.description,
        yearMonth,
      });
    }
    console.log(`  ${yearMonth}: ${entries.length} entries`);
  }

  console.log('Seeding tasks...');

  const codeDirs = [
    path.join(process.cwd(), 'content/projects/code'),
    path.join(process.cwd(), 'content/projects/workstreams'),
  ];
  for (const dir of codeDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const slug = file.replace('.md', '');
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const { content } = matter(raw);
      const tasks = parseTasksFromContent(content);
      for (const task of tasks) {
        await db.insert(schema.tasks).values({
          projectSlug: slug,
          text: task.text,
          completed: task.completed,
        });
      }
      console.log(`  ${slug}: ${tasks.length} tasks`);
    }
  }

  console.log('Done!');
}

seed().catch(console.error);
