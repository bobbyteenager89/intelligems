import { NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(req: Request) {
  const { filePath, taskText } = await req.json();
  if (!filePath || !taskText) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const content = fs.readFileSync(filePath, 'utf-8').trimEnd();
  const updated = content + `\n- [ ] ${taskText}`;
  fs.writeFileSync(filePath, updated + '\n', 'utf-8');
  return NextResponse.json({ success: true });
}
