# Intelligems Workspace Progress

---

## 2026-03-05 — Session 1: Full Build — All 4 Phases

### Accomplished
- Scaffolded Next.js 16 project at ~/Projects/intelligems/ on port 3040
- Installed shadcn/ui (new-york, neutral), Lucide React, gray-matter, react-markdown, remark-gfm
- Created full content/ directory: 18 files total across time, meetings, reports, frameworks, projects
- Populated all content from intelligems_project_context.md (14 time entries Jan, 1 March)
- Built sidebar layout (Time/Notes/Projects/Focus) using h-dvh, matching slack-tools conventions
- Built Notes tab: search, 3 sections (meetings/reports/frameworks), markdown detail view, + Meeting dialog
- Built Time tab: budget gauge (2.5/40h), log form with Select, category bars, weekly entries, Report button
- Built CLI tool (cli/ig.js): ig log, ig status, ig report, ig open; all duration formats including time ranges
- Symlinked CLI to ~/.local/bin/ig; fixed __dirname bug with fs.realpathSync(__filename)
- Built Projects tab: code projects + workstreams, phase progress dots (intelligems-slack-tools Phase 2/5), task checkboxes wired to files, + Task dialog, ↗ send buttons
- Built Focus tab: 21 open tasks aggregated from all active projects with project badges, budget progress
- Built personal-os-bridge.ts: sendToPersonalOS() writes vault task files + updates manifest
- All 9 API routes registered and functional
- 7 commits, 38 files changed, 2,400 insertions

### Files Modified
| File | Changes |
|------|---------|
| `src/app/(dashboard)/layout.tsx` | Dashboard shell with sidebar |
| `src/components/sidebar.tsx` | 4-tab sidebar nav |
| `src/app/(dashboard)/time/page.tsx` | Full time tracker UI |
| `src/app/(dashboard)/notes/page.tsx` | Notes with search + markdown |
| `src/app/(dashboard)/projects/page.tsx` | Projects + task management |
| `src/app/(dashboard)/focus/page.tsx` | Aggregated priority view |
| `src/lib/content.ts` | File-based content utilities |
| `src/lib/config.ts` | Budget constants |
| `src/lib/personal-os-bridge.ts` | Bridge to personal-os vault |
| `src/app/api/time/route.ts` | Time read/write API |
| `src/app/api/notes/route.ts` | Notes read API |
| `src/app/api/projects/route.ts` | Projects read API |
| `src/app/api/projects/task/route.ts` | Toggle task completion |
| `src/app/api/projects/task/add/route.ts` | Add new task |
| `src/app/api/projects/send/route.ts` | Send task to personal-os |
| `cli/ig.js` | Full CLI tool |
| `content/` | 18 content files |

### Next Steps
- [ ] Test ↗ send button end-to-end with personal-os running
- [x] Add `ig` to PATH via ~/.zshrc
- [ ] Rename browser tab title from "Create Next App" to "Intelligems Workspace"
- [ ] Add mobile-responsive layout for occasional phone use
- [ ] Phase 5 (future): personal-os → intelligems back-sync (poll for completed status)

---

## 2026-03-06 — Session 2: Neon DB + Vercel Deploy

### Accomplished
- Created GitHub repo: https://github.com/bobbyteenager89/intelligems
- Linked Vercel project and deployed to https://intelligems.vercel.app
- Migrated all write operations from local filesystem to Neon DB (`neon-fulvous-school`)
- Added Drizzle ORM: 3 tables (time_entries, tasks, meeting_notes)
- Wrote seed script — imported 16 time entries + 29 tasks from existing markdown files
- Updated 5 API routes to use Drizzle instead of fs writes
- Notes/frameworks/reports remain as markdown in repo (read-only on Vercel, works fine)
- Added `ig` to PATH via ~/.zshrc — `ig status` works from any terminal
- Updated global CLAUDE.md: all future projects always get GitHub + Vercel (no localhost-only)

