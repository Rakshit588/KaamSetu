# KaamSetu feature checklist

Status: **API (Stages 1 to 4) is done and tested** (41 automated tests: 15 shared + 26 API). **Web: the customer journey works end to end** (login, home, search, worker profile, booking, live tracking, chat, demo payment, review), tested by hand. Worker screens, admin and polish are next.

- `[x]` = built and tested. `[ ]` = not done. "code delivered" = written but not yet tested by hand.

## Stage 1 — scaffolding

- [x] Monorepo: `apps/web`, `apps/api`, `apps/mobile` (stub), `packages/shared`
- [x] Shared types, constants, trust / pricing / matching / booking functions
- [x] Env files (`.env`, `.env.example` per app)
- [x] Docker + docker-compose
- [x] ESLint + Prettier
- [x] CI-ready GitHub Actions workflow
- [x] Health-check endpoint
- [x] Structured logging (pino)

## Stage 2 — API foundation

- [x] User, WorkerProfile (2dsphere), CustomerProfile, Trade, Booking, Review, Message, Notification, Advertisement, Report, SubscriptionPlan models
- [x] BulkRequirement and WalletTransaction models
- [x] Phone + OTP auth (`OtpProvider`: dev / MSG91 / Firebase slots)
- [x] Dev OTP always `123456`, logged to console
- [x] JWT access + refresh with rotation (unique `jti`, old token cannot be reused)
- [x] OTP attempt limits + rate limiting + helmet + CORS + zod
- [x] Role selection on first login (admin seed-only)
- [x] Trades catalogue endpoint
- [x] Seed: 1 admin, 15 customers, 60 workers, 150 bookings, reviews

## Stage 3 — worker, geo, match, price, trust

- [x] Worker profile get/update, availability toggle, digital worker ID (`KS-XXXXXX`)
- [x] Verification upload + masked ID storage, `KycProvider` mock, admin approve/reject
- [x] Trust score recompute + breakdown endpoint
- [x] Geo search (`$geoNear`) with filters (rating, verified, available, price, distance)
- [x] `MatchingService` weighted score + top 3 "why this match" reasons
- [x] Free-text to trade mapper (`/ai/interpret`), English + Hindi keywords
- [x] Pricing estimate with worker pay, platform fee, urgency, min to max
- [x] Unit tests: trust, pricing, matching, booking state machine
- [x] API tests: auth, trades, worker profile, geo/match, pricing

## Stage 4 — bookings, realtime, payments (API)

- [x] Booking state machine (shared) with tests
- [x] Direct booking + emergency booking (`/bookings`, `/bookings/emergency`)
- [x] Atomic accept (only one worker wins), decline, open-requests list for workers
- [x] Status changes with start / completion OTP and GPS check; party check on every change
- [x] Emergency broadcast with expanding radius (2, 5, 10 km) and 3-minute fallback
- [x] Socket.io server wired in `index.ts` (availability, job requests, status, chat)
- [x] Mock UPI pay + release, worker wallet payout (Razorpay test slot, demo mode)
- [x] Reviews both ways, rating average, trust score recompute (`/reviews`)
- [x] Chat history + HTTP send (`/chat`)
- [x] Notifications list, unread count, mark read (`/notifications`)
- [x] Worker earnings dashboard endpoint (`/wallet/me`)
- [x] Fraud rules service wired into bookings and chat
- [x] Integration tests: full booking flow, emergency race, reviews, chat, notifications, wallet
- [ ] Admin fraud queue endpoint
- [ ] PDF invoice download route (`utils/invoice.ts` exists)
- [ ] Contractor bulk-hire routes (`BulkRequirement` model exists)
- [ ] Favourite workers
- [ ] Advertisements serving + impression / click tracking
- [ ] Referral program endpoints
- [ ] Premium / subscription purchase via mock payment
- [ ] Admin analytics endpoints
- [ ] Swagger at `/docs`
- [ ] Test the `jobsAccepted` / `jobsCancelled` counters

## Stage 5 — web foundation

