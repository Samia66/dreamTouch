import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RegistrationForm } from "@/components/RegistrationForm";

export default function InscriptionPage() {
  return (
    <>
      <Header />
      <section className="relative z-10 px-6 md:px-12 py-12 max-w-xl mx-auto">
        <p className="text-xs tracking-[0.3em] text-gold mb-3 text-center">RÉSERVE TA PLACE</p>
        <h1 className="font-display italic text-3xl md:text-4xl mb-10 text-center">
          Réserve ton <span className="text-gold not-italic font-semibold">expérience</span>
        </h1>
        <RegistrationForm />
      </section>
      <Footer />
    </>
  );
}
