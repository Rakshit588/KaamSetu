# KaamSetu feature checklist

Status: **Stages 1 to 4 (API) are done and tested** (41 automated tests: 15 shared + 26 API). Stage 5 (web) has started.
Items marked "code delivered" are written but not yet confirmed by running them.

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

## Stage 5 — web foundation (in progress)

- [x] Design system: tokens, light + dark, fonts, buttons, cards
- [x] Landing page: hero, stats, how it works, trades, trust, stories, FAQ, CTA
- [x] Login (OTP) and role selection
- [x] API client + auth state: token refresh, session restore
- [ ] i18n scaffold: English + Hindi dictionaries, language switcher (code delivered; screens will use it as they are built)
- [ ] Shared UI: skeleton, empty / error states, demo badge, stars, trust ring, map (Leaflet), socket client (code delivered)

## Stage 6 — web screens

- [ ] Customer: app shell with role guard and bottom nav, home with map + trade chips + emergency entry, notifications page (code delivered)
- [ ] Customer: search results, worker profile, booking confirm, live tracking + chat, payment, review, history
- [ ] Customer: emergency "need a worker now" flow
- [ ] Customer: contractor bulk-hire + subscription screens
- [ ] Worker: onboarding wizard, home (availability toggle, incoming requests with countdown), active job, earnings, ID card with QR, reputation, referral, premium
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
