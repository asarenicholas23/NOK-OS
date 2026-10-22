# noksocial.com — Redesign Brief

Owner: Osei (N.O.K Social)
Scope: the PUBLIC website only (homepage, services, about, blog, resources, FAQ, nav, footer).
Out of scope: the CMS / admin screens (`CmsPage.tsx` and anything behind login). Do not restyle them, but keep every CMS data flow working.

---

## 0. Working rules (read first)

1. Do not change any code until I approve the audit (Phase 0).
2. Work one phase at a time. At the end of each phase, stop, summarise what changed (files + why), and wait for my go-ahead.
3. Explain each step before you do it. I want to understand the changes, not just receive them.
4. Do not commit, push or deploy. I review and commit myself.
5. If you're unsure about something in the codebase (hosting setup, Tailwind version, how the CMS stores data), check and tell me. Don't guess.
6. All visible copy goes in one content file (see §5) so I can rewrite it in my own voice. Treat every line of copy in this brief as a DRAFT.
7. Never invent testimonials, client results or statistics. Where real content is missing, build the slot and leave it hidden or clearly marked as a placeholder.

---

## 1. Design direction

The site is moving AWAY from the blueprint look used on my social media carousels. No grid-paper backgrounds, no registration/corner marks, no hairline technical frames, no neumorphism (`neu-raised`, `neu-pressed`, `neu-gold-filled` etc. on public pages go).

It KEEPS the brand colours and typography, and adds:
- **Rounded everything:** large radii on sections and cards, pill-shaped buttons and nav.
- **Smooth motion:** soft reveals, gentle floating elements, small looping animations inside cards.
- **Storytelling:** each page reads as a narrative — problem → what changes → proof → how it works → call to action.

Reference sites (for behaviour, not to copy):
- **lemonsqueezy.com** — scroll-filled statement text (words go from faded to solid as you scroll); numbered list on the left that drives an animated panel on the right; bold colour-block sections; pill buttons.
- **family.co** — soft rounded cards on an off-white background, each with a small live animation inside.

Visual reference: `concept-homepage.html` (in the repo root next to this brief). Open it in a browser. It's a static concept: match its look and feel, not its exact markup.

---

## 2. Design tokens

### Colours
| Token | Hex | Use |
|---|---|---|
| ink | `#14213D` | Dark sections, headlines on light, primary dark button |
| cyanotype | `#2E5EAA` | Labels, links, small data highlights |
| paper | `#F5F1E8` | Default page background |
| slate | `#6B7280` | Supporting text (see contrast note) |
| amber | `#E8A33D` | ONE accent moment per section max: main CTA fill, one highlighted word |
| graphite | `#14171A` | Body text on light backgrounds |
| white | `#FFFFFF` | Cards on paper |

Sections alternate **paper** and **ink**. Cards on paper are white.

**Contrast rules — check these, I've estimated them (verify with a contrast checker):**
- Amber TEXT on paper ≈ 1.9:1 → fails WCAG for any text size. Amber on paper may only be used as a fill (e.g. button with ink text) or a highlight/underline behind ink text. Amber text is fine on ink (≈ 7:1).
- Slate on paper ≈ 4.4:1 → just under AA for normal body text. Either darken slate slightly for body copy on paper, or use slate only at ≥ 18px. Propose a value.
- Cyanotype on paper ≈ 5.6:1 → OK.
- Paper text on ink → OK.

### Typography
- **Baloo 2** (Google Fonts) — headlines AND body. Weights 400/500/600/700.
- **IBM Plex Mono** — ONLY for small labels and real numbers/stats (e.g. "Step 01", "GH₵ 240 · MoMo", service-line tags). Not for paragraphs.
- Remove the current display font and IBM Plex Sans usage on public pages.
- Sentence case for headings and buttons. No ALL CAPS labels.

### Shape
- Section blocks: ~28px radius. Cards: ~24px. Inner images/frames: ~16px. Buttons & nav: fully rounded (pill).
- No hard 1px technical borders as decoration. No drop-shadow-heavy neumorphism. A very soft shadow on floating elements is fine.

