import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTicketPdf } from "@/lib/pdf";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const registration = await prisma.registration.findUnique({
    where: { id: params.id },
    include: { ticket: true, event: true }
  });

  if (!registration || !registration.ticket || registration.status !== "CONFIRMED") {
    return NextResponse.json({ error: "TICKET_NOT_AVAILABLE" }, { status: 404 });
  }

  const pdfBuffer = await generateTicketPdf({
    eventName: registration.event.name,
    eventEdition: registration.event.edition,
    experienceName: "THE UNKNOWN",
    participantFullName: `${registration.firstName} ${registration.lastName}`,
    reference: registration.reference,
    ticketNumber: registration.ticket.ticketNumber,
    date: registration.event.date
      ? new Date(registration.event.date).toLocaleDateString("fr-FR")
      : "À définir",
    location: registration.event.location ?? "Dévoilé après inscription",
    duration: registration.event.durationLabel,
    pricePaid: registration.lockedPrice,
    currency: "FCFA",
    qrToken: registration.ticket.qrToken
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${registration.ticket.ticketNumber}.pdf"`
    }
  });
}
