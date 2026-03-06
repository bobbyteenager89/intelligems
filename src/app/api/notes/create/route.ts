import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetingNotes } from '@/lib/db/schema';

export async function POST(req: Request) {
  const body = await req.json() as {
    person?: string;
    date?: string;
    duration?: string;
    summary?: string;
  };
  const { person, date, duration, summary } = body;

  if (!person || !date || !summary) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const slug = `${date}-${person.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

  await db.insert(meetingNotes).values({
    slug,
    title: person,
    date,
    duration: duration || '',
    person,
    content: summary,
  });

  return NextResponse.json({ slug });
}
