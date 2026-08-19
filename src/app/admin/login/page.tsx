"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password")
      })
    });

    if (!res.ok) {
      setLoading(false);
      if (res.status === 429) setError("Trop de tentatives. Réessaie dans quelques minutes.");
      else setError("Identifiants incorrects.");
      return;
    }

    router.push(search.get("next") ?? "/admin/dashboard");
  }

  return (
    <main className="min-h-screen bg-void text-bone flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="max-w-sm w-full">
        <p className="text-xs tracking-[0.3em] text-gold mb-2 text-center">DREAMTOUCH</p>
        <h1 className="font-display text-2xl mb-8 text-center">Espace administrateur</h1>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200 mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm text-mist mb-4">
          Email
          <input
            name="email"
            type="email"
            required
            className="w-full mt-1 bg-charcoal border border-ash focus:border-gold rounded-xl px-4 py-3 text-bone outline-none"
          />
        </label>
        <label className="block text-sm text-mist mb-6">
          Mot de passe
          <input
            name="password"
            type="password"
            required
            className="w-full mt-1 bg-charcoal border border-ash focus:border-gold rounded-xl px-4 py-3 text-bone outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gold text-void font-semibold py-3 hover:bg-gold-light transition disabled:opacity-50"
        >
          {loading ? "Connexion…" : "SE CONNECTER"}
        </button>
      </form>
    </main>
  );
}
