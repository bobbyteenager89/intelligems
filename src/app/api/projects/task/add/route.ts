import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';

export async function POST(req: Request) {
  const { projectSlug, taskText } = await req.json() as {
    projectSlug?: string;
    taskText?: string;
  };

  if (!projectSlug || !taskText) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await db.insert(tasks).values({ projectSlug, text: taskText, completed: false });
  return NextResponse.json({ success: true });
}
