"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/tickets", label: "Scanner" },
  { href: "/admin/settings", label: "Réglages" }
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <header className="border-b border-ash px-6 py-4 flex items-center justify-between flex-wrap gap-4">
      <p className="font-display text-lg">
        DREAM<span className="text-gold">TOUCH</span> · Admin
      </p>
      <nav className="flex items-center gap-6 text-sm">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname === l.href ? "text-gold" : "text-mist hover:text-bone transition"}
          >
            {l.label}
          </Link>
        ))}
        <button onClick={logout} className="text-mist hover:text-red-300 transition">
          Déconnexion
        </button>
      </nav>
    </header>
  );
}
