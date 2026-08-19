import { NextRequest, NextResponse } from "next/server";
import { registrationSchema } from "@/lib/validation";
import {
  createRegistration,
  EventNotOpenError,
  EventSoldOutError,
  expireStaleRegistrations
} from "@/lib/reservation";
import { getPaymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

const EVENT_SLUG = "the-unknown";

export async function POST(req: NextRequest) {
  try {
    await expireStaleRegistrations();

    const body = await req.json();
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { registration, expiresAt } = await createRegistration(EVENT_SLUG, parsed.data);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const provider = getPaymentProvider();

    const payment = await prisma.payment.create({
      data: {
        registrationId: registration.id,
        provider: (process.env.PAYMENT_PROVIDER ?? "mock").toUpperCase(),
        amount: registration.lockedPrice,
        currency: "XOF",
        status: "PENDING"
      }
    });

    const initiated = await provider.initiatePayment({
      registrationId: registration.id,
      reference: registration.reference,
      amount: registration.lockedPrice,
      currency: "XOF",
      customerName: `${registration.firstName} ${registration.lastName}`,
      customerPhone: registration.phone,
      customerEmail: registration.email,
      returnUrl: `${appUrl}/paiement/succes?reservation=${registration.id}`,
      cancelUrl: `${appUrl}/paiement/echec?reservation=${registration.id}`
    });

    if (initiated.providerTransactionId) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { transactionId: initiated.providerTransactionId }
      });
    }

    return NextResponse.json({
      reservationId: registration.id,
      reference: registration.reference,
      amount: registration.lockedPrice,
      expiresAt,
      paymentUrl: initiated.paymentUrl
    });
  } catch (err) {
    if (err instanceof EventSoldOutError) {
      return NextResponse.json({ error: "SOLD_OUT" }, { status: 409 });
    }
    if (err instanceof EventNotOpenError) {
      return NextResponse.json({ error: "EVENT_NOT_OPEN" }, { status: 409 });
    }
    console.error("POST /api/registrations", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
