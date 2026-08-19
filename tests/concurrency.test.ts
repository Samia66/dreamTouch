/**
 * Tests d'intégration — nécessitent une base PostgreSQL de test accessible
 * via DATABASE_URL (voir README > "Lancer les tests"). Ils sont ignorés
 * automatiquement si DATABASE_URL n'est pas définie, pour ne pas casser
 * `npm test` dans un environnement sans base de données.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

d("confirmPaymentAndIssueTicket — concurrence et idempotence", () => {
  let prisma: import("@prisma/client").PrismaClient;
  let ticketLib: typeof import("@/lib/ticket");
  let eventId: string;

  beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    ticketLib = await import("@/lib/ticket");
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  beforeEach(async () => {
    await prisma.ticketScan.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.pricingTier.deleteMany();
    await prisma.eventSetting.deleteMany();
    await prisma.event.deleteMany();

    const event = await prisma.event.create({
      data: {
        name: "Test Event",
        slug: `test-${Date.now()}`,
        capacity: 2,
        confirmedCount: 0,
        status: "OPEN"
      }
    });
    eventId = event.id;
  });

  async function createPendingRegistration(price = 5000) {
    return prisma.registration.create({
      data: {
        reference: `TEST-${Math.random().toString(36).slice(2)}`,
        eventId,
        firstName: "Test",
        lastName: "User",
        phone: "0000000000",
        email: `test-${Math.random()}@example.com`,
        age: 25,
        city: "Cotonou",
        profession: "Dev",
        lockedPrice: price,
        status: "PENDING_PAYMENT",
        expiresAt: new Date(Date.now() + 60_000)
      }
    });
  }

  it("bloque la confirmation au-dela de la capacite (2 max, 3 tentatives concurrentes)", async () => {
    const regs = await Promise.all([
      createPendingRegistration(),
      createPendingRegistration(),
      createPendingRegistration()
    ]);

    const results = await Promise.allSettled(
      regs.map((r, i) =>
        ticketLib.confirmPaymentAndIssueTicket({
          registrationId: r.id,
          amountReceived: 5000,
          transactionId: `TX-${i}`,
          provider: "MOCK"
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    expect(succeeded.length).toBe(2);
    expect(failed.length).toBe(1);

    const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    expect(event.confirmedCount).toBe(2);
    expect(event.status).toBe("SOLD_OUT");
  });

  it("rejette un montant incorrect", async () => {
    const reg = await createPendingRegistration(5000);
    await expect(
      ticketLib.confirmPaymentAndIssueTicket({
        registrationId: reg.id,
        amountReceived: 4000,
        transactionId: "TX-WRONG",
        provider: "MOCK"
      })
    ).rejects.toThrow(/AMOUNT_MISMATCH/);
  });

  it("est idempotent: deux confirmations pour la meme reservation ne creent qu'un seul ticket", async () => {
    const reg = await createPendingRegistration(5000);

    const first = await ticketLib.confirmPaymentAndIssueTicket({
      registrationId: reg.id,
      amountReceived: 5000,
      transactionId: "TX-DUP",
      provider: "MOCK"
    });
    const second = await ticketLib.confirmPaymentAndIssueTicket({
      registrationId: reg.id,
      amountReceived: 5000,
      transactionId: "TX-DUP",
      provider: "MOCK"
    });

    expect(first.ticket.id).toBe(second.ticket.id);
    const ticketCount = await prisma.ticket.count({ where: { registrationId: reg.id } });
    expect(ticketCount).toBe(1);

    const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    expect(event.confirmedCount).toBe(1);
  });
});

d("scanTicket — double scan et jeton invalide", () => {
  let prisma: import("@prisma/client").PrismaClient;
  let ticketLib: typeof import("@/lib/ticket");

  beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    ticketLib = await import("@/lib/ticket");
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("refuse un jeton QR inexistant", async () => {
    const outcome = await ticketLib.scanTicket("jeton-qui-nexiste-pas");
    expect(outcome.result).toBe("INVALID");
  });

  it("empeche un double scan du meme ticket", async () => {
    const event = await prisma.event.create({
      data: { name: "Scan Test", slug: `scan-${Date.now()}`, capacity: 5, confirmedCount: 0 }
    });
    const reg = await prisma.registration.create({
      data: {
        reference: `SCAN-${Date.now()}`,
        eventId: event.id,
        firstName: "A",
        lastName: "B",
        phone: "0000",
        email: `scan-${Date.now()}@example.com`,
        age: 20,
        city: "X",
        profession: "Y",
        lockedPrice: 5000,
        status: "CONFIRMED",
        expiresAt: new Date()
      }
    });
    const ticket = await prisma.ticket.create({
      data: {
        registrationId: reg.id,
        ticketNumber: "DT-TKT-TEST01",
        qrToken: "scan-test-token"
      }
    });

    const firstScan = await ticketLib.scanTicket(ticket.qrToken);
    expect(firstScan.result).toBe("VALID");

    const secondScan = await ticketLib.scanTicket(ticket.qrToken);
    expect(secondScan.result).toBe("ALREADY_USED");
  });
});
