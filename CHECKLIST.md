# KaamSetu feature checklist

Ticked items are implemented in **Stages 1–3**. Unticked items belong to later stages.

## Stage 1 — scaffolding

- [x] Monorepo: `apps/web`, `apps/api`, `apps/mobile` (stub), `packages/shared`
- [x] Shared types, constants, trust / pricing / matching functions
- [x] Env files (`.env`, `.env.example` per app)
- [x] Docker + docker-compose
- [x] ESLint + Prettier
- [x] CI-ready GitHub Actions workflow
- [x] Health-check endpoint
- [x] Structured logging (pino)

## Stage 2 — API foundation

- [x] User model
- [x] WorkerProfile model (2dsphere)
- [x] CustomerProfile model
- [x] Trade catalogue model
- [x] Booking model
- [x] Review model
- [x] Message model
- [x] Notification model
- [x] Advertisement model
- [x] Report / Dispute model
- [x] Subscription / PremiumPlan model
- [x] Phone + OTP auth (`OtpProvider`: dev / MSG91 / Firebase slots)
- [x] Dev OTP always `123456`, logged to console
- [x] JWT access + refresh with rotation
- [x] OTP attempt limits + rate limiting + helmet + CORS + zod
- [x] Role selection on first login (admin seed-only)
- [x] Trades catalogue endpoint
- [x] Seed: 1 admin, 15 customers, 60 workers, 150 bookings, reviews

## Stage 3 — worker, geo, match, price, trust

- [x] Worker profile get/update (skills, bio, location, radius, schedule)
- [x] Availability toggle
- [x] Digital worker ID (`KS-XXXXXX`)
- [x] Verification upload + masked ID storage
- [x] `KycProvider` mock + admin approve/reject
- [x] Trust score recompute after verification / reviews
- [x] Trust score breakdown endpoint
- [x] Geo search (`$geoNear`) + filters (rating, verified, available, price, distance)
- [x] `MatchingService` weighted score + top 3 “why this match” reasons
- [x] Keyword free-text → trade mapper (`/ai/interpret`)
- [x] Pricing estimate with worker pay, platform fee, urgency, min–max
- [x] Unit tests: trust, pricing, matching
- [x] API tests: auth, trades, worker profile, geo/match, pricing (mongodb-memory-server)

## Customer features (later stages unless noted)

- [x] Nearby worker search (API only; UI Stage 5–6)
- [ ] Instant booking
- [x] Worker profiles (API)
- [ ] Ratings & reviews flow after completion
- [x] Estimated pricing (API)
- [ ] Live availability via Socket.io
- [ ] Emergency hiring broadcast
- [ ] Job tracking, ETA, chat, start/finish OTP
- [ ] Secure payment / mock UPI checkout
- [ ] Booking history, favourites, PDF invoices
- [ ] Contractor bulk-hire + subscription screens

## Worker features

- [x] Easy registration (phone + OTP, API)
- [x] Skill categories (API)
- [x] Digital identity code generated (QR card UI later)
- [x] Verification submit + badges (API)
- [ ] Job notifications + accept/decline countdown
- [x] Availability toggle (API)
- [ ] Earnings dashboard
- [x] Ratings-based trust breakdown (API)
- [ ] Multi-language UI switcher
- [ ] Premium profile purchase
- [ ] Referral program UI (codes exist on user)

## Platform features

- [x] AI-based matching as weighted algorithm + interface
- [x] GPS discovery with `$geoNear`
- [x] Secure authentication stack
- [ ] Fraud prevention engine + admin queue
- [ ] Admin analytics dashboard
- [x] Dockerised / env-based / health-check (cloud deploy configs later)
- [x] Admin verification queue (full admin panel later)
- [ ] Advertisements serving + impression tracking
- [x] Commission engine (8% in pricing)

## Screens (web Stage 5–6, mobile Stage 8)

- [ ] Landing, login/OTP, role selection UI
- [ ] Customer home / search / profile / tracking / payment
- [ ] Worker onboarding / home / ID card / earnings
- [ ] Admin analytics and queues UI

## Deferred simulations (interfaces only unless noted)

- [x] Mock KYC (`KycProvider`)
- [x] Mock OTP provider
- [x] Mock UPI / Razorpay provider stubs (no booking payments yet)
- [x] In-app notification provider stub
- [ ] Socket.io live events
- [ ] Swagger at `/docs`
- [ ] PWA, voice input, dark mode polish
- [ ] Expo mobile app
- [ ] Coming-soon Phase 3 cards / waitlist UI
