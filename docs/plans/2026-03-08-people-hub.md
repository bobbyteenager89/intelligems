# People Hub Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a People tab to intelligems.vercel.app — a relationship hub where each contact gets an internal edit page and a public shareable page with benchmarks, meeting notes, deliverables, and tasks.

**Architecture:** New `contacts`, `contact_deliverables`, and `contact_tasks` tables in intelligems Neon DB. `meeting_notes` and `tasks` tables get a nullable `contactSlug` FK. Benchmarks are fetched from Benchmarker via an internal API endpoint protected by a shared secret. Public pages live at `/c/[token]` — no auth required.

**Tech Stack:** Next.js 15, Drizzle ORM, Neon Postgres, shadcn/ui, Tailwind CSS 4. Same stack as rest of intelligems workspace.

---

## Phase 1: DB Schema

### Task 1: Add new tables + contact columns to schema

**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Add contacts table and update existing tables**

Replace the bottom of `src/lib/db/schema.ts` with the following additions (keep existing tables, append):

```typescript
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  token: text('token').notNull().unique(), // for /c/[token] public URL
  name: text('name').notNull(),
  company: text('company').notNull().default(''),
  context: text('context').notNull().default(''), // relationship notes
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const contactBenchmarkTags = pgTable('contact_benchmark_tags', {
  id: serial('id').primaryKey(),
  contactSlug: text('contact_slug').notNull(),
  tag: text('tag').notNull(), // e.g. "analytics", "popup"
  createdAt: timestamp('created_at').defaultNow(),
});

export const contactDeliverables = pgTable('contact_deliverables', {
  id: serial('id').primaryKey(),
  contactSlug: text('contact_slug').notNull(),
  label: text('label').notNull(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const contactTasks = pgTable('contact_tasks', {
  id: serial('id').primaryKey(),
  contactSlug: text('contact_slug').notNull(),
  text: text('text').notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
```

Also add `contactSlug` (nullable) to `meetingNotes` and `tasks` tables:

```typescript
// In meetingNotes table, add:
contactSlug: text('contact_slug'),

// In tasks table, add:
contactSlug: text('contact_slug'),
```

**Step 2: Push schema to DB**

```bash
cd ~/Projects/intelligems
npm run db:push
```

Expected: tables created, no errors.

