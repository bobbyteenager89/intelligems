import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactDeliverables } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { label, url } = await req.json() as { label: string; url: string };
  const [row] = await db.insert(contactDeliverables).values({ contactSlug: slug, label, url }).returning();
  return NextResponse.json(row);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { id } = await req.json() as { id: number };
  await db.delete(contactDeliverables).where(eq(contactDeliverables.id, id));
  return NextResponse.json({ success: true });
}
