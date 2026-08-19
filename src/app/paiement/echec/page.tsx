import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function PaiementEchecPage({
  searchParams
}: {
  searchParams: { reservation?: string };
}) {
  return (
    <>
      <Header />
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-xl mx-auto text-center">
        <h1 className="font-display italic text-3xl md:text-4xl mb-4">
          Le paiement n&apos;a pas pu <span className="text-gold not-italic font-semibold">être confirmé.</span>
        </h1>
        <p className="text-mist mb-10">
          Ta réservation n&apos;a pas été validée et aucun ticket n&apos;a été généré. Tu peux
          réessayer à tout moment tant qu&apos;il reste des places.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/inscription"
            className="rounded-full bg-gold text-void font-semibold px-8 py-4 tracking-wide hover:bg-gold-light transition"
          >
            RÉESSAYER
          </Link>
          <WhatsAppButton number="0129791717" />
        </div>
      </section>
      <Footer />
    </>
  );
}
