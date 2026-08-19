import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function getSetting(
  eventId: string,
  key: string,
  fallback: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string> {
  const row = await client.eventSetting.findUnique({
    where: { eventId_key: { eventId, key } }
  });
  return row?.value ?? fallback;
}

export async function setSetting(eventId: string, key: string, value: string) {
  return prisma.eventSetting.upsert({
    where: { eventId_key: { eventId, key } },
    update: { value },
    create: { eventId, key, value }
  });
}

export async function getAllSettings(eventId: string) {
  return prisma.eventSetting.findMany({ where: { eventId } });
}
