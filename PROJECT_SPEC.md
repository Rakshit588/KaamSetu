# ROLE
You are a senior full-stack engineer and product designer. Build "KaamSetu" end to end: a hyperlocal digital labour marketplace for India's daily wage workers. Work in stages (see BUILD ORDER). After each stage, make sure the app runs with no errors before moving on. Do not leave TODOs or placeholder screens; every screen listed must be functional with seeded demo data.

# PRODUCT SUMMARY
KaamSetu ("bridge to work") connects daily wage workers (masons, electricians, plumbers, carpenters, painters, construction labourers, cleaners, repair technicians) directly with customers (homeowners, contractors, small businesses, housing societies, commercial establishments). It replaces physical "labour chowks" and middlemen with verified, location-based, transparent, direct hiring.
Tagline: "Connecting Workers. Creating Opportunities." Closing line: "From Labour Chowks to Smart Hiring."
Core goals: hiring that is faster, transparent, reliable, accessible, and middleman-free.

# TECH STACK (fixed)
- Monorepo: /apps/web (Next.js 14+ App Router, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui as base only), /apps/api (Node.js + Express + TypeScript, REST APIs, Socket.io), /apps/mobile (Expo React Native, built in the last stage, consuming the same API), /packages/shared (shared types, constants, trust-score and pricing functions).
- Database: MongoDB with Mongoose, with 2dsphere geospatial indexes for location queries.
- Auth: phone number + OTP, JWT access + refresh tokens. In dev, the OTP is always 123456 and logged to the console. Put the SMS sender behind an interface (`OtpProvider`) with a dev implementation and a Firebase/MSG91 implementation selectable by env var.
- Maps: Leaflet + OpenStreetMap tiles by default (free, no key). Add a `MapProvider` abstraction so Google Maps API can be swapped in via env var `NEXT_PUBLIC_GOOGLE_MAPS_KEY`.
- Realtime: Socket.io (live availability, job requests, job status, chat).
- Payments: UPI payment gateway behind a `PaymentProvider` interface. Implement Razorpay in TEST mode plus a built-in "Mock UPI" provider used by default so the demo works with no keys.
- Push notifications: Firebase Cloud Messaging (web push + mobile) behind a `NotificationProvider`, with an in-app notification centre as the guaranteed fallback.
- i18n: next-intl (web) / i18next (mobile). Ship English, Hindi, Punjabi, Bengali, Marathi (English and Hindi complete; others at least for core flows).
- Deployment: Dockerfile + docker-compose for local (api, web, mongo), and deploy configs for Render (api), Vercel or Render (web), MongoDB Atlas. Include `.env.example` for every app.
- Include a seed script that creates 1 admin, 15 customers, 60 workers across all trades around a default city (use Meerut, Uttar Pradesh as the demo city; coordinates configurable), 150 past bookings, and reviews, so every screen looks alive.

# USER ROLES
1. Customer, 2. Worker, 3. Admin. A user picks a role on first login. Admin accounts are created by seed only.

# DATA MODELS (Mongoose)
- User: phone (unique), name, role, language, avatarUrl, fcmTokens[], createdAt.
- WorkerProfile: userId, skills[] (trade enum + experience years + optional own daily/hourly rate), bio, location (GeoJSON Point), serviceRadiusKm, isAvailableNow (bool), availabilitySchedule, verification { phoneVerified, idType, idNumberMasked, idDocUrl, selfieUrl, status: none|pending|verified|rejected, verifiedAt }, digitalId (unique code like KS-XXXXXX, with a QR), trustScore (0-100), ratingAvg, ratingCount, jobsCompleted, completionRate, responseRate, earningsTotal, isPremium, premiumUntil.
- CustomerProfile: userId, savedAddresses[], customerType (homeowner|contractor|small_business|housing_society|commercial), contractorSubscription { plan, validUntil }.
- Service/Trade catalogue: key, name (en/hi), icon, baseRateHour, baseRateDay, minRate, maxRate.
- Booking: customerId, workerId, trade, description, photos[], location (GeoJSON), address, scheduledFor, isEmergency, estimatedDurationHrs, priceEstimate { min, max, urgencyMultiplier }, finalPrice, platformFee, status (requested|accepted|on_the_way|in_progress|completed|paid|cancelled|disputed), statusTimeline[], payment { provider, orderId, status, method, paidAt }, startOtp / completionOtp (for secure start/finish), cancelReason.
- Review: bookingId, fromUserId, toUserId, rating 1-5, tags[] (punctual, skilled, polite, fair-price), comment.
- Message: bookingId, senderId, text, createdAt, readAt.
- Notification: userId, type, title, body, data, readAt.
- Advertisement: title, imageUrl, link, sponsor, targetTrade, active.
- Report/Dispute: bookingId, raisedBy, reason, status, adminNotes.
- Subscription/PremiumPlan: plan definitions for worker premium and contractor subscription.

