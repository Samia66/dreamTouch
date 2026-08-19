import type { PaymentProvider } from "./provider";
import { CeltisProvider } from "./celtis-provider";
import { MockProvider } from "./mock-provider";

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const mode = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  cached = mode === "celtis" ? new CeltisProvider() : new MockProvider();
  return cached;
}

export * from "./provider";
