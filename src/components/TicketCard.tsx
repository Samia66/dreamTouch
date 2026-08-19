"use client";

import { useEffect, useState } from "react";
import { WhatsAppButton } from "./WhatsAppButton";

interface TicketData {
  status: string;
  reference: string;
  amount: number;
  participant: { firstName: string; lastName: string };
  event: { name: string; date: string | null; location: string | null; whatsappNumber: string };
  ticket: { ticketNumber: string; status: string; qrDataUrl: string } | null;
}

export function TicketCard({ reservationId }: { reservationId: string }) {
  const [data, setData] = useState<TicketData | null>(null);

  useEffect(() => {
    let active = true;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(`/api/tickets/${reservationId}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!active) return;
        setData(json);
        // Continue de sonder tant que le paiement n'est pas encore confirme,
        // jusqu'a 30 tentatives (~1 minute), car le webhook peut arriver
        // avec un leger delai.
        if (json.status !== "CONFIRMED" && attempts < 30) {
          setTimeout(poll, 2000);
        }
      } catch {
        if (attempts < 30) setTimeout(poll, 2000);
      }
    }
    poll();
    return () => {
      active = false;
    };
  }, [reservationId]);

  if (!data) {
    return <p className="text-mist text-center">Chargement de ton ticket…</p>;
  }

  if (data.status !== "CONFIRMED" || !data.ticket) {
    return (
      <div className="text-center space-y-4">
        <p className="font-display text-2xl text-gold">Vérification en cours…</p>
        <p className="text-mist">
          Nous vérifions ton paiement. Cette page se mettra à jour automatiquement dès que ta
          place sera confirmée.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-charcoal overflow-hidden">
      <div className="p-8 text-center">
        <p className="text-xs tracking-[0.3em] text-gold mb-2">DREAMTOUCH EXPERIENCE</p>
        <p className="font-display text-2xl mb-6">THE UNKNOWN</p>

        <img
          src={data.ticket.qrDataUrl}
          alt="QR Code du ticket"
          className="mx-auto w-48 h-48 rounded-xl bg-bone p-3"
        />

        <p className="font-mono text-gold text-lg mt-6">{data.ticket.ticketNumber}</p>
        <p className="text-mist text-sm mt-1">Réservation {data.reference}</p>

        <div className="grid grid-cols-2 gap-4 text-left mt-8 text-sm">
          <div>
            <p className="text-mist">Participant</p>
            <p className="text-bone">
              {data.participant.firstName} {data.participant.lastName}
            </p>
          </div>
          <div>
            <p className="text-mist">Montant payé</p>
            <p className="text-bone">{data.amount.toLocaleString("fr-FR")} FCFA</p>
          </div>
          <div>
            <p className="text-mist">Date</p>
            <p className="text-bone">
              {data.event.date ? new Date(data.event.date).toLocaleDateString("fr-FR") : "À définir"}
            </p>
          </div>
          <div>
            <p className="text-mist">Lieu</p>
            <p className="text-bone">{data.event.location ?? "Dévoilé après inscription"}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-ash p-6 flex flex-col sm:flex-row gap-3">
        <a
          href={`/api/tickets/${reservationId}/pdf`}
          className="flex-1 text-center rounded-full bg-gold text-void font-semibold py-3 hover:bg-gold-light transition"
        >
          TÉLÉCHARGER MON TICKET
        </a>
        <button
          onClick={() => navigator.share?.({ title: "Mon ticket THE UNKNOWN", url: window.location.href })}
          className="flex-1 text-center rounded-full border border-mist/40 text-bone py-3 hover:border-gold hover:text-gold transition"
        >
          PARTAGER
        </button>
      </div>
      <div className="p-6 pt-0">
        <WhatsAppButton number={data.event.whatsappNumber} className="w-full justify-center" />
      </div>
    </div>
  );
}
