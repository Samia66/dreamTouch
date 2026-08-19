import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Constellation } from "@/components/Constellation";
import { PricingStatus } from "@/components/PricingStatus";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const PILLARS = [
  { icon: "🎮", title: "PLAY", text: "Joue et relève les défis." },
  { icon: "🧠", title: "LEARN", text: "Apprends sans avoir l'impression d'être en cours." },
  { icon: "🤝", title: "CONNECT", text: "Rencontre de nouvelles personnes." },
  { icon: "🔎", title: "DISCOVER", text: "Découvre ce que THE UNKNOWN te réserve." }
];

export default function HomePage() {
  return (
    <>
      <div className="relative overflow-hidden">
        <Constellation className="absolute inset-0 w-full h-full opacity-70" />
        <div className="absolute inset-0 bg-radial-glow" />
        <Header />

        <section className="relative z-10 px-6 md:px-12 pt-16 pb-28 max-w-5xl mx-auto text-center">
          <p className="text-xs md:text-sm tracking-[0.35em] text-mist animate-fadeUp">
            DREAMTOUCH EXPERIENCE — ÉDITION #001
          </p>

          <h1
            className="font-display font-light italic text-6xl md:text-8xl mt-6 mb-6 text-bone animate-fadeUp"
            style={{ animationDelay: "0.1s" }}
          >
            THE <span className="text-gold not-italic font-semibold">UNKNOWN</span>
          </h1>

          <p
            className="max-w-xl mx-auto text-mist text-base md:text-lg leading-relaxed animate-fadeUp"
            style={{ animationDelay: "0.2s" }}
          >
            Tu ne viens pas pour assister.
            <br />
            Tu viens vivre une expérience.
          </p>

          <div
            className="inline-flex items-center gap-2 mt-8 px-4 py-2 rounded-full border border-gold/40 text-gold text-xs tracking-widest animate-fadeUp"
            style={{ animationDelay: "0.3s" }}
          >
            20 PERSONNES SEULEMENT
          </div>

          <p
            className="mt-10 text-bone/90 text-lg md:text-xl leading-relaxed animate-fadeUp"
            style={{ animationDelay: "0.4s" }}
          >
            20 inconnus.
            <br />
            Des missions. Des défis.
            <br />
            Des rencontres. Des surprises.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 animate-fadeUp"
            style={{ animationDelay: "0.5s" }}
          >
            <Link
              href="/inscription"
              className="rounded-full bg-gold text-void font-semibold px-8 py-4 tracking-wide hover:bg-gold-light transition"
            >
              JE VEUX VIVRE L&apos;EXPÉRIENCE
            </Link>
            <Link
              href="/experience"
              className="rounded-full border border-mist/40 px-8 py-4 tracking-wide text-bone hover:border-gold hover:text-gold transition"
            >
              EN SAVOIR PLUS
            </Link>
          </div>

          <div className="max-w-sm mx-auto mt-16 animate-fadeUp" style={{ animationDelay: "0.6s" }}>
            <PricingStatus />
          </div>
        </section>
      </div>

      {/* QU'EST-CE QUE THE UNKNOWN ? */}
      <section className="relative z-10 px-6 md:px-12 py-24 max-w-5xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-6">
          Qu&apos;est-ce que <span className="text-gold italic">THE UNKNOWN</span> ?
        </h2>
        <p className="text-mist text-center max-w-2xl mx-auto leading-relaxed mb-16">
          THE UNKNOWN est une expérience immersive où tu vas rencontrer des personnes que tu ne
          connais peut-être pas, relever des défis, résoudre des missions, apprendre, rire et
          sortir de ta zone de confort.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-ash bg-charcoal/50 p-6 text-center hover:border-gold/40 transition"
            >
              <div className="text-3xl mb-3">{p.icon}</div>
              <p className="font-display text-lg tracking-wide text-gold mb-2">{p.title}</p>
              <p className="text-mist text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TU PEUX VENIR SEUL */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display italic text-3xl md:text-4xl text-bone mb-6">
            Tu peux venir seul.
            <br />
            <span className="text-gold not-italic">C&apos;est justement le principe.</span>
          </h2>
          <p className="text-mist leading-relaxed">
            Tu n&apos;as pas besoin de venir avec un groupe d&apos;amis. Les équipes seront
            constituées sur place afin de favoriser les rencontres.
          </p>
        </div>
      </section>

      {/* TARIFICATION */}
      <section className="relative z-10 px-6 md:px-12 py-24 max-w-2xl mx-auto">
        <h2 className="font-display text-3xl text-center mb-10">Tarif de participation</h2>
        <PricingStatus />
        <div className="flex justify-center mt-10">
          <Link
            href="/inscription"
            className="rounded-full bg-gold text-void font-semibold px-8 py-4 tracking-wide hover:bg-gold-light transition"
          >
            RÉSERVER MA PLACE
          </Link>
        </div>
      </section>

      <section className="relative z-10 px-6 md:px-12 py-16 text-center">
        <p className="text-mist text-sm mb-4">Infos &amp; inscriptions</p>
        <WhatsAppButton number="0129791717" variant="solid" />
      </section>

      <Footer />
    </>
  );
}
