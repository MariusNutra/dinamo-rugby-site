# ROADMAP — Dinamo Rugby Platform

> Document generat pe 28 Februarie 2026
> Analiza completă a funcționalităților lipsă pentru a aduce platforma la nivel internațional

---

## Sumar

Platforma are deja un fundament solid: management sportivi, portal părinți cu magic-link auth, evaluări, prezențe, medical, plăți Stripe, fundraising, galerie foto, module toggle, GDPR, exporturi PDF/CSV. Acest roadmap acoperă **toate** funcționalitățile lipsă, structurate în 3 faze de prioritate.

**Starea curentă:**
- 18 module funcționale (Starter + Club + Pro)
- 34+ pagini admin, 25+ pagini publice
- SQLite (file-based) — limitare majoră pt scalabilitate
- Limba: doar Română
- PWA: neimplementat
- Push Notifications: neimplementat
- Shop checkout: neimplementat (doar display)
- Subscripții recurente: neimplementate
- Multi-limbă: neimplementat
- Analytics: neintegrat

---

## FAZA 1 — CRITICE (Necesare imediat)

Funcționalități esențiale care lipsesc și care afectează operarea zilnică sau credibilitatea platformei.

---

### 1.1 PWA (Progressive Web App)

**Descriere:** Aplicația nu are manifest.json, service worker sau suport offline. Părinții și antrenorii trebuie să poată instala aplicația pe telefon și să aibă acces rapid la informații chiar și cu conexiune slabă. Implementare: `next-pwa` cu caching strategie (stale-while-revalidate pt pagini, cache-first pt imagini), manifest cu iconițe și splash screen, push notification registration.

**Efort estimat:** 8-12 ore

**Dependențe:** Niciuna

**Impact:** HIGH — Experiență mobilă semnificativ îmbunătățită, acces instant de pe homescreen

**Fișiere de creat/modificat:**
- `next.config.mjs` — integrare `next-pwa`
- `public/manifest.json` — NOU
- `public/sw.js` — NOU (custom service worker, dacă e necesar)
- `public/icons/` — NOU (icon-192.png, icon-512.png, apple-touch-icon)
- `app/layout.tsx` — meta tags `<link rel="manifest">`, theme-color
- `lib/push-subscription.ts` — NOU (dacă se implementează push)

---

### 1.2 Push Notifications (Web Push)

**Descriere:** Nu există nicio formă de notificare push. Părinții primesc doar email-uri. Implementare: Web Push API cu VAPID keys, subscription management per parent, admin UI pentru trimitere push (refolosește tipurile existente: anulare antrenament, schimbare program, meci nou, general). Stocarea subscriptions în DB.

**Efort estimat:** 16-24 ore

**Dependențe:** PWA (1.1) — service worker necesar pt a primi push

**Impact:** HIGH — Comunicare instant cu părinții, rata de citire mult mai mare decât emailul

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — model `PushSubscription { id, parentId, endpoint, p256dh, auth, createdAt }`
- `lib/web-push.ts` — NOU (VAPID key gen, send notification)
- `app/api/push/subscribe/route.ts` — NOU (POST — save subscription)
- `app/api/push/unsubscribe/route.ts` — NOU (POST — remove subscription)
- `app/api/admin/notificari/route.ts` — extinde: trimite și push pe lângă email
- `app/parinti/dashboard/page.tsx` — toggle "Activează notificări"
- Service worker (din 1.1) — handler `push` event

---

### 1.3 Migrare la PostgreSQL

**Descriere:** SQLite nu suportă conexiuni concurente, nu are replicare, backup-ul e manual (copiere fișier), și nu suportă tipuri avansate (JSON nativ, arrays). Pentru o platformă de nivel internațional, PostgreSQL este obligatoriu. Include: migrare schema, export/import date, actualizare Prisma provider, backup automation (pg_dump cron).

**Efort estimat:** 8-16 ore

**Dependențe:** Niciuna (dar trebuie făcut înainte de orice feature care depinde de concurență)

**Impact:** HIGH — Stabilitate, scalabilitate, backup automat, suport JSON nativ

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — `provider = "postgresql"`, ajustări tipuri (DateTime, Json)
- `.env` — `DATABASE_URL` format PostgreSQL
- `scripts/migrate-sqlite-to-pg.ts` — NOU (script de migrare date)
- `docker-compose.yml` sau config server — NOU (PostgreSQL service)
- `scripts/backup-db.sh` — NOU (pg_dump cron)

---

### 1.4 Google Analytics / Tracking

