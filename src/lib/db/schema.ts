import { pgTable, serial, text, real, timestamp, boolean } from 'drizzle-orm/pg-core';

export const timeEntries = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(),
  timeBlock: text('time_block').notNull().default(''),
  hours: real('hours').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  yearMonth: text('year_month').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  projectSlug: text('project_slug').notNull(),
  text: text('text').notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const meetingNotes = pgTable('meeting_notes', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  duration: text('duration').notNull().default(''),
  person: text('person').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
