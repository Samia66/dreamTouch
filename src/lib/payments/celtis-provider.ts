import crypto from "node:crypto";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  WebhookVerificationResult
} from "./provider";

/**
 * ============================================================================
 * INTEGRATION CELTIS — A COMPLETER AVEC LA DOCUMENTATION OFFICIELLE
 * ============================================================================
 *
 * Ce fichier NE DOIT PAS etre considere comme une integration Celtis
 * fonctionnelle telle quelle. Les endpoints, noms de champs, algorithme de
 * signature et format de payload ci-dessous sont des EMPLACEMENTS A
 * COMPLETER (marques `// TODO CELTIS`), pas des valeurs reelles inventees.
 *
 * Avant de pouvoir utiliser ce provider en production, obtenir de Celtis :
 *
 *   1. L'URL exacte de l'endpoint de creation de paiement
 *      (CELTIS_PAYMENT_URL) et le format exact du payload attendu
 *      (JSON ? form-encoded ? champs requis ?).
 *   2. Le mecanisme d'authentification des appels sortants
 *      (header Authorization ? HMAC de la requete ? CELTIS_API_KEY seule ?).
 *   3. Le format exact de l'URL de paiement retournee par Celtis vers
 *      laquelle rediriger l'utilisateur.
 *   4. Le format exact des notifications webhook (POST body), la liste des
 *      champs (montant, devise, reference marchand, id transaction, statut)
 *      et leurs noms precis.
 *   5. L'algorithme et l'emplacement exact de la signature du webhook
 *      (header dedie ? HMAC-SHA256 du corps brut avec CELTIS_WEBHOOK_SECRET ?
 *      autre ?) afin de completer `verifyWebhookSignature` ci-dessous.
 *   6. La liste des valeurs de statut possibles envoyees par Celtis et leur
 *      correspondance avec CONFIRMED / FAILED / CANCELLED / EXPIRED / PENDING.
 *   7. La politique de retry/renvoi des webhooks (pour confirmer que notre
 *      idempotence par transactionId + webhookEventId est suffisante).
 *
 * Tant que ces informations ne sont pas fournies, utiliser
 * PAYMENT_PROVIDER="mock" (voir mock-provider.ts) qui simule un flux de
 * paiement complet en local/sandbox, sans aucun appel reseau reel, pour que
 * le reste de l'application (reservation, ticket, QR, email, admin) reste
 * entierement testable.
 * ============================================================================
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement ${name} manquante. Voir README.md > "Configuration Celtis".`
    );
  }
  return value;
}

export class CeltisProvider implements PaymentProvider {
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const apiKey = requireEnv("CELTIS_API_KEY");
    const merchantId = requireEnv("CELTIS_MERCHANT_ID");
    const paymentUrl = requireEnv("CELTIS_PAYMENT_URL");

    // TODO CELTIS: remplacer ce payload par le format exact exige par
    // l'API officielle Celtis (champs, encodage, en-tetes d'authentification).
    const payload = {
      merchant_id: merchantId,
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      customer: {
        name: input.customerName,
        phone: input.customerPhone,
        email: input.customerEmail
      },
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl
    };

    const response = await fetch(paymentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO CELTIS: confirmer le schema d'authentification exact.
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Celtis a refuse la creation du paiement (HTTP ${response.status}).`);
    }

    // TODO CELTIS: adapter aux noms de champs reels de la reponse Celtis.
    const data = (await response.json()) as { payment_url?: string; transaction_id?: string };
    if (!data.payment_url) {
      throw new Error("Reponse Celtis invalide: payment_url manquant.");
    }

    return {
      paymentUrl: data.payment_url,
      providerTransactionId: data.transaction_id
    };
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookVerificationResult> {
    const secret = requireEnv("CELTIS_WEBHOOK_SECRET");

    // TODO CELTIS: remplacer par le nom exact du header de signature Celtis.
    const signatureHeader = headers.get("x-celtis-signature");
    if (!signatureHeader) {
      throw new Error("Signature Celtis absente de la requete webhook.");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const valid = timingSafeEqual(signatureHeader, expectedSignature);
    if (!valid) {
      throw new Error("Signature Celtis invalide.");
    }

    // TODO CELTIS: adapter le parsing aux noms de champs reels du webhook.
    const parsed = JSON.parse(rawBody) as {
      event_id: string;
      transaction_id: string;
      reference: string;
      amount: number;
      currency: string;
      status: string;
    };

    return {
      valid: true,
      webhookEventId: parsed.event_id,
      transactionId: parsed.transaction_id,
      reference: parsed.reference,
      amount: parsed.amount,
      currency: parsed.currency,
      // TODO CELTIS: completer le mapping exhaustif des statuts Celtis reels.
      status: mapCeltisStatus(parsed.status),
      rawPayload: parsed
    };
  }
}

function mapCeltisStatus(
  raw: string
): "CONFIRMED" | "FAILED" | "CANCELLED" | "EXPIRED" | "PENDING" {
  const normalized = raw.toUpperCase();
  if (["SUCCESS", "SUCCESSFUL", "CONFIRMED", "PAID"].includes(normalized)) return "CONFIRMED";
  if (["FAILED", "FAILURE", "DECLINED"].includes(normalized)) return "FAILED";
  if (["CANCELLED", "CANCELED"].includes(normalized)) return "CANCELLED";
  if (["EXPIRED", "TIMEOUT"].includes(normalized)) return "EXPIRED";
  return "PENDING";
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
