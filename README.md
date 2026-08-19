# DreamTouch Experience #001 — THE UNKNOWN

Plateforme de réservation et billetterie pour l'expérience immersive
**THE UNKNOWN**, limitée à 20 participants.

> "Tu ne viens pas pour assister à un événement. Tu viens vivre une expérience."

---

## 1. Sommaire

- [Stack technique](#2-stack-technique)
- [Installation locale](#3-installation-locale)
- [Configuration Celtis (paiement)](#4-configuration-celtis-paiement)
- [Mode sandbox / mock](#5-mode-sandbox--mock)
- [Politique de tarification & de verrouillage du prix](#6-politique-de-tarification--de-verrouillage-du-prix)
- [Sécurité](#7-sécurité)
- [Lancer les tests](#8-lancer-les-tests)
- [Déploiement en production](#9-déploiement-en-production)
- [Structure du projet](#10-structure-du-projet)
- [Ce qu'il reste à faire avant la mise en ligne](#11-ce-quil-reste-à-faire-avant-la-mise-en-ligne)

---

## 2. Stack technique

| Domaine        | Choix                              |
|-----------------|-------------------------------------|
| Frontend        | Next.js 14 (App Router) / React / TypeScript |
| Style           | Tailwind CSS                        |
| Backend         | Next.js Route Handlers (API)        |
| Base de données | PostgreSQL                          |
| ORM             | Prisma                              |
| Validation      | Zod                                 |
| Auth admin      | JWT (cookie httpOnly) + bcrypt      |
| QR Code         | `qrcode`                            |
| PDF             | `pdfkit`                            |
| Email           | `nodemailer` (SMTP configurable)    |
| Paiement        | Celtis (production) / provider mock (sandbox) |
| Tests           | Vitest                              |

---

## 3. Installation locale

### Prérequis
- Node.js 18+
- Une base PostgreSQL (locale ou hébergée)

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement
cp .env.example .env
# puis éditer .env avec vos valeurs (DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET, ...)

# 3. Générer le client Prisma et créer les tables
npx prisma generate
npx prisma migrate dev --name init

# 4. Injecter les données par défaut (événement, paliers tarifaires, compte admin)
npm run prisma:seed

# 5. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur http://localhost:3000, l'admin sur
http://localhost:3000/admin/login (identifiants définis via `ADMIN_EMAIL` /
`ADMIN_PASSWORD` dans `.env`, avant de lancer le seed).

Par défaut, `PAYMENT_PROVIDER="mock"` : tout le parcours (réservation →
paiement → ticket → email → scan) est testable sans aucun compte Celtis réel.

---

## 4. Configuration Celtis (paiement)

Le code d'intégration Celtis se trouve dans `src/lib/payments/celtis-provider.ts`.
**Ce fichier n'est volontairement pas une intégration finale.** Les endpoints,
noms de champs et mécanisme de signature exacts de Celtis n'étaient pas
disponibles au moment du développement : plutôt que de les inventer, chaque
point à compléter est marqué `// TODO CELTIS` dans le code.

Avant de basculer `PAYMENT_PROVIDER=celtis` en production, il faut obtenir de
Celtis et renseigner :

1. **L'URL exacte de création de paiement** → `CELTIS_PAYMENT_URL`, et le
   format exact du payload attendu (JSON ? champs requis ?).
2. **Le mécanisme d'authentification des appels sortants** (header
   `Authorization` ? HMAC de la requête ? `CELTIS_API_KEY` seule ?).
3. **Le format de l'URL de paiement** renvoyée par Celtis (vers laquelle
   rediriger l'utilisateur).
4. **Le format exact des notifications webhook** (corps de la requête POST),
   avec les noms précis des champs : montant, devise, référence marchand, id
   de transaction, statut.
5. **L'algorithme et l'emplacement de la signature du webhook** — header
   dédié ? HMAC-SHA256 du corps brut avec `CELTIS_WEBHOOK_SECRET` ? Cette
   information est indispensable pour compléter `verifyWebhook()` de façon
   sécurisée.
6. **La liste exhaustive des statuts Celtis** et leur correspondance avec
   `CONFIRMED / FAILED / CANCELLED / EXPIRED / PENDING` côté DreamTouch.
7. **La politique de renvoi des webhooks** (pour confirmer que
   l'idempotence par `transactionId` + `webhookEventId` déjà en place est
   suffisante).

Variables à renseigner dans `.env` une fois ces informations obtenues :

```
CELTIS_API_KEY=
CELTIS_SECRET_KEY=
CELTIS_MERCHANT_ID=
CELTIS_PAYMENT_URL=
CELTIS_WEBHOOK_SECRET=
PAYMENT_PROVIDER=celtis
```

Le reste de l'application (tarification, capacité, tickets, QR, emails,
admin) ne dépend d'aucune façon de Celtis directement : tout passe par
l'interface `PaymentProvider` (`src/lib/payments/provider.ts`), donc brancher
la vraie intégration ne nécessite de modifier que `celtis-provider.ts`.

---

## 5. Mode sandbox / mock

Avec `PAYMENT_PROVIDER=mock` (valeur par défaut), une page `/paiement/mock/[id]`
simule un écran de paiement Celtis. Elle permet de simuler un paiement réussi
ou échoué, qui déclenche le même webhook interne (`/api/payments/celtis/webhook`)
que la vraie intégration utiliserait — donc tout le reste du système
(vérification du montant, capacité, génération du ticket, email) est
testé de bout en bout sans dépendre de Celtis.

---

## 6. Politique de tarification & de verrouillage du prix

Le calcul du palier tarifaire (`src/lib/pricing.ts`) se base **uniquement**
sur le nombre de paiements réellement **confirmés** (`Event.confirmedCount`).
Une réservation en attente de paiement ne compte jamais comme une place
vendue.

**Verrouillage du prix** (`src/lib/reservation.ts`) : le prix est figé au
moment de la création de la réservation, selon le palier en vigueur à cet
instant précis. C'est ce prix qui doit être payé, tant que la réservation
n'a pas expiré (délai configurable, `RESERVATION_TTL_MINUTES`, 20 minutes
par défaut). Ce choix privilégie la prévisibilité pour l'utilisateur : le
prix affiché est le prix payé.

**La capacité**, elle, n'est vérifiée et décrémentée qu'au moment de la
confirmation réelle du paiement (webhook), sous transaction PostgreSQL
sérialisable avec verrou de ligne (`SELECT ... FOR UPDATE`). Si la capacité
est déjà atteinte à ce moment précis (quelqu'un d'autre a payé plus vite), la
réservation n'est **pas** confirmée même si son prix était verrouillé — le
paiement doit alors être remboursé manuellement, et ce cas déclenche un log
d'alerte explicite côté serveur (`ALERTE: paiement confirmé ... capacité
atteinte`).

Voir les commentaires détaillés en tête de `src/lib/pricing.ts` pour la
politique complète.

---

## 7. Sécurité

- HTTPS attendu en production (à la charge de l'hébergeur/reverse proxy).
- Toute validation d'entrée est faite côté serveur (Zod), jamais uniquement
  côté client.
- Prisma protège nativement contre les injections SQL (requêtes paramétrées).
  Le seul `$executeRaw` du projet (`src/lib/ticket.ts`) utilise un template
  literal Prisma (paramétré, pas de concaténation de chaînes).
- En-têtes de sécurité (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`) définis dans `next.config.js`.
- Secrets (Celtis, JWT, SMTP) exclusivement côté serveur, jamais exposés au
  frontend (`NEXT_PUBLIC_*` n'est utilisé que pour l'URL publique de l'app).
- Mots de passe admin hashés avec bcrypt (12 rounds).
- Sessions admin en cookie **httpOnly**, `secure` en production, JWT signé.
- Rate limiting simple sur `/api/admin/auth/login` (8 tentatives / 10 min /IP).
- Webhook Celtis : vérification de signature obligatoire, idempotence stricte
  par `webhookEventId`, montant toujours revérifié côté serveur (jamais
  confiance au frontend), capacité revérifiée sous verrou avant émission du
  ticket.
- QR Code : jeton opaque aléatoire (`qrToken`), aucune donnée personnelle
  encodée. Chaque scan est journalisé (`TicketScan`) ; un ticket ne peut
  passer `VALID → USED` qu'une seule fois (vérifié en transaction).
- Identifiants non prévisibles : UUID v4 pour toutes les clés primaires,
  jeton QR généré via `crypto.randomBytes`.

---

## 8. Lancer les tests

```bash
npm test
```

- `tests/pricing.test.ts` — tests purs du moteur de tarification (paliers,
  transitions 5000→7000→7500 FCFA, SOLD OUT). Ne nécessitent aucune base de
  données.
- `tests/concurrency.test.ts` — tests d'intégration (blocage à la capacité
  avec inscriptions concurrentes, montant incorrect, idempotence du webhook,
  double scan). **Nécessitent une base PostgreSQL de test** accessible via
  `DATABASE_URL` ; ils sont automatiquement ignorés (`describe.skip`) si
  `DATABASE_URL` n'est pas définie, pour ne pas casser `npm test` par défaut.

Pour les exécuter réellement :

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dreamtouch_test" npx prisma migrate deploy
DATABASE_URL="postgresql://user:password@localhost:5432/dreamtouch_test" npm test
```

---

## 9. Déploiement en production

1. Provisionner une base PostgreSQL (ex. Supabase, Neon, RDS, ou instance
   dédiée).
2. Définir toutes les variables de `.env.example` dans l'environnement de
   production (jamais commiter le `.env` réel).
3. `npx prisma migrate deploy` pour appliquer les migrations.
4. `npm run prisma:seed` (une seule fois, pour créer l'événement, les
   paliers tarifaires et le compte admin).
5. `npm run build && npm start`, ou déployer sur une plateforme compatible
   Next.js (Vercel, un serveur Node classique, un conteneur Docker, etc.).
6. Configurer l'URL du webhook Celtis vers
   `https://votre-domaine.example/api/payments/celtis/webhook` une fois
   l'intégration Celtis complétée (voir section 4).
7. Passer `PAYMENT_PROVIDER=celtis` seulement après avoir testé
   l'intégration en environnement sandbox Celtis si disponible.
8. Mettre en place une tâche planifiée (cron) qui appelle
   `expireStaleRegistrations()` (`src/lib/reservation.ts`) régulièrement,
   ou l'exposer via une route API protégée déclenchée par un cron externe,
   pour libérer les réservations expirées non payées.

---

## 10. Structure du projet

```
prisma/
  schema.prisma        Modèle de données complet
  seed.ts               Données par défaut (event, paliers, admin)
src/
  app/
    page.tsx             Accueil
    experience/          Page "L'expérience"
    inscription/          Formulaire de réservation
    paiement/
      succes/ attente/ echec/   Pages de résultat de paiement
      mock/[registrationId]/    Simulateur de paiement (sandbox uniquement)
    ticket/[id]/          Ticket avec QR Code
    conditions/ confidentialite/ contact/
    admin/
      login/ dashboard/ participants/ tickets/ settings/
    api/
      registrations/                     Création de réservation
      pricing/                           Statut tarifaire en direct
      payments/celtis/webhook/           Webhook de paiement
      tickets/[id]/  tickets/[id]/pdf/   Consultation / téléchargement ticket
      admin/...                          API protégées de l'espace admin
  components/            Composants UI réutilisables
  lib/
    pricing.ts            Moteur de tarification
    reservation.ts         Création de réservation (prix verrouillé)
    ticket.ts               Confirmation paiement + émission ticket + scan
    payments/                Abstraction provider (Celtis / mock)
    pdf.ts / qrcode.ts / email.ts / auth.ts / validation.ts / settings.ts
  middleware.ts           Protection des routes /admin/*
tests/
  pricing.test.ts          Tests unitaires purs
  concurrency.test.ts       Tests d'intégration (nécessitent une DB)
```

---

## 11. Ce qu'il reste à faire avant la mise en ligne

- [ ] Obtenir la documentation officielle Celtis et compléter
      `celtis-provider.ts` (voir section 4).
- [ ] Définir la date et le lieu réels de l'événement dans
      `/admin/settings`.
- [ ] Relire et adapter juridiquement `/conditions` et `/confidentialite`
      (contenus actuellement fournis comme modèles de base).
- [ ] Configurer un vrai fournisseur SMTP pour l'envoi des emails de
      confirmation.
- [ ] Mettre en place la tâche planifiée d'expiration des réservations
      (section 9, étape 8).
- [ ] Tester le scanner QR sur les appareils réellement utilisés le jour J
      (le scan caméra utilise l'API `BarcodeDetector`, disponible sur
      Chrome/Edge Android et desktop ; prévoir la saisie manuelle en
      solution de repli sur les navigateurs non compatibles, déjà intégrée
      dans `/admin/tickets`).
- [ ] Changer `ADMIN_PASSWORD` et `JWT_SECRET` avant tout déploiement
      public.
# dreamTouch
