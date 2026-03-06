import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timeEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function getCurrentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayDate(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const month = url.searchParams.get('month') || getCurrentYearMonth();

  const entries = await db.select().from(timeEntries).where(eq(timeEntries.yearMonth, month));

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const byCategory: Record<string, number> = {};
  for (const e of entries) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.hours;
  }

  return NextResponse.json({ month, entries, totalHours, byCategory });
}

export async function POST(req: Request) {
  const body = await req.json() as {
    date?: string;
    timeBlock?: string;
    hours?: number | string;
    category?: string;
    description?: string;
    month?: string;
  };
  const { date, timeBlock, hours, category, description, month } = body;

  if (!hours || !category || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const yearMonth = month || getCurrentYearMonth();

  await db.insert(timeEntries).values({
    date: date || getTodayDate(),
    timeBlock: timeBlock || '',
    hours: parseFloat(String(hours)),
    category: category.toLowerCase(),
    description,
    yearMonth,
  });

  return NextResponse.json({ success: true });
}