**Descriere:** Cookie policy menționează Google Analytics dar nu e integrat în cod. Lipsește orice formă de tracking: pageviews, events, conversions. Implementare: GA4 via `@next/third-parties` sau `gtag.js`, consent-aware (respectă cookie banner), event tracking pe acțiuni cheie (înscriere, donație, contact).

**Efort estimat:** 4-6 ore

**Dependențe:** Niciuna

**Impact:** MEDIUM — Date esențiale despre trafic și conversii

**Fișiere de creat/modificat:**
- `app/layout.tsx` — Google Analytics script (condiționat de consent)
- `lib/analytics.ts` — NOU (helper functions: trackEvent, trackPageView)
- `components/CookieConsent.tsx` — integrare cu GA consent mode
- `.env` — `GA_MEASUREMENT_ID`

---

### 1.5 Sistem de Documente pentru Părinți

**Descriere:** Secțiunea "Documente" din portalul părinți e un placeholder ("în curând"). Părinții au nevoie de acces la: regulament intern, calendar competiții, formulare medicale, contract, etc. Admin-ul trebuie să poată urca documente (PDF, DOC) pe categorii, iar părinții să le descarce.

**Efort estimat:** 12-16 ore

**Dependențe:** Niciuna

**Impact:** MEDIUM — Centralizarea documentelor elimină distribuirea manuală pe WhatsApp

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — model `Document { id, title, category, filePath, fileSize, mimeType, targetGroup (all/team), teamId?, uploadedBy, createdAt }`
- `app/api/admin/documents/route.ts` — NOU (GET list, POST upload)
- `app/api/admin/documents/[id]/route.ts` — NOU (PUT, DELETE)
- `app/api/parinti/documents/route.ts` — NOU (GET — documents pt echipele copiilor mei)
- `app/admin/documente/page.tsx` — NOU (admin CRUD + upload)
- `app/parinti/dashboard/page.tsx` — secțiunea Documente funcțională
- `app/admin/layout.tsx` — link sidebar

---

### 1.6 Shop Checkout (Finalizare Comandă Magazin)

**Descriere:** Magazinul afișează produse dar nu are funcționalitate de cumpărare. Implementare: coș de cumpărături (localStorage), flux Stripe Checkout (similar donațiilor), confirmare pe email, tracking comenzi în admin. Nu e necesar sistem complet de e-commerce — doar un flux simplu de achiziție.

**Efort estimat:** 16-24 ore

**Dependențe:** Stripe (deja integrat)

**Impact:** MEDIUM — Monetizare directă din merchandising

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — model `Order { id, customerName, email, phone, items (JSON), total, status, stripeSessionId, shippingAddress, createdAt }` + model `OrderItem { id, orderId, productId, quantity, price }`
- `app/api/shop/cart/route.ts` — NOU (POST create checkout session from cart)
- `app/api/shop/webhook/route.ts` — NOU sau extend payments webhook
- `app/api/admin/orders/route.ts` — NOU (GET — list orders)
- `app/api/admin/orders/[id]/route.ts` — NOU (PATCH — update status: procesare/expediat/livrat)
- `app/magazin/page.tsx` — buton "Adaugă în coș" + floating cart
- `app/magazin/cos/page.tsx` — NOU (pagina coș)
- `app/magazin/succes/page.tsx` — NOU (confirmare)
- `app/admin/comenzi/page.tsx` — NOU (admin order management)
- `lib/cart.ts` — NOU (localStorage cart helpers)

---

### 1.7 Subscripții Recurente (Cotizații Lunare Automate)

**Descriere:** Plata cotizației e one-off (trebuie plătită manual în fiecare lună). Implementare: Stripe Subscriptions cu Products/Prices, auto-debit lunar, portal de management (anulare, schimbare card), webhook-uri pt invoice.paid / invoice.payment_failed. Admin dashboard cu statusul abonamentelor.

**Efort estimat:** 20-30 ore

**Dependențe:** Stripe (deja integrat), migrare PostgreSQL (1.3) recomandată

**Impact:** HIGH — Automatizare completă a colectării cotizațiilor, reducere semnificativă a muncii administrative

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — model `Subscription { id, parentId, childId, stripeSubscriptionId, stripeCustomerId, status, currentPeriodStart, currentPeriodEnd, canceledAt }` + `SubscriptionPlan { id, name, amount, interval, stripePriceId }`
- `app/api/subscriptions/create/route.ts` — NOU (create Stripe subscription)
- `app/api/subscriptions/portal/route.ts` — NOU (Stripe Customer Portal redirect)
- `app/api/subscriptions/webhook/route.ts` — NOU sau extend webhook existent
- `app/api/admin/subscriptions/route.ts` — NOU (GET — list all subscriptions + status)
- `app/parinti/dashboard/page.tsx` — secțiune abonament activ / plătește
- `app/admin/plati/page.tsx` — tab subscripții active/expirate
- `lib/stripe-subscriptions.ts` — NOU (helpers)

