"use client";

import { useEffect, useState } from "react";

interface PricingData {
  pricing: {
    confirmedCount: number;
    capacity: number;
    remaining: number;
    currentPrice: number | null;
    soldOut: boolean;
    spotsLeftInCurrentTier: number | null;
    phaseLabel: string;
  };
}

export function PricingStatus({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<PricingData | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/pricing", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (active) setData(json);
      } catch {
        /* silencieux: affichage degrade */
      }
    }
    load();
    const id = setInterval(load, 20000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!data) {
    return (
      <div className="animate-pulse text-mist text-sm">Chargement des places disponibles…</div>
    );
  }

  const { pricing } = data;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-bone">
          {pricing.confirmedCount} / {pricing.capacity} places confirmées
        </span>
        <span className="text-gold font-semibold">
          {pricing.soldOut ? "SOLD OUT" : `${pricing.currentPrice?.toLocaleString("fr-FR")} FCFA`}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/25 bg-charcoal/60 backdrop-blur p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs tracking-[0.2em] text-gold">{pricing.phaseLabel}</span>
        <span className="text-xs text-mist">
          {pricing.confirmedCount} / {pricing.capacity} places confirmées
        </span>
      </div>

      <div className="h-1.5 w-full bg-ash rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-gold-dim to-gold transition-all duration-700"
          style={{ width: `${Math.min((pricing.confirmedCount / pricing.capacity) * 100, 100)}%` }}
        />
      </div>

      {pricing.soldOut ? (
        <p className="font-display text-3xl text-gold">SOLD OUT</p>
      ) : (
        <>
          <p className="font-display text-3xl text-bone">
            {pricing.currentPrice?.toLocaleString("fr-FR")} <span className="text-lg text-mist">FCFA</span>
          </p>
          {pricing.spotsLeftInCurrentTier !== null && (
            <p className="text-sm text-mist mt-2">
              Plus que {pricing.spotsLeftInCurrentTier} place
              {pricing.spotsLeftInCurrentTier > 1 ? "s" : ""} au tarif actuel.
            </p>
          )}
        </>
      )}
    </div>
  );
}
