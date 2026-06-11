# FounderMatch — Build-Anweisung für Claude Code

> Diese Datei ist die vollständige Anweisung. Lege sie als `BUILD_INSTRUCTIONS.md` ins Projekt-Root und starte Claude Code mit dem Prompt ganz unten ("Startbefehl").

---

## 0. Kontext & bereits erledigt

Du baust **FounderMatch**, ein Premium-Dating-Netzwerk für Unternehmer und ambitionierte Singles, plus ein automatisiertes Monetarisierungs-System (Community, Kurs, Upsells). Das Onboarding orientiert sich am Quittr-Flow (Quiz → personalisierter Score → personalisierter Plan → Paywall), bewusst **ohne** Dark Patterns (kein Fake-Countdown, kein harter Block).

**Backend existiert bereits (Supabase, Projekt-Ref `ccgewououswrrdkjhava`, Region eu-central-1, Postgres 17).**
Vorhandene Tabellen (alle mit RLS aktiv): `profiles`, `values`, `business_verifications`, `likes`, `matches`, `messages`, `rejections`, `blocks`, `concierge_applications`, `analytics_events`, `push_tokens`, `notification_preferences`, `notifications`.

**Bereits durchgeführte Security-Fixes (NICHT erneut anlegen, aber respektieren):**
- Alle 6 `SECURITY DEFINER`-Funktionen: EXECUTE für anon/authenticated entzogen, `search_path=''` gesetzt.
- View `public.public_profiles` (security_invoker) existiert — **fremde Profile NUR hierüber lesen**, niemals direkt aus `profiles`. Sie enthält bewusst keine sensiblen Felder (email, is_admin, plan, trial_*, Statistiken).
- Trigger `prevent_privilege_escalation` auf `profiles` — Nutzer können `is_admin`, `plan`, `verification_status`, `trial_*` nicht selbst per UPDATE ändern.
- Security-Advisor-Scan ist aktuell **clean (0 Warnungen)**. Halte ihn so.

---

## 1. Tech-Stack (verbindlich)

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS. Als **PWA** (installierbar, kein App-Store nötig im MVP → keine 30 % Gebühr, kein Review-Delay).
- **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions, Realtime).
- **Payments:** Stripe (Subscriptions + einmalige Zahlungen + Webhooks).
- **Community/Kurs:** eigene Tabellen + Mux oder Cloudflare Stream für Videos (siehe Paragraph 6). Kein externes Skool/Whop im Code — wir bauen es nativ, damit alles in einem System laeuft.
- **Transaktionale E-Mails & Sequenzen:** Resend (oder Postmark).
- **Hosting:** Vercel.
- **Design-Tokens:** Dark Premium. Hintergrund `#0C0E13`, Akzent Champagner-Gold `#CDA349`, Text `#F4F1EA`, Flaechen `#14181F`/`#1C212B`, Linien `#272D39`. Display-Font *Space Grotesk*, Body *Inter*. Alles in 4er-Spacing. (Referenz: der bereits gebaute HTML-Prototyp `foundermatch-onboarding.html`.)

**Arbeitsweise:** Inkrementell in den unten definierten Phasen. Nach **jeder** Phase: `npm run build` muss gruen sein, Lint sauber, und am Ende jeder Phase mit Backend-Bezug der Supabase-Security-Advisor erneut pruefen (siehe Paragraph 9). Committe nach jeder Phase mit aussagekraeftiger Message.

---

## 2. Leitprinzipien (gelten fuer ALLES, was du baust)

