import {sqliteTable,text,integer,primaryKey} from 'drizzle-orm/sqlite-core';
export const projects=sqliteTable('projects',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),title:text('title').notNull(),
 sourceKey:text('source_key').notNull(),settings:text('settings').notNull(),variants:text('variants').notNull().default('[]'),
 createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
});
export const usage=sqliteTable('usage',{
 owner:text('owner').notNull(),month:text('month').notNull(),used:integer('used').notNull().default(0),
},t=>[primaryKey({columns:[t.owner,t.month]})]);
