import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function ContactPage() {
  return (
    <>
      <Header />
      <section className="relative z-10 px-6 md:px-12 py-24 max-w-xl mx-auto text-center">
        <h1 className="font-display italic text-3xl mb-4">
          Une question sur <span className="text-gold not-italic font-semibold">THE UNKNOWN</span> ?
        </h1>
        <p className="text-mist mb-10">
          L&apos;équipe DreamTouch te répond directement sur WhatsApp.
        </p>
        <WhatsAppButton number="0129791717" variant="solid" />
      </section>
      <Footer />
    </>
  );
}