1. **Security first.** Service-Role-Key NIE im Client. Fremde Profile nur ueber `public_profiles`. Jede neue Tabelle bekommt sofort RLS + Policies. Nach jeder DDL-Aenderung Advisor-Check.
2. **Zwei getrennte Onboarding-Flows.** Maenner: Quiz mit Score-Reveal + Paywall-Funnel (Druck ueber Ist/Soll-Luecke). Frauen: Sicherheit, Kuratierung, Exklusivitaet — **kein** "dein Score ist niedrig"-Druck. Niemals denselben aggressiven Funnel auf Frauen anwenden; das zerstoert die Angebotsseite.
3. **Keine Dark Patterns.** Kuendigung so einfach wie Abschluss (DE-Pflicht: Kuendigungsbutton). Echte Trials, klare Preise inkl. MwSt., echte Erinnerungen. Keine Fake-Timer, keine Fake-Notifications.
4. **DSGVO by design.** `children_wish`, `values.*`, Beziehungsdaten = teils Art. 9. Granulare Consent-Checkbox im Onboarding, dokumentiert. Account-Loeschung kaskadiert ueber ALLE Tabellen. Daten-Export-Funktion. EXIF-Stripping bei Bild-Upload.
5. **Community-Kultur als Geschaeftsschutz.** Die Maenner-Community ist "Selbstentwicklung & Standing", NICHT Pick-up/Manipulation. Community-Guidelines im Code/Content verankern; Moderations- & Meldefunktion ab Tag 1. Frauenverachtende Inhalte sind verboten und fuehren zu Ban.
6. **Automatisierung = Ziel.** Jeder Upsell, jede Sequenz, jede Zugriffsfreigabe laeuft ohne manuelles Eingreifen (siehe Paragraph 7). Der Betreiber soll nichts manuell freischalten muessen.

---

## 3. Phase 1 — Fundament & Auth

- Next.js-Projekt mit Supabase-Client (Server + Browser, `@supabase/ssr`).
- Auth: E-Mail + Passwort, **E-Mail-Bestätigung erzwungen**. In Supabase Auth aktivieren: Leaked-Password-Protection, Passwort-Mindeststaerke.
- `.env.example` mit allen noetigen Keys (Supabase URL/anon, Stripe, Resend, Mux). Service-Role nur serverseitig.
- Globales Design-System aus den Tokens (Paragraph 1) als Tailwind-Config + Basis-Komponenten (Button, Chip/Option, ProgressBar, Card, Input).
- App-Shell mit geschuetzten Routes (Middleware: nicht-eingeloggt → /login).
- **Rate-Limiting-Layer** (Upstash Redis o. Supabase-seitig) fuer: Registrierung, Likes, Nachrichten, Quiz-Submit.
- Captcha (hCaptcha/Turnstile) bei Registrierung.

**Done-Kriterium:** Registrierung → E-Mail-Bestätigung → Login → leeres Dashboard. Build gruen.

---

## 4. Phase 2 — Onboarding-Maschine (Quittr-Logik)

Baue beide Flows als gefuehrte Schrittfolge (ein Schritt pro Screen, Fortschrittsbalken, Zurueck-Button), Antworten in State + am Ende persistiert.

### 4a. Maenner-Flow (uebernimm Struktur aus `foundermatch-onboarding.html`)
Welcome → Name → Geschlecht → Beziehungsziel → 5 Diagnose-Fragen (Status quo, Antwortrate, Blocker [multi], beruflicher Stand inkl. Founder-Verifizierungs-Frage, 5-Jahres-Vision) → Lade-Screen → **Score-Reveal** → persoenlicher Plan → Commitment → Social Proof → Consent → Paywall → Welcome.

### 4b. Frauen-Flow
Welcome → Name → Geschlecht → Beziehungsziel → Werte/Familie/Lifestyle-Fragen (kuratierend, nicht beschaemend) → "Was ist dir wichtig an einem Partner" → Sicherheits-Versprechen-Screen ("nur verifizierte, ernsthafte Maenner") → Consent → sanfte Premium-Einladung (kein Hard-Paywall) → Welcome.

### 4c. Score-Engine (echte Berechnung, kein Fake)
Implementiere `lib/score.ts`:
- **Ambition**, **Family**, **Lifestyle**, **Relationship-Readiness** je 0–100 aus den Antworten.
- **Ist-Score** (Maenner-Reveal): bewusst niedrig-mittel, ehrlich aus den Diagnose-Antworten abgeleitet (z. B. niedrige Antwortrate + "falsche Leute" + Solo-Status → niedrigerer Ist-Wert).
- **Potenzial-Score**: realistisch deutlich hoeher, kommuniziert als "im richtigen Pool erreichbar".
- Schreibe Scores nach `values` bzw. neue Spalten (Migration mit RLS-Beachtung). Reveal-Animation wie im Prototyp.
- **Wichtig:** Die Luecke entsteht aus echten Antworten, nicht aus Zufall. Transparenz-Hinweis: "Selbsteinschaetzung, keine Diagnostik."

