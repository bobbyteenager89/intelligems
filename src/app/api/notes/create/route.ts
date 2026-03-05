import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  const filePath = path.join(process.cwd(), 'content/notes/meetings', `${slug}.md`);

  const content = `---
title: ${person}
date: ${date}
duration: ${duration || 'unknown'}
person: ${person}
---

${summary}
`;

  fs.writeFileSync(filePath, content, 'utf-8');
  return NextResponse.json({ slug, filePath });
}
