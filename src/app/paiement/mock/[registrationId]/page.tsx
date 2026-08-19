"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuid } from "uuid";

/**
 * Page de paiement SANDBOX. Simule l'ecran de paiement Celtis afin de tester
 * tout le flux (webhook, ticket, email) sans credentials reels. N'est
 * jamais utilisee lorsque PAYMENT_PROVIDER="celtis".
 */
export default function MockPaymentPage({ params }: { params: { registrationId: string } }) {
  const router = useRouter();
  const search = useSearchParams();
  const amount = search.get("amount");
  const ref = search.get("ref");
  const [loading, setLoading] = useState<"pay" | "fail" | null>(null);

  async function simulate(status: "CONFIRMED" | "FAILED") {
    setLoading(status === "CONFIRMED" ? "pay" : "fail");
    try {
      await fetch("/api/payments/celtis/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: uuid(),
          transaction_id: `MOCK-${uuid()}`,
          reference: ref,
          amount: Number(amount),
          currency: "XOF",
          status
        })
      });
    } finally {
      if (status === "CONFIRMED") {
        router.push(`/paiement/succes?reservation=${params.registrationId}`);
      } else {
        router.push(`/paiement/echec?reservation=${params.registrationId}`);
      }
    }
  }

  return (
    <main className="min-h-screen bg-void text-bone flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-gold/30 rounded-2xl p-8 bg-charcoal">
        <p className="text-gold text-xs tracking-[0.2em] mb-2">SANDBOX · SIMULATION CELTIS</p>
        <h1 className="font-display text-2xl mb-6">Ecran de paiement (mode test)</h1>
        <div className="space-y-1 text-sm text-mist mb-8">
          <p>
            Référence : <span className="text-bone">{ref}</span>
          </p>
          <p>
            Montant : <span className="text-bone">{Number(amount).toLocaleString("fr-FR")} FCFA</span>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => simulate("CONFIRMED")}
            disabled={loading !== null}
            className="w-full py-3 rounded-full bg-gold text-void font-semibold hover:bg-gold-light transition disabled:opacity-50"
          >
            {loading === "pay" ? "Traitement…" : "Simuler un paiement réussi"}
          </button>
          <button
            onClick={() => simulate("FAILED")}
            disabled={loading !== null}
            className="w-full py-3 rounded-full border border-mist/40 text-bone hover:border-gold transition disabled:opacity-50"
          >
            {loading === "fail" ? "Traitement…" : "Simuler un échec de paiement"}
          </button>
        </div>
        <p className="text-xs text-mist mt-6">
          Cette page n&apos;existe qu&apos;en environnement sandbox (PAYMENT_PROVIDER=mock).
        </p>
      </div>
    </main>
  );
}