---

### 1.8 Backup Automatizat & Disaster Recovery

**Descriere:** Baza de date SQLite nu are backup automat. Un crash al serverului sau o eroare de scriere poate pierde tot. Implementare: script de backup zilnic (copiere fișier SQLite + pg_dump dacă se migrează), stocare pe S3/Google Cloud Storage, retenție 30 zile, notificare pe email la eșec.

**Efort estimat:** 4-8 ore

**Dependențe:** Migrare PostgreSQL (1.3) recomandată dar nu obligatorie

**Impact:** HIGH — Protecție critică împotriva pierderii datelor

**Fișiere de creat/modificat:**
- `scripts/backup.sh` — NOU (script backup + upload S3)
- `scripts/restore.sh` — NOU (script restaurare)
- Cron job pe server
- `.env` — credentials S3/GCS

---

### 1.9 Sistem de Logging & Monitoring

**Descriere:** Nu există logging structurat sau monitoring. Erorile se pierd în stdout PM2. Implementare: logger structurat (winston sau pino), error tracking (Sentry free tier), health check endpoint, PM2 metrics.

**Efort estimat:** 6-10 ore

**Dependențe:** Niciuna

**Impact:** MEDIUM — Detectare rapidă a problemelor, debugging mai ușor

**Fișiere de creat/modificat:**
- `lib/logger.ts` — NOU (winston/pino logger cu rotare fișiere)
- `app/api/health/route.ts` — NOU (health check: DB ok, disk space, memory)
- `sentry.client.config.ts` + `sentry.server.config.ts` — NOU (dacă se folosește Sentry)
- `next.config.mjs` — Sentry plugin
- `middleware.ts` — request logging

---

## FAZA 2 — DIFERENȚIATORI (Avantaje competitive)

Funcționalități care diferențiază platforma de competiție și oferă valoare unică.

---

### 2.1 Multi-Language (i18n)

**Descriere:** Toată aplicația e în Română. Un club internațional necesită minim Engleză + Română. Implementare: `next-intl` cu middleware locale detection, dicționare JSON per limbă, switcher în header. Prioritate: paginile publice și portalul părinți. Admin-ul poate rămâne în Română.

**Efort estimat:** 30-40 ore

**Dependențe:** Niciuna

**Impact:** HIGH — Acces pentru părinți/sportivi non-români, imagine internațională

**Fișiere de creat/modificat:**
- `messages/ro.json` — NOU (dicționar Română)
- `messages/en.json` — NOU (dicționar Engleză)
- `i18n.ts` + `i18n/request.ts` — NOU (config next-intl)
- `middleware.ts` — locale detection + redirect
- `app/[locale]/layout.tsx` — NOU (wrapper cu locale)
- Toate paginile publice — refactorizare cu `useTranslations()`
- Toate paginile portal părinți — refactorizare cu `useTranslations()`
- `components/LanguageSwitcher.tsx` — NOU
- `app/layout.tsx` / `components/Navbar.tsx` — language switcher

---

### 2.2 Dashboard Analytics Avansat (Admin)

**Descriere:** Dashboard-ul curent arată doar contoare simple. Un dashboard profesional necesită: grafice de tendință (prezență pe luni), comparații între echipe, rata de retenție sportivi, grafice financiare (venituri lunare), KPIs cu trend arrows. Implementare cu Recharts (deja instalat).

**Efort estimat:** 16-24 ore

**Dependențe:** Niciuna (Recharts deja instalat)

**Impact:** HIGH — Insight-uri acționabile pentru management

**Fișiere de creat/modificat:**
- `app/admin/page.tsx` — redesign complet cu widgets
- `app/api/admin/dashboard/stats/route.ts` — NOU (endpoint agregat: attendance trend, revenue trend, retention, registrations)
- `components/admin/charts/AttendanceTrend.tsx` — NOU (line chart pe 12 luni)
- `components/admin/charts/RevenueSummary.tsx` — NOU (bar chart venituri)
- `components/admin/charts/RetentionRate.tsx` — NOU (gauge/percentage)
- `components/admin/charts/TeamComparison.tsx` — NOU (radar multi-team)
- `components/admin/widgets/KpiCard.tsx` — NOU (valoare + trend + arrow)

---

### 2.3 Calendar Interactiv cu Sincronizare

