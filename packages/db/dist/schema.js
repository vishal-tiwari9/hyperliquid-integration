"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wallets = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    fullName: (0, pg_core_1.text)('full_name'),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.wallets = (0, pg_core_1.pgTable)('wallets', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    ethAddress: (0, pg_core_1.varchar)('eth_address', { length: 42 }).notNull().unique(),
    // For production mock purposes, we store an encrypted seed or pass verification parameters
    encryptedVault: (0, pg_core_1.text)('encrypted_vault').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
//# sourceMappingURL=schema.js.map