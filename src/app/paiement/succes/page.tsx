import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TicketCard } from "@/components/TicketCard";

export default function PaiementSuccesPage({
  searchParams
}: {
  searchParams: { reservation?: string };
}) {
  const reservationId = searchParams.reservation;

  return (
    <>
      <Header />
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-xl mx-auto text-center">
        <div className="text-5xl mb-6">🎉</div>
        <h1 className="font-display italic text-3xl md:text-4xl mb-3">
          Tu es officiellement <span className="text-gold not-italic font-semibold">des nôtres.</span>
        </h1>
        <p className="text-mist mb-10">Ton aventure THE UNKNOWN commence ici.</p>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-mist mb-10">
          <span>✓ Paiement confirmé</span>
          <span>✓ Inscription confirmée</span>
          <span>✓ Ticket généré</span>
        </div>

        {reservationId ? (
          <TicketCard reservationId={reservationId} />
        ) : (
          <p className="text-red-300">Référence de réservation manquante.</p>
        )}
      </section>
      <Footer />
    </>
  );
}
