import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactBenchmarkTags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tag } = await req.json() as { tag: string };
  const [row] = await db.insert(contactBenchmarkTags).values({ contactSlug: slug, tag }).returning();
  return NextResponse.json(row);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tag } = await req.json() as { tag: string };
  await db.delete(contactBenchmarkTags).where(
    and(eq(contactBenchmarkTags.contactSlug, slug), eq(contactBenchmarkTags.tag, tag))
  );
  return NextResponse.json({ success: true });
}