**Descriere:** Calendarul actual e o listă simplă de evenimente. Upgrade la: vizualizare lunară/săptămânală drag-and-drop, export iCal (.ics), sincronizare cu Google Calendar, filtrare per echipă, colour coding per tip eveniment. Integrare cu antrenamente și meciuri (evenimentele se generează automat din programul de antrenamente și din meciurile programate).

**Efort estimat:** 20-30 ore

**Dependențe:** Niciuna

**Impact:** MEDIUM — Organizare vizuală superioară

**Fișiere de creat/modificat:**
- `app/calendar/page.tsx` — redesign cu vizualizare lunară
- `app/calendar/CalendarClient.tsx` — NOU sau refactorizare
- `app/api/calendar/export/route.ts` — NOU (generare .ics)
- `app/api/calendar/sync/route.ts` — NOU (Google Calendar API)
- `lib/ical.ts` — NOU (iCal format generator)
- `components/calendar/MonthView.tsx` — NOU
- `components/calendar/WeekView.tsx` — NOU
- `components/calendar/EventCard.tsx` — NOU

---

### 2.4 Sistem de Mesagerie Internă (Chat)

**Descriere:** Comunicarea antrenor-părinte se face exclusiv prin email sau WhatsApp extern. Un sistem de mesagerie internă permite: conversații directe antrenor-părinte, anunțuri per echipă, atașamente (imagini, documente), notificări push la mesaj nou. Nu e necesar real-time (polling la 30s e suficient pt MVP).

**Efort estimat:** 30-40 ore

**Dependențe:** Push Notifications (1.2), Portal Părinți (existent)

**Impact:** HIGH — Centralizare comunicare, GDPR compliant (datele rămân pe platformă)

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — modele: `Conversation { id, type (direct/group), teamId?, createdAt }`, `ConversationParticipant { id, conversationId, parentId?, adminId?, lastReadAt }`, `Message { id, conversationId, senderId, senderType, content, attachmentUrl?, createdAt }`
- `app/api/messages/conversations/route.ts` — NOU (GET list, POST create)
- `app/api/messages/conversations/[id]/route.ts` — NOU (GET messages, POST send)
- `app/api/messages/unread/route.ts` — NOU (GET unread count)
- `app/parinti/mesaje/page.tsx` — NOU (inbox părinte)
- `app/parinti/mesaje/[conversationId]/page.tsx` — NOU (thread)
- `app/admin/mesaje/page.tsx` — NOU (admin inbox)
- `app/admin/mesaje/[conversationId]/page.tsx` — NOU (thread)
- `components/chat/MessageBubble.tsx` — NOU
- `components/chat/ConversationList.tsx` — NOU

---

### 2.5 Sistem de Prezență cu QR Code / NFC

**Descriere:** Prezența se completează manual de admin. Alternativă modernă: generare QR code unic per antrenament, părintele scanează la sosire (din portal), timestamp automat. Opțional: NFC tag la intrarea în sală. Include: auto-generare QR la ora antrenamentului, validare locație (opțional), raport instant post-antrenament.

**Efort estimat:** 16-24 ore

**Dependențe:** Portal Părinți (existent), PWA (1.1) pt scanner din app

**Impact:** MEDIUM — Automatizare prezență, reducere erori manuale

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — model `AttendanceSession { id, teamId, date, qrToken, expiresAt, createdAt }` + modify `Attendance` cu `checkinTime`
- `lib/qr.ts` — NOU (generare QR, validare token)
- `app/api/attendance/session/route.ts` — NOU (POST — create session cu QR)
- `app/api/attendance/checkin/route.ts` — NOU (POST — scan QR, record attendance)
- `app/admin/prezente/page.tsx` — buton "Generează QR" pe antrenament
- `app/parinti/checkin/page.tsx` — NOU (scanner QR din camera)
- `components/QRScanner.tsx` — NOU (camera-based QR reader)
- `components/QRDisplay.tsx` — NOU (QR code display pt admin)

---

### 2.6 Sistem de Competiții & Turnee

**Descriere:** Meciurile sunt individuale, fără legătură între ele. Lipsește conceptul de competiție/turneu cu clasament, grupe, faze eliminatorii. Implementare: model Competition cu faze, clasament automat (puncte, golaveraj), bracket view pt eliminatorii, istorie competiții.

**Efort estimat:** 24-32 ore

**Dependențe:** Meciuri (model existent)

