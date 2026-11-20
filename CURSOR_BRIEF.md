# KaamSetu: brief for the coding agent (round 2)

Read this whole file before doing anything. It says what already exists and works, the rules for changing it, and the tasks left. You will be told which task to do in each session. Do ONLY that task, then stop and report.

## 1. The product
KaamSetu is a hyperlocal digital labour marketplace for India's daily wage workers (mason, electrician, plumber, carpenter, painter, construction labour, cleaner, repair technician). Customers find verified workers nearby, see a transparent price, book, track, chat, pay (demo UPI) and review. Workers get nearby job requests, earn, and build a trust score. Admins verify workers and watch analytics. Brand: "Kaam" + "सेतु" (bridge). Tagline: "Connecting Workers. Creating Opportunities." Demo city: Meerut (lng 77.7064, lat 28.9845). The original spec is `PROJECT_SPEC.md`. This brief wins where they differ.

## 2. What is DONE and tested by hand (do not redo, do not rewrite)
Monorepo (npm workspaces). Git branch: `worker-screens`. The user commits; you never do.
- `packages/shared`: types, constants (TRADES with base rates, MATCH_WEIGHTS, TRUST_WEIGHTS, CITY_CONFIG), trust, pricing, matching, booking state machine. 15 tests.
- `apps/api` (Express + TypeScript + Mongoose + Socket.io, port 4000, local MongoDB). 26 tests. All Stage 1 to 4 features: auth, workers, geo search, matching, pricing, bookings (direct and emergency), atomic accept, OTP-verified status changes, demo payments, reviews, chat, notifications, worker wallet. Simulated providers: dev OTP `123456`, mock KYC, Mock UPI.
- `apps/web` (Next.js 14.2 App Router, Tailwind 3.4, framer-motion, lucide-react, leaflet, socket.io-client, port 3000). The whole CUSTOMER journey works: landing, login/OTP/role, home with map, search, worker profile, booking, live tracking with chat, payment, review. Bilingual (English and Hindi), light and dark.
- Seed data (`npm run seed`): admin `+919999999999`, customers `+919000000001..015`, workers `+919100000001..060`, OTP always `123456`. The login screen takes the 10-digit number.

### API facts you must respect (read the route and service files for exact shapes; never guess)
Base `http://localhost:4000`, JSON, `Authorization: Bearer <accessToken>`. Errors are thrown as `AppError` (status, message, code).
- Worker: `GET /workers/me`; `PUT /workers/me` (bio, serviceRadiusKm 1 to 50, location {lng,lat}, skills [{trade, experienceYears 0 to 50, hourlyRate?, dailyRate?}], availabilitySchedule); `PUT /workers/me/availability {isAvailableNow}`; `POST /workers/me/verification {idType: aadhaar|voter_id|dl, idNumber, idDocUrl, selfieUrl}` (urls must be a valid URL, a data: URL also passes, or start with `/`; there is NO upload endpoint and the JSON body limit is 2 MB, so shrink images in the browser and send a data URL, and label it Demo mode); `GET /workers/:id/trust`; `GET /workers/:id`; `GET /workers/search`.
- Bookings: `GET /bookings/requests/open` (worker), `GET /bookings/mine`, `GET /bookings/:id`, `POST /bookings/:id/accept`, `POST /bookings/:id/decline`, `POST /bookings/:id/status {to, otp?, lng?, lat?, reason?}` (worker: on_the_way, then in_progress with the customer's start OTP, then completed with the completion OTP; send the job's lng and lat), `GET /wallet/me`, `GET /reviews/user/:userId`, `POST /reviews`, `/chat/:bookingId/messages` (GET and POST), `/notifications` (list, unread-count, read, read-all). Workers never see the OTPs, the customer reads them out. Read `apps/api/src/services/booking.ts` (publicBooking, transitions) and `apps/api/src/services/emergency.ts`.
- Socket.io on the same port. Client sends `booking:join(bookingId)`, `availability:update(boolean)`, `chat:send`. Server emits `job:request` (bookingId, trade, distanceKm, price, acceptDeadlineAt, countdownSeconds, isEmergency), `job:status`, `chat:message`, `notification:new`, `availability:update`.
- `scripts/worker-sim.ps1` plays the worker from the terminal. Leave it alone.

