import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TicketCard } from "@/components/TicketCard";

export default function TicketPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Header />
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-xl mx-auto">
        <h1 className="font-display italic text-3xl mb-10 text-center">
          Mon <span className="text-gold not-italic font-semibold">ticket</span>
        </h1>
        <TicketCard reservationId={params.id} />
      </section>
      <Footer />
    </>
  );
}
