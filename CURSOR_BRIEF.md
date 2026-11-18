# KaamSetu: brief for the coding agent

Read this whole file before doing anything. It describes what already exists, the rules for changing it, and the numbered tasks left. You will be told which task(s) to do in each session. Do ONLY those tasks, then stop.

## 1. What KaamSetu is
A hyperlocal digital labour marketplace for India's daily wage workers (mason, electrician, plumber, carpenter, painter, construction labour, cleaner, repair technician). Customers find verified workers nearby, see a transparent price, book, track, pay (demo UPI) and review. Workers get nearby job requests, earn, and build a trust score. Admins verify workers and watch analytics.
Tagline: "Connecting Workers. Creating Opportunities." Brand name written "Kaam" + "सेतु". Demo city: Meerut, Uttar Pradesh (lng 77.7064, lat 28.9845).
The full original spec is in `PROJECT_SPEC.md`. If this brief and the spec disagree, this brief wins (it reflects what is built).

## 2. Repo state (all of this is DONE, tested and committed. Do not redo it)
Monorepo (npm workspaces) at the repo root. Git branch for new work: `stage5-web` (`master` holds Stages 1-4).
- `packages/shared`: types, constants, trust score, pricing, matching, booking state machine. 15 unit tests pass.
- `apps/api`: Node + Express + TypeScript + Mongoose + Socket.io. 26 tests pass (vitest + supertest + mongodb-memory-server). Runs with `tsx` on port 4000. Local MongoDB at `mongodb://127.0.0.1:27017/kaamsetu`.
- `apps/web`: Next.js 14.2 (App Router), Tailwind 3.4, framer-motion 11, lucide-react 0.460. Port 3000. tsconfig alias `@/*` maps to `apps/web/*`.
- `apps/mobile`: stub only. Out of scope.

### API (base `http://localhost:4000`, no `/api` prefix, JSON, `Authorization: Bearer <accessToken>`)
Read the actual route files in `apps/api/src/routes/*.ts` and the services in `apps/api/src/services/*.ts` for exact request and response shapes. DO NOT guess a path, field name or response shape: open the file.
- `/health`
- `/auth`: `POST /otp/request {phone}`, `POST /otp/verify {phone, otp}` returns `{accessToken, refreshToken, user, needsRole}`, `POST /refresh`, `POST /logout`, `GET /me`, `POST /role {role: customer|worker, name?, language?}` returns `{user, accessToken}`.
- `/trades`, `/workers` (profile, availability, verification, geo search, trust breakdown), `/customers` (`GET/PUT /me`), `/pricing` (estimate), `/ai` (`interpret`: free text to trade and urgency), `/admin` (verification queue so far).
- `/bookings`: `POST /` (direct), `POST /emergency`, `GET /mine`, `GET /requests/open` (worker), `GET /:id`, `POST /:id/accept`, `POST /:id/decline`, `POST /:id/status {to, otp?, lng?, lat?, reason?}`, `POST /:id/pay`, `POST /:id/release`.
- `/reviews`: `POST /`, `GET /user/:userId`. `/chat/:bookingId/messages`: `GET`, `POST`. `/notifications`: `GET /`, `GET /unread-count`, `POST /read-all`, `POST /:id/read`. `/wallet/me` (worker earnings).
- Socket.io on the same port. Connect with `auth: { token: <accessToken> }`. Client emits `booking:join(bookingId)`, `availability:update(boolean)`, `chat:send({bookingId, text})`. Server emits `job:request`, `job:status`, `chat:message`, `notification:new`, `availability:update`.
- Booking flow: customer creates (gets `startOtp` and `completionOtp`, shown only to the customer), worker accepts, worker sets `on_the_way`, then `in_progress` with the customer's start OTP, then `completed` with the completion OTP, customer `pay` then `release`. Emergency: broadcast to nearby available workers, 45 s accept window, radius grows 2, 5, 10 km, 3-minute timeout, first accept wins.
- Demo data: run `npm run seed` (wipes and reseeds). OTP is always `123456`. Admin `+919999999999`, customers `+919000000001` to `015`, workers `+919100000001` to `060`. Typing the 10-digit number in the login screen is enough.
- Providers are simulated and must be labelled "Demo mode" in the UI: Mock UPI payments, mock KYC, dev OTP.

### Web (already built)
- `app/layout.tsx` (fonts, theme script, `<Providers>`), `app/providers.tsx`, `app/globals.css`, `app/page.tsx` (landing), `app/login/page.tsx`, `app/dashboard/page.tsx` (temporary account-check page that Task 2 and Task 4 will replace by redirecting each role to its home).
- `lib/api.ts` (`api<T>(path, {method?, body?, auth?})`, `ApiError`, `tokens`, automatic refresh on 401), `lib/auth.tsx` (`AuthProvider`, `useAuth()` returns `{user, status, signIn, setSession, signOut}`), `lib/types.ts`.
- `components/`: `Logo`, `ThemeToggle`, `BridgeArch`, `landing/*`, `auth/LoginFlow`, `auth/OtpInput`.
- Design tokens (Tailwind colours, all CSS variables with a `.dark` class): `bg`, `surface`, `surface2`, `ink`, `muted`, `line`, `brand`, `saffron`, `flame`, `mint`, `coral`. Utility classes: `btn`, `btn-primary`, `btn-ghost`, `card`, `eyebrow`, `container-x`, `grain`. Fonts: `font-ui`, `font-display`. Radius: `rounded-xl2`, `rounded-xl3`. Shadows: `shadow-soft`, `shadow-lift`. Palette: Midnight Indigo, Saffron to Sunset Orange gradient for actions, Warm Cream, Teal Mint for success and availability, Soft Coral for alerts and emergency.

