import type { PaymentProvider } from "./provider";
import { CeltisProvider } from "./celtis-provider";
import { KkiapayProvider } from "./kkiapay-provider";
import { MockProvider } from "./mock-provider";

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const mode = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  if (mode === "celtis") cached = new CeltisProvider();
  else if (mode === "kkiapay") cached = new KkiapayProvider();
  else cached = new MockProvider();
  return cached;
}

export * from "./provider";