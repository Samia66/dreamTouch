import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "dt_admin_session";
const SESSION_DURATION = "12h";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET manquant ou trop court (voir .env.example).");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminSessionToken(adminId: string, email: string): Promise<string> {
  return new SignJWT({ sub: adminId, email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export interface AdminSession {
  sub: string;
  email: string;
  role: string;
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "admin") return null;
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