## 3. Hard rules (read twice)
1. **Never rewrite an existing file wholesale.** Prefer creating new files. For existing files, make small targeted edits (search and replace of the exact lines that must change). If an existing file would need more than about 30% change, create a new file instead and import it, and say so in your summary.
2. Files you may NOT edit unless the task explicitly says so: everything under `apps/api/src` except where a task lists API work, all existing tests, `packages/shared/src` (only additive exports allowed), `apps/web/components/landing/*`, `apps/web/components/auth/*`, `apps/web/lib/api.ts` and `apps/web/lib/auth.tsx` (additive helpers only), `tailwind.config.ts` and `globals.css` (additive only: append new tokens or classes, never change existing ones).
3. Do not run git commands other than `git status` and `git diff`. The user commits. Do not run `npm audit fix`. Do not run `npm run seed` unless the task says so.
4. **Do not start long-running dev servers** (`npm run dev`). The user already runs the API on port 4000 and the web app on port 3000. Verify with commands that finish: `npm run build -w @kaamsetu/shared`, `npm test`, `npx tsc -p apps/web/tsconfig.json --noEmit`, and `npm run build -w @kaamsetu/web`.
5. The terminal is Windows PowerShell. Use PowerShell-compatible commands. No bash-only syntax. Run commands one per call.
6. Install a package only if the task lists it or you cannot do the job without it. Name every new package in your summary.
7. Before using an API endpoint, open the route and service file and match the real request and response shapes. If something you need is missing from the API, say so in the summary. Add API code only if the task says so, and then add tests for it and keep all 41 existing tests green.
8. Keep all 41 existing tests passing (`npm test`). Never delete or weaken a test.
9. Be honest in the UI: anything simulated shows a small "Demo mode" badge. No fake live numbers, no invented testimonials presented as real.

## 4. Code and design standards
- TypeScript strict. No `any` unless unavoidable (comment why). Functional components. `'use client'` only where hooks or browser APIs are needed.
- Use only the design tokens and utility classes above. No hard-coded hex colours in components (SVG gradients may use the brand hexes). Light and dark mode must both look right.
- Mobile first: design for 360 px width, then scale up. Minimum touch target 48 px. Sticky bottom navigation on mobile for signed-in screens. Large rounded cards, bento layouts, soft shadows, glass panels over maps.
- Icon-first UI with short labels (many users read little). Hindi-friendly typography.
- Every data screen has a loading skeleton, an empty state and an error state with a retry button.
- Animations with framer-motion, and they must respect `prefers-reduced-motion`.
- Accessibility: labelled inputs, keyboard navigable, visible focus, AA contrast.
- Leaflet maps: use `react-leaflet@4` with `next/dynamic` and `ssr: false`, OpenStreetMap tiles, custom `L.divIcon` pins (no default marker images). Put maps behind a `MapView` component so another provider can be swapped in later.
- Keep user-facing strings in the i18n dictionaries (Task 1) once they exist.

## 5. Tasks (do only the ones you are told to)

### Task 1: web foundations
New files only (plus tiny additive edits). Packages: `leaflet`, `react-leaflet@4`, `@types/leaflet`, `socket.io-client`.
- `lib/i18n.tsx`: `LanguageProvider`, `useT()`, dictionaries `locales/en.ts` (complete) and `locales/hi.ts` (core flows), persisted in localStorage, plus `components/LanguageSwitcher.tsx`. Add `LanguageProvider` inside `app/providers.tsx` (small edit).
- `lib/socket.ts`: singleton Socket.io client using the access token, reconnecting after a token refresh, with a `useSocketEvent(event, handler)` hook.
- `components/ui/`: `Skeleton`, `EmptyState`, `ErrorState`, `DemoBadge`, `StarRating`, `TrustRing`, `Money` (formats rupees).
- `components/map/MapView.tsx` (+ `MapPin` helpers): shows pins, a "you are here" marker, optional draggable pin, fit-to-bounds.
- `components/app/AppShell.tsx`: signed-in layout with header (logo, language, theme, notification bell with unread count that updates on `notification:new`) and role-aware bottom navigation. `components/app/RoleGuard.tsx`: redirects guests to `/login?next=...` and wrong roles to their own home.
- Replace the body of `app/dashboard/page.tsx` with a redirect by role: customer to `/customer`, worker to `/worker`, admin to `/admin`. Until those exist, keep the current account-check content as the fallback.
Done when: type check and web build pass, and `/dashboard` still works.

