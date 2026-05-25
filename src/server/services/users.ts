"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

export async function createUser(data: {
  name: string;
  email: string;
  role: "admin" | "cashier" | "kitchen";
  password?: string;
}) {
  let authId: string | null = null;

  if (supabaseAdmin && data.password) {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    
    if (authError) {
      throw new Error(`Gagal membuat akun auth: ${authError.message}`);
    }
    
    if (authUser?.user) {
      authId = authUser.user.id;
    }
  }

  const [created] = await db
    .insert(users)
    .values({
      authId: authId,
      name: data.name,
      email: data.email,
      role: data.role,
    })
    .returning();

  revalidatePath("/admin/users");
  return { success: true, data: created };
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    role?: "admin" | "cashier" | "kitchen";
    isActive?: string;
    password?: string;
  }
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    throw new Error("Pengguna tidak ditemukan");
  }

  if (supabaseAdmin && user.authId) {
    const updatePayload: { email?: string; password?: string } = {};
    if (data.email && data.email !== user.email) {
      updatePayload.email = data.email;
    }
    if (data.password) {
      updatePayload.password = data.password;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        user.authId,
        updatePayload
      );
      if (authError) {
        throw new Error(`Gagal memperbarui akun auth: ${authError.message}`);
      }
    }
  }

  const { password, ...dbData } = data;
  const [updated] = await db
    .update(users)
    .set({
      ...dbData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  revalidatePath("/admin/users");
  return { success: true, data: updated };
}

export async function deleteUser(id: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (supabaseAdmin && user?.authId) {
    await supabaseAdmin.auth.admin.deleteUser(user.authId);
  }

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/users");
  return { success: true };
}