- [x] Design system: tokens, light + dark, fonts, buttons, cards
- [x] Landing page: hero, stats, how it works, trades, trust, stories, FAQ, CTA
- [x] Login (OTP) and role selection
- [x] API client + auth state: token refresh, session restore
- [x] i18n scaffold: English + Hindi dictionaries, language switcher (every customer screen uses it)
- [x] Shared UI: skeleton, empty / error states, demo badge, stars, trust ring, map (Leaflet), socket client

## Stage 6 — web screens

- [x] Customer: app shell with role guard and bottom nav, home with map, GPS, draggable pin, trade chips, emergency entry
- [ ] Customer: notifications page (code delivered, not yet tested by hand)
- [x] Customer: search with trade chips, "describe the problem" box, filters, sort, list and map views, live availability, match reasons, price estimate
- [x] Customer: worker profile page with trust breakdown, reviews, map
- [x] Customer: booking confirm with live price estimate
- [x] Customer: booking tracking: status bridge, OTPs, live chat, pay + release (demo), review, timeline
- [ ] Customer: cancel and "report a problem" buttons (code delivered, not yet tested by hand)
- [ ] Customer: booking history with active / past tabs and book again (code delivered, not yet tested by hand)
- [ ] Customer: emergency booking flow with countdown and timeout state (code delivered, not yet tested by hand)
- [ ] Customer: contractor bulk-hire + subscription screens
- [ ] Worker: onboarding wizard with trades, rates inside the allowed band, location pin, radius, bio (code delivered)
- [ ] Worker: home with availability toggle (broadcast live), incoming requests with 45 s countdown, accept and decline, today's earnings, active job card (code delivered)
- [ ] Worker: job page with on the way, start and complete with OTPs, map, chat, rate the customer, cancel (code delivered)
- [ ] Worker: notifications page (code delivered)
- [ ] Worker: earnings page, ID card with QR and verification form, reputation, reviews, referral, premium (not built yet)
- [ ] Admin: analytics, verification queue, users, bookings, disputes, fraud flags, trades, ads

## Stage 7 — polish

- [ ] PWA (installable, offline shell)
- [ ] Voice input (Hindi / English)
- [ ] Accessibility + performance pass
- [ ] Coming-soon Phase 3 cards + waitlist form

## Stage 8 — mobile (optional)

- [ ] Expo app (worker first)

## Stage 9 — final

- [ ] README, demo script, deployment configs, screenshots

## Simulations (clearly labelled "Demo mode")

- [x] Mock KYC, mock OTP, Mock UPI / Razorpay test provider, in-app notification provider
- [ ] "Demo mode" badges in the UI wherever a simulation is active

## Known issues (fix before a production build)

- `npx tsc -p apps/api/tsconfig.json --noEmit` reports about 28 type errors in older files (null checks on `location` / `verification`, Mongoose array types in `auth.ts` and `booking.ts`, `providers/notification.ts` passes 4 arguments to a 3-argument function). Tests and `tsx` run fine; `tsc` builds will not until these are fixed.
- `availability:update` socket event is broadcast to every connected client.
- Short keywords such as "ac" in the free-text trade mapper can match inside other words.
- `GET /workers/search` returns no worker name or location, so the search screen fetches each worker's profile (about 8 extra requests). Add `name` and `location` to the search response to remove them.
- The worker side has no screens yet. `scripts/worker-sim.ps1` plays the worker (accept, on the way, start, complete, chat) from the terminal for testing.
- Dev only: the API rate limits are loosened outside production. On Windows, `esbuild` sometimes loses its platform binary after `npm install`; reinstall it with `npm install --no-save @esbuild/win32-x64@<same version as esbuild>`.
- Review tags in the UI are limited to punctual, skilled and polite until the full tag list is confirmed.

## Next up

1. Test the remaining customer screens by hand: notifications, history, emergency, cancel.
2. Worker screens: onboarding wizard, home with availability toggle and incoming requests, active job, earnings, ID card, reputation (see the Stage 6 worker line above).
3. Admin API endpoints and screens.
4. Remaining API features: PDF invoice, bulk hire, favourites, ads, referrals, subscriptions, Swagger.
5. Polish: PWA, voice input, dark mode and accessibility pass, README and demo script.
