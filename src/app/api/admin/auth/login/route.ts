import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validation";
import { COOKIE_NAME, createAdminSessionToken, verifyPassword } from "@/lib/auth";

// Rate limiting simple en memoire (par IP) pour freiner le bruteforce.
// En production, preferer un store partage (Redis) derriere plusieurs
// instances.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "TOO_MANY_ATTEMPTS" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email } });
  const valid = admin ? await verifyPassword(parsed.data.password, admin.passwordHash) : false;

  if (!admin || !valid) {
    // Reponse volontairement generique (pas d'indice sur email vs mot de passe).
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const token = await createAdminSessionToken(admin.id, admin.email);
  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60
  });
  return res;
}
