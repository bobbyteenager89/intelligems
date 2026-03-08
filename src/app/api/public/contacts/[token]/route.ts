import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, contactBenchmarkTags, contactDeliverables, contactTasks, meetingNotes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [contact] = await db.select().from(contacts).where(eq(contacts.token, token));
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [tags, deliverables, tasks, meetings] = await Promise.all([
    db.select().from(contactBenchmarkTags).where(eq(contactBenchmarkTags.contactSlug, contact.slug)),
    db.select().from(contactDeliverables).where(eq(contactDeliverables.contactSlug, contact.slug)),
    db.select().from(contactTasks).where(eq(contactTasks.contactSlug, contact.slug)),
    db.select().from(meetingNotes).where(eq(meetingNotes.contactSlug, contact.slug)),
  ]);

  return NextResponse.json({ contact, tags, deliverables, tasks, meetings });
}
