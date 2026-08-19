import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import type { Prisma, Registration, Payment, Ticket } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const filter = searchParams.get("filter"); // confirmed | pending | failed | used | unused

  const where: Prisma.RegistrationWhereInput = {};

  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { ticket: { ticketNumber: { contains: q, mode: "insensitive" } } }
    ];
  }

  if (filter === "confirmed") where.status = "CONFIRMED";
  if (filter === "pending") where.status = "PENDING_PAYMENT";
  if (filter === "failed") where.status = { in: ["PAYMENT_FAILED", "EXPIRED", "CANCELLED"] };
  if (filter === "used") where.ticket = { status: "USED" };
  if (filter === "unused") where.ticket = { status: "VALID" };

  const registrations = await prisma.registration.findMany({
    where,
    include: { ticket: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  return NextResponse.json({
    participants: registrations.map((r: Registration & { ticket: Ticket | null; payments: Payment[] }) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone,
      email: r.email,
      createdAt: r.createdAt,
      status: r.status,
      amount: r.lockedPrice,
      ticketNumber: r.ticket?.ticketNumber ?? null,
      ticketStatus: r.ticket?.status ?? null,
      paidAt: r.payments[0]?.paidAt ?? null
    }))
  });
}
