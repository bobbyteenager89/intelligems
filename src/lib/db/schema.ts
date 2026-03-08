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
  contactSlug: text('contact_slug'),
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
  contactSlug: text('contact_slug'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  token: text('token').notNull().unique(),
  name: text('name').notNull(),
  company: text('company').notNull().default(''),
  context: text('context').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const contactBenchmarkTags = pgTable('contact_benchmark_tags', {
  id: serial('id').primaryKey(),
  contactSlug: text('contact_slug').notNull(),
  tag: text('tag').notNull(),
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
