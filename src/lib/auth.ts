"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "admin_session";

export async function verifyPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  // Support both plain text and bcrypt hashed passwords
  if (adminPassword.startsWith("$2")) {
    return bcrypt.compare(password, adminPassword);
  }
  return password === adminPassword;
}

export async function login(password: string): Promise<boolean> {
  const valid = await verifyPassword(password);
  if (valid) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    return true;
  }
  return false;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === "authenticated";
}
