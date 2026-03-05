import { NextResponse } from 'next/server';
import { sendToPersonalOS } from '@/lib/personal-os-bridge';

export async function POST(req: Request) {
  const { taskText, projectTitle, projectSlug } = await req.json() as {
    taskText: string;
    projectTitle: string;
    projectSlug: string;
  };

  if (!taskText || !projectTitle) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const result = sendToPersonalOS({
    title: taskText,
    projectTitle,
    projectSlug,
    tags: [projectSlug],
  });

  return NextResponse.json({ success: true, ...result });
}
