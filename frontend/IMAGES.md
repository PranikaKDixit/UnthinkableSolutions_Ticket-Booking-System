# Image Manifest — CineSeat Frontend

Everything runs **without** these images (gradient/SVG fallbacks are built in).
Drop the files below in to make it look premium. Names and paths must match exactly.

> Tip: from Pinterest, grab **dark, cinematic, high-contrast** shots. Prefer landscape
> for the hero/backgrounds and portrait (2:3) for posters.

---

## Required-ish (biggest visual impact)

| File | Path | Size (px) | Format | What to find |
|------|------|-----------|--------|--------------|
| Hero backdrop | `public/hero.jpg` | 1920 × 1080 | JPG | A moody cinema auditorium / concert crowd with stage lights, mostly dark so white text reads on top. Purple/gold tones fit the theme. |
| OG share image | `public/og-image.png` | 1200 × 630 | PNG | Optional — an SVG fallback (`og-image.svg`) already exists. Replace only if you want a photo-based social card. |
| Favicon | `public/favicon.svg` | 64 × 64 | SVG | Already provided (gold clapperboard). Replace if you have a logo. |

---

## Event posters (optional — cards fall back to genre gradients)

Posters are shown when an event has a `posterUrl`. Two ways to supply them:

1. **Per-event via backend** — set `posterUrl` on the event record (recommended), or
2. **Local demo images** — drop files in `public/posters/` and point `posterUrl` to
   `/posters/<name>.jpg`.

| Suggested file | Path | Size (px) | Format | What to find |
|----------------|------|-----------|--------|--------------|
| Movie poster 1 | `public/posters/movie-1.jpg` | 600 × 900 | JPG (2:3) | Sci-fi / thriller movie poster, dark palette |
| Movie poster 2 | `public/posters/movie-2.jpg` | 600 × 900 | JPG (2:3) | Drama / action movie poster |
| Concert 1 | `public/posters/concert-1.jpg` | 600 × 900 | JPG (2:3) | Stage + crowd, neon lights |
| Concert 2 | `public/posters/concert-2.jpg` | 600 × 900 | JPG (2:3) | Artist silhouette, spotlight |

Add as many as you like — just keep the 2:3 aspect ratio so cards crop cleanly.

---

## Nice-to-have

| File | Path | Size (px) | Format | What to find |
|------|------|-----------|--------|--------------|
| Auth side image | `public/auth-bg.jpg` | 1200 × 1600 | JPG | Vertical cinematic shot for future split-screen auth (not wired yet). |
| Empty-state art | `public/empty-tickets.svg` | 400 × 300 | SVG/PNG | Minimal line-art of a ticket; optional flourish for empty states. |

---

## Where each image appears in code

- `public/hero.jpg` → `src/pages/Landing.tsx` (hero `<img src="/hero.jpg">`, hidden if missing)
- `posterUrl` → `src/components/EventCard.tsx` and `src/pages/EventDetail.tsx`
- `public/favicon.svg` / `og-image` → `index.html` `<head>`

All image references degrade gracefully: a missing file shows a gradient or icon, never a
broken-image box.
