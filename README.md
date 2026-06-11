# FounderMatch – Dating für Unternehmer

Exklusive Dating-Web-App für Unternehmer und ambitionierte Singles mit klaren Lebenszielen.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth & DB:** Supabase
- **Payments:** Stripe (vorbereitet)
- **Deployment:** Vercel

## Setup

### 1. Repository klonen

```bash
git clone <repo-url>
cd foundermatch
npm install
```

### 2. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. Kopiere die **Project URL** und den **anon public key** aus den Projekteinstellungen

### 3. Umgebungsvariablen

Kopiere `.env.example` zu `.env.local`:

```bash
cp .env.example .env.local
```

Fülle die Werte aus:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 4. Datenbank einrichten

1. Öffne den **SQL Editor** in deinem Supabase Dashboard
2. Kopiere den Inhalt von `supabase/migrations/00001_initial_schema.sql`
3. Führe das SQL aus

### 5. Admin-User erstellen

1. Registriere dich normal über die App
2. Gehe in den Supabase **Table Editor** → `profiles`
3. Setze `is_admin = true` für deinen User

### 6. Lokal starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

### 7. Auf Vercel deployen

```bash
vercel
```

Setze die Environment Variables in den Vercel Project Settings.

## Features

### Fertig im MVP

- Landing Page mit allen Sektionen
- Auth (Register, Login, Logout, Passwort vergessen)
- 6-Stufen Onboarding (Account-Typ, Basisdaten, Lebensmodell, Werte, Verifizierung, Profil)
- Dashboard mit Stats
- Kuratierte Match-Vorschläge mit Kompatibilitäts-Score
- Like & Match System (automatisch bei gegenseitigem Interesse)
- 1:1 Chat zwischen Matches
- Profilbearbeitung
- Pricing-Seite mit 4 Plänen
- Concierge-Bewerbungsformular
- Admin Dashboard (Nutzer, Verifizierungen, Statistiken, Sperren)
- Row Level Security
- Mobile-first Design

### Platzhalter / Nächste Schritte

- [ ] Foto-Upload (Supabase Storage)
- [ ] Stripe Checkout Integration
- [ ] Realtime Chat (Supabase Realtime)
- [ ] E-Mail Benachrichtigungen
- [ ] Push Notifications
- [ ] Erweiterte Filter für Premium
- [ ] Distanz-basiertes Matching
- [ ] Rate Limiting für Likes
- [ ] Profilbild-Moderation
