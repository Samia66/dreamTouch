import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.upsert({
    where: { slug: "the-unknown" },
    update: {},
    create: {
      name: "DreamTouch Experience #001",
      slug: "the-unknown",
      edition: "#001",
      tagline: "Tu ne viens pas pour assister. Tu viens vivre une expérience.",
      date: null,
      location: null,
      durationLabel: "3 heures",
      capacity: 20,
      confirmedCount: 0,
      status: "OPEN",
      whatsappNumber: "0129791717"
    }
  });

  const tiers = [
    { name: "Phase 1 — Early Bird", minParticipants: 1, maxParticipants: 5, price: 5000, order: 1 },
    { name: "Phase 2 — Standard", minParticipants: 6, maxParticipants: 10, price: 7000, order: 2 },
    { name: "Phase 3 — Dernières places", minParticipants: 16, maxParticipants: 5, price: 7500, order: 3 }
  ];

  for (const tier of tiers) {
    const existing = await prisma.pricingTier.findFirst({
      where: { eventId: event.id, order: tier.order }
    });
    if (existing) {
      await prisma.pricingTier.update({ where: { id: existing.id }, data: tier });
    } else {
      await prisma.pricingTier.create({ data: { ...tier, eventId: event.id, active: true } });
    }
  }

  await prisma.eventSetting.upsert({
    where: { eventId_key: { eventId: event.id, key: "RESERVATION_TTL_MINUTES" } },
    update: {},
    create: { eventId: event.id, key: "RESERVATION_TTL_MINUTES", value: "20" }
  });

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@dreamtouch.example";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-before-seeding";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: "Administrateur DreamTouch" }
  });

  console.log("Seed terminé.");
  console.log(`Événement: ${event.name} (${event.slug})`);
  console.log(`Admin: ${adminEmail} — mot de passe défini via ADMIN_PASSWORD dans .env`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