**Step 3: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat: add contacts schema (contacts, benchmark_tags, deliverables, contact_tasks)"
```

---

## Phase 2: API Routes

### Task 2: Contacts CRUD API

**Files:**
- Create: `src/app/api/contacts/route.ts`
- Create: `src/app/api/contacts/[slug]/route.ts`

**Step 1: Create list + create route**

`src/app/api/contacts/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { name, company, context } = await req.json() as {
    name: string;
    company?: string;
    context?: string;
  };

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const token = nanoid(16);

  const [row] = await db.insert(contacts).values({
    slug,
    token,
    name,
    company: company ?? '',
    context: context ?? '',
  }).returning();

  return NextResponse.json(row);
}
```

**Step 2: Install nanoid**

```bash
cd ~/Projects/intelligems
npm install nanoid
```

**Step 3: Create single contact GET + PATCH route**

`src/app/api/contacts/[slug]/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, contactBenchmarkTags, contactDeliverables, contactTasks, meetingNotes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [contact] = await db.select().from(contacts).where(eq(contacts.slug, slug));
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [tags, deliverables, tasks, meetings] = await Promise.all([
    db.select().from(contactBenchmarkTags).where(eq(contactBenchmarkTags.contactSlug, slug)),
    db.select().from(contactDeliverables).where(eq(contactDeliverables.contactSlug, slug)),
    db.select().from(contactTasks).where(eq(contactTasks.contactSlug, slug)),
    db.select().from(meetingNotes).where(eq(meetingNotes.contactSlug, slug)),
  ]);

  return NextResponse.json({ contact, tags, deliverables, tasks, meetings });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json() as Partial<{ name: string; company: string; context: string }>;

  await db.update(contacts).set({ ...body, updatedAt: new Date() }).where(eq(contacts.slug, slug));
  return NextResponse.json({ success: true });
}
```

**Step 4: Commit**

```bash
git add src/app/api/contacts/
git commit -m "feat: contacts CRUD API routes"
```

---

### Task 3: Contact sub-resource APIs (tags, deliverables, tasks)

**Files:**
- Create: `src/app/api/contacts/[slug]/tags/route.ts`
- Create: `src/app/api/contacts/[slug]/deliverables/route.ts`
- Create: `src/app/api/contacts/[slug]/tasks/route.ts`

**Step 1: Tags API**

`src/app/api/contacts/[slug]/tags/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactBenchmarkTags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tag } = await req.json() as { tag: string };
  const [row] = await db.insert(contactBenchmarkTags).values({ contactSlug: slug, tag }).returning();
  return NextResponse.json(row);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tag } = await req.json() as { tag: string };
  await db.delete(contactBenchmarkTags).where(
    and(eq(contactBenchmarkTags.contactSlug, slug), eq(contactBenchmarkTags.tag, tag))
  );
  return NextResponse.json({ success: true });
}
```

**Step 2: Deliverables API**

`src/app/api/contacts/[slug]/deliverables/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactDeliverables } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { label, url } = await req.json() as { label: string; url: string };
  const [row] = await db.insert(contactDeliverables).values({ contactSlug: slug, label, url }).returning();
  return NextResponse.json(row);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { id } = await req.json() as { id: number };
  await db.delete(contactDeliverables).where(eq(contactDeliverables.id, id));
  return NextResponse.json({ success: true });
}
```

**Step 3: Contact tasks API**

`src/app/api/contacts/[slug]/tasks/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactTasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { text } = await req.json() as { text: string };
  const [row] = await db.insert(contactTasks).values({ contactSlug: slug, text }).returning();
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { id, completed } = await req.json() as { id: number; completed: boolean };
  await db.update(contactTasks).set({ completed }).where(eq(contactTasks.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { id } = await req.json() as { id: number };
  await db.delete(contactTasks).where(eq(contactTasks.id, id));
  return NextResponse.json({ success: true });
}
```

**Step 4: Commit**

```bash
git add src/app/api/contacts/
git commit -m "feat: contact sub-resource APIs (tags, deliverables, tasks)"
```

---

### Task 4: Public token lookup API

**Files:**
- Create: `src/app/api/public/contacts/[token]/route.ts`

**Step 1: Create public route**

`src/app/api/public/contacts/[token]/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, contactBenchmarkTags, contactDeliverables, contactTasks, meetingNotes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [contact] = await db.select().from(contacts).where(eq(contacts.token, token));
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [tags, deliverables, tasks, meetings] = await Promise.all([
    db.select().from(contactBenchmarkTags).where(eq(contactBenchmarkTags.contactSlug, contact.slug)),
    db.select().from(contactDeliverables).where(eq(contactDeliverables.contactSlug, contact.slug)),
    db.select().from(contactTasks).where(eq(contactTasks.contactSlug, contact.slug)),
    db.select().from(meetingNotes).where(eq(meetingNotes.contactSlug, contact.slug)),
  ]);

  return NextResponse.json({ contact, tags, deliverables, tasks, meetings });
}
```

**Step 2: Commit**

```bash
git add src/app/api/public/
git commit -m "feat: public token-based contact API"
```

---

## Phase 3: Benchmarker Bridge

### Task 5: Add internal benchmarks API to Benchmarker

**Files:**
- Create: `~/Projects/benchmarker/src/app/api/internal/benchmarks/route.ts`

**Step 1: Add env var to both projects**

Add to `~/Projects/benchmarker/.env.local`:
```
INTERNAL_API_SECRET=<generate a random 32-char string, e.g. openssl rand -hex 16>
```

Add to `~/Projects/intelligems/.env.local`:
```
BENCHMARKER_URL=http://localhost:3000
BENCHMARKER_SECRET=<same value>
```

Also add both to Vercel env vars for both projects (via `vercel env add`).

**Step 2: Create the endpoint in Benchmarker**

`src/app/api/internal/benchmarks/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, captures } from '@/lib/db/schema';
import { inArray, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const secret = req.headers.get('x-internal-secret');
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) ?? [];

  if (tags.length === 0) return NextResponse.json([]);

  // Find products where any of the requested tags are in the product's tags array
  const matchingProducts = await db.select().from(products).where(
    sql`${products.tags} && ${tags}::text[]`
  );

  if (matchingProducts.length === 0) return NextResponse.json([]);

  const productIds = matchingProducts.map(p => p.id);
  const productCaptures = await db.select().from(captures)
    .where(inArray(captures.productId, productIds));

  return NextResponse.json(
    matchingProducts.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      url: p.url,
      tags: p.tags,
      description: p.description,
      captures: productCaptures
        .filter(c => c.productId === p.id)
        .map(c => ({ id: c.id, blobUrl: c.blobUrl, pageType: c.pageType, notes: c.notes, pageTitle: c.pageTitle })),
    }))
  );
}
```

**Step 3: Commit to Benchmarker**

```bash
cd ~/Projects/benchmarker
git add src/app/api/internal/
git commit -m "feat: internal benchmarks API for intelligems bridge"
```

---

### Task 6: Benchmarks fetcher in intelligems

**Files:**
- Create: `src/lib/benchmarks.ts`

**Step 1: Create fetcher utility**

`src/lib/benchmarks.ts`:
```typescript
export interface BenchmarkCapture {
  id: string;
  blobUrl: string;
  pageType: string | null;
  notes: string | null;
  pageTitle: string | null;
}

