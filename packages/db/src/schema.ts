import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  ethAddress: varchar('eth_address', { length: 42 }).notNull().unique(),
  // For production mock purposes, we store an encrypted seed or pass verification parameters
  encryptedVault: text('encrypted_vault').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
});