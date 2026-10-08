import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {id:text('id').primaryKey(),title:text('title').notNull(),data:text('data').notNull(),version:integer('version').notNull().default(1),updatedAt:text('updated_at').notNull()});
