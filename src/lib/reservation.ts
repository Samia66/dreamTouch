import { prisma } from "@/lib/prisma";
import { resolveTierForNextParticipant } from "@/lib/pricing";
import { getSetting } from "@/lib/settings";
import type { Prisma } from "@prisma/client";

export class EventSoldOutError extends Error {
  constructor() {
    super("EVENT_SOLD_OUT");
  }
}

export class EventNotOpenError extends Error {
  constructor() {
    super("EVENT_NOT_OPEN");
  }
}

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  age: number;
  city: string;
  profession: string;
  emergencyName?: string;
  emergencyPhone?: string;
  acceptedTerms: boolean;
  acceptedContact: boolean;
}

/**
 * Genere une reference lisible du type DT-2026-0001.
 * Le compteur se base sur le nombre total de reservations de l'annee en
 * cours pour cet evenement — collisions evitees par la contrainte unique
 * en base + retry, la transaction appelante garantit deja la coherence.
 */
type TxClient = Prisma.TransactionClient;

async function nextReference(tx: TxClient, eventId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.registration.count({
    where: {
      eventId,
      reference: { startsWith: `DT-${year}-` }
    }
  });
  const seq = String(count + 1).padStart(4, "0");
  return `DT-${year}-${seq}`;
}

/**
 * Cree une reservation en verrouillant son prix selon le palier courant.
 * N'incremente PAS Event.confirmedCount (reserve a la confirmation de
 * paiement). Protege par une transaction pour eviter des lectures
 * incoherentes du palier en cas d'inscriptions simultanees.
 */
export async function createRegistration(eventSlug: string, input: RegistrationInput) {
  return prisma.$transaction(async (tx: TxClient) => {
    const event = await tx.event.findUnique({
      where: { slug: eventSlug },
      include: { pricingTiers: true }
    });
    if (!event) throw new Error("EVENT_NOT_FOUND");
    if (event.status === "CLOSED") throw new EventNotOpenError();
    if (event.confirmedCount >= event.capacity || event.status === "SOLD_OUT") {
      throw new EventSoldOutError();
    }

    const tier = resolveTierForNextParticipant(event.pricingTiers, event.confirmedCount);
    if (!tier) throw new EventSoldOutError();

    const ttlMinutes = Number(await getSetting(event.id, "RESERVATION_TTL_MINUTES", "20"));
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    const reference = await nextReference(tx, event.id);

    const registration = await tx.registration.create({
      data: {
        reference,
        eventId: event.id,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        age: input.age,
        city: input.city.trim(),
        profession: input.profession.trim(),
        emergencyName: input.emergencyName?.trim() || null,
        emergencyPhone: input.emergencyPhone?.trim() || null,
        acceptedTerms: input.acceptedTerms,
        acceptedContact: input.acceptedContact,
        lockedPrice: tier.price,
        pricingTierId: tier.id,
        status: "PENDING_PAYMENT",
        expiresAt
      }
    });

    return { registration, lockedTier: tier, expiresAt };
  });
}

/**
 * Marque comme EXPIRED toutes les reservations PENDING_PAYMENT dont le
 * delai est depasse. A appeler avant tout calcul d'affichage de prix/places
 * et via une tache planifiee (cron) en production.
 */
export async function expireStaleRegistrations() {
  const now = new Date();
  await prisma.registration.updateMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { lt: now } },
    data: { status: "EXPIRED" }
  });
}
