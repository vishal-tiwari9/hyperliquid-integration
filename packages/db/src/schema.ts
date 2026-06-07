import { pgTable, uuid, text, timestamp, varchar, jsonb, boolean,integer ,date} from 'drizzle-orm/pg-core';

// db/schema.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  privyId: varchar('privy_id', { length: 100 }).unique(),
  email: varchar('email', { length: 255 }).unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  streak: integer('streak').default(0).notNull(),
  lastLoginDate: date('last_login_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userWallets = pgTable('user_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  privyAddress: varchar('privy_address', { length: 42 }).notNull().unique(), // EVM address from Privy
  chain: varchar('chain', { length: 20 }).default('hyperliquid'), // or arbitrum etc.
  isDefault: boolean('is_default').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Optional: User preferences / settings
export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  defaultLeverage: integer('default_leverage').default(10),
  favoriteTickers: jsonb('favorite_tickers').default([]), 
  theme: varchar('theme', { length: 20 }).default('dark'),
});