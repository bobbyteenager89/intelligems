import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks as tasksTable } from '@/lib/db/schema';
import { getProjectMeta } from '@/lib/content';

export async function GET() {
  const projectsMeta = getProjectMeta();
  const allTasks = await db.select().from(tasksTable);

  // Group tasks by projectSlug
  const tasksByProject: Record<string, Array<{ text: string; completed: boolean }>> = {};
  for (const task of allTasks) {
    if (!tasksByProject[task.projectSlug]) tasksByProject[task.projectSlug] = [];
    tasksByProject[task.projectSlug].push({ text: task.text, completed: task.completed });
  }

  const projects = projectsMeta.map(p => ({
    ...p,
    tasks: tasksByProject[p.slug] ?? [],
  }));

  return NextResponse.json(projects);
}