### Task 2: customer search and discovery
Routes under `app/customer/`.
- `/customer` home: map-first with the user's location (GPS, draggable pin, or saved address), 8 trade chips from `GET /trades`, a "describe your problem" box using `POST /ai/interpret`, and a prominent "Need a worker NOW" emergency button.
- `/customer/search`: nearby workers for a trade with list and map toggle; filters for rating, price, verified only, available now, distance; each card shows match score and the top 3 "why this match" reasons, trust ring, rating, price range, and a pulsing "Available now" dot kept live by the `availability:update` event.
- `/customer/workers/[id]`: profile with photo or initials, digital ID badge, skills, experience, trust breakdown, reviews (`GET /reviews/user/:id`), rate card, and a price estimate with the fee broken out.
Read `routes/workers.ts`, `routes/pricing.ts`, `routes/ai.ts` for exact shapes.

### Task 3: customer booking and tracking
- `/customer/book`: confirm with price breakdown (worker pay, platform fee, urgency surcharge, total), "Now" or schedule, then `POST /bookings`.
- `/customer/bookings/[id]`: live status timeline (bridge-style progress), start and completion OTP shown large to the customer, worker ETA and position on the map, in-app chat (socket with the HTTP fallback), cancel, pay (with `DemoBadge`) then release, then a review prompt (stars, tags, comment).
- `/customer/emergency`: the emergency flow with a live countdown, "workers notified" count, radius widening, worker-on-the-way state, and the 3-minute timeout offering to schedule instead.
- `/customer/bookings` (history, re-book), `/customer/notifications`.

### Task 4: worker core
Routes under `app/worker/`. Role-guarded, mobile first.
- Onboarding wizard (shown while the profile has no skills or location): icon-based skill picker, experience and own rate within the trade's allowed band, location and service radius.
- `/worker` home: a big availability toggle (also emits `availability:update`), incoming requests from `GET /bookings/requests/open` plus `job:request` events with a 45 s countdown and Accept or Decline, today's earnings, active job card.
- `/worker/jobs/[id]`: status buttons (on the way, start with the customer's OTP, complete with the completion OTP), chat, customer details only after accepting.

### Task 5: worker extras
- `/worker/earnings` (from `GET /wallet/me`: balance, today, week, month, 7-day chart drawn as lightweight SVG, recent payouts, `DemoBadge`).
- `/worker/id`: digital ID card with QR code (package `qrcode.react`), verification status and an ID upload form, trust score with the breakdown and improvement tips.
- `/worker/reviews`, `/worker/referral` (read the referral code from the user; if the API has no referral endpoint, show the code and list what is missing), `/worker/premium` (plans shown in demo mode if no API exists), and "Coming soon" cards for Phase 3 items (insurance, financing, certification, payroll) with a waitlist form. A `Waitlist` model exists, so add `POST /waitlist` and a test if no route exists yet.

### Task 6: admin
API first (with tests): `GET /admin/analytics` (users, active workers, bookings per day, GMV, platform revenue, trade-wise demand, top workers, conversion funnel), fraud flags queue, disputes queue, users list, bookings list, trades base-rate management, ads management. Then `app/admin/*` screens with charts drawn as SVG or `recharts`, and the worker verification queue with approve and reject.

### Task 7: remaining API features (each with tests)
PDF invoice route (use `utils/invoice.ts`), contractor bulk-hire (`BulkRequirement`) routes and UI, favourite workers, ad serving with impression and click tracking, referral endpoints and reward credit, premium and contractor subscriptions paid through the mock provider, Swagger UI at `/docs`.

### Task 8: polish
PWA (manifest, icons, offline shell), voice input on search and registration (Web Speech API, Hindi and English, graceful fallback), dark mode QA of every screen, accessibility and performance pass, `DemoBadge` everywhere something is simulated, fix the existing TypeScript errors in the old API files (run `npx tsc -p apps/api/tsconfig.json --noEmit`; edit minimally; all tests must stay green), README with architecture diagram (mermaid) and a demo script.

## 6. How to finish every task
1. Run `npm run build -w @kaamsetu/shared`, `npm test`, `npx tsc -p apps/web/tsconfig.json --noEmit` and `npm run build -w @kaamsetu/web`. Fix what you broke. Do not hide errors.
2. Tick only the items you verified in `CHECKLIST.md` (small edits to those lines, nothing else).
3. End with a short summary: files created, existing files edited and why (should be very few), packages added, commands run with their results, anything unfinished or any API gap you found. Then stop and wait.

## 7. Demo flow the whole product must support (Definition of Done)
A judge opens the landing page, logs in as a customer with OTP 123456, searches a plumber nearby on the map, sees an explained match score and price breakdown, books, watches a worker accept in another browser window in real time, chats, completes the job with the two OTPs, pays via demo UPI, leaves a review, and sees the worker's trust score and earnings update. They trigger an emergency booking, switch the language to Hindi, and open the admin dashboard to see analytics. Nothing crashes and nothing is a dead link.
