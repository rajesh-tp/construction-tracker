import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users, userConstructions } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/db/schema";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "default-dev-secret-change-in-production";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const COOKIE_NAME = "session";

type SessionPayload = {
  userId: number;
  email: string;
  role: string;
  activeConstructionId: number | null;
  exp: number;
};

function sign(payload: SessionPayload): string {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadStr)
    .digest("base64url");
  return `${payloadStr}.${signature}`;
}

function verify(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadStr)
    .digest("base64url");

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadStr, "base64url").toString()
    ) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(
  user: { id: number; email: string; role: string },
  activeConstructionId: number | null = null
): Promise<void> {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    activeConstructionId,
    exp: Date.now() + SESSION_DURATION_MS,
  };
  const token = sign(payload);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verify(token) !== null;
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export async function getSessionUser(): Promise<User | null> {
  const payload = await getSessionPayload();
  if (!payload) return null;

  const user = db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId))
    .get();

  return user ?? null;
}

export async function getActiveConstructionId(): Promise<number> {
  const payload = await getSessionPayload();
  if (!payload || !payload.activeConstructionId) {
    const nav = await import("next/navigation");
    nav.redirect("/constructions");
  }
  return payload!.activeConstructionId!;
}

export async function requireConstructionAccess(constructionId: number): Promise<void> {
  const user = await requireAuth();
  // Superadmin has access to all constructions
  if (user.role === "superadmin") return;

  const membership = db
    .select()
    .from(userConstructions)
    .where(eq(userConstructions.userId, user.id))
    .all()
    .find((uc) => uc.constructionId === constructionId);

  if (!membership) {
    const nav = await import("next/navigation");
    nav.redirect("/constructions");
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    const nav = await import("next/navigation");
    nav.redirect("/login");
  }
  return user as User;
}

export async function requireOwner(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "owner" && user.role !== "superadmin") {
    const nav = await import("next/navigation");
    nav.redirect("/");
  }
  return user;
}

export async function requireSuperAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "superadmin") {
    const nav = await import("next/navigation");
    nav.redirect("/");
  }
  return user;
}
