import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import type { Registration, Ticket } from "@prisma/client";

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const registrations = await prisma.registration.findMany({
    include: { ticket: true },
    orderBy: { createdAt: "asc" }
  });

  const headers = [
    "Nom",
    "Prenom",
    "Telephone",
    "Email",
    "Montant (FCFA)",
    "Date inscription",
    "Numero ticket",
    "Statut"
  ];

  const rows = registrations.map((r: Registration & { ticket: Ticket | null }) =>
    [
      r.lastName,
      r.firstName,
      r.phone,
      r.email,
      String(r.lockedPrice),
      r.createdAt.toISOString(),
      r.ticket?.ticketNumber ?? "",
      r.status
    ]
      .map(csvEscape)
      .join(";")
  );

  const csv = [headers.join(";"), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dreamtouch-participants-${Date.now()}.csv"`
    }
  });
}
