import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyKkiapayTransaction } from "@/lib/payments/kkiapay-provider";
import {
  AmountMismatchError,
  CapacityExceededError,
  confirmPaymentAndIssueTicket
} from "@/lib/ticket";
import { generateTicketPdf } from "@/lib/pdf";
import { sendConfirmationEmail } from "@/lib/email";

const bodySchema = z.object({
  registrationId: z.string().uuid(),
  transactionId: z.string().min(1)
});

/**
 * POST /api/payments/kkiapay/confirm
 *
 * Appelee par la page /paiement/kkiapay/[registrationId] apres que le
 * widget Kkiapay ait declenche son evenement "success" cote navigateur.
 * Cet evenement client N'EST PAS une preuve de paiement (transactionId
 * fourni par le navigateur, potentiellement falsifie) : cette route
 * revérifie la transaction directement aupres de l'API Kkiapay avec les
 * cles privee/secrete (jamais exposees au frontend), avant de confirmer
 * quoi que ce soit. Meme politique que le webhook Celtis : montant et
 * capacite toujours reverifies serveur, jamais confiance au client.
 */
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  const { registrationId, transactionId } = parsed.data;

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { event: true, payments: true }
  });
  if (!registration) {
    return NextResponse.json({ error: "REGISTRATION_NOT_FOUND" }, { status: 404 });
  }

  // Idempotence: si deja confirme (ex. double appel apres un refresh), on
  // repond OK sans refaire de verification reseau.
  if (registration.status === "CONFIRMED") {
    return NextResponse.json({ confirmed: true, alreadyProcessed: true });
  }

  const payment =
    registration.payments.find((p) => p.transactionId === transactionId) ??
    registration.payments.find((p) => p.status === "PENDING") ??
    null;

  let verification;
  try {
    verification = await verifyKkiapayTransaction(transactionId);
  } catch (err) {
    console.error("Kkiapay verify() a echoue", err);
    return NextResponse.json({ error: "VERIFICATION_FAILED" }, { status: 502 });
  }

  if (verification.status !== "SUCCESS") {
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          transactionId,
          failureReason: verification.status,
          rawReference: JSON.stringify(verification).slice(0, 2000)
        }
      });
    }
    return NextResponse.json({ confirmed: false, status: verification.status });
  }

  const amountReceived = Number(verification.amount);

  try {
    const result = await confirmPaymentAndIssueTicket({
      registrationId: registration.id,
      amountReceived,
      transactionId,
      provider: "KKIAPAY",
      rawReference: JSON.stringify(verification).slice(0, 2000)
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "CONFIRMED",
          transactionId,
          amount: amountReceived,
          rawReference: JSON.stringify(verification).slice(0, 2000),
          paidAt: new Date()
        }
      });
    }

    if (!result.alreadyProcessed) {
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

    return NextResponse.json({ confirmed: true });
  } catch (err) {
    if (err instanceof CapacityExceededError) {
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "CONFIRMED",
            transactionId,
            amount: amountReceived,
            failureReason: "CAPACITY_EXCEEDED_NEEDS_REFUND",
            paidAt: new Date()
          }
        });
      }
      console.error(
        `ALERTE: paiement Kkiapay confirme pour ${registration.reference} mais capacite atteinte. Remboursement requis (k.refund).`
      );
      return NextResponse.json({ error: "CAPACITY_EXCEEDED", requiresRefund: true }, { status: 200 });
    }
    if (err instanceof AmountMismatchError) {
      console.error("Kkiapay: montant incorrect", err.message);
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED", failureReason: "AMOUNT_MISMATCH" }
        });
      }
      return NextResponse.json({ error: "AMOUNT_MISMATCH" }, { status: 200 });
    }
    console.error("Kkiapay confirm: erreur inattendue", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