### Web code you should REUSE (all in `apps/web`, alias `@/` = `apps/web/`)
`lib/`: `api.ts` (`api<T>(path, {method?, body?, auth?})`, auto token refresh), `auth.tsx` (`useAuth()`), `i18n.tsx` (`useT()` gives `{t, lang, setLang}`), `socket.ts` (`getSocket`, `emitSocket`), `useSocketEvent.ts`, `format.ts` (`formatINR`, `formatDistance`, `timeAgo`, `formatDateTime`, `asPercent`, `initials`), `geo.ts`, `location.ts`, `useGeolocation.ts`, `trades.ts` (TRADES, TradeKey), `booking.ts` (Booking type, STATUS_FLOW), `errors.ts` (`errorMessage`).
`components/`: `Logo`, `ThemeToggle`, `LanguageSwitcher`, `BridgeArch`, `ui/` (`Skeleton`, `EmptyState`, `ErrorState`, `DemoBadge`, `StarRating`, `TrustRing`, `Money`), `map/MapView` (pins, pick pin, fit to pins), `app/` (`AppShell`, `RoleGuard`, `NotificationBell`), `booking/` (`StatusChip`, `StatusBridge`, `ChatPanel` and `ReviewForm` both work for a worker too).
The AppShell worker nav already points to `/worker`, `/worker/earnings`, `/worker/id`, `/worker/reviews`, and the bell to `/worker/notifications`; admin nav points to `/admin`, `/admin/verification`, `/admin/users`, `/admin/bookings`. `app/customer/layout.tsx` shows the pattern: `<RoleGuard role="..."><AppShell role="...">`.
Design tokens (Tailwind colours backed by CSS variables, with a `.dark` class): `bg surface surface2 ink muted line brand saffron flame mint coral`. Utility classes: `btn btn-primary btn-ghost card eyebrow container-x grain`. Fonts `font-ui font-display`. Radius `rounded-xl2 rounded-xl3`. Shadows `shadow-soft shadow-lift`.

## 3. Hard rules (these come from real mistakes, read them twice)
1. **Never rewrite an existing file wholesale.** Create new files. For existing files make small targeted edits (replace only the exact lines that must change). If an existing file needs more than about 30% change, make a new file and import it, and say so in your summary.
2. Do NOT edit: existing tests; `apps/api/src` (unless the task lists API work, then add tests and keep every existing test green); `packages/shared/src` (additive exports only); `apps/web/components/landing/*`, `components/auth/*`; `lib/api.ts` and `lib/auth.tsx` (additive helpers only); `tailwind.config.ts` and `globals.css` (append only).
3. No git commands except `git status` and `git diff`. No `npm audit fix`. No `npm run seed` unless told. **Do not start dev servers** (`npm run dev`): the user runs the API on 4000 and the web app on 3000.
4. Terminal is Windows PowerShell: one command per call, no bash-only syntax. Verify with commands that finish:
   `npm run build -w @kaamsetu/shared`, `npm test`, `npx tsc -p apps/web/tsconfig.json --noEmit`, **`npm run build -w @kaamsetu/web`** (this production build runs lint and the type check and is the one that must pass).
5. **Never write `// eslint-disable...` comments.** The react-hooks lint rules are not installed here and the build fails on unknown rule names.
6. Any page that calls `useSearchParams()` must be a server page wrapping a client component in `<Suspense>` (see `app/customer/book/page.tsx`). Pages under `app/**/[id]` use `useParams()`.
7. i18n: add strings in NEW dictionary files named by area (for example `locales/en.worker.ts` and `locales/hi.worker.ts`, exporting `enWorker` and `hiWorker`) and merge them with one small edit in `lib/i18n.tsx` (it already merges `en.search` and `hi.search` the same way). English must be complete; Hindi should cover every user-facing string. Use `t('key')`, never hard-code visible text in screens.
8. Use only the design tokens and utility classes above (SVG gradients may use the brand hexes). Both light and dark mode must look right.
9. Any new package must be named in your summary (allowed for the tasks below: `qrcode.react`). Keep every existing test green (41 today).
10. Be honest in the UI: anything simulated (payments, ID checks, OTP) shows `<DemoBadge />`. No fake live numbers.

## 4. Standards
TypeScript strict, no `any` unless unavoidable (comment why). `'use client'` only where needed. Mobile first (360 px), 48 px touch targets, sticky bottom nav on mobile (AppShell already does it). Every data screen has a skeleton, an empty state and an error state with retry. framer-motion respects `prefers-reduced-motion`. Labelled inputs, visible focus, AA contrast. Real data only: take shapes from the API, never invent fields.

## 5. Tasks (do only the one you are given)

