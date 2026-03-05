'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, ArrowLeft, Users, BarChart2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteFile {
  slug: string;
  title: string;
  date?: string;
  duration?: string;
  weekOf?: string;
  totalHours?: number;
  category?: string;
  content: string;
  filePath: string;
}

interface NotesData {
  meetings: NoteFile[];
  reports: NoteFile[];
  frameworks: NoteFile[];
}

export default function NotesPage() {
  const [data, setData] = useState<NotesData>({ meetings: [], reports: [], frameworks: [] });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<NoteFile | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ person: '', date: '', duration: '', summary: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/notes').then(r => r.json()).then(setData);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return data;
    const filter = (items: NoteFile[]) =>
      items.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    return {
      meetings: filter(data.meetings),
      reports: filter(data.reports),
      frameworks: filter(data.frameworks),
    };
  }, [data, query]);

  async function createMeeting() {
    setSaving(true);
    await fetch('/api/notes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMeeting),
    });
    setSaving(false);
    setShowDialog(false);
    setNewMeeting({ person: '', date: '', duration: '', summary: '' });
    fetch('/api/notes').then(r => r.json()).then(setData);
  }

  if (selected) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} aria-label="Back to notes">
            <ArrowLeft className="size-4 mr-1.5" />
            Notes
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{selected.title}</span>
          {selected.duration && <Badge variant="secondary">{selected.duration}</Badge>}
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto w-full">
          <h1 className="text-2xl font-semibold mb-1 text-balance">{selected.title}</h1>
          {selected.date && (
            <p className="text-sm text-muted-foreground mb-6">
              {new Date(selected.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {selected.duration && ` · ${selected.duration}`}
            </p>
          )}
          <div className="prose prose-sm max-w-none text-pretty">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4 flex items-center gap-3">
        <h1 className="text-lg font-semibold flex-1">Notes</h1>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-8 h-8 w-52 text-sm"
          />
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="size-3.5 mr-1.5" />
          Meeting
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {filtered.meetings.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-3.5 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meetings</h2>
            </div>
            <div className="space-y-0.5">
              {filtered.meetings.map(note => (
                <button
                  key={note.slug}
                  onClick={() => setSelected(note)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent text-left transition-colors"
                >
                  <span className="flex-1 text-sm font-medium">{note.title}</span>
                  {note.date && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {note.duration && <Badge variant="outline" className="text-xs">{note.duration}</Badge>}
                </button>
              ))}
            </div>
          </section>
        )}

        {filtered.reports.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="size-3.5 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Reports</h2>
            </div>
            <div className="space-y-0.5">
              {filtered.reports.map(note => (
                <button
                  key={note.slug}
                  onClick={() => setSelected(note)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent text-left transition-colors"
                >
                  <span className="flex-1 text-sm font-medium">{note.weekOf ? `Week of ${note.weekOf}` : note.title}</span>
                  {note.totalHours !== undefined && (
                    <span className="text-xs text-muted-foreground tabular-nums">{note.totalHours}h</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {filtered.frameworks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="size-3.5 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frameworks</h2>
            </div>
            <div className="space-y-0.5">
              {filtered.frameworks.map(note => (
                <button
                  key={note.slug}
                  onClick={() => setSelected(note)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent text-left transition-colors"
                >
                  <span className="flex-1 text-sm font-medium">{note.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {filtered.meetings.length === 0 && filtered.reports.length === 0 && filtered.frameworks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No notes match your search.</p>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Meeting Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="person" className="text-xs mb-1.5 block">Person / Group</Label>
              <Input
                id="person"
                value={newMeeting.person}
                onChange={e => setNewMeeting(m => ({ ...m, person: e.target.value }))}
                placeholder="Drew & Adam"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date" className="text-xs mb-1.5 block">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newMeeting.date}
                  onChange={e => setNewMeeting(m => ({ ...m, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="duration" className="text-xs mb-1.5 block">Duration</Label>
                <Input
                  id="duration"
                  value={newMeeting.duration}
                  onChange={e => setNewMeeting(m => ({ ...m, duration: e.target.value }))}
                  placeholder="45m"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="summary" className="text-xs mb-1.5 block">Summary</Label>
              <Textarea
                id="summary"
                value={newMeeting.summary}
                onChange={e => setNewMeeting(m => ({ ...m, summary: e.target.value }))}
                placeholder="Key takeaways, decisions, action items..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={createMeeting}
              disabled={saving || !newMeeting.person || !newMeeting.date || !newMeeting.summary}
            >
              {saving ? 'Saving...' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