### Files Modified
| File | Changes |
|------|---------|
| `src/lib/db/schema.ts` | Drizzle schema: time_entries, tasks, meeting_notes |
| `src/lib/db/index.ts` | Neon + Drizzle client |
| `drizzle.config.ts` | Drizzle Kit config |
| `src/app/api/time/route.ts` | Reads/writes time_entries table |
| `src/app/api/projects/route.ts` | Merges file metadata + DB tasks |
| `src/app/api/projects/task/route.ts` | Toggles task via projectSlug |
| `src/app/api/projects/task/add/route.ts` | Inserts task row |
| `src/app/api/notes/route.ts` | Merges file + DB meetings |
| `src/app/api/notes/create/route.ts` | Inserts meeting_notes row |
| `src/lib/content.ts` | Added getProjectMeta() (metadata without tasks) |
| `src/app/(dashboard)/projects/page.tsx` | Uses projectSlug for task API calls |
| `scripts/seed-db.ts` | One-time seed from markdown files |
| `.gitignore` | Added .env.local |

### Next Steps
- [ ] Test ↗ send button end-to-end with personal-os running
- [ ] Add mobile-responsive layout for occasional phone use

---

## 2026-03-08 — Session 3: Housekeeping + People Hub

### Accomplished
- Committed untracked docs/plans/ (plan files from between-session work)
- Renamed browser tab: "Create Next App" → "Intelligems Workspace"
- Pushed all 10 commits to GitHub (origin/master) — Vercel auto-deployed
- People Hub DB schema: contacts, contact_benchmark_tags, contact_deliverables, contact_tasks tables (already committed between sessions)
- All contact API routes: CRUD + sub-resources (tags, deliverables, tasks) + public token endpoint
- Benchmarker bridge: src/lib/benchmarks.ts — fetchBenchmarks() by tag array
- People Hub UI:
  - Sidebar: People nav item (Users icon → /people)
  - List page: /people — contact cards, New Contact dialog
  - Detail page: /people/[slug] — Context, Tags, Deliverables, Tasks, Meeting Notes panels, Share Link copy
  - Public page: /c/[token] — read-only view with benchmarks, deliverables, next steps
  - Focus tab: "By Contact" section groups open contact tasks

### Files Added/Modified
| File | Changes |
|------|---------|
| `src/lib/db/schema.ts` | Added contacts, contact_benchmark_tags, contact_deliverables, contact_tasks tables |
| `src/app/api/contacts/route.ts` | List + create contacts |
| `src/app/api/contacts/[slug]/route.ts` | GET + PATCH single contact |
| `src/app/api/contacts/[slug]/tags/route.ts` | POST + DELETE tags |
| `src/app/api/contacts/[slug]/deliverables/route.ts` | POST + DELETE deliverables |
| `src/app/api/contacts/[slug]/tasks/route.ts` | POST + PATCH + DELETE tasks |
| `src/app/api/public/contacts/[token]/route.ts` | Public token-based lookup |
| `src/lib/benchmarks.ts` | fetchBenchmarks() bridge to Benchmarker |
| `src/components/sidebar.tsx` | Added People nav item |
| `src/app/(dashboard)/people/page.tsx` | Contact list with New Contact dialog |
| `src/app/(dashboard)/people/[slug]/page.tsx` | Full contact detail (all panels) |
| `src/app/c/[token]/page.tsx` | Public shareable contact page |
| `src/app/(dashboard)/focus/page.tsx` | By-Contact task grouping section |
| `src/app/layout.tsx` | Renamed browser tab to "Intelligems Workspace" |

### Next Steps
- [ ] Seed contacts via UI: Jerry (tag: analytics), Drew (tasks: profit guessing game, CAC calculator)
- [ ] Test public share page at /c/[token] in incognito
- [ ] Add BENCHMARKER_URL + BENCHMARKER_SECRET env vars to Vercel when Benchmarker bridge is ready
- [ ] Add mobile-responsive layout for occasional phone use
