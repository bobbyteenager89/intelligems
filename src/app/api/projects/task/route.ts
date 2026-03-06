import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  const { projectSlug, taskText, completed } = await req.json() as {
    projectSlug?: string;
    taskText?: string;
    completed?: boolean;
  };

  if (!projectSlug || taskText === undefined || completed === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await db.update(tasks)
    .set({ completed })
    .where(and(eq(tasks.projectSlug, projectSlug), eq(tasks.text, taskText)));

  return NextResponse.json({ success: true });
}
