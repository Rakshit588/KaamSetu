# KaamSetu — Development Checklist

> Updated against the repository's recent commits, current `CHECKLIST.md`, project specifications, and the web build output shared in chat. This is a progress tracker, not a claim that every feature was independently re-tested in this session.

**Legend**
- [x] Implemented and verified (per repository notes or user-shared test/build evidence)
- [ ] Remaining, or implementation exists but still needs hands-on verification

---

## Stage 1 — Repository & project foundation

- [x] Monorepo structure (`apps/web`, `apps/api`, `apps/mobile` stub, `packages/shared`)
- [x] npm workspaces
- [x] Shared types, constants and core logic package
- [x] Environment configuration and example files
- [x] Docker / docker-compose setup
- [x] ESLint and Prettier configuration
- [x] CI workflow
- [x] API health endpoint
- [x] Structured API logging

## Stage 2 — API foundation

- [x] Core Mongoose models (users, worker/customer profiles, trades, bookings, reviews, messages, notifications, ads, reports, subscription plans)
- [x] Bulk-hire requirement and wallet transaction models
- [x] Phone-number + OTP authentication
- [x] Development OTP flow
- [x] JWT access/refresh token flow and refresh rotation
- [x] OTP attempt limits and rate limiting
- [x] Security middleware (Helmet, CORS, Zod validation)
- [x] Role selection for first-time users
- [x] Trades catalogue
- [x] Demo seed data

## Stage 3 — Worker profiles, location, matching and pricing

- [x] Worker profile read/update
- [x] Worker availability toggle
- [x] Digital worker ID generation
- [x] Verification upload flow and mock KYC provider
- [x] Admin approve/reject verification API
- [x] Trust-score calculation and breakdown
- [x] Geospatial worker search
- [x] Search filters (rating, verification, availability, price, distance)
- [x] Weighted matching and match-reason output
- [x] Free-text trade interpretation (English/Hindi keyword logic)
- [x] Pricing estimate, worker pay, platform fee, urgency and price range
- [x] Shared unit tests (trust, pricing, matching, booking state machine)
- [x] API tests for auth, trades, worker profile, search/matching and pricing

## Stage 4 — Booking, realtime, payments and communication (API)

- [x] Booking state machine
- [x] Direct booking endpoint
- [x] Emergency booking endpoint
- [x] Atomic worker acceptance
- [x] Decline and worker open-request flow
- [x] Booking status progression
- [x] Start and completion OTP checks
- [x] GPS/location checks for relevant status transitions
- [x] Socket.io integration for booking/status/chat/availability events
- [x] Emergency broadcast radius logic and fallback
- [x] Mock UPI payment and payment release
- [x] Worker wallet / earnings API
- [x] Reviews and trust-score recomputation
- [x] Chat history and HTTP message send
- [x] Notifications API (list, unread count, mark read)
- [x] Fraud rules integrated with booking/chat flows
- [x] Integration tests for booking, emergency race, reviews, chat, notifications and wallet
- [ ] Admin fraud-queue endpoint
- [ ] PDF invoice route (invoice utility exists; route/output still to verify)
- [ ] Contractor bulk-hire API routes
- [ ] Favourite-worker API
- [ ] Advertisement serving and impression/click tracking
- [ ] Referral API and reward tracking
- [ ] Premium/subscription purchase flow
- [ ] Admin analytics API
- [ ] Swagger/OpenAPI docs at `/docs`
- [ ] Verify `jobsAccepted` / `jobsCancelled` counters and edge cases

## Stage 5 — Web foundation

- [x] Design tokens and reusable UI system
- [x] Light/dark theme foundations
- [x] Landing page sections and navigation
- [x] Login with OTP
- [x] Role selection
- [x] API client and authentication state
- [x] Token refresh/session restore
- [x] English/Hindi translation scaffolding and switcher
- [x] Shared UI states/components (loading, empty, errors, demo badge, stars, trust ring)
- [x] Leaflet map integration
- [x] Socket client integration
- [x] Next.js production build compiles successfully (based on the build output shared in chat)

## Stage 6 — Customer web experience

### Customer screens

