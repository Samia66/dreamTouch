/**
 * Abstraction du fournisseur de paiement.
 *
 * Toute la logique metier (reservation.ts, webhook Celtis, dashboard admin)
 * parle uniquement a cette interface, jamais directement a un SDK Celtis.
 * Cela permet de brancher un vrai provider Celtis des que les informations
 * officielles sont disponibles, sans toucher au reste du systeme.
 */

export interface InitiatePaymentInput {
  registrationId: string;
  reference: string; // reference DreamTouch (DT-2026-0001)
  amount: number; // FCFA, determine par le backend, jamais par le frontend
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  returnUrl: string; // URL de retour utilisateur apres paiement
  cancelUrl: string;
}

export interface InitiatePaymentResult {
  /** URL vers laquelle rediriger l'utilisateur pour payer. */
  paymentUrl: string;
  /** Identifiant de transaction cote provider, si connu immediatement. */
  providerTransactionId?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  /** Identifiant unique de l'evenement webhook, pour idempotence. */
  webhookEventId: string;
  transactionId: string;
  reference: string; // doit correspondre a Registration.reference
  amount: number;
  currency: string;
  status: "CONFIRMED" | "FAILED" | "CANCELLED" | "EXPIRED" | "PENDING";
  rawPayload: unknown;
}

export interface PaymentProvider {
  /** Demarre un paiement et retourne l'URL vers laquelle rediriger l'utilisateur. */
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;

  /**
   * Verifie l'authenticite d'une requete webhook entrante (signature,
   * secret partage, etc.) et retourne les donnees normalisees.
   * Doit lancer une erreur si la signature est invalide.
   */
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookVerificationResult>;
}
