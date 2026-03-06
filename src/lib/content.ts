import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export interface NoteFile {
  slug: string;
  title: string;
  date?: string;
  duration?: string;
  person?: string;
  role?: string;
  weekOf?: string;
  totalHours?: number;
  category?: string;
  content: string;
  filePath: string;
}

export interface TimeEntry {
  date: string;
  timeBlock: string;
  hours: number;
  category: string;
  description: string;
}

export interface MonthlyTimeLog {
  month: string;
  entries: TimeEntry[];
  totalHours: number;
  byCategory: Record<string, number>;
}

export interface ProjectFile {
  slug: string;
  title: string;
  type: 'code' | 'workstream';
  status: 'active' | 'shipped' | 'complete' | 'paused';
  phases?: number;
  currentPhase?: number;
  repo?: string;
  description?: string;
  tasks: Array<{ text: string; completed: boolean }>;
  content: string;
  filePath: string;
}

export interface ProjectMeta {
  slug: string;
  title: string;
  type: 'code' | 'workstream';
  status: string;
  phases?: number;
  currentPhase?: number;
  repo?: string;
  description?: string;
  filePath: string;
}

// --- Notes ---

export function getMeetings(): NoteFile[] {
  const dir = path.join(CONTENT_DIR, 'notes/meetings');
  return readMarkdownDir(dir);
}

export function getWeeklyReports(): NoteFile[] {
  const dir = path.join(CONTENT_DIR, 'notes/weekly-reports');
  return readMarkdownDir(dir).sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getFrameworks(): NoteFile[] {
  const dir = path.join(CONTENT_DIR, 'notes/frameworks');
  return readMarkdownDir(dir);
}

export function getNoteByPath(filePath: string): NoteFile | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);
    const slug = path.basename(filePath, '.md');
    return {
      slug,
      title: data.title || slug,
      date: data.date ? String(data.date) : undefined,
      duration: data.duration,
      person: data.person,
      role: data.role,
      weekOf: data.weekOf,
      totalHours: data.totalHours,
      category: data.category,
      content,
      filePath,
    };
  } catch {
    return null;
  }
}

function readMarkdownDir(dir: string): NoteFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const filePath = path.join(dir, filename);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      const slug = filename.replace('.md', '');
      return {
        slug,
        title: data.title || slug,
        date: data.date ? String(data.date) : undefined,
        duration: data.duration,
        person: data.person,
        role: data.role,
        weekOf: data.weekOf,
        totalHours: data.totalHours,
        category: data.category,
        content,
        filePath,
      };
    });
}

// --- Time ---

export function getMonthlyTimeLog(yearMonth: string): MonthlyTimeLog {
  const filePath = path.join(CONTENT_DIR, `time/${yearMonth}.md`);
  if (!fs.existsSync(filePath)) {
    return { month: yearMonth, entries: [], totalHours: 0, byCategory: {} };
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const entries = parseTimeTable(raw);
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const byCategory: Record<string, number> = {};
  for (const entry of entries) {
    byCategory[entry.category.toLowerCase()] = (byCategory[entry.category.toLowerCase()] || 0) + entry.hours;
  }

  return { month: yearMonth, entries, totalHours, byCategory };
}

export function parseTimeTable(markdown: string): TimeEntry[] {
  const lines = markdown.split('\n');
  const entries: TimeEntry[] = [];

  for (const line of lines) {
    const match = line.match(/^\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
    if (!match) continue;

    const [, date, timeBlock, hoursStr, category, description] = match.map(s => s.trim());

    if (date === 'Date' || date.startsWith('-')) continue;

    const hours = parseFloat(hoursStr);
    if (isNaN(hours)) continue;

    entries.push({ date, timeBlock, hours, category, description });
  }

  return entries;
}

export function appendTimeEntry(yearMonth: string, entry: TimeEntry): void {
  const filePath = path.join(CONTENT_DIR, `time/${yearMonth}.md`);
  const row = `| ${entry.date} | ${entry.timeBlock} | ${entry.hours.toFixed(2)} | ${entry.category} | ${entry.description} |`;

  if (!fs.existsSync(filePath)) {
    const monthName = new Date(yearMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
    const content = `# ${monthName}\n\n| Date | Time Block | Hours | Category | Description |\n|------|------------|-------|----------|-------------|\n${row}\n`;
    fs.writeFileSync(filePath, content, 'utf-8');
  } else {
    const existing = fs.readFileSync(filePath, 'utf-8');
    const trimmed = existing.trimEnd();
    fs.writeFileSync(filePath, trimmed + '\n' + row + '\n', 'utf-8');
  }
}

// --- Projects ---

export function getProjectMeta(): ProjectMeta[] {
  const codeDir = path.join(CONTENT_DIR, 'projects/code');
  const workstreamDir = path.join(CONTENT_DIR, 'projects/workstreams');
  return [
    ...readProjectMetaDir(codeDir, 'code'),
    ...readProjectMetaDir(workstreamDir, 'workstream'),
  ];
}

function readProjectMetaDir(dir: string, type: 'code' | 'workstream'): ProjectMeta[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const filePath = path.join(dir, filename);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(raw);
      const slug = filename.replace('.md', '');
      return {
        slug,
        title: data.title || slug,
        type: (data.type || type) as 'code' | 'workstream',
        status: data.status || 'active',
        phases: data.phases,
        currentPhase: data.currentPhase,
        repo: data.repo,
        description: data.description,
        filePath,
      };
    });
}

export function getProjects(): ProjectFile[] {
  const codeDir = path.join(CONTENT_DIR, 'projects/code');
  const workstreamDir = path.join(CONTENT_DIR, 'projects/workstreams');
  return [
    ...readProjectDir(codeDir, 'code'),
    ...readProjectDir(workstreamDir, 'workstream'),
  ];
}

export function getProjectBySlug(slug: string): ProjectFile | null {
  const allProjects = getProjects();
  return allProjects.find(p => p.slug === slug) || null;
}

export function updateTaskInProject(filePath: string, taskText: string, completed: boolean): void {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const updated = raw.replace(
    new RegExp(`- \\[${completed ? ' ' : 'x'}\\] ${escapeRegex(taskText)}`),
    `- [${completed ? 'x' : ' '}] ${taskText}`
  );
  fs.writeFileSync(filePath, updated, 'utf-8');
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readProjectDir(dir: string, type: 'code' | 'workstream'): ProjectFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const filePath = path.join(dir, filename);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      const slug = filename.replace('.md', '');

      const tasks = parseTasksFromContent(content);

      return {
        slug,
        title: data.title || slug,
        type: data.type || type,
        status: data.status || 'active',
        phases: data.phases,
        currentPhase: data.currentPhase,
        repo: data.repo,
        description: data.description,
        tasks,
        content,
        filePath,
      };
    });
}

export function parseTasksFromContent(content: string): Array<{ text: string; completed: boolean }> {
  const lines = content.split('\n');
  const tasks: Array<{ text: string; completed: boolean }> = [];
  for (const line of lines) {
    const match = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
    if (match) {
      tasks.push({ text: match[2].trim(), completed: match[1] === 'x' });
    }
  }
  return tasks;
}