**Impact:** MEDIUM — Organizare competiții structurată, atractiv pt părinți și sponsori

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — modele: `Competition { id, name, type (liga/turneu/cupa), season, startDate, endDate, description, active }`, `CompetitionTeam { id, competitionId, teamName, points, played, won, drawn, lost, goalsFor, goalsAgainst }`, extinde `Match` cu `competitionId`
- `app/api/admin/competitions/route.ts` — NOU (CRUD)
- `app/api/admin/competitions/[id]/route.ts` — NOU
- `app/api/admin/competitions/[id]/standings/route.ts` — NOU (recalculare clasament)
- `app/admin/competitii/page.tsx` — NOU (admin management)
- `app/competitii/page.tsx` — NOU (public listing)
- `app/competitii/[id]/page.tsx` — NOU (clasament, meciuri, bracket)
- `components/competition/StandingsTable.tsx` — NOU
- `components/competition/BracketView.tsx` — NOU

---

### 2.7 Profil Public Sportiv

**Descriere:** Sportivii nu au pagină publică. Cluburi internaționale oferă profiluri publice cu: poză, echipă, meciuri jucate, statistici agregate. Acces controlat: admin decide ce sportivi au profil public, părintele trebuie să consimtă (legat de acordul foto existent).

**Efort estimat:** 12-16 ore

**Dependențe:** Acord foto (existent), Evaluări + Prezențe (existente)

**Impact:** LOW — Nice-to-have, valoros pt recrutare și mândria familiei

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — extend `Child` cu `publicProfile Boolean @default(false)`, `publicBio String?`
- `app/sportivi/page.tsx` — NOU (listing sportivi cu profil public)
- `app/sportivi/[id]/page.tsx` — NOU (profil public cu stats agregate)
- `app/api/sportivi/public/route.ts` — NOU (GET — sportivi cu publicProfile=true)
- `app/admin/sportivi/[childId]/page.tsx` — toggle "Profil Public" + bio edit

---

### 2.8 Sistem de Cereri & Absențe

**Descriere:** Nu există formalizare pt: cerere de absență, cerere transfer, cerere echipament. Implementare: formulare tipizate, workflow approve/reject, notificări, istoric. Părintele trimite cererea din portal, admin-ul o procesează.

**Efort estimat:** 12-16 ore

**Dependențe:** Portal Părinți (existent), Push Notifications (1.2 — opțional)

**Impact:** MEDIUM — Formalizare procese administrative

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — model `Request { id, parentId, childId, type (absenta/transfer/echipament/alta), title, description, status (pending/approved/rejected), response, reviewedBy, createdAt, reviewedAt }`
- `app/api/parinti/requests/route.ts` — NOU (GET list, POST create)
- `app/api/admin/requests/route.ts` — NOU (GET all, PATCH approve/reject)
- `app/parinti/cereri/page.tsx` — NOU (lista cererilor mele)
- `app/parinti/cereri/nou/page.tsx` — NOU (formular cerere nouă)
- `app/admin/cereri/page.tsx` — NOU (admin queue)
- `app/admin/layout.tsx` — link sidebar

---

### 2.9 Email Templates & Customizare

**Descriere:** Email-urile trimise sunt plain text cu HTML minimal inline. Lipsesc template-uri profesionale cu branding (logo, culori, footer). Implementare: template system cu Handlebars/MJML, preview în admin, variabile dinamice ({numeSportiv}, {numeEchipa}, etc.), template-uri default pt fiecare tip de email.

**Efort estimat:** 12-16 ore

**Dependențe:** Niciuna

**Impact:** MEDIUM — Imagine profesională, comunicare consistentă

**Fișiere de creat/modificat:**
- `lib/email-templates/` — NOU (director)
- `lib/email-templates/base.html` — NOU (layout cu logo, culori, footer)
- `lib/email-templates/magic-link.html` — NOU
- `lib/email-templates/notification.html` — NOU
- `lib/email-templates/payment-receipt.html` — NOU
- `lib/email-templates/payment-reminder.html` — NOU
- `lib/email-templates/welcome.html` — NOU
- `lib/email.ts` — NOU (centralizare trimitere email + template rendering)
- `app/api/admin/settings/email-templates/route.ts` — NOU (preview + customize)

---

### 2.10 Role-Based Access Control (RBAC) Avansat

**Descriere:** Sistemul actual are doar 2 roluri: admin și editor. Lipsesc: antrenor (vede doar echipa lui), manager (financiar), secretar (înscrieri + documente). Implementare: model Permission, role-permission mapping, UI de management roluri, guard pe fiecare endpoint.

**Efort estimat:** 20-30 ore

**Dependențe:** Admin Users (existent)

**Impact:** HIGH — Delegare task-uri, securitate granulară

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — model `Role { id, name, permissions (JSON) }`, extend `User` cu `roleId` + `teamIds`
- `lib/permissions.ts` — NOU (definire permisiuni, check functions)
- `lib/auth.ts` — extinde getAuthUser() cu permisiuni
- `middleware.ts` — route-level permission check
- `app/admin/settings/roles/page.tsx` — NOU (manage roles + permissions matrix)
- Toate API-urile admin — verificare permisiune specifică în loc de `role === 'admin'`

