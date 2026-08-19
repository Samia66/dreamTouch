import Link from "next/link";

export function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
      <Link href="/" className="font-display text-lg tracking-wide text-bone">
        DREAM<span className="text-gold">TOUCH</span>
      </Link>
      <nav className="hidden md:flex items-center gap-8 text-sm text-mist">
        <Link href="/experience" className="hover:text-gold transition">
          L&apos;expérience
        </Link>
        <Link href="/conditions" className="hover:text-gold transition">
          Conditions
        </Link>
        <Link href="/contact" className="hover:text-gold transition">
          Contact
        </Link>
      </nav>
      <Link
        href="/inscription"
        className="rounded-full border border-gold/60 px-5 py-2 text-xs md:text-sm tracking-wide text-gold hover:bg-gold hover:text-void transition"
      >
        RÉSERVER
      </Link>
    </header>
  );
}
