// packages/db/src/schema.ts

import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  jsonb,
  boolean,
  integer,
  date,
  decimal,
  bigint,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const orderSideEnum = pgEnum("order_side", ["buy", "sell"]);
export const orderTypeEnum = pgEnum("order_type", ["market", "limit"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "open",
  "filled",
  "partially_filled",
  "cancelled",
  "rejected",
]);

// ─── Users ─────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  privyId: varchar("privy_id", { length: 100 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  streak: integer("streak").default(0).notNull(),
  lastLoginDate: date("last_login_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── User wallets (from Privy embedded wallet) ────────────────────────────────

export const userWallets = pgTable("user_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  privyAddress: varchar("privy_address", { length: 42 }).notNull().unique(),
  chain: varchar("chain", { length: 20 }).default("arbitrum"),
  isDefault: boolean("is_default").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── User settings ────────────────────────────────────────────────────────────

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  defaultLeverage: integer("default_leverage").default(10),
  favoriteTickers: jsonb("favorite_tickers").default([]),
  theme: varchar("theme", { length: 20 }).default("dark"),
  preferredNetwork: varchar("preferred_network", { length: 20 }).default("testnet"),
});

// ─── Orders ──────────────────────────────────────────────────────────────────
// Mirrors the order state on Hyperliquid for our internal records.

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  /** Hyperliquid order ID (oid) */
  hlOrderId: bigint("hl_order_id", { mode: "number" }),
  coin: varchar("coin", { length: 20 }).notNull(),
  side: orderSideEnum("side").notNull(),
  orderType: orderTypeEnum("order_type").notNull(),
  size: decimal("size", { precision: 20, scale: 8 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }),
  leverage: integer("leverage").default(1),
  reduceOnly: boolean("reduce_only").default(false),
  tpPrice: decimal("tp_price", { precision: 20, scale: 8 }),
  slPrice: decimal("sl_price", { precision: 20, scale: 8 }),
  status: orderStatusEnum("status").default("pending"),
  fillPrice: decimal("fill_price", { precision: 20, scale: 8 }),
  fillSize: decimal("fill_size", { precision: 20, scale: 8 }),
  /** HL tx hash or explorer URL */
  explorerUrl: text("explorer_url"),
  network: varchar("network", { length: 20 }).default("testnet"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Deposits (for UPI on-ramp tracking) ─────────────────────────────────────

export const deposits = pgTable("deposits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  /** Razorpay payment ID */
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }).unique(),
  amountInr: decimal("amount_inr", { precision: 15, scale: 2 }).notNull(),
  amountUsdc: decimal("amount_usdc", { precision: 20, scale: 6 }),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  status: varchar("status", { length: 20 }).default("pending"),
  txHash: varchar("tx_hash", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});