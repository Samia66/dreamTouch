"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface PricingData {
  pricing: {
    currentPrice: number | null;
    soldOut: boolean;
    spotsLeftInCurrentTier: number | null;
  };
}

const inputClasses =
  "w-full bg-charcoal border border-ash focus:border-gold rounded-xl px-4 py-3 text-bone placeholder:text-mist/50 outline-none transition";

export function RegistrationForm() {
  const router = useRouter();
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pricing", { cache: "no-store" })
      .then((r) => r.json())
      .then(setPricing)
      .catch(() => undefined);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      phone: form.get("phone"),
      email: form.get("email"),
      age: form.get("age"),
      city: form.get("city"),
      profession: form.get("profession"),
      emergencyName: form.get("emergencyName") || "",
      emergencyPhone: form.get("emergencyPhone") || "",
      acceptedTerms: form.get("acceptedTerms") === "on",
      acceptedContact: form.get("acceptedContact") === "on"
    };

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "SOLD_OUT") {
          setGlobalError("Toutes les places sont déjà réservées. THE UNKNOWN est complet.");
        } else if (data.error === "VALIDATION_ERROR") {
          setErrors(data.issues ?? {});
          setGlobalError("Merci de corriger les champs indiqués ci-dessous.");
        } else {
          setGlobalError("Une erreur est survenue. Merci de réessayer dans un instant.");
        }
        setSubmitting(false);
        return;
      }

      window.location.href = data.paymentUrl;
    } catch {
      setGlobalError("Connexion interrompue. Vérifie ta connexion et réessaie.");
      setSubmitting(false);
    }
  }

  if (pricing?.pricing.soldOut) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-charcoal p-8 text-center">
        <p className="font-display text-2xl text-gold mb-2">SOLD OUT</p>
        <p className="text-mist">
          Les 20 places de THE UNKNOWN sont réservées. Contacte-nous sur WhatsApp pour être
          informé d&apos;une prochaine édition.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {pricing && (
        <div className="rounded-xl border border-gold/25 bg-charcoal/60 px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-mist">Tarif actuel</span>
          <span className="font-display text-xl text-gold">
            {pricing.pricing.currentPrice?.toLocaleString("fr-FR")} FCFA
          </span>
        </div>
      )}
      {pricing?.pricing.spotsLeftInCurrentTier !== null &&
        pricing?.pricing.spotsLeftInCurrentTier !== undefined && (
          <p className="text-xs text-mist -mt-3">
            Ce tarif est valable pour les {pricing.pricing.spotsLeftInCurrentTier} prochaines
            places payées.
          </p>
        )}

      {globalError && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {globalError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Prénom" name="firstName" required errors={errors.firstName} />
        <Field label="Nom" name="lastName" required errors={errors.lastName} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Numéro WhatsApp" name="phone" type="tel" required errors={errors.phone} />
        <Field label="Adresse email" name="email" type="email" required errors={errors.email} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Âge" name="age" type="number" required errors={errors.age} />
        <Field label="Ville" name="city" required errors={errors.city} />
        <Field
          label="Profession / domaine"
          name="profession"
          required
          errors={errors.profession}
        />
      </div>

      <div className="pt-2">
        <p className="text-xs tracking-widest text-mist mb-3">
          EN CAS D&apos;URGENCE (OPTIONNEL)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Personne à contacter" name="emergencyName" />
          <Field label="Téléphone" name="emergencyPhone" type="tel" />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 text-sm text-mist">
          <input type="checkbox" name="acceptedTerms" required className="mt-1 accent-gold" />
          <span>
            J&apos;accepte les{" "}
            <a href="/conditions" className="text-gold underline" target="_blank">
              conditions de participation
            </a>{" "}
            et la{" "}
            <a href="/confidentialite" className="text-gold underline" target="_blank">
              politique de confidentialité
            </a>
            .
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-mist">
          <input type="checkbox" name="acceptedContact" className="mt-1 accent-gold" />
          <span>J&apos;accepte d&apos;être contacté par DreamTouch concernant cet événement.</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-gold text-void font-semibold py-4 tracking-wide hover:bg-gold-light transition disabled:opacity-50"
      >
        {submitting ? "Préparation du paiement…" : "CONTINUER VERS LE PAIEMENT"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  errors
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  errors?: string[];
}) {
  return (
    <label className="block text-sm text-mist">
      {label}
      {required && <span className="text-gold"> *</span>}
      <input
        name={name}
        type={type}
        required={required}
        className={`${inputClasses} mt-1`}
      />
      {errors?.map((err) => (
        <span key={err} className="block text-xs text-red-400 mt-1">
          {err}
        </span>
      ))}
    </label>
  );
}
