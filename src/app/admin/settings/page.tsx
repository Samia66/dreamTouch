"use client";

import { useEffect, useState, FormEvent } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

interface SettingsData {
  event: {
    name: string;
    capacity: number;
    confirmedCount: number;
    date: string | null;
    location: string | null;
    durationLabel: string;
    whatsappNumber: string;
    status: string;
  };
  reservationTtlMinutes: number;
  pricingTiers: {
    id: string;
    name: string;
    minParticipants: number;
    maxParticipants: number;
    price: number;
    order: number;
    active: boolean;
  }[];
}

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const form = new FormData(e.currentTarget);
    const date = form.get("date") as string;
    const location = form.get("location") as string;
    const capacity = form.get("capacity") as string;
    const ttl = form.get("reservationTtlMinutes") as string;

    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capacity: Number(capacity),
        date: date ? new Date(date).toISOString() : null,
        location: location || null,
        reservationTtlMinutes: Number(ttl)
      })
    });
    setSaving(false);
    setSaved(true);
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-void text-bone">
        <AdminNav />
        <p className="text-mist p-10">Chargement…</p>
      </main>
    );
  }

  const currentTier = data.pricingTiers.find(
    (t) => data.event.confirmedCount + 1 >= t.minParticipants && data.event.confirmedCount + 1 <= t.maxParticipants
  );

  return (
    <main className="min-h-screen bg-void text-bone">
      <AdminNav />
      <section className="px-6 md:px-12 py-10 max-w-2xl mx-auto">
        <h1 className="font-display text-2xl mb-8">Réglages de l&apos;événement</h1>

        <div className="rounded-2xl border border-gold/25 bg-charcoal/50 p-6 mb-10">
          <p className="text-xs text-mist mb-1">Phase actuelle</p>
          <p className="font-display text-xl text-gold mb-4">
            {currentTier ? currentTier.name : "SOLD OUT"}
          </p>
          <p className="text-sm text-mist">
            Participants confirmés : {data.event.confirmedCount} / {data.event.capacity}
          </p>
          <p className="text-sm text-mist">
            Prix actuel : {currentTier ? `${currentTier.price.toLocaleString("fr-FR")} FCFA` : "—"}
          </p>
        </div>

        <h2 className="font-display text-lg text-gold mb-3">Paliers tarifaires</h2>
        <div className="rounded-2xl border border-ash overflow-hidden mb-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-charcoal text-mist text-left">
                <th className="px-4 py-3">Palier</th>
                <th className="px-4 py-3">Participants</th>
                <th className="px-4 py-3">Prix</th>
              </tr>
            </thead>
            <tbody>
              {data.pricingTiers.map((t) => (
                <tr key={t.id} className="border-t border-ash">
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3">
                    {t.minParticipants}–{t.maxParticipants}
                  </td>
                  <td className="px-4 py-3 text-gold">{t.price.toLocaleString("fr-FR")} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-mist -mt-6 mb-10">
          Les paliers sont modifiables directement en base de données (table PricingTier) — une
          interface d&apos;édition dédiée peut être ajoutée si nécessaire.
        </p>

        <h2 className="font-display text-lg text-gold mb-3">Paramètres généraux</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm text-mist">
            Capacité maximale
            <input
              name="capacity"
              type="number"
              defaultValue={data.event.capacity}
              className="w-full mt-1 bg-charcoal border border-ash focus:border-gold rounded-xl px-4 py-3 text-bone outline-none"
            />
          </label>
          <label className="block text-sm text-mist">
            Date de l&apos;événement
            <input
              name="date"
              type="datetime-local"
              defaultValue={data.event.date ? data.event.date.slice(0, 16) : ""}
              className="w-full mt-1 bg-charcoal border border-ash focus:border-gold rounded-xl px-4 py-3 text-bone outline-none"
            />
          </label>
          <label className="block text-sm text-mist">
            Lieu
            <input
              name="location"
              type="text"
              defaultValue={data.event.location ?? ""}
              placeholder="Dévoilé après inscription"
              className="w-full mt-1 bg-charcoal border border-ash focus:border-gold rounded-xl px-4 py-3 text-bone outline-none"
            />
          </label>
          <label className="block text-sm text-mist">
            Durée de validité d&apos;une réservation (minutes)
            <input
              name="reservationTtlMinutes"
              type="number"
              defaultValue={data.reservationTtlMinutes}
              className="w-full mt-1 bg-charcoal border border-ash focus:border-gold rounded-xl px-4 py-3 text-bone outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gold text-void font-semibold px-8 py-3 hover:bg-gold-light transition disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {saved && <span className="ml-4 text-green-400 text-sm">Réglages enregistrés.</span>}
        </form>
      </section>
    </main>
  );
}
