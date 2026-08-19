import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { settingsUpdateSchema } from "@/lib/validation";
import { getSetting, setSetting } from "@/lib/settings";

const EVENT_SLUG = "the-unknown";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: { pricingTiers: { orderBy: { order: "asc" } } }
  });
  if (!event) return NextResponse.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });

  const ttl = await getSetting(event.id, "RESERVATION_TTL_MINUTES", "20");

  return NextResponse.json({
    event: {
      id: event.id,
      name: event.name,
      capacity: event.capacity,
      confirmedCount: event.confirmedCount,
      date: event.date,
      location: event.location,
      durationLabel: event.durationLabel,
      whatsappNumber: event.whatsappNumber,
      status: event.status
    },
    reservationTtlMinutes: Number(ttl),
    pricingTiers: event.pricingTiers
  });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { slug: EVENT_SLUG } });
  if (!event) return NextResponse.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { capacity, date, location, reservationTtlMinutes } = parsed.data;

  await prisma.event.update({
    where: { id: event.id },
    data: {
      ...(capacity !== undefined ? { capacity } : {}),
      ...(date !== undefined ? { date: date ? new Date(date) : null } : {}),
      ...(location !== undefined ? { location } : {})
    }
  });

  if (reservationTtlMinutes !== undefined) {
    await setSetting(event.id, "RESERVATION_TTL_MINUTES", String(reservationTtlMinutes));
  }

  return NextResponse.json({ ok: true });
}
