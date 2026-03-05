import { NextResponse } from 'next/server';
import { getNoteByPath } from '@/lib/content';
import path from 'path';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params;
  const filePath = path.join(process.cwd(), 'content', ...pathParts) + '.md';
  const note = getNoteByPath(filePath);
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(note);
}