export interface BenchmarkProduct {
  id: string;
  name: string;
  slug: string;
  url: string;
  tags: string[];
  description: string | null;
  captures: BenchmarkCapture[];
}

export async function fetchBenchmarks(tags: string[]): Promise<BenchmarkProduct[]> {
  if (tags.length === 0) return [];

  const url = `${process.env.BENCHMARKER_URL}/api/internal/benchmarks?tags=${tags.join(',')}`;
  const res = await fetch(url, {
    headers: { 'x-internal-secret': process.env.BENCHMARKER_SECRET ?? '' },
    next: { revalidate: 300 }, // cache 5 minutes
  });

  if (!res.ok) return [];
  return res.json();
}
```

**Step 2: Add benchmarks fetch to public contact API**

In `src/app/api/public/contacts/[token]/route.ts`, import and call `fetchBenchmarks` with the contact's tags, add to response:

```typescript
import { fetchBenchmarks } from '@/lib/benchmarks';

// Inside GET, after fetching tags:
const benchmarks = await fetchBenchmarks(tags.map(t => t.tag));

return NextResponse.json({ contact, tags, deliverables, tasks, meetings, benchmarks });
```

**Step 3: Commit**

```bash
cd ~/Projects/intelligems
git add src/lib/benchmarks.ts src/app/api/public/
git commit -m "feat: benchmarker bridge — fetch products+captures by tag"
```

---

## Phase 4: UI — People Tab

### Task 7: Add People to sidebar + list page

**Files:**
- Modify: `src/components/sidebar.tsx`
- Create: `src/app/(dashboard)/people/page.tsx`

**Step 1: Add People to sidebar nav**

In `src/components/sidebar.tsx`, add to the `navigation` array:
```typescript
import { Users } from 'lucide-react'; // add to imports
// add to navigation array:
{ name: 'People', href: '/people', icon: Users },
```

**Step 2: Create People list page**

`src/app/(dashboard)/people/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Contact {
  id: number;
  slug: string;
  token: string;
  name: string;
  company: string;
  context: string;
  createdAt: string;
}

