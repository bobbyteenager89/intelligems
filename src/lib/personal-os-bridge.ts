import fs from 'fs';
import path from 'path';

const VAULT_ROOT = path.join(process.env.HOME || '', 'Projects/personal-os/vault');
const TASKS_DIR = path.join(VAULT_ROOT, 'tasks/active');
const MANIFEST_PATH = path.join(VAULT_ROOT, '.index/manifest.json');

export interface BridgeTask {
  title: string;
  projectTitle: string;
  projectSlug: string;
  tags?: string[];
}

export function sendToPersonalOS(task: BridgeTask): { filePath: string; slug: string } {
  // Ensure directories exist
  fs.mkdirSync(TASKS_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

  const now = new Date();
  const timestamp = now.toISOString();
  const datePrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const timePrefix = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  const slug = task.title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 50);
  const filename = `${datePrefix}-${timePrefix}-${slug}.md`;
  const filePath = path.join(TASKS_DIR, filename);

  const tags = ['intelligems', ...(task.tags || [])];

  const content = `---
title: ${task.title}
created: ${timestamp}
domain: side-projects
type: task
status: active
tags: [${tags.join(', ')}]
---

# ${task.title}

From intelligems workspace > ${task.projectTitle}
`;

  fs.writeFileSync(filePath, content, 'utf-8');

  // Update manifest — match the real manifest format (files object + counts)
  interface ManifestFile {
    title: string;
    created: string;
    domain: string;
    type: string;
    status: string;
    tags: string[];
  }
  interface Manifest {
    version: number;
    updated: string;
    files: Record<string, ManifestFile>;
    counts: {
      tasks_active: number;
      tasks_waiting: number;
      tasks_someday: number;
      inbox: number;
    };
  }

  let manifest: Manifest = {
    version: 1,
    updated: timestamp,
    files: {},
    counts: { tasks_active: 0, tasks_waiting: 0, tasks_someday: 0, inbox: 0 },
  };

  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as Manifest;
    } catch {
      // Use defaults
    }
  }

  // Register file in manifest
  const relativeKey = `vault/tasks/active/${filename}`;
  manifest.files[relativeKey] = {
    title: task.title,
    created: timestamp,
    domain: 'side-projects',
    type: 'task',
    status: 'active',
    tags,
  };

  manifest.updated = timestamp;
  if (!manifest.counts) {
    manifest.counts = { tasks_active: 0, tasks_waiting: 0, tasks_someday: 0, inbox: 0 };
  }
  manifest.counts.tasks_active = (manifest.counts.tasks_active || 0) + 1;

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  return { filePath, slug };
}
