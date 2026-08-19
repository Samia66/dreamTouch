import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderQrDataUrl } from "@/lib/qrcode";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const registration = await prisma.registration.findUnique({
    where: { id: params.id },
    include: { ticket: true, event: true }
  });

  if (!registration) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const qrDataUrl = registration.ticket ? await renderQrDataUrl(registration.ticket.qrToken) : null;

  return NextResponse.json({
    status: registration.status,
    reference: registration.reference,
    amount: registration.lockedPrice,
    expiresAt: registration.expiresAt,
    participant: {
      firstName: registration.firstName,
      lastName: registration.lastName
    },
    event: {
      name: registration.event.name,
      date: registration.event.date,
      location: registration.event.location,
      durationLabel: registration.event.durationLabel,
      whatsappNumber: registration.event.whatsappNumber
    },
    ticket: registration.ticket
      ? {
          ticketNumber: registration.ticket.ticketNumber,
          status: registration.ticket.status,
          qrDataUrl
        }
      : null
  });
}