### 4d. Consent & Recht
Eigener Consent-Screen vor Abschluss: getrennte Checkboxen fuer (1) AGB/Datenschutz, (2) Verarbeitung besonderer Daten (Kinderwunsch/Werte), (3) optional Marketing. In `analytics_events` + dediziertem `consents`-Record dokumentieren (Zeitstempel, Version).

**Done-Kriterium:** Beide Flows komplett durchspielbar, Score wird berechnet & gespeichert, Profil ist nach Abschluss `onboarding_completed=true`. Neue Tabellen haben RLS. Advisor clean.

---

## 5. Phase 3 — Core Dating (Matching, Chat, Verifizierung)

- **Daily-Batch-Matching** statt Endlos-Swipe: taeglich begrenzte, kuratierte Vorschlaege (Anzahl je Plan). Matching-Gewichtung: Beziehungsziel 20 %, Werte 20 %, Kinderwunsch 15 %, Lebensmodell 15 %, Familienorientierung 10 %, Ambition 10 %, Lifestyle 5 %, Standort als **Hard Filter** (Radius), nicht Score. **Hard Filter zuerst:** unvereinbarer Kinderwunsch/Beziehungsziel → kein Match. Mindestscore 60 %, dynamisch absenkbar bei duennem Pool (transparent gekennzeichnet).
- Swipe-Geste als UI auf dem **limitierten Tagesdeck** (Dopamin-Loop ueber Knappheit, nicht Endlosigkeit). Match-Logik nutzt vorhandene `likes`/`matches`/`rejections`.
- **Chat:** Realtime ueber Supabase, nur innerhalb eigener Matches (RLS streng pruefen). Free darf antworten, nicht initiieren; Premium voll.
- **Verifizierung:** Foto-Liveness/ID (Anbieter-Abstraktion, z. B. Veriff/Sumsub als pluggable Service) + Founder-Verifizierung (Handelsregister/LinkedIn-Abgleich → `business_verifications`). `verification_status` nur per Admin/Service-Role setzbar (Trigger schuetzt das bereits).
- **Storage:** Bucket **privat**, Zugriff ueber signierte URLs. Verifizierungs-Dokumente in separatem Bucket. EXIF beim Upload serverseitig strippen.
- **Trust & Safety:** Melde-/Block-Flow (nutzt `blocks`, `is_flagged`), Admin-Moderations-Queue, Reaktionsziel < 24 h.

**Done-Kriterium:** Zwei Test-User matchen, chatten, koennen melden/blocken. 2-User-RLS-Test (s. Paragraph 9) bestanden: User A kann KEINE fremden E-Mails/Chats/Admin-Felder lesen. Advisor clean.

---

## 6. Phase 4 — Monetarisierungs-Maschine (der Kern)

Implementiere die Value Ladder als zusammenhaengendes System. **Neue Tabellen** (alle mit RLS + Policies, Migrationen sauber benannt):

```
subscriptions        (user_id, stripe_sub_id, tier, status, current_period_end, ...)
purchases            (user_id, product, stripe_payment_id, amount, status, created_at)
community_members    (user_id, joined_at, tier, status, level, points)
community_posts      (id, author_id, body, channel, created_at, is_pinned, is_flagged)
community_comments   (id, post_id, author_id, body, created_at)
courses / modules / lessons   (Struktur + video_asset_id)
lesson_progress      (user_id, lesson_id, completed_at)
live_calls           (id, title, starts_at, join_url, recording_asset_id)
coaching_bookings    (user_id, slot, status, stripe_payment_id)
upsell_offers        (key, title, price, type, active)        -- konfigurierbar
offer_events         (user_id, offer_key, shown_at, clicked_at, purchased_at)
consents             (user_id, type, version, granted_at)
email_sequences / email_jobs   (fuer automatisierte Sequenzen)
```

