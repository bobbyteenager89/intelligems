import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { name, company, context } = await req.json() as {
    name: string;
    company?: string;
    context?: string;
  };

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const token = nanoid(16);

  const [row] = await db.insert(contacts).values({
    slug,
    token,
    name,
    company: company ?? '',
    context: context ?? '',
  }).returning();

  return NextResponse.json(row);
}
