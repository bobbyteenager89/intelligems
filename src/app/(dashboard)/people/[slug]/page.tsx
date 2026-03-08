'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Tag,
  X,
  Plus,
  ExternalLink,
  Trash2,
  CheckSquare,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  id: number;
  slug: string;
  token: string;
  name: string;
  company: string;
  context: string;
  createdAt: string | null;
  updatedAt: string | null;
}

interface BenchmarkTag {
  id: number;
  contactSlug: string;
  tag: string;
}

interface Deliverable {
  id: number;
  contactSlug: string;
  label: string;
  url: string;
}

interface ContactTask {
  id: number;
  contactSlug: string;
  text: string;
  completed: boolean;
}

interface Meeting {
  id: number;
  slug: string;
  title: string;
  date: string;
  content: string;
  person: string;
  contactSlug: string | null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContactDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [tags, setTags] = useState<BenchmarkTag[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tasks, setTasks] = useState<ContactTask[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Context textarea
  const [contextValue, setContextValue] = useState('');

  // Tag input
  const [tagInput, setTagInput] = useState('');

  // Deliverable add inputs
  const [delivLabel, setDelivLabel] = useState('');
  const [delivUrl, setDelivUrl] = useState('');

  // Task add input
  const [taskInput, setTaskInput] = useState('');

  const contextSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch on mount ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/contacts/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setContact(data.contact);
        setContextValue(data.contact?.context ?? '');
        setTags(data.tags ?? []);
        setDeliverables(data.deliverables ?? []);
        setTasks(data.tasks ?? []);
        setMeetings(data.meetings ?? []);
        setLoading(false);
      });
  }, [slug]);

  // ── Share link ──────────────────────────────────────────────────────────────

  function copyShareLink() {
    if (!contact) return;
    const url = `${window.location.origin}/c/${contact.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Context auto-save on blur ───────────────────────────────────────────────

  function handleContextBlur() {
    if (!contact) return;
    if (contextSaveTimer.current) clearTimeout(contextSaveTimer.current);
    fetch(`/api/contacts/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: contextValue }),
    });
  }

  // ── Tags ────────────────────────────────────────────────────────────────────

  async function addTag() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    setTagInput('');
    const res = await fetch(`/api/contacts/${slug}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: trimmed }),
    });
    const row: BenchmarkTag = await res.json();
    setTags((prev) => [...prev, row]);
  }

  async function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t.tag !== tag));
    await fetch(`/api/contacts/${slug}/tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    });
  }

  // ── Deliverables ────────────────────────────────────────────────────────────

  async function addDeliverable() {
    const label = delivLabel.trim();
    const url = delivUrl.trim();
    if (!label || !url) return;
    setDelivLabel('');
    setDelivUrl('');
    const res = await fetch(`/api/contacts/${slug}/deliverables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, url }),
    });
    const row: Deliverable = await res.json();
    setDeliverables((prev) => [...prev, row]);
  }

  async function removeDeliverable(id: number) {
    setDeliverables((prev) => prev.filter((d) => d.id !== id));
    await fetch(`/api/contacts/${slug}/deliverables`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  // ── Tasks ───────────────────────────────────────────────────────────────────

  async function addTask() {
    const text = taskInput.trim();
    if (!text) return;
    setTaskInput('');
    const res = await fetch(`/api/contacts/${slug}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const row: ContactTask = await res.json();
    setTasks((prev) => [...prev, row]);
  }

  async function toggleTask(id: number, completed: boolean) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );
    await fetch(`/api/contacts/${slug}/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed }),
    });
  }

  async function removeTask(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/contacts/${slug}/tasks`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b px-6 py-4">
          <div className="h-5 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-6 space-y-4">
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b px-6 py-4 flex items-center gap-2">
          <Link href="/people" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">Contact not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center gap-3">
        <Link
          href="/people"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{contact.name}</h1>
          {contact.company && (
            <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={copyShareLink}>
          <Share2 className="size-3.5 mr-1.5" />
          {copied ? 'Copied!' : 'Share Link'}
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8 max-w-2xl">

        {/* 1. Context */}
        <Section label="Context">
          <Textarea
            value={contextValue}
            onChange={(e) => setContextValue(e.target.value)}
            onBlur={handleContextBlur}
            placeholder="Relationship notes, background, how you met…"
            className="resize-none min-h-[100px] text-sm"
          />
        </Section>

        {/* 2. Benchmark Tags */}
        <Section
          label="Benchmark Tags"
          hint="Tags pull matching products from Benchmarker onto the share page."
        >
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                >
                  <Tag className="size-3 text-muted-foreground" />
                  {t.tag}
                  <button
                    onClick={() => removeTag(t.tag)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Remove tag ${t.tag}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="e.g. apparel, footwear"
              className="text-sm h-8"
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
            />
            <Button size="sm" variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
              <Plus className="size-3.5 mr-1" />
              Add
            </Button>
          </div>
        </Section>

        {/* 3. Deliverables */}
        <Section label="Deliverables">
          {deliverables.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {deliverables.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 flex items-center gap-1.5 text-sm hover:underline"
                  >
                    <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{d.label}</span>
                  </a>
                  <button
                    onClick={() => removeDeliverable(d.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    aria-label={`Remove deliverable ${d.label}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={delivLabel}
              onChange={(e) => setDelivLabel(e.target.value)}
              placeholder="Label"
              className="text-sm h-8 w-36 shrink-0"
              onKeyDown={(e) => e.key === 'Enter' && addDeliverable()}
            />
            <Input
              value={delivUrl}
              onChange={(e) => setDelivUrl(e.target.value)}
              placeholder="https://…"
              className="text-sm h-8 flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addDeliverable()}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addDeliverable}
              disabled={!delivLabel.trim() || !delivUrl.trim()}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </Section>

        {/* 4. Tasks */}
        <Section label="Tasks">
          {tasks.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 rounded-lg border px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => toggleTask(task.id, e.target.checked)}
                    className="size-4 rounded border-input cursor-pointer"
                  />
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      task.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    aria-label={`Remove task: ${task.text}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="New action item…"
              className="text-sm h-8"
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <Button size="sm" variant="outline" onClick={addTask} disabled={!taskInput.trim()}>
              <Plus className="size-3.5 mr-1" />
              Add
            </Button>
          </div>
        </Section>

        {/* 5. Meeting Notes (read-only) */}
        {meetings.length > 0 && (
          <Section label="Meeting Notes">
            <div className="space-y-2">
              {meetings.map((m) => (
                <div key={m.id} className="rounded-lg border px-4 py-3">
                  <div className="flex items-start gap-2">
                    <FileText className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.date}</p>
                      {m.content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {m.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-medium">{label}</h2>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
