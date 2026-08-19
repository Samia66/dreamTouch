import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ConditionsPage() {
  return (
    <>
      <Header />
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-2xl mx-auto">
        <h1 className="font-display text-3xl mb-2">Conditions de participation</h1>
        <p className="text-mist text-sm mb-12">
          Modèle de base à adapter avec un conseil juridique avant publication définitive.
        </p>

        <div className="space-y-10 text-mist leading-relaxed text-sm">
          <Block title="Conditions de participation">
            La participation à DreamTouch Experience #001 — THE UNKNOWN est réservée aux
            personnes ayant complété leur inscription et dont le paiement a été confirmé.
            L&apos;organisateur se réserve le droit de refuser l&apos;accès à toute personne ne
            respectant pas les présentes conditions.
          </Block>

          <Block title="Politique de remboursement">
            [À définir par l&apos;organisateur] — préciser ici les conditions et délais dans
            lesquels un remboursement peut être demandé, ainsi que les cas d&apos;annulation par
            l&apos;organisateur (ex. évènement complet suite à une erreur technique, annulation
            de l&apos;évènement).
          </Block>

          <Block title="Conditions de paiement">
            Le prix affiché au moment de la création de la réservation est le prix dû, dans la
            limite du délai de validité de la réservation. Le paiement est traité via Celtis. Une
            réservation non payée dans le délai imparti est automatiquement annulée.
          </Block>

          <Block title="Politique de confidentialité">
            Les informations personnelles collectées (nom, contact, informations d&apos;urgence)
            sont utilisées uniquement dans le cadre de l&apos;organisation de l&apos;événement.
            Voir la page dédiée pour plus de détails.
          </Block>

          <Block title="Photos et vidéos">
            Des photos et vidéos pourront être prises pendant l&apos;événement à des fins de
            communication. [Préciser les modalités d&apos;opposition/consentement.]
          </Block>

          <Block title="Comportement attendu">
            Chaque participant s&apos;engage à faire preuve de respect envers les autres
            participants et l&apos;équipe organisatrice. Tout comportement inapproprié pourra
            entraîner une exclusion sans remboursement.
          </Block>

          <Block title="Contact">
            Pour toute question : WhatsApp 01 29 79 17 17.
          </Block>
        </div>
      </section>
      <Footer />
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg text-gold mb-2">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