export default function PeoplePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  useEffect(() => {
    fetch('/api/contacts').then(r => r.json()).then(setContacts);
  }, []);

  async function handleCreate() {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, company }),
    });
    const contact = await res.json();
    setContacts(prev => [contact, ...prev]);
    setName(''); setCompany(''); setOpen(false);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="border-b px-6 py-4 flex items-center gap-2">
        <Users className="size-4 text-muted-foreground" />
        <h1 className="text-lg font-semibold flex-1">People</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="size-3.5 mr-1.5" />New Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jerry Smith" />
              </div>
              <div className="space-y-1">
                <Label>Company</Label>
                <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Co" />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!name}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6 space-y-2 max-w-2xl">
        {contacts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">No contacts yet. Add your first one.</p>
          </div>
        ) : (
          contacts.map(c => (
            <Link key={c.slug} href={`/people/${c.slug}`}
              className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.name}</p>
                {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
              </div>
              <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/sidebar.tsx src/app/(dashboard)/people/
git commit -m "feat: People tab — sidebar nav + contact list page"
```

---

### Task 8: Contact detail (internal edit) page

**Files:**
- Create: `src/app/(dashboard)/people/[slug]/page.tsx`

**Step 1: Create the full detail page**

`src/app/(dashboard)/people/[slug]/page.tsx`:
```typescript
'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Copy, Check, Plus, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface Contact { id: number; slug: string; token: string; name: string; company: string; context: string; }
interface Tag { id: number; tag: string; }
interface Deliverable { id: number; label: string; url: string; }
interface Task { id: number; text: string; completed: boolean; }
interface Meeting { id: number; title: string; date: string; content: string; }

export default function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<{ contact: Contact; tags: Tag[]; deliverables: Deliverable[]; tasks: Task[]; meetings: Meeting[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newDelivLabel, setNewDelivLabel] = useState('');
  const [newDelivUrl, setNewDelivUrl] = useState('');
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    fetch(`/api/contacts/${slug}`).then(r => r.json()).then(setData);
  }, [slug]);

  async function copyShareLink() {
    if (!data) return;
    await navigator.clipboard.writeText(`${window.location.origin}/c/${data.contact.token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function addTag() {
    if (!newTag.trim() || !data) return;
    const res = await fetch(`/api/contacts/${slug}/tags`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tag: newTag.trim() }),
    });
    const tag = await res.json();
    setData(d => d ? { ...d, tags: [...d.tags, tag] } : d);
    setNewTag('');
  }

  async function removeTag(tag: string) {
    await fetch(`/api/contacts/${slug}/tags`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tag }),
    });
    setData(d => d ? { ...d, tags: d.tags.filter(t => t.tag !== tag) } : d);
  }

  async function addDeliverable() {
    if (!newDelivLabel.trim() || !newDelivUrl.trim() || !data) return;
    const res = await fetch(`/api/contacts/${slug}/deliverables`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label: newDelivLabel.trim(), url: newDelivUrl.trim() }),
    });
    const deliv = await res.json();
    setData(d => d ? { ...d, deliverables: [...d.deliverables, deliv] } : d);
    setNewDelivLabel(''); setNewDelivUrl('');
  }

  async function addTask() {
    if (!newTask.trim() || !data) return;
    const res = await fetch(`/api/contacts/${slug}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: newTask.trim() }),
    });
    const task = await res.json();
    setData(d => d ? { ...d, tasks: [...d.tasks, task] } : d);
    setNewTask('');
  }

  async function toggleTask(id: number, completed: boolean) {
    await fetch(`/api/contacts/${slug}/tasks`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, completed }),
    });
    setData(d => d ? { ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, completed } : t) } : d);
  }

  if (!data) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  const { contact, tags, deliverables, tasks, meetings } = data;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="border-b px-6 py-4 flex items-center gap-3">
        <Link href="/people"><ArrowLeft className="size-4 text-muted-foreground" /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{contact.name}</h1>
          {contact.company && <p className="text-xs text-muted-foreground">{contact.company}</p>}
        </div>
        <Button size="sm" variant="outline" onClick={copyShareLink}>
          {copied ? <Check className="size-3.5 mr-1.5 text-green-600" /> : <Copy className="size-3.5 mr-1.5" />}
          {copied ? 'Copied!' : 'Share Link'}
        </Button>
      </div>

      <div className="p-6 space-y-8 max-w-2xl">

        {/* Context */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Context</h2>
          <Textarea
            defaultValue={contact.context}
            placeholder="Notes about this relationship..."
            className="resize-none h-20 text-sm"
            onBlur={async (e) => {
              await fetch(`/api/contacts/${slug}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ context: e.target.value }),
              });
            }}
          />
        </section>

        {/* Benchmark Tags */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Benchmark Tags</h2>
          <p className="text-xs text-muted-foreground">Tags pull matching products from Benchmarker onto the share page.</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <Badge key={t.id} variant="secondary" className="gap-1.5 cursor-pointer" onClick={() => removeTag(t.tag)}>
                {t.tag} <Trash2 className="size-3" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newTag} onChange={e => setNewTag(e.target.value)}
              placeholder="e.g. analytics" className="h-8 text-sm"
              onKeyDown={e => e.key === 'Enter' && addTag()} />
            <Button size="sm" variant="outline" onClick={addTag}>Add</Button>
          </div>
        </section>

        {/* Deliverables */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Deliverables</h2>
          <div className="space-y-1.5">
            {deliverables.map(d => (
              <div key={d.id} className="flex items-center gap-2 rounded border px-3 py-2 text-sm">
                <a href={d.url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-blue-600 hover:underline flex items-center gap-1.5">
                  {d.label} <ExternalLink className="size-3 shrink-0" />
                </a>
                <button onClick={async () => {
                  await fetch(`/api/contacts/${slug}/deliverables`, {
                    method: 'DELETE', headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ id: d.id }),
                  });
                  setData(prev => prev ? { ...prev, deliverables: prev.deliverables.filter(x => x.id !== d.id) } : prev);
                }}><Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newDelivLabel} onChange={e => setNewDelivLabel(e.target.value)}
              placeholder="Label" className="h-8 text-sm w-40" />
            <Input value={newDelivUrl} onChange={e => setNewDelivUrl(e.target.value)}
              placeholder="https://..." className="h-8 text-sm flex-1" />
            <Button size="sm" variant="outline" onClick={addDeliverable}><Plus className="size-3.5" /></Button>
          </div>
        </section>

        {/* Tasks */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Tasks</h2>
          <div className="space-y-1.5">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 rounded border px-3 py-2">
                <input type="checkbox" checked={t.completed}
                  onChange={e => toggleTask(t.id, e.target.checked)}
                  className="rounded" />
                <span className={`text-sm flex-1 ${t.completed ? 'line-through text-muted-foreground' : ''}`}>{t.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newTask} onChange={e => setNewTask(e.target.value)}
              placeholder="New action item..." className="h-8 text-sm"
              onKeyDown={e => e.key === 'Enter' && addTask()} />
            <Button size="sm" variant="outline" onClick={addTask}><Plus className="size-3.5" /></Button>
          </div>
        </section>

        {/* Meeting Notes */}
        {meetings.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Meeting Notes</h2>
            <div className="space-y-1.5">
              {meetings.map(m => (
                <div key={m.id} className="rounded border px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{m.title}</span>
                    <span className="text-xs text-muted-foreground">{m.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{m.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/people/
git commit -m "feat: contact detail page — edit mode with all panels"
```

---

### Task 9: Public shareable page

**Files:**
- Create: `src/app/c/[token]/page.tsx`

**Step 1: Create public page**

`src/app/c/[token]/page.tsx`:
```typescript
import { notFound } from 'next/navigation';

interface BenchmarkCapture { id: string; blobUrl: string; pageType: string | null; notes: string | null; pageTitle: string | null; }
interface BenchmarkProduct { id: string; name: string; slug: string; url: string; description: string | null; captures: BenchmarkCapture[]; }
interface PageData {
  contact: { name: string; company: string; };
  deliverables: { id: number; label: string; url: string; }[];
  tasks: { id: number; text: string; completed: boolean; }[];
  meetings: { id: number; title: string; date: string; content: string; }[];
  benchmarks: BenchmarkProduct[];
}

async function getData(token: string): Promise<PageData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://intelligems.vercel.app';
  const res = await fetch(`${baseUrl}/api/public/contacts/${token}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export default async function PublicContactPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getData(token);
  if (!data) notFound();

  const { contact, deliverables, tasks, meetings, benchmarks } = data;
  const openTasks = tasks.filter(t => !t.completed);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">

        {/* Header */}
        <div className="border-b pb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Intelligems</p>
          <h1 className="text-2xl font-semibold">{contact.name}</h1>
          {contact.company && <p className="text-muted-foreground">{contact.company}</p>}
        </div>

        {/* Benchmarks */}
        {benchmarks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Benchmarks</h2>
            <div className="space-y-8">
              {benchmarks.map(product => (
                <div key={product.id} className="space-y-3">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
                  </div>
                  {product.captures.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {product.captures.slice(0, 6).map(c => (
                        <div key={c.id} className="rounded-lg border overflow-hidden">
                          <img src={c.blobUrl} alt={c.pageTitle ?? product.name} className="w-full object-cover" />
                          {c.notes && <p className="px-3 py-2 text-xs text-muted-foreground">{c.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Deliverables</h2>
            <div className="space-y-2">
              {deliverables.map(d => (
                <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-medium text-blue-600">
                  {d.label}
                  <span className="ml-auto text-muted-foreground text-xs">↗</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Next Steps */}
        {openTasks.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Next Steps</h2>
            <ul className="space-y-2">
              {openTasks.map(t => (
                <li key={t.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 size-1.5 rounded-full bg-foreground shrink-0" />
                  {t.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Meeting Notes */}
        {meetings.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meeting Notes</h2>
            <div className="space-y-4">
              {meetings.map(m => (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{m.title}</span>
                    <span className="text-xs text-muted-foreground">{m.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="border-t pt-6 text-xs text-muted-foreground">
          Prepared by Intelligems
        </footer>
      </div>
    </div>
  );
}
```

**Step 2: Add NEXT_PUBLIC_APP_URL to env**

```bash
# Add to .env.local:
NEXT_PUBLIC_APP_URL=http://localhost:3040

# Add to Vercel via dashboard or:
vercel env add NEXT_PUBLIC_APP_URL production
# value: https://intelligems.vercel.app
```

**Step 3: Commit**

```bash
git add src/app/c/
git commit -m "feat: public shareable contact page at /c/[token]"
```

---

## Phase 5: Focus Tab Enhancement

### Task 10: Add contact grouping to Focus tab

**Files:**
- Modify: `src/app/(dashboard)/focus/page.tsx`

**Step 1: Fetch contact tasks and add "By Contact" section**

Add a second fetch for `/api/contacts` and a second section to the Focus page below the existing "Open Tasks" block:

```typescript
// Add to state:
const [contacts, setContacts] = useState<{ slug: string; name: string }[]>([]);
const [contactTasksMap, setContactTasksMap] = useState<Record<string, { id: number; text: string; completed: boolean }[]>>({});

// Add to useEffect fetches:
fetch('/api/contacts').then(r => r.json()).then(async (ctcts) => {
  setContacts(ctcts);
  const tasksByContact: Record<string, { id: number; text: string; completed: boolean }[]> = {};
  await Promise.all(ctcts.map(async (c: { slug: string }) => {
    const res = await fetch(`/api/contacts/${c.slug}`);
    const data = await res.json();
    tasksByContact[c.slug] = data.tasks.filter((t: { completed: boolean }) => !t.completed);
  }));
  setContactTasksMap(tasksByContact);
});
```

Add below existing Open Tasks section:
```tsx
{/* Contact Tasks */}
{contacts.some(c => (contactTasksMap[c.slug]?.length ?? 0) > 0) && (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Users className="size-3.5 text-muted-foreground" />
      <h2 className="text-sm font-medium">By Contact</h2>
    </div>
    {contacts.filter(c => (contactTasksMap[c.slug]?.length ?? 0) > 0).map(c => (
      <div key={c.slug} className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.name}</p>
        {(contactTasksMap[c.slug] ?? []).map(t => (
          <div key={t.id} className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
            <div className="size-4 rounded border border-input mt-0.5 shrink-0" />
            <span className="text-sm flex-1">{t.text}</span>
          </div>
        ))}
      </div>
    ))}
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/focus/page.tsx
git commit -m "feat: focus tab — by-contact task grouping"
```

---

## Phase 6: Seed Initial Data

### Task 11: Create Jerry's contact + initial tasks

**Step 1: Open the workspace in browser**

```bash
cd ~/Projects/intelligems
npm run dev
# Open http://localhost:3040/people
```

**Step 2: Create contacts via UI**
- Jerry → Company: Intelligems (or whatever applies) → tag: `analytics`
- Drew → tasks: "Profit guessing game", "CAC calculator"
- Drew + Adam → task: "General recommendations deck"

**Step 3: Add Productized CRO workstream**

In the Projects tab, add a new project entry or task for "Productized CRO — managed service research".

**Step 4: Deploy**

```bash
cd ~/Projects/intelligems
git push origin main
vercel --prod
```

---

## Build Check

After all tasks, run:

```bash
cd ~/Projects/intelligems
npm run build
```

Expected: no errors, all routes compile.

Also run:

```bash
cd ~/Projects/benchmarker
npm run build
```

Expected: internal API route compiles cleanly.
