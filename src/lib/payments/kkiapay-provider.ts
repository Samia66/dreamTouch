import kkiapay from "@kkiapay-org/nodejs-sdk";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  WebhookVerificationResult
} from "./provider";

/**
 * Integration Kkiapay (agregateur mobile money / carte tres utilise au
 * Benin : MTN Money, Moov Money, cartes bancaires).
 *
 * Contrairement a Celtis (redirection + webhook signe), Kkiapay fonctionne
 * par WIDGET cote client : l'utilisateur paie dans une popup ouverte sur
 * /paiement/kkiapay/[registrationId] (voir cette page), qui recupere un
 * `transactionId` a la fin du paiement. Ce transactionId n'est PAS une
 * preuve de paiement en soi (il vient du navigateur, donc non fiable) : il
 * sert uniquement de reference pour interroger l'API officielle Kkiapay
 * cote serveur via `k.verify(transactionId)`, qui renvoie le statut et le
 * montant reellement enregistres chez Kkiapay. C'est cette verification
 * serveur, faite dans /api/payments/kkiapay/confirm/route.ts, qui declenche
 * confirmPaymentAndIssueTicket — jamais le seul evenement client.
 *
 * Documentation source (SDK officiel, verifie via npm) :
 *   - Widget:      paquet npm `kkiapay` (openKkiapayWidget / addSuccessListener)
 *   - Verification: paquet npm `@kkiapay-org/nodejs-sdk`
 *       POST https://api.kkiapay.me/api/v1/transactions/status (prod)
 *       POST https://api-sandbox.kkiapay.me/api/v1/transactions/status (sandbox)
 *       headers x-api-key / x-secret-key / x-private-key
 *       body { transactionId }
 *       reponse.status: SUCCESS | FAILED | INSUFFICIENT_FUND |
 *         TRANSACTION_NOT_ELIGIBLE | TRANSACTION_NOT_FOUND |
 *         INVALID_TRANSACTION | INVALID_TRANSACTION_TYPE
 */ 

export function normalizePhoneForKkiapay(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/\D/g, "");
  if (digitsOnly.startsWith("229") && digitsOnly.length > 10) {
    return digitsOnly.slice(3);
  }
  return digitsOnly;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement ${name} manquante. Voir README.md > "Configuration Kkiapay".`);
  }
  return value;
}

export interface KkiapayVerifyResult {
  status: string;
  amount?: number;
  transactionId?: string;
  [key: string]: unknown;
}

function getKkiapayClient() {
  // NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY et NEXT_PUBLIC_KKIAPAY_SANDBOX sont aussi
  // lues par le widget cote navigateur (voir page.tsx) : une seule source de
  // verite pour ces deux valeurs, pas de duplication qui pourrait diverger.
  return kkiapay({
    publickey: requireEnv("NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY"),
    privatekey: requireEnv("KKIAPAY_PRIVATE_KEY"),
    secretkey: requireEnv("KKIAPAY_SECRET_KEY"),
    sandbox: (process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX ?? "true") === "true"
  });
}

/** Interroge l'API Kkiapay pour verifier l'etat reel d'une transaction. A
 * appeler uniquement cote serveur (les cles privee/secrete ne doivent
 * jamais atteindre le navigateur). */
export async function verifyKkiapayTransaction(transactionId: string): Promise<KkiapayVerifyResult> {
  const client = getKkiapayClient();
  return client.verify(transactionId);
}

export class KkiapayProvider implements PaymentProvider {
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    // Pas d'appel reseau ici : le paiement Kkiapay se fait via un widget
    // cote navigateur, pas via une URL de paiement generee serveur. On
    // renvoie une URL relative (jamais NEXT_PUBLIC_APP_URL, qui peut ne
    // pas correspondre au port reellement utilise en dev) vers la page qui
    // ouvre ce widget.
    const params = new URLSearchParams({
      amount: String(input.amount),
      ref: input.reference,
      name: input.customerName,
      phone: input.customerPhone,
      email: input.customerEmail
    });
    return {
      paymentUrl: `/paiement/kkiapay/${input.registrationId}?${params.toString()}`
    };
  }

  async verifyWebhook(): Promise<WebhookVerificationResult> {
    // Kkiapay n'est pas branche sur /api/payments/celtis/webhook : la
    // confirmation passe par /api/payments/kkiapay/confirm (verification
    // active via l'API Kkiapay, pas une signature de webhook entrant).
    throw new Error(
      "KkiapayProvider.verifyWebhook: non utilise. Voir /api/payments/kkiapay/confirm."
    );
  }
}
