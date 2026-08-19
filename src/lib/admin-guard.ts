import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";

/** A utiliser au debut de chaque route API /api/admin/* pour verifier la
 * session. Retourne la session ou null si non authentifie. */
export async function requireAdmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}
