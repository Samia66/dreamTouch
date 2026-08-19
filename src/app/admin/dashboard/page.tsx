"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

interface Stats {
  confirmedParticipants: number;
  capacity: number;
  remaining: number;
  currentPrice: number | null;
  currentPhase: string;
  soldOut: boolean;
  revenue: number;
  stats: {
    paymentsConfirmed: number;
    paymentsPending: number;
    paymentsFailed: number;
    ticketsUsed: number;
    ticketsUnused: number;
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <main className="min-h-screen bg-void text-bone">
      <AdminNav />
      <section className="px-6 md:px-12 py-10 max-w-5xl mx-auto">
        <h1 className="font-display text-2xl mb-8">Dashboard</h1>

        {!data ? (
          <p className="text-mist">Chargement…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <Card label="Participants confirmés" value={`${data.confirmedParticipants} / ${data.capacity}`} />
              <Card label="Chiffre d'affaires" value={`${data.revenue.toLocaleString("fr-FR")} FCFA`} />
              <Card label="Tarif actuel" value={data.soldOut ? "SOLD OUT" : `${data.currentPrice?.toLocaleString("fr-FR")} FCFA`} />
              <Card label="Places restantes" value={String(data.remaining)} />
            </div>

            <h2 className="font-display text-lg mb-4 text-gold">Statistiques</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card label="Paiements confirmés" value={String(data.stats.paymentsConfirmed)} small />
              <Card label="Paiements en attente" value={String(data.stats.paymentsPending)} small />
              <Card label="Paiements échoués" value={String(data.stats.paymentsFailed)} small />
              <Card label="Tickets utilisés" value={String(data.stats.ticketsUsed)} small />
              <Card label="Tickets non utilisés" value={String(data.stats.ticketsUnused)} small />
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Card({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-ash bg-charcoal/50 p-5">
      <p className="text-xs text-mist mb-2">{label}</p>
      <p className={`font-display ${small ? "text-lg" : "text-2xl"} text-gold`}>{value}</p>
    </div>
  );
}
