"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ListenerData } from "kkiapay";

/**
 * Ouvre le widget de paiement Kkiapay pour cette reservation. Le
 * transactionId recu ici (evenement "success" cote navigateur) n'est
 * qu'une reference : la confirmation reelle se fait cote serveur dans
 * /api/payments/kkiapay/confirm, qui reverifie aupres de l'API Kkiapay
 * avant d'emettre le ticket. Voir src/lib/payments/kkiapay-provider.ts.
 */
export default function KkiapayPaymentPage({
  params
}: {
  params: { registrationId: string };
}) {
  const router = useRouter();
  const search = useSearchParams();
  const amount = search.get("amount");
  const ref = search.get("ref");
  const name = search.get("name") ?? "";
  const phone = search.get("phone") ?? "";
  const email = search.get("email") ?? "";
  const [status, setStatus] = useState<"loading" | "ready" | "confirming" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const kkiapayModule = await import("kkiapay");
      if (cancelled) return;

      const publicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY;
      if (!publicKey) {
        setStatus("error");
        setErrorMessage("Configuration de paiement incomplete (cle publique Kkiapay manquante).");
        return;
      }

      const openWidget = () => {
        kkiapayModule.openKkiapayWidget({
          amount: Number(amount),
          key: publicKey,
          sandbox: process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX === "true",
          fullname: name,
          // Numero deja normalise (sans indicatif pays) par
          // normalizePhoneForKkiapay cote serveur. On restreint le widget au
          // Benin pour que ce soit lui qui applique l'indicatif +229, evitant
          // tout risque de numero double-prefixe ("numero invalide").
          countries: ["BJ"] as never,
          phone,
          email,
          data: JSON.stringify({ registrationId: params.registrationId, reference: ref })
        });
      };

      kkiapayModule.addSuccessListener(async (data?: ListenerData) => {
        if (!data?.transactionId) return;
        setStatus("confirming");
        try {
          const res = await fetch("/api/payments/kkiapay/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              registrationId: params.registrationId,
              transactionId: data.transactionId
            })
          });
          const json = await res.json();
          if (json.confirmed) {
            router.push(`/paiement/succes?reservation=${params.registrationId}`);
          } else {
            router.push(`/paiement/echec?reservation=${params.registrationId}`);
          }
        } catch {
          router.push(`/paiement/echec?reservation=${params.registrationId}`);
        }
      });

      kkiapayModule.addFailedListener(() => {
        router.push(`/paiement/echec?reservation=${params.registrationId}`);
      });

      setStatus("ready");
      openWidget();

      return openWidget;
    }

    let reopen: (() => void) | undefined;
    setup().then((fn) => {
      reopen = fn;
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-void text-bone flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-gold/30 rounded-2xl p-8 bg-charcoal text-center">
        <p className="text-gold text-xs tracking-[0.2em] mb-2">PAIEMENT SECURISE · KKIAPAY</p>
        <h1 className="font-display text-2xl mb-6">
          {status === "confirming" ? "Verification du paiement…" : "Paiement en cours"}
        </h1>

        {status === "error" ? (
          <p className="text-red-300 text-sm">{errorMessage}</p>
        ) : (
          <>
            <div className="space-y-1 text-sm text-mist mb-6">
              <p>
                Référence : <span className="text-bone">{ref}</span>
              </p>
              <p>
                Montant : <span className="text-bone">{Number(amount).toLocaleString("fr-FR")} FCFA</span>
              </p>
            </div>
            <p className="text-xs text-mist mb-6">
              Une fenetre de paiement Kkiapay s&apos;est ouverte (Mobile Money ou carte bancaire).
              Si elle ne s&apos;affiche pas, verifie que les popups ne sont pas bloquées par ton
              navigateur.
            </p>
          </>
        )}
      </div>
    </main>
  );
}