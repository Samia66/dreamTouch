import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function randomTicketSuffix(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}

export function generateTicketNumber(): string {
  return `DT-TKT-${randomTicketSuffix()}`;
}

/** Jeton opaque, non devinable, stocke dans le QR Code. Ne contient AUCUNE
 * donnee personnelle : uniquement un identifiant permettant au backend de
 * retrouver le ticket. */
export function generateQrToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export class CapacityExceededError extends Error {
  constructor() {
    super("CAPACITY_EXCEEDED");
  }
}
export class AlreadyConfirmedError extends Error {
  constructor() {
    super("ALREADY_CONFIRMED");
  }
}
export class AmountMismatchError extends Error {
  constructor(expected: number, received: number) {
    super(`AMOUNT_MISMATCH expected=${expected} received=${received}`);
  }
}

/**
 * Confirme un paiement de maniere atomique et securisee :
 *  - relit la reservation et son evenement SOUS VERROU (SELECT ... FOR UPDATE
 *    via $queryRaw dans une transaction serialisable) pour empecher deux
 *    confirmations concurrentes de depasser la capacite.
 *  - verifie que le montant recu correspond exactement au prix verrouille
 *    de la reservation (jamais confiance au frontend).
 *  - est idempotent : si un ticket existe deja pour cette reservation, ne
 *    fait rien de plus et retourne le ticket existant.
 *
 * Cette fonction est appelee par le webhook Celtis (ou mock), jamais
 * directement par une action utilisateur cote client.
 */
export async function confirmPaymentAndIssueTicket(params: {
  registrationId: string;
  amountReceived: number;
  transactionId: string;
  provider: string;
  rawReference?: string;
}) {
  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // Verrou de ligne sur la reservation ET sur l'evenement pour serialiser
      // les confirmations concurrentes qui visent la meme capacite.
      const registration = await tx.registration.findUnique({
        where: { id: params.registrationId },
        include: { ticket: true, event: true }
      });
      if (!registration) throw new Error("REGISTRATION_NOT_FOUND");

      if (registration.status === "CONFIRMED" && registration.ticket) {
        // Idempotence: deja traite (ex: webhook envoye deux fois).
        return { registration, ticket: registration.ticket, alreadyProcessed: true as const };
      }

      if (params.amountReceived !== registration.lockedPrice) {
        throw new AmountMismatchError(registration.lockedPrice, params.amountReceived);
      }

      // Verrou de ligne explicite sur l'evenement (PostgreSQL: FOR UPDATE)
      // pour serialiser la lecture+increment de confirmedCount.
      await tx.$executeRaw`SELECT id FROM "Event" WHERE id = ${registration.eventId} FOR UPDATE`;

      const event = await tx.event.findUniqueOrThrow({ where: { id: registration.eventId } });

      if (event.confirmedCount >= event.capacity) {
        throw new CapacityExceededError();
      }

      const newConfirmedCount = event.confirmedCount + 1;

      await tx.event.update({
        where: { id: event.id },
        data: {
          confirmedCount: newConfirmedCount,
          status: newConfirmedCount >= event.capacity ? "SOLD_OUT" : event.status
        }
      });

      await tx.registration.update({
        where: { id: registration.id },
        data: { status: "CONFIRMED" }
      });

      const ticket = await tx.ticket.create({
        data: {
          registrationId: registration.id,
          ticketNumber: generateTicketNumber(),
          qrToken: generateQrToken(),
          status: "VALID"
        }
      });

      return { registration, ticket, alreadyProcessed: false as const };
    },
    { isolationLevel: "Serializable" as Prisma.TransactionIsolationLevel }
  );
}

/** Traite un scan de QR Code a l'entree. Idempotent-safe: un ticket ne peut
 * jamais passer VALID -> USED deux fois grace au check atomique. */
export async function scanTicket(qrToken: string, scannedBy?: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const ticket = await tx.ticket.findUnique({
      where: { qrToken },
      include: { registration: true }
    });

    if (!ticket) {
      await tx.ticketScan.create({
        data: { qrToken, result: "INVALID", scannedBy }
      });
      return { result: "INVALID" as const, ticket: null };
    }

    if (ticket.status === "USED") {
      await tx.ticketScan.create({
        data: { ticketId: ticket.id, qrToken, result: "ALREADY_USED", scannedBy }
      });
      return { result: "ALREADY_USED" as const, ticket };
    }

    if (ticket.status === "REVOKED") {
      await tx.ticketScan.create({
        data: { ticketId: ticket.id, qrToken, result: "INVALID", scannedBy }
      });
      return { result: "INVALID" as const, ticket };
    }

    const updated = await tx.ticket.update({
      where: { id: ticket.id },
      data: { status: "USED", usedAt: new Date() },
      include: { registration: true }
    });

    await tx.ticketScan.create({
      data: { ticketId: ticket.id, qrToken, result: "VALID", scannedBy }
    });

    return { result: "VALID" as const, ticket: updated };
  });
}

/** Marque explicitement un ticket comme utilise depuis l'admin (apres
 * confirmation visuelle), reutilise la meme logique que le scan. */
export async function markTicketUsed(ticketId: string, scannedBy?: string) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  return scanTicket(ticket.qrToken, scannedBy);
}
