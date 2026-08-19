import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { scanRequestSchema } from "@/lib/validation";
import { scanTicket } from "@/lib/ticket";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = scanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const outcome = await scanTicket(parsed.data.qrToken, session.sub);

  if (outcome.result === "INVALID") {
    return NextResponse.json({ result: "INVALID" });
  }

  const ticket = outcome.ticket as (typeof outcome.ticket & {
    registration?: { firstName: string; lastName: string };
  }) | null;

  return NextResponse.json({
    result: outcome.result,
    ticket: ticket
      ? {
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          participant: ticket.registration
            ? `${ticket.registration.firstName} ${ticket.registration.lastName}`
            : undefined
        }
      : null
  });
}
