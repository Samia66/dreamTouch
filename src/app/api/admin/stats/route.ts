import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { computePricingStatus, tierPhaseLabel } from "@/lib/pricing";

const EVENT_SLUG = "the-unknown";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: { pricingTiers: true }
  });
  if (!event) return NextResponse.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });

  const [confirmedPayments, pendingPayments, failedPayments, ticketsUsed, ticketsUnused, revenueAgg] =
    await Promise.all([
      prisma.payment.count({ where: { status: "CONFIRMED" } }),
      prisma.registration.count({ where: { status: "PENDING_PAYMENT" } }),
      prisma.payment.count({ where: { status: { in: ["FAILED", "CANCELLED", "EXPIRED"] } } }),
      prisma.ticket.count({ where: { status: "USED" } }),
      prisma.ticket.count({ where: { status: "VALID" } }),
      prisma.registration.aggregate({
        where: { status: "CONFIRMED" },
        _sum: { lockedPrice: true }
      })
    ]);

  const pricing = computePricingStatus(event.pricingTiers, event.confirmedCount, event.capacity);

  return NextResponse.json({
    confirmedParticipants: event.confirmedCount,
    capacity: event.capacity,
    remaining: pricing.remaining,
    currentPrice: pricing.currentPrice,
    currentPhase: tierPhaseLabel(pricing.currentTier),
    soldOut: pricing.soldOut,
    revenue: revenueAgg._sum.lockedPrice ?? 0,
    stats: {
      paymentsConfirmed: confirmedPayments,
      paymentsPending: pendingPayments,
      paymentsFailed: failedPayments,
      ticketsUsed,
      ticketsUnused
    }
  });
}
