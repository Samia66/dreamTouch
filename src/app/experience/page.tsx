import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PricingStatus } from "@/components/PricingStatus";

export default function ExperiencePage() {
  return (
    <>
      <Header />
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-3xl mx-auto">
        <p className="text-xs tracking-[0.3em] text-gold mb-4">L&apos;EXPÉRIENCE</p>
        <h1 className="font-display italic text-4xl md:text-5xl mb-8">
          THE <span className="text-gold not-italic font-semibold">UNKNOWN</span>
        </h1>

        <p className="text-mist leading-relaxed mb-6">
          THE UNKNOWN est une expérience immersive de 3 heures, pensée pour 20 personnes
          maximum. Tu vas jouer, apprendre, relever des défis, rencontrer de nouvelles
          personnes, résoudre des missions, participer à des activités en équipe et
          découvrir des surprises.
        </p>

        <p className="text-mist leading-relaxed mb-6">
          On ne va pas tout te dire à l&apos;avance. Le mystère fait partie de
          l&apos;expérience — c&apos;est même tout le principe de <em className="text-gold not-italic">THE UNKNOWN</em>.
          Ce qu&apos;on peut te confirmer :
        </p>

        <ul className="space-y-3 text-bone mb-10">
          <li className="flex gap-3">
            <span className="text-gold">—</span> Durée : 3 heures
          </li>
          <li className="flex gap-3">
            <span className="text-gold">—</span> 20 participants maximum
          </li>
          <li className="flex gap-3">
            <span className="text-gold">—</span> Date : à définir, communiquée après inscription
          </li>
          <li className="flex gap-3">
            <span className="text-gold">—</span> Lieu : dévoilé après inscription
          </li>
        </ul>

        <div className="mb-12">
          <PricingStatus />
        </div>

        <div className="flex justify-center">
          <Link
            href="/inscription"
            className="rounded-full bg-gold text-void font-semibold px-8 py-4 tracking-wide hover:bg-gold-light transition"
          >
            JE VEUX VIVRE L&apos;EXPÉRIENCE
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
