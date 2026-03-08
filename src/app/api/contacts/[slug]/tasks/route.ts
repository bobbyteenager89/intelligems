import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactTasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { text } = await req.json() as { text: string };
  const [row] = await db.insert(contactTasks).values({ contactSlug: slug, text }).returning();
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { id, completed } = await req.json() as { id: number; completed: boolean };
  await db.update(contactTasks).set({ completed }).where(eq(contactTasks.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { id } = await req.json() as { id: number };
  await db.delete(contactTasks).where(eq(contactTasks.id, id));
  return NextResponse.json({ success: true });
}
