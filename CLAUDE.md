# Intelligems Workspace

## Overview
Consulting ops dashboard for Intelligems fractional engagement.
Deployed at https://intelligems.vercel.app

## Tech Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- shadcn/ui (new-york, neutral), Lucide React
- gray-matter (frontmatter parsing), react-markdown + remark-gfm
- Neon (Postgres via Drizzle ORM) — time entries, tasks, meeting notes
- Markdown files in repo — notes, frameworks, reports (read-only on Vercel)

## Commands
- `npm run dev` — start on port 3040
- `ig log 2h research "description"` — log time (CLI)
- `ig status` — show budget status
- `ig report` — generate weekly report
- `ig open` — open in browser

## Project Structure
- `content/` — all data (time logs, notes, projects)
- `src/app/(dashboard)/` — tabbed UI pages
- `src/lib/` — content utilities, bridge
- `cli/ig.js` — CLI tool (symlinked to ~/.local/bin/ig)

## Config Constants
- BUDGET_HOURS = 40
- BUDGET_RESET_DAY = 7
- PORT = 3040
- Time categories: research, strategy, meeting, admin, content, building
