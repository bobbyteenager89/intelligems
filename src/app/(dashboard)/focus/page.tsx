'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BUDGET_HOURS } from '@/lib/config';

interface Task {
  text: string;
  completed: boolean;
}

interface ProjectFile {
  slug: string;
  title: string;
  type: string;
  status: string;
  tasks: Task[];
  filePath: string;
}

interface MonthlyLog {
  totalHours: number;
}

const PROJECT_LABELS: Record<string, string> = {
  'intelligems-slack-tools': 'slack-tools',
  'guardian-bot': 'guardian',
  'intelligems-tools': 'tools',
  'strategy-positioning': 'strategy',
  'content': 'content',
  'partnerships': 'partnerships',
};

export default function FocusPage() {
  const [projects, setProjects] = useState<ProjectFile[]>([]);
  const [timeLog, setTimeLog] = useState<MonthlyLog | null>(null);

  const currentMonth = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects);
    fetch(`/api/time?month=${currentMonth}`).then(r => r.json()).then(setTimeLog);
  }, [currentMonth]);

  // All open tasks across all active projects
  const openTasks = projects
    .filter(p => p.status === 'active')
    .flatMap(p =>
      p.tasks
        .filter(t => !t.completed)
        .map(t => ({ ...t, projectSlug: p.slug, projectTitle: p.title }))
    );

  const totalHours = timeLog?.totalHours ?? 0;
  const remaining = BUDGET_HOURS - totalHours;
  const pct = Math.min(100, (totalHours / BUDGET_HOURS) * 100);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="border-b px-6 py-4 flex items-center gap-2">
        <Target className="size-4 text-muted-foreground" />
        <h1 className="text-lg font-semibold flex-1">Focus</h1>
        <span className="text-sm text-muted-foreground">{today}</span>
      </div>

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Open tasks across all active projects */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="size-3.5 text-muted-foreground" />
            <h2 className="text-sm font-medium">
              Open Tasks
              <span className="ml-2 text-muted-foreground font-normal">({openTasks.length})</span>
            </h2>
          </div>

          {openTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">All caught up. Add tasks from the Projects tab.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {openTasks.map((task, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
                  <div className="size-4 rounded border border-input mt-0.5 shrink-0" />
                  <span className="text-sm flex-1">{task.text}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {PROJECT_LABELS[task.projectSlug] || task.projectSlug}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget status */}
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-medium">Hours This Month</h2>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums">{totalHours.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">/ {BUDGET_HOURS}h</span>
          </div>
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {remaining.toFixed(1)}h remaining this month
          </p>
        </div>
      </div>
    </div>
  );
}
