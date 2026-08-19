import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ConfidentialitePage() {
  return (
    <>
      <Header />
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-2xl mx-auto">
        <h1 className="font-display text-3xl mb-2">Politique de confidentialité</h1>
        <p className="text-mist text-sm mb-12">
          Modèle de base à adapter avant publication définitive.
        </p>

        <div className="space-y-8 text-mist leading-relaxed text-sm">
          <p>
            Dans le cadre de ton inscription à DreamTouch Experience #001 — THE UNKNOWN, nous
            collectons : prénom, nom, numéro WhatsApp, email, âge, ville, profession, et
            optionnellement un contact d&apos;urgence.
          </p>
          <p>
            Ces données sont utilisées uniquement pour : gérer ta réservation, traiter ton
            paiement, générer ton ticket, te contacter au sujet de l&apos;événement (si tu y as
            consenti), et assurer la sécurité pendant l&apos;événement.
          </p>
          <p>
            Les données de paiement sont traitées par notre prestataire Celtis et ne sont jamais
            stockées en clair sur nos serveurs.
          </p>
          <p>
            Tu peux à tout moment demander la suppression de tes données en nous contactant sur
            WhatsApp au 01 29 79 17 17.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
