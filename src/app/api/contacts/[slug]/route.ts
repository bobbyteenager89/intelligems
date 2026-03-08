import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, contactBenchmarkTags, contactDeliverables, contactTasks, meetingNotes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [contact] = await db.select().from(contacts).where(eq(contacts.slug, slug));
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [tags, deliverables, tasks, meetings] = await Promise.all([
    db.select().from(contactBenchmarkTags).where(eq(contactBenchmarkTags.contactSlug, slug)),
    db.select().from(contactDeliverables).where(eq(contactDeliverables.contactSlug, slug)),
    db.select().from(contactTasks).where(eq(contactTasks.contactSlug, slug)),
    db.select().from(meetingNotes).where(eq(meetingNotes.contactSlug, slug)),
  ]);

  return NextResponse.json({ contact, tags, deliverables, tasks, meetings });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json() as Partial<{ name: string; company: string; context: string }>;

  await db.update(contacts).set({ ...body, updatedAt: new Date() }).where(eq(contacts.slug, slug));
  return NextResponse.json({ success: true });
}
