import { v4 as uuid } from "uuid";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  WebhookVerificationResult
} from "./provider";

/**
 * Provider "MOCK" — simule un flux de paiement complet SANS aucun appel
 * reseau reel, pour developper et tester tout le reste de l'application
 * (reservation, tickets, QR, emails, admin, concurrence) avant que
 * l'integration Celtis officielle ne soit disponible.
 *
 * Actif par defaut via PAYMENT_PROVIDER="mock" (voir .env.example).
 *
 * Flux :
 *  - initiatePayment renvoie une URL locale /paiement/mock/[registrationId]
 *    qui affiche une page "payer / echouer" permettant de simuler l'issue.
 *  - Cette page appelle elle-meme le webhook interne avec un payload signe
 *    par le meme secret que celui utilise pour la verification, afin de
 *    tester le chemin complet (y compris idempotence et double envoi).
 */
export class MockProvider implements PaymentProvider {
 async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
  return {
    paymentUrl: `/paiement/mock/${input.registrationId}?amount=${input.amount}&ref=${input.reference}`,
    providerTransactionId: `MOCK-${uuid()}`
  };
}

  async verifyWebhook(rawBody: string): Promise<WebhookVerificationResult> {
    const parsed = JSON.parse(rawBody) as {
      event_id: string;
      transaction_id: string;
      reference: string;
      amount: number;
      currency: string;
      status: "CONFIRMED" | "FAILED" | "CANCELLED" | "EXPIRED" | "PENDING";
    };

    return {
      valid: true,
      webhookEventId: parsed.event_id,
      transactionId: parsed.transaction_id,
      reference: parsed.reference,
      amount: parsed.amount,
      currency: parsed.currency ?? "XOF",
      status: parsed.status,
      rawPayload: parsed
    };
  }
}