- [x] Customer app shell and role guard
- [x] Bottom navigation
- [x] Home/map screen
- [x] GPS location and draggable location pin
- [x] Trade/category selection
- [x] Emergency entry point
- [x] Worker search (list/map, filters, sort, availability)
- [x] Problem-description/free-text search
- [x] Matching reasons and price estimate
- [x] Worker profile with trust details, reviews and map
- [x] Booking confirmation and live price estimate
- [x] Booking tracking/status timeline
- [x] OTP flow for booking start/completion
- [x] Live chat in booking flow
- [x] Demo payment/release flow
- [x] Review submission
- [ ] Notifications screen: hands-on test
- [ ] Cancel booking: hands-on test
- [ ] Report a problem: hands-on test
- [ ] Booking history (active/past tabs): hands-on test
- [ ] Book again from history: hands-on test
- [ ] Emergency booking countdown and timeout: hands-on test
- [ ] Contractor bulk-hire UI and end-to-end flow
- [ ] Customer subscription UI and purchase flow

## Stage 7 — Worker web experience

### Core worker flow

- [x] Worker onboarding wizard
- [x] Trade selection
- [x] Rate selection within permitted limits
- [x] Location pin and service radius
- [x] Worker bio
- [x] Worker home/dashboard
- [x] Availability toggle and live broadcast
- [x] Incoming job requests and countdown
- [x] Accept/decline request
- [x] Today's earnings and active-job card
- [x] Job details page
- [x] On-the-way/status flow
- [x] Start/complete job with OTP
- [x] Job map
- [x] Chat
- [x] Rate customer
- [ ] Cancel accepted job: hands-on test
- [ ] Worker notifications screen: hands-on test

### Worker extras

- [x] Earnings page (balance and time-period summaries)
- [x] Earnings chart
- [x] Payout display
- [x] Digital ID card
- [x] QR code
- [x] Share ID link
- [x] Verification form and photo-upload UI (demo)
- [x] Reputation/trust-score screen
- [x] Trust-score breakdown
- [x] Tips and review display
- [x] Referral-code display (UI only)
- [x] Premium-plan cards (display only)
- [x] Coming-soon feature cards
- [ ] Referral/reward tracking backend and end-to-end test
- [ ] Premium purchase/subscription backend and end-to-end test
- [ ] Waitlist form + API endpoint

## Stage 8 — Admin experience

- [ ] Admin dashboard and navigation
- [ ] Analytics dashboard
- [ ] Verification queue and approve/reject workflow UI
- [ ] User/customer/worker management
- [ ] Booking management
- [ ] Disputes/problem reports
- [ ] Fraud flags/queue
- [ ] Trades/catalogue management
- [ ] Ads management
- [ ] Admin flows tested end to end

## Stage 9 — Quality, UX and platform polish

- [ ] PWA/installability
- [ ] Offline/poor-network handling
- [ ] Voice input (Hindi/English)
- [ ] Accessibility review (keyboard, labels, contrast, screen readers)
- [ ] Performance review (maps, search, page loading, API requests)
- [ ] Responsive/mobile-browser review
- [ ] Demo-mode badges consistently shown wherever simulations are active
- [ ] Confirm all demo/mock functionality is clearly labelled
- [ ] Error handling and empty states review
- [ ] Security review (auth, authorization, rate limits, input validation, uploads)
- [ ] Fix known API TypeScript errors and get clean API type-check/build
- [ ] Run all automated tests and record result
- [ ] Manual regression test of customer and worker journeys

## Stage 10 — Mobile (later/optional)

- [ ] Expo app scaffolding
- [ ] Worker mobile experience
- [ ] Customer mobile experience (if required)
- [ ] Mobile API/socket integration
- [ ] Push notifications
- [ ] Mobile testing and release preparation

## Stage 11 — Demo and release preparation

- [ ] Update README with current setup and feature status
- [ ] Demo script
- [ ] Deployment configuration
- [ ] Screenshots
- [ ] Seed/demo flow validation
- [ ] Production environment variables and secrets checklist
- [ ] Deployment smoke test
- [ ] Final release checklist

---

## Known issues / follow-up checks

- [ ] Fix API TypeScript errors previously noted in `npx tsc -p apps/api/tsconfig.json --noEmit` (reported nullability/Mongoose/provider-signature issues; re-run to confirm current state)
- [ ] Restrict availability socket updates to appropriate users/rooms
- [ ] Improve free-text trade keyword matching to avoid accidental substring matches
- [ ] Include worker name/location in search response to reduce extra profile requests, if still unresolved
- [ ] Review and test worker simulator script against the current booking flow
- [ ] Confirm review tags and supported tag list
- [ ] Verify Windows install/build stability for esbuild after dependency installs

## Notes

- Referral and premium screens are currently presentation/display-only until the corresponding APIs and purchase/reward workflows are implemented.
- Verification, OTP and payment providers may be simulated; label these clearly in the UI.
- This checklist reflects repo documentation/commit notes and user-shared build evidence. Items marked complete should be re-verified if code changes or regressions occur.