# FEATURES TO IMPLEMENT (every one must work)

## Customer features
1. Nearby Worker Search: choose a service, set location (GPS, map pin, or typed address), see workers within radius sorted by a match score; list view and map view toggle; filters (rating, price, verified only, available now, distance).
2. Instant Booking: one-tap book a worker with date/time or "Now".
3. Worker Profiles: photo, digital ID badge, skills, experience, rating, reviews, trust score ring, jobs done, response rate, rate card, verification badge.
4. Ratings & Reviews: after completion, rate and tag the worker; workers can also rate the customer.
5. Estimated Pricing: price range computed before booking (see PRICING). Show a transparent breakdown: worker pay, platform fee, urgency surcharge, total.
6. Live Availability: green pulsing "Available now" indicator driven by Socket.io.
7. Emergency Hiring: prominent "Need a worker NOW" flow (see EMERGENCY FLOW).
8. Job Tracking: live status timeline, worker ETA on map, in-app chat, start/finish OTP verification.
9. Secure Payment: pay in-app via UPI after completion (payment held as "pending release" in the mock flow, released on customer confirmation).
10. Booking history, re-book favourite worker, save favourite workers, invoices (downloadable PDF receipt).
11. Contractor mode: post a multi-worker requirement (e.g., "5 masons for 3 days"), bulk hire, repeat-hire list, subscription plan screen.

## Worker features
1. Easy Registration: phone + OTP, minimal typing, icon-based skill picker, voice input option.
2. Skill Categories: choose multiple trades with experience and own rate within the allowed band.
3. Digital Identity: generated digital worker ID card with QR code, shareable/printable; shows verification status and trust score.
4. Verification: upload ID (Aadhaar/Voter ID/DL — see LIMITATIONS) + selfie; admin approves; status badges (Unverified / Pending / Verified).
5. Job Notifications: real-time push/in-app alerts for nearby requests with distance, price, and Accept/Decline (with countdown).
6. Availability toggle: big "I'm available / not available" switch, plus weekly schedule.
7. Earnings Dashboard: today/week/month earnings, completed jobs, pending payouts, chart, payout history, transaction list.
8. Ratings-Based Reputation: trust score breakdown, reviews, tips to improve score.
9. Multi-Language Support: language switcher at first launch and in settings.
10. Premium Profile: paid plan for priority placement and visibility boost; in the demo, purchase is via the mock payment provider.
11. Referral program: unique referral code, track referred workers, reward credit (wallet balance).

## Platform features
1. AI-Based Matching: implement a transparent weighted scoring algorithm first (skill match, distance, availability, trust score, rating, price fit, response rate, past success with this customer), returns ranked workers with a short "Why this match" explanation. Wrap it in a `MatchingService` interface so an LLM or ML model can be plugged in later. Optionally add an LLM-powered "describe your problem in your own words" box that maps free text (Hindi or English) to a trade + urgency, using an env-configured API key and falling back to keyword matching if no key is present.
2. GPS Discovery: MongoDB $geoNear queries with expanding radius.
3. Secure Authentication: OTP login, JWT with refresh rotation, rate limiting, helmet, CORS, input validation (zod), OTP attempt limits.
4. Fraud Prevention: rule-based engine (duplicate device/phone, rapid cancel patterns, too-many-bookings-in-a-minute, review-bombing, GPS mismatch at job start, off-platform contact attempts in chat such as phone numbers, flagged keywords). Flags go to the admin queue and can reduce trust score.
5. Analytics Dashboard (admin): total users, active workers, bookings per day, GMV, platform revenue, trade-wise demand heatmap, city/area heatmap, conversion funnel, top workers, fraud flags, dispute queue. Use charts.
6. Cloud Infrastructure: Dockerised, stateless API, env-based config, health-check endpoint, structured logging, ready for AWS/Render/Atlas.
7. Admin panel: verify workers, manage trades and base rates, manage ads, handle disputes and reports, manage subscriptions, view analytics.
8. Advertisements: sponsored cards/banners (construction brands, tool makers, local businesses) shown in the customer home and worker home, targeted by trade, with impression/click tracking.
9. Commission engine: configurable platform fee (default 8%) deducted on job completion.

