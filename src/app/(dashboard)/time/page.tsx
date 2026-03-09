'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, TrendingUp, ExternalLink } from 'lucide-react';
import { BUDGET_HOURS, BUDGET_RESET_DAY, TIME_CATEGORIES } from '@/lib/config';

interface TimeEntry {
  date: string;
  timeBlock: string;
  hours: number;
  category: string;
  description: string;
}

interface MonthlyLog {
  month: string;
  entries: TimeEntry[];
  totalHours: number;
  byCategory: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  meeting: 'bg-blue-500',
  research: 'bg-violet-500',
  strategy: 'bg-amber-500',
  admin: 'bg-slate-400',
  content: 'bg-emerald-500',
  building: 'bg-orange-500',
};

function getDaysUntilReset(): number {
  const today = new Date();
  const day = today.getDate();
  const reset = BUDGET_RESET_DAY;
  if (day <= reset) return reset - day;
  const nextReset = new Date(today.getFullYear(), today.getMonth() + 1, reset);
  return Math.ceil((nextReset.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getCurrentYearMonth(): string {
  const d = new Date();
  if (d.getDate() < BUDGET_RESET_DAY) {
    d.setDate(0); // move to last day of previous month
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getBillingPeriodLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const start = new Date(year, month - 1, BUDGET_RESET_DAY);
  const end = new Date(year, month, BUDGET_RESET_DAY - 1);
  const fmt = (d: Date) => d.toLocaleString('default', { month: 'short', day: 'numeric' });
  const endYear = end.getFullYear();
  return `${fmt(start)} – ${fmt(end)}, ${endYear}`;
}

function getThisWeekEntries(entries: TimeEntry[]): TimeEntry[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);

  return entries.filter(e => {
    const [mm, dd] = e.date.split('/').map(Number);
    const entryDate = new Date(today.getFullYear(), mm - 1, dd);
    return entryDate >= monday && entryDate <= today;
  });
}

export default function TimePage() {
  const [log, setLog] = useState<MonthlyLog | null>(null);
  const [hours, setHours] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [logging, setLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  const currentMonth = getCurrentYearMonth();

  useEffect(() => {
    fetch(`/api/time?month=${currentMonth}`)
      .then(r => r.json())
      .then(setLog);
  }, [currentMonth]);

  async function logTime() {
    if (!hours || !category || !description) return;
    setLogging(true);
    await fetch('/api/time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours, category, description, month: currentMonth }),
    });
    setLogging(false);
    setHours('');
    setCategory('');
    setDescription('');
    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 2000);
    fetch(`/api/time?month=${currentMonth}`).then(r => r.json()).then(setLog);
  }

  async function generateReport() {
    if (!log) return;
    const week = getThisWeekEntries(log.entries);
    const byCat: Record<string, number> = {};
    for (const e of week) {
      byCat[e.category.toLowerCase()] = (byCat[e.category.toLowerCase()] || 0) + e.hours;
    }
    const total = week.reduce((s, e) => s + e.hours, 0);

    const lines = [
      `## Weekly Report — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      '',
      '### Time Summary',
      '| Category | Hours |',
      '|----------|-------|',
      ...Object.entries(byCat).map(([cat, h]) => `| ${cat.charAt(0).toUpperCase() + cat.slice(1)} | ${h.toFixed(2)} |`),
      `| **Total** | **${total.toFixed(2)}** |`,
      '',
      `**Cumulative:** ${log.totalHours.toFixed(2)} of ${BUDGET_HOURS} hours`,
      '',
      '### This Week',
      ...week.map(e => `- ${e.date} · ${e.category} · ${e.hours}h · ${e.description}`),
    ].join('\n');

    await navigator.clipboard.writeText(lines);
    alert('Report copied to clipboard!');
  }

  const totalHours = log?.totalHours ?? 0;
  const remaining = BUDGET_HOURS - totalHours;
  const pct = Math.min(100, (totalHours / BUDGET_HOURS) * 100);
  const daysUntilReset = getDaysUntilReset();
  const thisWeekEntries = log ? getThisWeekEntries(log.entries) : [];

  const sortedCategories = log
    ? Object.entries(log.byCategory).sort(([, a], [, b]) => b - a)
    : [];
  const maxCatHours = sortedCategories[0]?.[1] ?? 1;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Time</h1>
      </div>

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Budget gauge */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-semibold tabular-nums">{totalHours.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm"> / {BUDGET_HOURS}h</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {getBillingPeriodLabel(currentMonth)}
            </span>
          </div>
          <Progress value={pct} className="h-2.5" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{Math.round(pct)}% used</span>
            <span>
              {remaining.toFixed(1)}h remaining · resets in {daysUntilReset}d
            </span>
          </div>
        </div>

        {/* Log time form */}
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Clock className="size-3.5" />
            Log Time
          </h2>
          <div className="flex gap-2">
            <Input
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="2h, 45m, 1.5h"
              className="w-28 text-sm"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-36 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {TIME_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description..."
              className="flex-1 text-sm"
              onKeyDown={e => e.key === 'Enter' && logTime()}
            />
            <Button
              onClick={logTime}
              disabled={logging || !hours || !category || !description}
              className="shrink-0"
              size="sm"
            >
              {logSuccess ? '✓' : 'Log'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Formats: 2h · 45m · 1.5h · 1h30m · Press Enter to log
          </p>
        </div>

        {/* By category */}
        {sortedCategories.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="size-3.5" />
              This Period by Category
            </h2>
            <div className="space-y-2.5">
              {sortedCategories.map(([cat, h]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-20 text-sm capitalize text-muted-foreground truncate">{cat}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CATEGORY_COLORS[cat] || 'bg-primary'}`}
                      style={{ width: `${(h / maxCatHours) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm tabular-nums w-12 text-right">{h.toFixed(2)}h</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* This week */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">This Week</h2>
            <Button variant="ghost" size="sm" onClick={generateReport} className="h-7 text-xs gap-1.5">
              <ExternalLink className="size-3" />
              Report
            </Button>
          </div>
          {thisWeekEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries this week yet.</p>
          ) : (
            <div className="space-y-1.5">
              {thisWeekEntries.slice().reverse().map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="tabular-nums text-muted-foreground w-10">{entry.date}</span>
                  <Badge variant="outline" className="capitalize text-xs">{entry.category}</Badge>
                  <span className="tabular-nums text-muted-foreground w-8">{entry.hours}h</span>
                  <span className="flex-1 truncate">{entry.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
