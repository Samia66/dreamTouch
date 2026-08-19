import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computePricingStatus, tierPhaseLabel } from "@/lib/pricing";

const EVENT_SLUG = "the-unknown";

export const revalidate = 0;

export async function GET() {
  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: { pricingTiers: true }
  });

  if (!event) {
    return NextResponse.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
  }

  const status = computePricingStatus(event.pricingTiers, event.confirmedCount, event.capacity);

  return NextResponse.json({
    event: {
      name: event.name,
      edition: event.edition,
      date: event.date,
      location: event.location,
      durationLabel: event.durationLabel,
      whatsappNumber: event.whatsappNumber,
      status: event.status
    },
    pricing: {
      ...status,
      phaseLabel: tierPhaseLabel(status.currentTier)
    }
  });
}