# CORE ALGORITHMS (put in /packages/shared with unit tests)

## Trust Score (0-100, recomputed after every job/review/verification change)
- 35% average rating (weighted toward recent reviews)
- 20% job completion rate
- 15% verification level (none 0, phone 40, ID pending 60, ID verified 100)
- 10% response rate and speed
- 10% experience (log-scaled by jobs completed)
- 10% punctuality / low cancellations
- Minus penalties for upheld disputes and fraud flags.
Show a breakdown to the worker so the score is explainable.

## Pricing Estimate
price = (trade base rate by hour or day, adjusted by the worker's own rate within min/max band) × estimated duration × urgency multiplier (normal 1.0, same-day 1.15, emergency 1.25-1.5, night 1.3). Show a min-max range. Platform fee 8% added transparently. Never hide fees.

## Match Score
Normalised weighted sum (skill 30, distance 20, trust 20, availability 10, price fit 10, past success 5, response 5). Return the score and the top 3 reasons.

## Emergency Flow
Customer taps "Need now" → selects trade, auto-detects location, optional photo/voice note → backend broadcasts to available workers within 2 km, expands to 5 km then 10 km every 30-45 seconds → first worker to accept wins (atomic update to avoid double-accept) → customer sees live "Worker on the way" with ETA, urgency surcharge shown upfront → fallback: if nobody accepts in 3 minutes, offer to schedule or notify the nearest 10 workers by in-app alert.

# BOOKING FLOW
Customer: open app → select service → enter location → view nearby workers → compare ratings and pricing → book → work completion → secure payment → review.
Worker: register → add skills → complete verification → receive nearby job requests → accept → complete task → receive payment → build reputation.
Use start OTP (customer gives worker a 4-digit code on arrival) and completion OTP, so the arrival and completion are verified. Log GPS at start and end.

# SCREENS / PAGES
Public: landing page (hero with animated bridge, live stats, how it works for both roles, trades grid, trust section, testimonials, FAQ, download CTA), login/OTP, role selection.
Customer: home (map-first with service chips and emergency button), service picker, search results (list/map), worker profile, booking confirm with price breakdown, live job tracking + chat, payment, history, saved workers, notifications, profile/settings, contractor bulk-hire page, subscription page.
Worker: onboarding wizard, home (availability toggle, incoming requests, today's earnings), job request modal with countdown, active job screen, earnings dashboard, digital ID card, reputation/trust score page, reviews, referral page, premium plans, settings and language.
Admin: overview analytics, worker verification queue, users, bookings, disputes, fraud flags, trades and rates, ads, subscriptions.

# DESIGN DIRECTION (make it unique and modern, not a generic template)
Brand idea: the "bridge" (setu). Use a subtle arched-bridge motif in headers, progress indicators (booking progress drawn as a bridge being completed span by span), empty states, and loaders.
Palette (define as CSS variables with a dark mode):
- Midnight Indigo #0B1F4B (primary, trust)
- Saffron Amber #F59E0B → Sunset Orange #F97316 (action, energy; use as gradient accents)
- Warm Cream #FFF8E7 (light background) / Deep Ink #0A0F1F (dark background)
- Teal Mint #14B8A6 (success, available-now, verified)
- Soft Coral #FB7185 (alerts, emergency)
- Neutral warm greys for text and borders.
Style: bento-grid layouts, large rounded corners (20-28px), soft layered shadows, subtle glassmorphism on floating panels over the map, grain texture on hero, micro-interactions with Framer Motion (spring animations, pulsing availability dot, animated trust-score ring, count-up stats, page transitions), sticky bottom navigation on mobile, large touch targets (min 48px), icon-first UI with short labels for low-literacy users, Hindi-friendly typography.
Fonts: "Plus Jakarta Sans" (UI), "Fraunces" (display headings), "Noto Sans Devanagari" for Hindi.
Accessibility: WCAG AA contrast, keyboard navigable, screen-reader labels, reduced-motion support, works on low-end phones and slow networks (lazy-load, skeletons, image optimisation, PWA with offline shell and installable manifest).
Mobile-first: design every screen for 360px width first, then scale up.
Voice assistance: add mic buttons on search and registration using the Web Speech API (Hindi and English), degrade gracefully if unsupported.

# SECURITY & QUALITY
zod validation on every endpoint, centralised error handling, rate limiting, helmet, mask ID numbers (store only last 4 digits plus encrypted document reference), never log secrets, role-based access control middleware, pagination everywhere, indexes on hot queries, ESLint + Prettier, unit tests for trust score, pricing, matching, and booking state machine, plus API integration tests for auth and booking. Add a README with setup, env vars, architecture diagram (mermaid), API docs (OpenAPI/Swagger at /docs), and demo credentials.

# FEATURES THAT CANNOT BE FULLY REAL IN A HACKATHON BUILD (implement as clearly-labelled simulations behind interfaces)
Build each one so that swapping in the real provider requires only config, and show a small "Demo mode" badge in the UI wherever a simulation is active.
1. Aadhaar / government ID verification: real eKYC requires UIDAI-licensed providers and legal compliance. Build upload + admin manual review + masked storage. Add a `KycProvider` interface with a mock implementation (and a documented slot for Digio/Signzy/IDfy). Never store full Aadhaar numbers. Police verification is out of scope.
2. Real UPI payments, payouts to workers, escrow, and commission splitting: need a registered business and gateway KYC. Use Razorpay test mode and the Mock UPI provider; simulate payout to worker wallet; show payout history as demo data.
3. Real SMS OTP at scale: needs DLT registration in India. Use dev OTP 123456 plus a Firebase/MSG91 provider slot.
4. Masked calling between customer and worker: needs a telephony provider. Use in-app chat and reveal the phone number only after a booking is accepted.
5. Production-grade "AI" matching and recommendations: no real training data exists. Use the weighted scoring algorithm now; keep the interface ready for ML later. Be honest in the UI ("Smart match") and docs.
6. Fraud detection at scale: implement rule-based detection only.
7. Real-time ETA and routing accuracy: use straight-line distance plus an OSRM/Google Directions call if a key is present, otherwise estimate by distance and average speed.
8. Voice assistance in all regional languages: Web Speech API support varies; implement Hindi/English and fall back to text.
9. Phase 3 items from the roadmap (worker financing, insurance, skill certification, payroll and attendance, government collaborations): do NOT build them. Create "Coming soon" cards on the worker dashboard and a roadmap page, with a waitlist signup form that stores interest in the database.
10. Nationwide scale and real worker network: not buildable in code; the seed data and the city-launch config (`CITY_CONFIG`) simulate a single-city launch.

# BUILD ORDER (stop and verify after each stage)
1. Monorepo scaffolding, shared package, env, Docker, lint, CI-ready scripts.
2. API: models, auth (OTP/JWT), trades catalogue, seed script.
3. API: worker profile, verification, geo search, matching, pricing, trust score (with tests).
4. API: booking state machine, emergency broadcast, Socket.io (availability, requests, status, chat), payments (mock + Razorpay test), reviews, notifications, fraud rules, ads, referrals, subscriptions, admin and analytics endpoints, Swagger docs.
5. Web: design system, layout, landing page, auth, role selection, i18n.
6. Web: customer flows, then worker flows, then admin dashboard.
7. PWA, voice input, accessibility, performance pass, dark mode, empty/error/loading states.
8. Mobile (Expo): worker app first (availability, job requests, earnings, ID card), then customer app, reusing the shared package and API.
9. Final polish: demo script data, README, screenshots folder, deployment configs, a "Demo mode" guide for the hackathon presentation.

# DEFINITION OF DONE
A judge can: open the landing page, log in as a customer with OTP 123456, search a plumber nearby on a map, see an explained match score and price breakdown, book, watch a worker accept in another browser window in real time, chat, complete the job with OTPs, pay via mock UPI, leave a review, and see the worker's trust score and earnings update; trigger an emergency booking; switch language to Hindi; open the admin dashboard and see live analytics. Nothing crashes, nothing is a dead link.