### Motion
- Use Framer Motion (`motion` / `framer-motion` — check what's installed; propose adding it if not).
- Easing: soft ease-out, e.g. `cubic-bezier(.2,.8,.2,1)`. Durations 0.3–0.8s. Nothing bouncy or flashy.
- **Must respect `prefers-reduced-motion`:** all reveals become instant, all loops stop, the scroll-fill text shows fully filled.
- Animations must not shift layout (no CLS) and must not block reading.

---

## 3. Reusable components to build (Phase 1)

Build these once, then use them everywhere:

- `Section` — props: `tone: "paper" | "ink"`, rounded or full-bleed.
- `PillButton` — variants: `primary` (amber fill, ink text), `dark` (ink fill, paper text), `soft` (white fill, ink text).
- `Card` — white, rounded, optional media slot on top.
- `Reveal` — fades/slides children in when they enter the viewport (once).
- `ScrollFillText` — paragraph whose words go from ~20% opacity to full as the user scrolls through it (Lemon Squeezy style). Reduced motion → fully filled.
- `StepPanel` — numbered list on the left; clicking/scrolling an item swaps the content in a rounded ink panel on the right, with a progress bar. On mobile, stack it as an accordion.
- `BrowserFrame` and `PhoneFrame` — rounded frames for screenshots.
- `FloatingStat` — small white rounded card that gently bobs (e.g. "Order paid · GH₵ 240 · MoMo"). Content always comes from data, never hardcoded fake numbers.
- `ImageSlot` — placeholder for an image that hasn't been supplied yet: shows a soft tinted block with a label like "Photo: content shoot with a client". When a real `src` is supplied, it renders the image (with `alt`, lazy loading, fixed aspect ratio).
- `TestimonialSlot` — renders a quote only if real testimonial data exists; otherwise renders nothing.
- `FAQAccordion` — rounded, smooth open/close, keyboard accessible, outputs FAQ JSON-LD (reuse the existing `buildFaqJsonLd`).
- New `PublicNavbar` and `PublicFooter` (see §4).

---

## 4. Page-by-page plan

### Global: navbar and footer
- Navbar: logo (node icon + "N.O.K Social" wordmark) left; pill nav centre: **Work · Services · About · Blog**; right: **Book a call** (dark pill). Mobile: rounded slide-down menu.
- Remove "Free Resources" from the main nav if Resources Option A is chosen (§4.6).
- Day/Night toggle: **decision needed from me** — recommendation is to remove it, since paper/ink sections already alternate and a full dark mode doubles QA. Don't remove until I confirm.
- Footer: capabilities list must include BOTH service lines and website builds. Location: "Konongo Low Cost, Ghana" (capital C). Contact: email, WhatsApp. Links to all pages.

### 4.1 Homepage (`/home`, and `/`)
Story order (see `concept-homepage.html`):
1. **Hero** (paper): no location badge above the headline. Headline names exactly what we do and the benefit, covering both service lines. Draft: "Social media, campaigns and websites that bring you customers" (one word may get amber highlight treatment — remember the contrast rule). Subline + two buttons: Book a discovery call (primary), See our work (soft).
2. **Hero visual**: collage — client site in `BrowserFrame`, client Instagram grid in `PhoneFrame`, two `FloatingStat` cards (one marketing result, one paid order). All `ImageSlot`s until I supply assets.
3. **Problem statement** (ink): `ScrollFillText`.
4. **Two service-line cards**: Data Direction and Pipeline Build, each with image slot, tag, benefit headline, one line, link to its service page.
5. **Work**: "Brands we've worked with" — Nkabom World, Standout Clothing, Vividel. Each = screenshot in a frame + name + what we did + optional `TestimonialSlot`. Links to live sites (existing URLs in `ClientBrandsSection.tsx`). Keep this CMS-driven.
6. **How we work with you**: `StepPanel` (5 steps covering both content and build clients).
7. **Short FAQ** (4–5 general questions).
8. **CTA** (ink): "Let's talk about your business" + Book a discovery call.

Remove from the current homepage: "Who We Serve" stock-photo card, the "5 Tiers / 100% / Direct" stats row, the duplicated website-builds block, the "Get IG Account Audit" CTA, the "SEPARATE SERVICE" label.

### 4.2 Services hub (`/services`) — new
Short intro + two large rounded cards (Data Direction, Pipeline Build) linking to their pages.

### 4.3 Data Direction (`/services/data-direction`) — new
1. Problem: posting without knowing what works.
2. The four stages as a 2×2 card grid: Brand Foundation, Digital Presence Setup, Growth Retainer (tag "Most picked"), Campaign Package. One label per card (remove the duplicated "Stage 01 / STAGE 1 · FOUNDATION").
3. Prices pulled from the CMS (single source of truth). Consistent formatting: "GH₵ 1,200–3,600" (comma thousands, en dash).
4. Example monthly report screenshot (`ImageSlot`).
5. `TestimonialSlot`, service FAQ, CTA.

### 4.4 Pipeline Build (`/services/pipeline-build`) — replaces `/website-builds`
1. Problem: orders and bookings lost in WhatsApp.
2. What we build: business websites, booking, online ordering, client systems — cards with small looping animations (e.g. a booking card that flips to "Deposit paid").
3. Client builds in `BrowserFrame`s.
4. The 5 build steps in `StepPanel` (deposit % from `DEFAULT_DEPOSIT_PERCENT`).
5. Price from the CMS, `TestimonialSlot`, build FAQ, CTA.
6. Rewrite tech-led bullets as outcomes (no "Firebase-backed system architecture" on client-facing copy).
7. **Redirect `/website-builds` → `/services/pipeline-build`** permanently. Check how the site is hosted (firebase.json / vercel.json / other) and tell me the right way to do a real 301, plus a client-side fallback route.

### 4.5 About (`/about`) — new
1. Photo of Osei (`ImageSlot`) + short founder story (copy placeholder for me to write).
2. Background: MSc Business and Data Analytics — why data drives the work.
3. "How we work" — 3–4 beliefs, each tied to something concrete we do.
4. NOK OS: one screenshot + line about the internal system we built to run client content.
5. CTA.

### 4.6 Resources (`/resources`)
- **Default (Option A):** remove from main nav; show a "Free tools" strip at the top of `/blog` and one card on the homepage. Keep `/resources` working.
- **Option B (if I choose it):** keep the page; Lead Tracker as one large featured card with screenshot; upcoming tools as small "In the works" cards with waitlist.
- Ask me which before building.

### 4.7 Blog (`/blog`, `/blog/:slug`)
- Restyle to the new system. **Keep the article reading layout** — it works.
- Featured newest post as a large rounded card, rest in a grid.
- Reduce categories to 3–4 (proposal: Social media, Campaigns, Websites, Running your business). Map existing posts to them and show me the mapping before changing anything.
- End-of-article CTA block chosen by category (campaign posts → Data Direction; website posts → Pipeline Build).

### 4.8 FAQ
- Split FAQ data by page: general (homepage), Data Direction, Pipeline Build. Store in the content/CMS data, not hardcoded in components.
- Remove the first answer that duplicates the hero copy.
- Add question slots for: ownership of website/domain, payment in instalments, working with businesses outside Kumasi, build timelines, what happens after launch. I'll supply the answers.
- Keep FAQ JSON-LD per page.

### 4.9 Testimonials
- No testimonials exist yet. Add a testimonial field to the client-brand data (quote, name, role, photo, permission flag) and to each service page.
- `TestimonialSlot` renders nothing when empty. Never seed fake quotes.

### 4.10 SEO / meta
- Update default title and meta/OG description: currently says "Digital Marketing Infrastructure & NOK OS" — replace with copy reflecting both service lines (I'll confirm wording).
- Per-page titles/descriptions for all new routes. Add new routes to the sitemap if one exists.

---

## 5. Content and images

- Put all public copy in one file (e.g. `src/content/siteContent.ts`), grouped by page. Mark draft lines with `// DRAFT` so I can find and rewrite them.
- Prices, services, client brands: keep coming from the CMS (`CmsContext` / `cmsData`). Don't duplicate them in the content file.
- Images: create `public/images/site/` with a README listing every image slot, its aspect ratio and what it should show. I'll supply real photos and screenshots. Until then, `ImageSlot` placeholders.
- Use modern formats (WebP/AVIF), lazy-load below the fold, set width/height to avoid layout shift.

---

## 6. Phases (stop after each)

| Phase | Work | Stop & show me |
|---|---|---|
| 0 | **Audit only, no code.** Stack, versions, file map for public pages, where styles/colours are hardcoded (e.g. `#15151A`, `#C5A065`, `#B08D57`, `#F2F0EB`, `neu-*` classes), where copy/prices/FAQ live, how routing and hosting work, what motion library exists. List anything you need from me. | Audit report + any questions |
| 1 | Tokens (Tailwind theme / CSS vars), fonts, motion setup + reduced-motion handling, all components in §3, new navbar + footer | Component preview page (dev-only route) + navbar/footer on one page |
| 2 | Homepage | Homepage at 375 / 768 / 1280px |
| 3 | Services hub + Data Direction + Pipeline Build + `/website-builds` redirect | All three pages + redirect test |
| 4 | About | About page |
| 5 | Blog restyle + category mapping (approve mapping first) + end-of-article CTAs | Blog index + one article |
| 6 | FAQ split + Resources (after I choose A or B) | Both |
| 7 | Testimonial data fields + slots | Empty and filled states |
| 8 | QA: every page at 375/768/1280; keyboard nav; reduced motion; contrast AA; Lighthouse (performance, accessibility, SEO) on homepage + one service page; check all old URLs still resolve | QA report with fixes made and anything outstanding |

---

## 7. Decisions still open (ask me, don't assume)
1. Remove the Day/Night toggle? (recommended: yes)
2. Resources: Option A or B?
3. Final headline wording.
4. Slate text colour adjustment value.
5. Prices — I'm fixing these myself in the CMS.
