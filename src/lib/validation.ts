import { z } from "zod";

export const registrationSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom trop court").max(60),
  lastName: z.string().trim().min(2, "Nom trop court").max(60),
  phone: z
    .string()
    .trim()
    .min(8, "Numéro WhatsApp invalide")
    .max(20)
    .regex(/^[0-9+\s().-]+$/, "Numéro WhatsApp invalide"),
  email: z.string().trim().email("Adresse email invalide").max(120),
  age: z.coerce.number().int().min(16, "Âge minimum 16 ans").max(100),
  city: z.string().trim().min(2, "Ville requise").max(80),
  profession: z.string().trim().min(2, "Profession requise").max(120),
  emergencyName: z.string().trim().max(120).optional().or(z.literal("")),
  emergencyPhone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\s().-]*$/, "Numéro invalide")
    .optional()
    .or(z.literal("")),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "Tu dois accepter les conditions de participation." })
  }),
  acceptedContact: z.boolean().default(false)
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

export const scanRequestSchema = z.object({
  qrToken: z.string().min(10)
});

export const settingsUpdateSchema = z.object({
  capacity: z.coerce.number().int().min(1).max(1000).optional(),
  date: z.string().datetime().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  reservationTtlMinutes: z.coerce.number().int().min(1).max(1440).optional()
});