---

## FAZA 3 — SCALE & PROFESIONALIZARE (Nivel internațional)

Funcționalități avansate care duc platforma la standarde internaționale de management sportiv.

---

### 3.1 API Publică (REST / GraphQL)

**Descriere:** Nu există API documentată pentru integrări externe. Cluburi mari au nevoie de: API pt aplicații mobile native, integrări cu federații, export date pt sponsori. Implementare: REST API versionată (/api/v1/), API key management, rate limiting, documentație Swagger/OpenAPI.

**Efort estimat:** 30-40 ore

**Dependențe:** RBAC (2.10) — pt API key permissions

**Impact:** MEDIUM — Extensibilitate, integrări externe

**Fișiere de creat/modificat:**
- `app/api/v1/` — NOU (director complet cu endpoints publice versionare)
- `prisma/schema.prisma` — model `ApiKey { id, name, key, permissions, rateLimitPerMinute, lastUsed, createdBy, active }`
- `lib/api-auth.ts` — NOU (validare API key)
- `lib/api-docs.ts` — NOU (OpenAPI spec generator)
- `app/admin/settings/api-keys/page.tsx` — NOU (manage API keys)
- `app/api/v1/docs/route.ts` — NOU (Swagger UI)

---

### 3.2 Aplicație Mobilă Nativă (React Native / Expo)

**Descriere:** PWA acoperă 80% din nevoi, dar o aplicație nativă oferă: push notifications mai fiabile, acces la camera (QR scan), biometrice, offline sync real. Implementare: Expo (React Native) cu shared API, refolosind design-ul existent. Minim: portal părinți complet + notificări.

**Efort estimat:** 80-120 ore (proiect separat)

**Dependențe:** API Publică (3.1), Push Notifications (1.2)

**Impact:** HIGH — Experiență premium, engagement crescut

**Fișiere de creat/modificat:**
- `mobile/` — NOU (proiect Expo separat)
- `mobile/app/` — screens (login, dashboard, child profile, messages, calendar)
- `mobile/lib/api.ts` — API client
- `mobile/lib/push.ts` — push notification handler
- Proiect complet separat — nu afectează codebase-ul web

---

### 3.3 Multi-Tenant (Platformă SaaS)

**Descriere:** Platforma deservește un singur club. Transformarea în SaaS permite: orice club sportiv de juniori poate folosi platforma, fiecare cu propriul domeniu custom, branding, date izolate. Implementare: tenant isolation (schema-per-tenant sau row-level), onboarding flow, billing per club, admin super-admin.

**Efort estimat:** 120-180 ore

**Dependențe:** PostgreSQL (1.3), RBAC (2.10), Subscripții (1.7)

**Impact:** HIGH — Model de business scalabil

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — `tenantId` pe toate modelele, model `Tenant { id, name, slug, domain, logo, colors, plan, active }`
- `middleware.ts` — tenant resolution din subdomain/domain
- `lib/tenant.ts` — NOU (tenant context, isolation helpers)
- `app/onboarding/` — NOU (flux înregistrare club nou)
- `app/super-admin/` — NOU (manage all tenants)
- Refactorizare majoră — toate query-urile Prisma filtrate by tenantId

---

### 3.4 Integrare cu Federații Sportive

**Descriere:** Cluburile raportează la federații (FRR — Federația Română de Rugby): liste sportivi legitimați, rezultate competiții, clasificări. Automatizarea acestor rapoarte elimină munca manuală. Implementare: export-uri în formatele cerute de federație, eventual API sync dacă federația oferă.

**Efort estimat:** 16-24 ore

**Dependențe:** Competiții (2.6)

**Impact:** MEDIUM — Reducere birocratică, conformitate

**Fișiere de creat/modificat:**
- `app/api/admin/export/federatie/route.ts` — NOU (export formate federație)
- `app/admin/federatie/page.tsx` — NOU (dashboard federație: sportivi legitimați, rapoarte)
- `lib/federation-formats.ts` — NOU (serializers pt formatele oficiale)

---

### 3.5 Video Analysis & Tactical Board

**Descriere:** Video highlights-urile actuale sunt simple link-uri YouTube. Un sistem avansat permite: adnotări pe video (marcaje moment, comentarii la timestamp), tactical board (desen formații pe teren), clipuri individuale per sportiv legate de evaluări. Integrare cu evaluări: antrenorul atașează clip-uri la evaluarea sportivului.

**Efort estimat:** 40-60 ore

