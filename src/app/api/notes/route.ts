import { NextResponse } from 'next/server';
import { getMeetings, getWeeklyReports, getFrameworks } from '@/lib/content';
import { db } from '@/lib/db';
import { meetingNotes } from '@/lib/db/schema';

export async function GET() {
  const [fileMeetings, reports, frameworks, dbMeetings] = await Promise.all([
    getMeetings(),
    getWeeklyReports(),
    getFrameworks(),
    db.select().from(meetingNotes).orderBy(meetingNotes.createdAt),
  ]);

  // Map DB meetings to the same shape as file meetings
  const dbMeetingsMapped = dbMeetings.map(m => ({
    slug: m.slug,
    title: m.title,
    date: m.date,
    duration: m.duration,
    person: m.person,
    content: m.content,
    filePath: '',
  }));

  // Avoid duplicates — file meetings take precedence
  const fileSlugs = new Set(fileMeetings.map(m => m.slug));
  const newDbMeetings = dbMeetingsMapped.filter(m => !fileSlugs.has(m.slug));

  return NextResponse.json({
    meetings: [...fileMeetings, ...newDbMeetings].sort((a, b) =>
      (b.date ?? '').localeCompare(a.date ?? '')
    ),
    reports,
    frameworks,
  });
}
