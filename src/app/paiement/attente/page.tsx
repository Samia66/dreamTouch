import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TicketCard } from "@/components/TicketCard";

export default function PaiementAttentePage({
  searchParams
}: {
  searchParams: { reservation?: string };
}) {
  const reservationId = searchParams.reservation;

  return (
    <>
      <Header />
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-xl mx-auto text-center">
        <h1 className="font-display italic text-3xl md:text-4xl mb-4">
          Ton paiement est <span className="text-gold not-italic font-semibold">en cours de vérification.</span>
        </h1>
        <p className="text-mist mb-10">
          Nous vérifions ton paiement. Tu recevras ta confirmation dès que le paiement sera
          validé.
        </p>
        {reservationId && <TicketCard reservationId={reservationId} />}
      </section>
      <Footer />
    </>
  );
}
