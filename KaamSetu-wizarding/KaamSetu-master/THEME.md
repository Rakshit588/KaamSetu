# KaamSetu: The Wizarding Marketplace (theme notes)

The redesign is token-driven, so every existing screen picked up the new look without logic changes.

- Tokens and component classes: `apps/web/app/globals.css` (dark "Midnight" default, light "Parchment by day").
- Token meaning: `brand` antique gold, `saffron` warm amber, `flame` bright gold, `mint` emerald (verified/available),
  `coral` crimson (emergency/rejected), `line` gold hairlines, `surface2` enchanted forest.
- Fonts (`app/layout.tsx`): Cinzel (headings), Cormorant Garamond (editorial), Plus Jakarta Sans (UI),
  JetBrains Mono (IDs), Noto Sans Devanagari (Hindi).
- Reusable pieces: `components/magic/` (Ambient, AlleyScene, Ornament, WaxSeal, MinistrySeal, GuildCrest).
- Landing (`components/landing/`), app shell (`components/app/AppShell.tsx`), login, worker ID card restyled.
- New admin area: `app/admin` (overview + Ministry Certification Office using the existing `/admin/verifications` API).
- Motion respects `prefers-reduced-motion`. No backend, API client, auth, or shared-package code was changed.
