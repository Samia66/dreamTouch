"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  createdAt: string;
  status: string;
  amount: number;
  ticketNumber: string | null;
  ticketStatus: string | null;
  paidAt: string | null;
}

const FILTERS = [
  { value: "", label: "Tous" },
  { value: "confirmed", label: "Confirmé" },
  { value: "pending", label: "En attente" },
  { value: "failed", label: "Échec" },
  { value: "used", label: "Ticket utilisé" },
  { value: "unused", label: "Ticket non utilisé" }
];

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    if (q) params.set("q", q);

    fetch(`/api/admin/participants?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal
    })
      .then((r) => r.json())
      .then((data) => {
        setParticipants(data.participants ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => controller.abort();
  }, [filter, q]);

  return (
    <main className="min-h-screen bg-void text-bone">
      <AdminNav />
      <section className="px-6 md:px-12 py-10 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="font-display text-2xl">Participants</h1>
          <a
            href="/api/admin/participants/export"
            className="rounded-full border border-gold/50 text-gold px-5 py-2 text-sm hover:bg-gold hover:text-void transition"
          >
            EXPORTER LES PARTICIPANTS (CSV)
          </a>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, téléphone, ticket)…"
            className="bg-charcoal border border-ash focus:border-gold rounded-xl px-4 py-2 text-sm outline-none flex-1 min-w-[220px]"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-charcoal border border-ash rounded-xl px-4 py-2 text-sm outline-none"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-ash">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-charcoal text-mist text-left">
                <Th>Nom</Th>
                <Th>Téléphone</Th>
                <Th>Email</Th>
                <Th>Inscription</Th>
                <Th>Statut</Th>
                <Th>Montant</Th>
                <Th>Ticket</Th>
                <Th>Statut ticket</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-mist">
                    Chargement…
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-mist">
                    Aucun participant.
                  </td>
                </tr>
              ) : (
                participants.map((p) => (
                  <tr key={p.id} className="border-t border-ash hover:bg-charcoal/40">
                    <Td>
                      {p.firstName} {p.lastName}
                    </Td>
                    <Td>{p.phone}</Td>
                    <Td>{p.email}</Td>
                    <Td>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</Td>
                    <Td>
                      <StatusBadge status={p.status} />
                    </Td>
                    <Td>{p.amount.toLocaleString("fr-FR")} FCFA</Td>
                    <Td className="font-mono text-xs">{p.ticketNumber ?? "—"}</Td>
                    <Td>{p.ticketStatus ?? "—"}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-bone ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    CONFIRMED: "text-green-400",
    PENDING_PAYMENT: "text-yellow-400",
    PAYMENT_FAILED: "text-red-400",
    EXPIRED: "text-mist",
    CANCELLED: "text-mist"
  };
  return <span className={colors[status] ?? "text-mist"}>{status}</span>;
}
