import { describe, it, expect } from "vitest";
import { computePricingStatus, resolveTierForNextParticipant, tierPhaseLabel } from "@/lib/pricing";

const TIERS = [
  { id: "t1", name: "Phase 1", minParticipants: 1, maxParticipants: 5, price: 5000, order: 1, active: true },
  { id: "t2", name: "Phase 2", minParticipants: 6, maxParticipants: 15, price: 7000, order: 2, active: true },
  { id: "t3", name: "Phase 3", minParticipants: 16, maxParticipants: 20, price: 7500, order: 3, active: true }
];

describe("resolveTierForNextParticipant", () => {
  it("retourne le palier 1 (5000 FCFA) pour la 1ere place", () => {
    expect(resolveTierForNextParticipant(TIERS, 0)?.price).toBe(5000);
  });

  it("reste au palier 1 pour la 5e place", () => {
    expect(resolveTierForNextParticipant(TIERS, 4)?.price).toBe(5000);
  });

  it("passe a 7000 FCFA des la 6e place (10 confirmes)", () => {
    expect(resolveTierForNextParticipant(TIERS, 5)?.price).toBe(7000);
  });

  it("reste a 7000 FCFA pour la 15e place", () => {
    expect(resolveTierForNextParticipant(TIERS, 14)?.price).toBe(7000);
  });

  it("passe a 7500 FCFA des la 16e place (5 confirmes)", () => {
    expect(resolveTierForNextParticipant(TIERS, 15)?.price).toBe(7500);
  });

  it("reste a 7500 FCFA pour la 20e place", () => {
    expect(resolveTierForNextParticipant(TIERS, 19)?.price).toBe(7500);
  });

  it("retourne null quand 20 places sont deja confirmees (SOLD OUT)", () => {
    expect(resolveTierForNextParticipant(TIERS, 20)).toBeNull();
  });
});

describe("computePricingStatus", () => {
  it("calcule le statut correct a 7 confirmes", () => {
    const status = computePricingStatus(TIERS, 7, 20);
    expect(status.remaining).toBe(13);
    expect(status.currentPrice).toBe(5000);
    expect(status.spotsLeftInCurrentTier).toBe(3);
    expect(status.soldOut).toBe(false);
  });

  it("bloque a 20 participants (SOLD OUT)", () => {
    const status = computePricingStatus(TIERS, 20, 20);
    expect(status.soldOut).toBe(true);
    expect(status.currentTier).toBeNull();
    expect(status.currentPrice).toBeNull();
    expect(status.remaining).toBe(0);
  });

  it("ne descend jamais sous 0 place restante meme si confirmedCount > capacity", () => {
    const status = computePricingStatus(TIERS, 25, 20);
    expect(status.remaining).toBe(0);
    expect(status.soldOut).toBe(true);
  });
});

describe("tierPhaseLabel", () => {
  it("etiquette EARLY BIRD pour le palier 1", () => {
    expect(tierPhaseLabel(TIERS[0]!)).toBe("EARLY BIRD");
  });
  it("etiquette SOLD OUT quand aucun palier", () => {
    expect(tierPhaseLabel(null)).toBe("SOLD OUT");
  });
  it("etiquette DERNIERES PLACES pour le palier 3", () => {
    expect(tierPhaseLabel(TIERS[2]!)).toBe("DERNIERES PLACES");
  });
});
