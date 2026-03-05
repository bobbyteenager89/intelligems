'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code2, Workflow, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  text: string;
  completed: boolean;
}

interface ProjectFile {
  slug: string;
  title: string;
  type: 'code' | 'workstream';
  status: string;
  phases?: number;
  currentPhase?: number;
  description?: string;
  tasks: Task[];
  filePath: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  shipped: 'bg-sky-500/10 text-sky-600 border-sky-200',
  complete: 'bg-slate-100 text-slate-500 border-slate-200',
  paused: 'bg-amber-500/10 text-amber-600 border-amber-200',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectFile[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [newTask, setNewTask] = useState({ text: '', projectSlug: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  }, []);

  const codeProjects = projects.filter(p => p.type === 'code');
  const workstreams = projects.filter(p => p.type === 'workstream');

  async function toggleTask(project: ProjectFile, task: Task) {
    const newCompleted = !task.completed;
    // Optimistic update
    setProjects(prev => prev.map(p =>
      p.slug === project.slug
        ? { ...p, tasks: p.tasks.map(t => t.text === task.text ? { ...t, completed: newCompleted } : t) }
        : p
    ));
    await fetch('/api/projects/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: project.filePath, taskText: task.text, completed: newCompleted }),
    });
  }

  async function addTask() {
    if (!newTask.text || !newTask.projectSlug) return;
    setSaving(true);
    const project = projects.find(p => p.slug === newTask.projectSlug);
    if (!project) { setSaving(false); return; }

    await fetch('/api/projects/task/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: project.filePath, taskText: newTask.text }),
    });
    setSaving(false);
    setShowDialog(false);
    setNewTask({ text: '', projectSlug: '' });
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  }

  function ProjectCard({ project }: { project: ProjectFile }) {
    const openTasks = project.tasks.filter(t => !t.completed);

    return (
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{project.title}</h3>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn('shrink-0 text-xs capitalize', STATUS_COLORS[project.status] || '')}
          >
            {project.status}
          </Badge>
        </div>

        {/* Phase indicator for code projects */}
        {project.phases && project.currentPhase && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Phase {project.currentPhase} of {project.phases}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: project.phases }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    i < (project.currentPhase ?? 0) ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tasks */}
        {project.tasks.length > 0 && (
          <div className="space-y-1.5">
            {project.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => toggleTask(project, task)}
                  className={cn(
                    'size-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                    task.completed
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-input hover:border-primary'
                  )}
                  aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {task.completed && (
                    <svg viewBox="0 0 10 10" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                    </svg>
                  )}
                </button>
                <span className={cn('text-xs flex-1', task.completed && 'line-through text-muted-foreground')}>
                  {task.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {project.tasks.length === 0 && openTasks.length === 0 && (
          <p className="text-xs text-muted-foreground">No tasks yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4 flex items-center">
        <h1 className="text-lg font-semibold flex-1">Projects</h1>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="size-3.5 mr-1.5" />
          Task
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Code Projects */}
        {codeProjects.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="size-3.5 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code Projects</h2>
            </div>
            <div className="space-y-3">
              {codeProjects.map(p => <ProjectCard key={p.slug} project={p} />)}
            </div>
          </section>
        )}

        {/* Workstreams */}
        {workstreams.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Workflow className="size-3.5 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Streams</h2>
            </div>
            <div className="space-y-3">
              {workstreams.map(p => <ProjectCard key={p.slug} project={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1.5 block">Project</Label>
              <Select value={newTask.projectSlug} onValueChange={v => setNewTask(t => ({ ...t, projectSlug: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Task</Label>
              <Input
                value={newTask.text}
                onChange={e => setNewTask(t => ({ ...t, text: e.target.value }))}
                placeholder="What needs to get done?"
                onKeyDown={e => e.key === 'Enter' && addTask()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={addTask} disabled={saving || !newTask.text || !newTask.projectSlug}>
              {saving ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
