import { NextResponse } from 'next/server';
import { updateTaskInProject } from '@/lib/content';

export async function POST(req: Request) {
  const { filePath, taskText, completed } = await req.json();
  if (!filePath || taskText === undefined || completed === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  updateTaskInProject(filePath, taskText, completed);
  return NextResponse.json({ success: true });
}