**Dependențe:** Video Highlights (existent), Evaluări (existent)

**Impact:** LOW — Diferențiator premium pt cluburi de elită

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — modele: `VideoAnnotation { id, videoId, timestamp, text, author }`, `TacticalBoard { id, name, formation (JSON), notes, teamId }`, extend `Evaluation` cu `videoClipIds`
- `app/admin/video-analysis/page.tsx` — NOU (player cu timeline + annotations)
- `app/admin/tactical/page.tsx` — NOU (canvas drawing tool pe teren rugby)
- `components/video/AnnotatedPlayer.tsx` — NOU
- `components/tactical/FieldCanvas.tsx` — NOU (SVG/Canvas field)
- `components/tactical/FormationEditor.tsx` — NOU

---

### 3.6 Gamification & Rewards

**Descriere:** Motivarea sportivilor tineri prin: badges/medalii (prezență perfectă, goal scorer, most improved), leaderboard pe echipă, puncte per activitate, rewards reale (reduceri magazin). Vizibil în portalul părinți și opțional pe profilul public.

**Efort estimat:** 20-30 ore

**Dependențe:** Profil Public Sportiv (2.7 — opțional), Evaluări + Prezențe (existente)

**Impact:** MEDIUM — Engagement crescut, motivare sportivi juniori

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — modele: `Badge { id, name, icon, description, criteria (JSON), category }`, `AthleteBadge { id, childId, badgeId, earnedAt }`, `Points { id, childId, amount, reason, createdAt }`
- `lib/gamification.ts` — NOU (engine evaluare criterii, award badges automat)
- `app/api/gamification/badges/route.ts` — NOU
- `app/api/gamification/leaderboard/route.ts` — NOU
- `app/parinti/sportiv/[childId]/page.tsx` — secțiune badges
- `app/admin/gamification/page.tsx` — NOU (manage badges, rules)
- `components/gamification/BadgeDisplay.tsx` — NOU
- `components/gamification/Leaderboard.tsx` — NOU

---

### 3.7 Integrare Wearables & Fitness Tracking

**Descriere:** Integrare cu dispozitive de fitness (Garmin, Polar, Apple Health) pt: tracking activitate la antrenament (heart rate, distanță, sprint count), sleep quality, recovery score. Date agregate vizibile în profilul sportivului. Necesită consimțământ explicit (GDPR).

**Efort estimat:** 40-60 ore

**Dependențe:** Profil Fizic (existent), GDPR consent (existent)

**Impact:** LOW — Feature premium pt cluburi de performanță

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — modele: `FitnessDevice { id, childId, provider, accessToken, refreshToken, connected }`, `FitnessData { id, childId, date, heartRateAvg, heartRateMax, distance, sprintCount, calories, sleepHours, source }`
- `lib/fitness/` — NOU (director cu adaptoare per provider)
- `lib/fitness/garmin.ts` — NOU (Garmin API integration)
- `lib/fitness/polar.ts` — NOU (Polar API integration)
- `app/api/fitness/connect/route.ts` — NOU (OAuth flow pt device)
- `app/api/fitness/sync/route.ts` — NOU (pull data)
- `app/parinti/sportiv/[childId]/page.tsx` — tab Fitness cu grafice
- `app/admin/sportivi/[childId]/page.tsx` — tab Fitness

---

### 3.8 AI Coach Assistant

**Descriere:** Asistent AI care sugerează: programe de antrenament personalizate bazate pe evaluări, recomandări de nivel (avansare/retrogradare echipă), detectare patterns (sportiv cu scădere performanță), predicție risc abandon (frecvență prezență scăzută). Implementare: integrare cu un LLM (Claude API), context din datele existente.

**Efort estimat:** 30-40 ore

**Dependențe:** Evaluări + Prezențe + Profil Fizic (existente), API key LLM

**Impact:** MEDIUM — Diferențiator unic, insight-uri acționabile

**Fișiere de creat/modificat:**
- `lib/ai/` — NOU (director)
- `lib/ai/coach-assistant.ts` — NOU (prompt engineering, context building)
- `lib/ai/analysis.ts` — NOU (athlete performance analysis)
- `app/api/admin/ai/analyze/route.ts` — NOU (POST — analyze athlete/team)
- `app/api/admin/ai/suggest/route.ts` — NOU (GET — suggestions for team)
- `app/admin/ai-coach/page.tsx` — NOU (dashboard cu sugestii, alerte)
- `app/admin/sportivi/[childId]/page.tsx` — tab "AI Insights"
- `.env` — `ANTHROPIC_API_KEY`

---

### 3.9 Sistem de Scouting & Recrutare

