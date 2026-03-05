import { NextResponse } from 'next/server';
import { getMeetings, getWeeklyReports, getFrameworks } from '@/lib/content';

export async function GET() {
  const [meetings, reports, frameworks] = await Promise.all([
    getMeetings(),
    getWeeklyReports(),
    getFrameworks(),
  ]);

  return NextResponse.json({ meetings, reports, frameworks });
}
