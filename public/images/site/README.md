# Site images

Every image slot on the public pages, what it should show, and its shape.
Save real images here as **WebP** (AVIF optional), keeping the aspect ratio,
then point the slot at the file (see "Where it's set").

Status: ✅ real image in place · ⬜ placeholder showing

## Homepage (`/home`)

| Slot | Status | File | Aspect / size | Should show | Where it's set |
|---|---|---|---|---|---|
| Hero browser frame | ✅ | `work-standout-site.webp` | 16:10, 1200×750 (cropped to 16:9 from the top) | A client website, desktop | `siteContent.ts` → `home.work.images["standout-clothing"]` |
| Hero phone frame | ✅ | `hero-standout-instagram.webp` | 540×718 (3×3 posts) | A client's Instagram grid | `siteContent.ts` → `home.hero.grid` |
| Marketing card | ✅ | `dd-nok-os-analytics.webp` | 2:1, 1012×506 | NOK OS analytics (from the owner's screenshot) | `siteContent.ts` → `home.serviceLines.cards[0].image` |
| Case study phone | ✅ | `case-standout-phone.webp` | Phone screenshot, 520×1125 (shown 9:16 from the top) | Standout's shop on a phone | `HomePage.tsx` → `CaseStudy` |
| Websites card | ✅ | `work-vividel-phone.webp` | Phone screenshot, 520×1125 | A client site on a phone | `HomePage.tsx` → `ServiceLines` |
| Work: Nkabom World | ✅ | `work-nkabom-site.webp` | 16:10, 1200×750 | Their live site, desktop | `siteContent.ts` → `home.work.images` |
| Work: Standout Clothing | ✅ | `work-standout-site.webp` | 16:10, 1200×750 | Their live site, desktop | `siteContent.ts` → `home.work.images` |
| Work: Vividel | ✅ | `work-vividel-site.webp` | 16:10, 1200×750 | Their live site, desktop | `siteContent.ts` → `home.work.images` |

The site screenshots were captured from the live client sites on 22 Oct 2026. The Instagram grid is cropped from the owner's screenshot in `assets/NOK Social Logo/standoutclothing grid.jpeg`.
Replace them with your own captures whenever the sites change.

## Coming in later phases

## Services pages

| Slot | Status | File | Aspect / size | Should show | Where it's set |
|---|---|---|---|---|---|
| Marketing: monthly report | ✅ | `dd-report.webp` | ~3:1, 1512×487 | A NOK OS analytics view | `siteContent.ts` → `marketingPage.report.image` |
| Websites: builds we've shipped | ✅ | `work-*-site.webp` | 16:10, 1200×750 | Client sites | `siteContent.ts` → `home.work.images` |

## About (`/about`)

| Slot | Status | File | Aspect / size | Should show | Where it's set |
|---|---|---|---|---|---|
| Founder photo | ⬜ | — | 4:5, e.g. 960×1200 | Osei, natural light, at work or a plain background | `siteContent.ts` → `about.founder.photo.src` |
| NOK OS | ✅ | `about-nok-os.webp` | ~2.7:1, 1540×567 | NOK OS in dark mode | `siteContent.ts` → `about.nokOs.image` |

The founder block (photo + story) stays hidden on the live site until `about.founder.story` is filled in.