**Descriere:** Platformă internă de scouting: evaluare prospecți, database cu jucători interesanți, note de scouting per meci vizionat, pipeline de recrutare (identificat → contactat → trial → înscris). Integrare cu formularul de înscrieri.

**Efort estimat:** 24-32 ore

**Dependențe:** Înscrieri (existent)

**Impact:** LOW — Relevant doar pt cluburi cu program de scouting activ

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — modele: `ScoutingReport { id, scoutId, eventName, eventDate, notes }`, `Prospect { id, name, birthYear, position, currentClub, notes, rating, status (identified/contacted/trial/enrolled/rejected), scoutingReportId }`
- `app/api/admin/scouting/route.ts` — NOU (CRUD reports)
- `app/api/admin/scouting/prospects/route.ts` — NOU (CRUD prospects)
- `app/admin/scouting/page.tsx` — NOU (pipeline view)
- `app/admin/scouting/raport/[id]/page.tsx` — NOU (scouting report detail)

---

### 3.10 White-Label & Branding Customization

**Descriere:** Platforma e hardcoded pe branding-ul Dinamo Rugby (culori, logo, texte). Pt a deveni SaaS, fiecare club trebuie să-și configureze: logo, culori primare/secundare, font, texte din hero/about, favicon, OG images. Implementare: theme system cu CSS variables, admin UI pt branding.

**Efort estimat:** 20-30 ore

**Dependențe:** Multi-Tenant (3.3) — pt SaaS, altfel standalone

**Impact:** MEDIUM — Prerequisite pt SaaS, profesionalism pt clubul curent

**Fișiere de creat/modificat:**
- `prisma/schema.prisma` — extend `SiteSettings` cu: `logo, primaryColor, secondaryColor, fontFamily, heroTitle, heroSubtitle, favicon, ogImage`
- `app/api/admin/settings/branding/route.ts` — NOU (GET/PUT)
- `app/admin/settings/branding/page.tsx` — NOU (live preview + color picker)
- `tailwind.config.ts` — CSS variables instead of hardcoded colors
- `app/layout.tsx` — inject CSS variables from DB
- `app/globals.css` — refactorizare cu `var(--color-primary)` etc.
- Toate componentele — replace `bg-dinamo-red` cu `bg-primary`

---

## Rezumat Efort

| Fază | Features | Efort Total Estimat |
|------|----------|-------------------|
| **FAZA 1 — Critice** | 9 features | 100-160 ore |
| **FAZA 2 — Diferențiatori** | 10 features | 190-280 ore |
| **FAZA 3 — Scale** | 10 features | 420-620 ore |
| **TOTAL** | **29 features** | **710-1060 ore** |

---

## Ordine Recomandată de Implementare

### Sprint 1 (Săptămâna 1-2)
1. ✅ 1.8 Backup Automatizat
2. ✅ 1.4 Google Analytics
3. ✅ 1.9 Logging & Monitoring

### Sprint 2 (Săptămâna 3-4)
4. ✅ 1.1 PWA
5. ✅ 1.2 Push Notifications

### Sprint 3 (Săptămâna 5-6)
6. ✅ 1.3 Migrare PostgreSQL
7. ✅ 1.5 Documente Părinți

### Sprint 4 (Săptămâna 7-8)
8. ✅ 1.6 Shop Checkout
9. ✅ 1.7 Subscripții Recurente

### Sprint 5-6 (Săptămâna 9-12)
10. ✅ 2.9 Email Templates
11. ✅ 2.10 RBAC Avansat
12. ✅ 2.2 Dashboard Analytics

### Sprint 7-8 (Săptămâna 13-16)
13. ✅ 2.1 Multi-Language
14. ✅ 2.3 Calendar Interactiv
15. ✅ 2.5 QR Code Prezență

### Sprint 9-10 (Săptămâna 17-20)
16. ✅ 2.4 Mesagerie Internă
17. ✅ 2.6 Competiții & Turnee
18. ✅ 2.8 Cereri & Absențe

### Sprint 11-12 (Săptămâna 21-24)
19. ✅ 2.7 Profil Public Sportiv
20. ✅ 3.6 Gamification
21. ✅ 3.10 White-Label

### Sprint 13+ (Săptămâna 25+)
22-29. Faza 3 restantă (API Publică, Mobile, Multi-Tenant, Federații, Video Analysis, Wearables, AI Coach, Scouting)

---

> **Notă:** Estimările sunt orientative și pot varia ±30% în funcție de complexitatea descoperită la implementare. Fiecare feature trebuie testată end-to-end înainte de deploy. Prioritizarea poate fi ajustată în funcție de feedback-ul utilizatorilor reali.
