"use client";

import { useEffect, useRef, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

type ScanOutcome = {
  result: "VALID" | "ALREADY_USED" | "INVALID";
  ticket?: { ticketNumber: string; status: string; participant?: string };
} | null;

export default function AdminScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [supported, setSupported] = useState(true);
  const [manualToken, setManualToken] = useState("");
  const [outcome, setOutcome] = useState<ScanOutcome>(null);
  const [busy, setBusy] = useState(false);
  const lastScanned = useRef<string | null>(null);

  useEffect(() => {
    const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
    if (typeof window === "undefined" || !BarcodeDetectorCtor) {
      setSupported(false);
      return;
    }

    let stream: MediaStream | null = null;
    let raf: number;
    let stopped = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const value = codes[0].rawValue as string;
              if (value && value !== lastScanned.current) {
                lastScanned.current = value;
                await handleScan(value);
                setTimeout(() => (lastScanned.current = null), 3000);
              }
            }
          } catch {
            /* frame non exploitable, on continue */
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setSupported(false);
      }
    }
    start();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScan(qrToken: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken })
      });
      const data = await res.json();
      setOutcome(data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-void text-bone">
      <AdminNav />
      <section className="px-6 md:px-12 py-10 max-w-xl mx-auto">
        <h1 className="font-display text-2xl mb-8">Contrôle à l&apos;entrée</h1>

        {supported ? (
          <div className="rounded-2xl overflow-hidden border border-ash mb-6">
            <video ref={videoRef} className="w-full aspect-square object-cover" muted playsInline />
          </div>
        ) : (
          <p className="text-mist text-sm mb-6">
            Caméra non disponible sur cet appareil/navigateur. Utilise la saisie manuelle
            ci-dessous.
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualToken.trim()) handleScan(manualToken.trim());
          }}
          className="flex gap-3 mb-8"
        >
          <input
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Coller le jeton QR manuellement"
            className="flex-1 bg-charcoal border border-ash focus:border-gold rounded-xl px-4 py-3 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gold text-void font-semibold px-5 disabled:opacity-50"
          >
            Vérifier
          </button>
        </form>

        {outcome && <ScanResultCard outcome={outcome} />}
      </section>
    </main>
  );
}

function ScanResultCard({ outcome }: { outcome: NonNullable<ScanOutcome> }) {
  if (outcome.result === "VALID") {
    return (
      <div className="rounded-2xl border border-green-500/40 bg-green-950/20 p-6 text-center">
        <p className="text-3xl mb-2">🟢</p>
        <p className="font-display text-xl mb-1">TICKET VALIDE</p>
        <p className="text-bone">{outcome.ticket?.participant}</p>
        <p className="font-mono text-mist text-sm mt-1">{outcome.ticket?.ticketNumber}</p>
        <p className="text-green-300 text-sm mt-3">Marqué comme utilisé.</p>
      </div>
    );
  }
  if (outcome.result === "ALREADY_USED") {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-6 text-center">
        <p className="text-3xl mb-2">🔴</p>
        <p className="font-display text-xl mb-1">TICKET DÉJÀ UTILISÉ</p>
        <p className="text-bone">{outcome.ticket?.participant}</p>
        <p className="font-mono text-mist text-sm mt-1">{outcome.ticket?.ticketNumber}</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-6 text-center">
      <p className="text-3xl mb-2">🔴</p>
      <p className="font-display text-xl">TICKET INVALIDE</p>
    </div>
  );
}
