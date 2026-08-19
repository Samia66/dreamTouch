import Link from "next/link";
import { WhatsAppButton } from "./WhatsAppButton";

export function Footer({ whatsappNumber = "0129791717" }: { whatsappNumber?: string }) {
  return (
    <footer className="relative z-10 border-t border-ash px-6 md:px-12 py-12 mt-24">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <p className="font-display text-lg mb-1">
            DREAM<span className="text-gold">TOUCH</span> EXPERIENCE
          </p>
          <p className="text-mist text-sm">Édition #001 — THE UNKNOWN</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-mist">
          <Link href="/conditions" className="hover:text-gold transition">
            Conditions de participation
          </Link>
          <Link href="/confidentialite" className="hover:text-gold transition">
            Confidentialité
          </Link>
          <Link href="/contact" className="hover:text-gold transition">
            Contact
          </Link>
        </div>
        <WhatsAppButton number={whatsappNumber} />
      </div>
      <p className="text-center text-mist/50 text-xs mt-10">
        © {new Date().getFullYear()} DreamTouch Experience. Tous droits réservés.
      </p>
    </footer>
  );
}
