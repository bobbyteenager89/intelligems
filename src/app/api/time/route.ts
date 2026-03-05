import { NextResponse } from 'next/server';
import { getMonthlyTimeLog, appendTimeEntry } from '@/lib/content';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const month = url.searchParams.get('month') || getCurrentYearMonth();
  const log = getMonthlyTimeLog(month);
  return NextResponse.json(log);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { date, timeBlock, hours, category, description, month } = body;

  if (!hours || !category || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const targetMonth = month || getCurrentYearMonth();

  appendTimeEntry(targetMonth, {
    date: date || getTodayDate(),
    timeBlock: timeBlock || '',
    hours: parseFloat(hours),
    category,
    description,
  });

  return NextResponse.json({ success: true });
}

function getCurrentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayDate(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