### Produkte/Tiers (aus dem Masterplan)
- **App Premium** 79 Euro/Mon (Trial 3 Tage; Jahres-Option guenstiger).
- **Community "Inner Circle"** 49–99 Euro/Mon (Founding-Member-Sonderpreis konfigurierbar).
- **Videokurs/Signature-Programm** 499 Euro einmalig (oder in Jahres-Community enthalten).
- **1:1 Coaching** Paket ~2.000 Euro / Session ~300–500 Euro.
- **Profil-Done-For-You** ~290–490 Euro, **Fotoshooting** ~490–890 Euro (Vermittlung/Marge).
- **Bundle "Transformation Intensive"** ~1.997 Euro.
- **Events** 250–2.000 Euro, **Concierge** 2.500–15.000 Euro (bewerbungsbasiert → `concierge_applications`).

### Community & Kurs nativ
- Geschlossene Community (Feed, Channels, Posts, Kommentare, Likes), Gamification (Level/Points/Leaderboard, Challenges), Accountability-Pods.
- Kurs-Player (Module/Lessons, Fortschritt, "Win of the week"). Videos ueber Mux/Cloudflare Stream (signierte Wiedergabe).
- Live-Calls: Termine, Join-Link, Aufzeichnungs-Ablage.
- **Moderation:** Auto-Flag verbotener Inhalte (Keyword/Heuristik + Melde-Button), Admin-Queue. Community-Guidelines-Seite (Selbstentwicklung, kein Frauenhass).

**Done-Kriterium:** Ein Test-User kann Premium + Community abonnieren, Kurs ansehen, Upsell kaufen — alles ueber Stripe-Testmode. Zugaenge werden automatisch freigeschaltet (s. Paragraph 7). Advisor clean.

---

## 7. Phase 5 — Voll-Automatisierung ("ohne mich")

Ziel: Betreiber muss **nichts** manuell freischalten/organisieren. Implementiere als Supabase **Edge Functions** + Webhooks + Cron.

### 7a. Stripe-Webhook (`/functions/stripe-webhook`)
Signatur verifizieren. Auf Events reagieren — **vollautomatisch**:
- `checkout.session.completed` / `customer.subscription.created|updated` → passenden Tier setzen, Community-/Kurs-/Premium-Zugang freischalten (Insert/Update in `subscriptions`, `community_members`, `purchases`), Profil-`plan` per Service-Role setzen (Client darf das nicht).
- `invoice.payment_failed` → Dunning-Sequenz starten, Zugang nach Karenz sperren.
- `customer.subscription.deleted` → Zugaenge automatisch entziehen.
- Einmalkauefe (Kurs, DFY, Bundle) → sofortige Freischaltung + passende Onboarding-E-Mail-Sequenz triggern.

### 7b. Upsell-Automatik (regelbasiert, ohne Hand)
Edge Function `upsell-engine` (Cron, z. B. stuendlich) wertet Verhalten aus und triggert Angebote in-app + per E-Mail:
- Premium aktiv aber niedrige Antwortrate → biete **Profil-DFY / Fotoshooting** an.
- Hohe App-Aktivitaet, viele Matches, wenig Dates → biete **Community / Coaching** an.
- Community-Mitglied, hohes Engagement (Posts/Calls) → biete **1:1 Coaching / Bundle** an.
- Top-Zahlungskraft + Founder-verifiziert + sucht "Familie/Heirat" → **Concierge-Einladung**.
Alle Angebote in `offer_events` geloggt (gezeigt/geklickt/gekauft), Frequency-Cap beachten, kein Spam.

### 7c. E-Mail-Sequenzen (Resend, Cron-gesteuert)
- **Onboarding-Nudge:** Quiz nicht beendet → Reminder.
- **Trial-Lifecycle:** Tag 1 Welcome, Tag 2 Value, **24 h vor Ablauf echte Erinnerung**, Ablauf-Angebot.
- **Win-back:** gekuendigt → respektvolle Rueckhol-Sequenz (kein Druck).
- **Community-Aktivierung:** beigetreten → Pod-Zuweisung, erster Call-Termin, erste Aufgabe.
- **"Partner gefunden":** als Erfolg tracken, Testimonial-Anfrage automatisiert.

