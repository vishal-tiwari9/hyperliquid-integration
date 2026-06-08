// app/actions.ts
"use server";

import { db } from "../../packages/db/src/index";
import { users, userWallets } from "../../packages/db/src/schema";
import { eq } from "drizzle-orm";

export async function syncPrivyUser(privyUser: any) {
  if (!privyUser?.id) throw new Error("Invalid Privy user");

  // Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.privyId, privyUser.id))
    .limit(1);

  let userId: string;

  if (existingUser.length === 0) {
    // === FIRST TIME USER (Register) ===
    const [newUser] = await db.insert(users).values({
      privyId: privyUser.id,
      email: privyUser.email?.address || null,
      fullName: privyUser.google?.name || null,
      avatarUrl: privyUser.google?.picture || null,
    }).returning();

    userId = newUser.id;

    // Privy already created embedded wallet → just record the address
    // We'll fetch it from client side and sync
    console.log(`New user created: ${userId}`);
  } else {
    userId = existingUser[0].id;
  }

  return { userId, isNewUser: existingUser.length === 0 };
}


// app/actions.ts
export async function updateLoginStreak(privyId: string) {
  const today = new Date().toISOString().split('T')[0];

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.privyId, privyId));

  if (!user) return;

  const lastLogin = user.lastLoginDate;
  let newStreak = user.streak;

  if (lastLogin === today) return; // already logged in today

  if (lastLogin === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
    newStreak += 1; // consecutive day
  } else {
    newStreak = 1; // streak broken
  }

  await db.update(users)
    .set({ streak: newStreak, lastLoginDate: today, updatedAt: new Date() })
    .where(eq(users.privyId, privyId));
}