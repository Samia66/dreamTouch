import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import {
  AmountMismatchError,
  CapacityExceededError,
  confirmPaymentAndIssueTicket
} from "@/lib/ticket";
import { generateTicketPdf } from "@/lib/pdf";
import { sendConfirmationEmail } from "@/lib/email";

/**
 * POST /api/payments/celtis/webhook
 *
 * Point d'entree unique pour les notifications de paiement (Celtis en
 * production, ou le provider mock en sandbox). Ne fait JAMAIS confiance au
 * frontend : verifie signature, montant, reservation, capacite, puis
 * confirme de facon idempotente.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const provider = getPaymentProvider();

  let verification;
  try {
    verification = await provider.verifyWebhook(rawBody, req.headers);
  } catch (err) {
    console.warn("Webhook signature/format invalide", err);
    // Toujours repondre 200 avec un statut d'erreur generique pour eviter
    // de donner des indices a un attaquant qui teste des signatures.
    return NextResponse.json({ received: true, error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  // Idempotence stricte: si cet evenement webhook a deja ete traite, on
  // repond OK sans rien refaire (Celtis peut renvoyer la meme notification
  // plusieurs fois).
  const existingByWebhookId = await prisma.payment.findUnique({
    where: { webhookEventId: verification.webhookEventId }
  }).catch(() => null);
  if (existingByWebhookId?.status === "CONFIRMED") {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  const registration = await prisma.registration.findUnique({
    where: { reference: verification.reference },
    include: { event: true, payments: true }
  });

  if (!registration) {
    console.warn("Webhook: reservation introuvable pour reference", verification.reference);
    return NextResponse.json({ received: true, error: "REGISTRATION_NOT_FOUND" }, { status: 404 });
  }

  const payment =
    registration.payments.find((p: { transactionId: string | null }) => p.transactionId === verification.transactionId) ??
    registration.payments.find((p: { status: string }) => p.status === "PENDING") ??
    null;

  if (verification.status !== "CONFIRMED") {
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: verification.status,
          transactionId: verification.transactionId,
          rawReference: JSON.stringify(verification.rawPayload).slice(0, 2000),
          webhookEventId: verification.webhookEventId,
          failureReason: verification.status
        }
      });
    }
    if (verification.status === "FAILED" || verification.status === "CANCELLED") {
      await prisma.registration.update({
        where: { id: registration.id },
        data: { status: "PAYMENT_FAILED" }
      });
    }
    return NextResponse.json({ received: true, status: verification.status });
  }

  // --- Paiement declare CONFIRME par le provider -----------------------
  try {
    const result = await confirmPaymentAndIssueTicket({
      registrationId: registration.id,
      amountReceived: verification.amount,
      transactionId: verification.transactionId,
      provider: registration.payments[0]?.provider ?? "CELTIS",
      rawReference: JSON.stringify(verification.rawPayload).slice(0, 2000)
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "CONFIRMED",
          transactionId: verification.transactionId,
          amount: verification.amount,
          rawReference: JSON.stringify(verification.rawPayload).slice(0, 2000),
          webhookEventId: verification.webhookEventId,
          paidAt: new Date()
        }
      });
    }

    if (!result.alreadyProcessed) {
      // Generation ticket PDF + envoi email, en dehors de la transaction DB
      // pour ne pas bloquer le verrou plus longtemps que necessaire.
      const pdfBuffer = await generateTicketPdf({
        eventName: registration.event.name,
        eventEdition: registration.event.edition,
        experienceName: "THE UNKNOWN",
        participantFullName: `${registration.firstName} ${registration.lastName}`,
        reference: registration.reference,
        ticketNumber: result.ticket.ticketNumber,
        date: registration.event.date
          ? new Date(registration.event.date).toLocaleDateString("fr-FR")
          : "À définir",
        location: registration.event.location ?? "Dévoilé après inscription",
        duration: registration.event.durationLabel,
        pricePaid: registration.lockedPrice,
        currency: "FCFA",
        qrToken: result.ticket.qrToken
      });

      await sendConfirmationEmail({
        to: registration.email,
        firstName: registration.firstName,
        ticketNumber: result.ticket.ticketNumber,
        amountPaid: registration.lockedPrice,
        currency: "FCFA",
        whatsappNumber: registration.event.whatsappNumber,
        pdfBuffer
      });
    }

    return NextResponse.json({ received: true, confirmed: true });
  } catch (err) {
    if (err instanceof CapacityExceededError) {
      // Cas critique: le paiement a ete accepte par Celtis mais la capacite
      // est deja atteinte (concurrence extreme). Il faut le signaler pour
      // remboursement manuel/automatique et ne PAS emettre de ticket.
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "CONFIRMED",
            transactionId: verification.transactionId,
            amount: verification.amount,
            failureReason: "CAPACITY_EXCEEDED_NEEDS_REFUND",
            webhookEventId: verification.webhookEventId,
            paidAt: new Date()
          }
        });
      }
      console.error(
        `ALERTE: paiement confirme pour ${registration.reference} mais capacite atteinte. Remboursement requis.`
      );
      return NextResponse.json(
        { received: true, error: "CAPACITY_EXCEEDED", requiresRefund: true },
        { status: 200 }
      );
    }
    if (err instanceof AmountMismatchError) {
      console.error("Webhook: montant incorrect", err.message);
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED", failureReason: "AMOUNT_MISMATCH" }
        });
      }
      return NextResponse.json({ received: true, error: "AMOUNT_MISMATCH" }, { status: 200 });
    }
    console.error("Webhook: erreur inattendue", err);
    return NextResponse.json({ received: true, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// Utilitaire pour previsualiser un QR pendant le dev (non expose publiquement
// dans le README comme route officielle).
export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST only" });
}