### Task W1: worker core
Routes under `app/worker/` with `layout.tsx` (RoleGuard worker + AppShell worker).
- Onboarding wizard (full-screen steps shown on `/worker` while the profile has no skills or no location): pick trades with big icons, experience years and own hourly rate within the trade's min to max band from `TRADES` in shared constants, location on a map (GPS or draggable pin) and service radius, short bio. Saves with `PUT /workers/me`.
- `/worker` home: a big availability toggle (calls `PUT /workers/me/availability`; the server broadcasts to customers), incoming requests from `GET /bookings/requests/open` plus live `job:request` events, each with distance, price and a 45-second countdown from `acceptDeadlineAt` with Accept and Decline buttons, "today's earnings" from `GET /wallet/me`, and an active-job card when the worker has a booking in accepted, on_the_way or in_progress.
- `/worker/jobs/[id]`: job details (customer details only after accept; use what `publicBooking` returns), a status stepper with big buttons: "On my way", "Start job" (a 4-digit OTP entry, the customer reads it out), "Complete job" (completion OTP), always sending the job's lng and lat; map with the job location; `ChatPanel`; cancel not offered to workers unless the state machine allows it.
- `/worker/notifications` (copy the pattern of `app/customer/notifications/page.tsx` in a new file).
- Small edit in `app/dashboard/page.tsx`: workers go to `/worker` (customers already go to `/customer`).
Done when: build and tests pass, and the flow works with two browser profiles (customer books, worker accepts and completes).

### Task W2: worker extras
- `/worker/earnings`: balance, today, week, month, 7-day chart drawn as lightweight SVG, recent payouts, `DemoBadge` (from `GET /wallet/me`).
- `/worker/id`: digital ID card with a QR code (`qrcode.react`), digital ID, verification status badge, trust score ring and the trust breakdown (read `packages/shared/src/trust.ts` for the breakdown shape and show tips to improve), and the verification form (id type, id number, ID photo and selfie shrunk in the browser to under about 300 KB and sent as data URLs; show `DemoBadge`; show the server's returned message).
- `/worker/reviews` (reviews about me from `GET /reviews/user/:userId`, plus a way to rate a customer after a completed job using `ReviewForm`), `/worker/referral` (show the user's `referralCode`; if there is no referral API, say what is missing in the summary), `/worker/premium` (plans as a demo), and "Coming soon" cards (insurance, financing, skill certification, payroll) with a waitlist form. A `Waitlist` model exists; add `POST /waitlist` plus a test if no route exists.

### Task A1: admin API (with tests)
`GET /admin/analytics` (users, active workers, bookings per day, GMV, platform revenue, trade-wise demand, top workers, conversion funnel), fraud flags queue, disputes queue and resolve, users list, bookings list, trades base-rate management, ads management. Read `apps/api/src/routes/admin.ts` and `services/fraud.ts` first.

### Task A2: admin screens
`app/admin/*` with RoleGuard admin + AppShell admin: overview with charts (SVG or lightweight), worker verification queue with approve and reject, users, bookings, disputes, fraud flags, trades and rates, ads.

### Task R: remaining API features (each with tests)
PDF invoice route (use `utils/invoice.ts`) and a download button on the booking page, contractor bulk-hire (`BulkRequirement`) routes and screen, favourite workers, ad serving with impression and click tracking, referral endpoints and reward credit, premium and contractor subscriptions paid via the mock provider, Swagger UI at `/docs`. Also make `GET /workers/search` return each worker's `name` and `location` (the web currently makes about 8 extra requests), then remove that workaround from the web with a minimal edit.

### Task P: polish
PWA (manifest, icons, offline shell), voice input on search and registration (Web Speech API, Hindi and English, graceful fallback), dark mode and accessibility pass over every screen, `DemoBadge` wherever something is simulated, fix the TypeScript errors in the older API files (`npx tsc -p apps/api/tsconfig.json --noEmit`, edit minimally, all tests green), README with a mermaid architecture diagram, and a demo script for the hackathon.

## 6. How to finish every task
1. Run the four verification commands from rule 4 and fix what you broke. Do not hide errors.
2. In `CHECKLIST.md` change only the lines for what you built, and mark them "(code delivered)". Do NOT write `[x]`; the user ticks after testing by hand.
3. End with a short summary: files created, existing files edited and why (should be very few), packages added, commands run and their results, anything unfinished or any API gap you found. Then stop.

## 7. Demo flow the product must support
A judge logs in as a customer with OTP 123456, searches a plumber on the map, sees an explained match and price, books, and in another window the worker (logged in with OTP 123456) accepts in real time; they chat, finish with the two OTPs, the customer pays by demo UPI and reviews, and the worker's earnings and trust score update. An emergency booking is accepted first-come. The language switches to Hindi. The admin sees analytics and verifies a worker. Nothing crashes, nothing is a dead link.
