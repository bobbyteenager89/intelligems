'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Contact {
  id: number;
  slug: string;
  name: string;
  company: string;
  createdAt: string | null;
}

export default function PeoplePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/contacts')
      .then((r) => r.json())
      .then(setContacts);
  }, []);

  async function createContact() {
    if (!name.trim()) return;
    setSaving(true);

    // Optimistic add
    const optimistic: Contact = {
      id: Date.now(),
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: name.trim(),
      company: company.trim(),
      createdAt: new Date().toISOString(),
    };
    setContacts((prev) => [optimistic, ...prev]);
    setOpen(false);
    setName('');
    setCompany('');

    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), company: company.trim() }),
    });
    const created: Contact = await res.json();

    // Replace optimistic entry with real one
    setContacts((prev) =>
      prev.map((c) => (c.id === optimistic.id ? created : c))
    );
    setSaving(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4 flex items-center gap-2">
        <Users className="size-4 text-muted-foreground" />
        <h1 className="text-lg font-semibold flex-1">People</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-3.5 mr-1.5" />
              New Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs mb-1.5 block">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  onKeyDown={(e) => e.key === 'Enter' && createContact()}
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Company</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company (optional)"
                  onKeyDown={(e) => e.key === 'Enter' && createContact()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createContact} disabled={saving || !name.trim()}>
                {saving ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {contacts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center mt-4">
            <Users className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No contacts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first contact to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/people/${contact.slug}`}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent transition-colors"
              >
                <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {contact.name.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{contact.name}</p>
                  {contact.company && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="size-3 shrink-0" />
                      <span className="truncate">{contact.company}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