### 7d. Cron-Jobs (Supabase Scheduled Functions / pg_cron)
- Daily-Match-Batch generieren (pro User, pro Tag).
- Inaktive Free-Profile nach 30 Tagen deaktivieren (Match-Qualitaet schuetzen).
- Push/E-Mail fuer neue Matches/Nachrichten (echte Events, keine Fakes; Frequency-Cap max. 2 Push/Tag ausser Match-Nachrichten).
- Pod-/Leaderboard-Updates, Call-Erinnerungen.

### 7e. Self-Serve-Matchmaking-Vorstufe (Concierge teil-automatisiert)
Concierge bleibt menschlich im Abschluss, ABER: Bewerbung, Qualifizierung, Bezahlung, Intake-Fragebogen, Terminbuchung laufen automatisch → Betreiber sieht nur qualifizierte, bezahlte Leads im Admin-Dashboard. Kein manuelles Hin und Her.

**Done-Kriterium:** Kompletter Geldfluss ohne manuelles Zutun: Kauf → Webhook → Zugang → Begruessungssequenz → passender Folge-Upsell, alles automatisch im Stripe-Testmode nachweisbar. Advisor clean.

---

## 8. Phase 6 — Admin-Dashboard & Analytics

- Admin-only (RLS auf `is_admin`, das per Trigger geschuetzt ist). Uebersicht: MRR (gesamt + Premium vs. Community), Funnel-Conversion je Stufe, Trial→Paid, Community-Churn, Geschlechter-Ratio pro Stadt, "Partner gefunden"-Quote.
- Moderations-Queue (gemeldete Profile/Posts), Verifizierungs-Queue.
- Concierge-Lead-Liste (nur bezahlt/qualifiziert).
- North Star sichtbar: **qualifizierte Konversationen/Woche** (Match + ≥5 wechselseitige Nachrichten).
- Tracke alle Events aus dem Spec (Registrierung, Onboarding, Trial, Kaeufe je Tier, Matches, Nachrichten) in `analytics_events`.

---

## 9. Sicherheits-Checks — nach JEDER Phase mit Backend-Bezug

Pflicht-Routine, nicht optional:
1. **Supabase Security Advisor** laufen lassen → muss **0 Warnungen** zeigen. Bei neuen Funktionen: `search_path=''` + EXECUTE nur wo noetig. Bei neuen Tabellen: RLS an + Policies.
2. **2-User-RLS-Test** (automatisierter Test): User A darf von User B NICHT lesen: `email`, `is_admin`, `is_banned`, `plan`, `trial_*`, fremde `messages`, fremde `business_verifications` (revenue_range!), fremde abgelehnte/geblockte. Test schlaegt fehl = Phase nicht fertig.
3. **Service-Role-Leak-Check:** Grep das Client-Bundle nach Service-Role-Key/Secrets → darf nicht vorkommen.
4. **Storage:** Buckets privat? Signierte URLs? EXIF gestrippt?
5. **Stripe-Webhook:** Signaturpruefung aktiv? Keine Zugangsfreischaltung ohne verifiziertes Event?
6. **Privilege-Escalation-Test:** UPDATE-Versuch auf eigenes `is_admin`/`plan` als normaler User muss wirkungslos sein (Trigger greift).

Schreibe diese Checks als wiederholbares Skript (`scripts/security-audit.ts`) und fuehre es in CI aus.

---

## 10. Definition of Done (gesamt)

- Beide Onboarding-Flows live, Score echt berechnet.
- Dating-Core (Daily-Batch-Match, Chat, Verifizierung, Trust&Safety) funktioniert.
- Value Ladder komplett: Premium, Community, Kurs, alle Upsells, Concierge — kaufbar.
- **Alles automatisiert:** Webhook-Freischaltung, Upsell-Engine, E-Mail-Sequenzen, Cron-Jobs. Betreiber muss nichts manuell freischalten.
- DSGVO: Consent, Loeschung (kaskadiert), Export, EXIF-Stripping.
- Security-Audit-Skript gruen, Advisor 0 Warnungen, 2-User-Test bestanden.
- `npm run build` gruen, deploybar auf Vercel.
