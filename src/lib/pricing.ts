/**
 * Moteur de tarification dynamique.
 *
 * REGLE D'OR : le nombre de "participants" utilise pour determiner le palier
 * est UNIQUEMENT le nombre de paiements reellement CONFIRMES
 * (Event.confirmedCount). Une reservation PENDING_PAYMENT n'est jamais
 * comptee comme une place vendue.
 *
 * ---------------------------------------------------------------------------
 * POLITIQUE DE VERROUILLAGE DU PRIX (section 31 du cahier des charges)
 * ---------------------------------------------------------------------------
 * Probleme : deux personnes peuvent commencer une inscription au meme
 * moment alors qu'il reste 2 places au tarif actuel. Si l'une paie avant
 * l'autre, le palier peut changer entre la creation de la reservation et
 * la confirmation du paiement.
 *
 * Politique retenue (a documenter clairement pour l'utilisateur) :
 *
 *   1. Le prix est fige ("locked") au moment de la CREATION de la
 *      reservation, en fonction du palier correspondant au nombre de
 *      paiements confirmes a cet instant precis (lecture protegee par
 *      transaction, voir reservation.ts).
 *   2. Ce prix figé (lockedPrice) est celui que le participant doit payer,
 *      quel que soit le palier affiche publiquement au moment ou il
 *      finalise son paiement. Cela garantit une experience previsible :
 *      "le prix que tu as vu est le prix que tu payes", tant que tu payes
 *      dans le delai de validite de la reservation (RESERVATION_TTL_MINUTES).
 *   3. La CAPACITE, elle, n'est verifiee et decrementee qu'au moment de la
 *      confirmation reelle du paiement (webhook), sous transaction
 *      serialisable avec verrou de ligne. Si la capacite maximale est deja
 *      atteinte a ce moment (quelqu'un d'autre a paye plus vite), la
 *      reservation n'est PAS confirmee meme si son prix etait verrouille -
 *      le participant est informe et doit etre rembourse / recontacte.
 *   4. Une reservation PENDING_PAYMENT non payee dans le delai imparti
 *      passe automatiquement au statut EXPIRED et libere implicitement sa
 *      place potentielle (elle n'a jamais ete comptee dans confirmedCount).
 *
 * Ce choix privilegie la transparence tarifaire pour l'utilisateur plutot
 * que de lui appliquer un prix different a la derniere seconde, tout en
 * gardant la capacite de 20 comme limite absolue et incontournable.
 */

export interface PricingTierLike {
  id: string;
  name: string;
  minParticipants: number;
  maxParticipants: number;
  price: number;
  order: number;
  active: boolean;
}

export interface PricingStatus {
  confirmedCount: number;
  capacity: number;
  remaining: number;
  currentTier: PricingTierLike | null;
  currentPrice: number | null;
  soldOut: boolean;
  spotsLeftInCurrentTier: number | null;
}

/**
 * Determine le palier tarifaire applicable pour la PROCHAINE personne a
 * s'inscrire, sachant que `confirmedCount` personnes ont deja un paiement
 * confirme. Les paliers sont 1-indexed et bases sur le rang de la place
 * (confirmedCount + 1).
 */
export function resolveTierForNextParticipant(
  tiers: PricingTierLike[],
  confirmedCount: number
): PricingTierLike | null {
  const nextRank = confirmedCount + 1;
  const active = tiers.filter((t) => t.active).sort((a, b) => a.order - b.order);
  for (const tier of active) {
    if (nextRank >= tier.minParticipants && nextRank <= tier.maxParticipants) {
      return tier;
    }
  }
  return null;
}

export function computePricingStatus(
  tiers: PricingTierLike[],
  confirmedCount: number,
  capacity: number
): PricingStatus {
  const soldOut = confirmedCount >= capacity;
  const currentTier = soldOut ? null : resolveTierForNextParticipant(tiers, confirmedCount);
  const spotsLeftInCurrentTier = currentTier
    ? currentTier.maxParticipants - confirmedCount
    : null;

  return {
    confirmedCount,
    capacity,
    remaining: Math.max(capacity - confirmedCount, 0),
    currentTier,
    currentPrice: currentTier ? currentTier.price : null,
    soldOut,
    spotsLeftInCurrentTier
  };
}

/** Petit libelle utilisateur en fonction du palier courant. */
export function tierPhaseLabel(tier: PricingTierLike | null): string {
  if (!tier) return "SOLD OUT";
  if (tier.order === 1) return "EARLY BIRD";
  if (tier.order === 2) return "TARIF STANDARD";
  return "DERNIERES PLACES";
}
