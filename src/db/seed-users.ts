// src/db/seed-users.ts
// Run: bun run src/db/seed-users.ts
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./schema";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

const USERS = [
  { email: "admin@koffiestation.id", password: "admin123!", name: "Admin Koffie", role: "admin" as const },
  { email: "kasir@koffiestation.id", password: "kasir123!", name: "Kasir 01", role: "cashier" as const },
  { email: "dapur@koffiestation.id", password: "dapur123!", name: "Kitchen Staff", role: "kitchen" as const },
];

async function seedUsers() {
  console.log("👤 Creating auth users...\n");

  for (const u of USERS) {
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true, // auto-confirm email
    });

    if (authError) {
      // If user already exists, fetch their ID
      if (authError.message.includes("already been registered")) {
        console.log(`  ⚠️  ${u.email} already exists in Auth, skipping auth creation...`);
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find((x) => x.email === u.email);
        if (existing) {
          // Still insert into our users table if not there yet
          try {
            await db.insert(users).values({
              authId: existing.id,
              name: u.name,
              email: u.email,
              role: u.role,
            }).onConflictDoNothing();
            console.log(`  ✅ ${u.name} (${u.role}) — synced to users table`);
          } catch {
            console.log(`  ✅ ${u.name} (${u.role}) — already in users table`);
          }
        }
        continue;
      }
      console.error(`  ❌ Failed to create ${u.email}:`, authError.message);
      continue;
    }

    // 2. Insert into our public.users table
    await db.insert(users).values({
      authId: authData.user.id,
      name: u.name,
      email: u.email,
      role: u.role,
    });

    console.log(`  ✅ ${u.name} (${u.role}) — ${u.email} / ${u.password}`);
  }

  console.log("\n🎉 Users created! Login credentials:");
  console.log("┌─────────────────────────────────────────────────┐");
  console.log("│  Role     │ Email                    │ Password │");
  console.log("├─────────────────────────────────────────────────┤");
  for (const u of USERS) {
    console.log(`│  ${u.role.padEnd(8)} │ ${u.email.padEnd(24)} │ ${u.password.padEnd(8)} │`);
  }
  console.log("└─────────────────────────────────────────────────┘");

  await client.end();
}

seedUsers().catch((err) => {
  console.error("❌ Seed users failed:", err);
  process.exit(1);
});
