# Hesketos — Project Reference

## Effort Estimates
Before starting any task, always give a quick effort label:
- **Small** — a few lines, done in seconds (e.g. color change, typo fix)
- **Medium** — one focused change, a few minutes (e.g. new button, handler)
- **Large** — multiple files, tooling, or research involved (e.g. new feature, image pipeline)

For **Large** tasks: describe the approach and ask for confirmation before writing any code.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Runtime**: Node.js v24 LTS

## Hebrew-First Requirements
- `<html lang="he" dir="rtl">` — all layout and text flow right-to-left
- All UI labels, copy, and navigation are in Hebrew
- Font choices should support Hebrew characters well
- Do not add English-only UI text; always use Hebrew
- **Always add nikud (נִיקּוּד)** to all Hebrew text — vowel diacritics help young kids read and pronounce words
  - Skip nikud on: brand names ("הסכתוס", "להיטוס"), show-specific catchphrases, filenames, and metadata/SEO strings

## Backlog
See [BACKLOG.md](BACKLOG.md) for the prioritized list of upcoming features and ideas. Check it at the start of relevant sessions.

## Session End Instructions
- Before the user clears the chat, always save a memory summary to the project memory folder
- Update `project_hesketos.md` with any new pages, features, or decisions made during the session
- Add any new feedback memories if the user corrected your approach

## App Structure
```
src/
├── app/
│   ├── layout.tsx          ← Root layout (RTL, floating home button)
│   ├── page.tsx            ← Home: 2x2 grid of feature tiles
│   ├── soundboard/         ← Sound buttons with emoji reactions + confetti
│   ├── quiz/               ← Multiple choice quiz
│   ├── draw/               ← Canvas drawing tool
│   ├── gallery/            ← Supabase fan art gallery + upload form
│   ├── admin/              ← Password-gated artwork approval panel
│   └── podcast/            ← Placeholder
└── components/
    ├── BottomNav.tsx        ← Floating home button (hides on homepage)
    ├── ArtworkUpload.tsx    ← Fan art upload form
    ├── DrawingCanvas.tsx    ← Drawing tool
    └── QuizPlayer.tsx       ← Quiz game
```

## Navigation
- **No bottom nav bar** — replaced with a single floating 🏠 home button
- Button hides on the homepage, springs in on all other pages
- All navigation flows: home → feature, then home button back

## Main Features

### 1. לוח צלילים — Soundboard
- 5 sound buttons with emoji reaction overlays (zoom in + fade out)
- להיטוס triggers full-screen confetti (canvas-confetti)
- Files in public/soundboard/

### 2. חידון — Quiz
- Multiple-choice trivia for kids
- Questions and answers in Hebrew
- Fun feedback animations on correct/incorrect answers (Framer Motion)

### 3. יצירה — Drawing
- In-browser drawing/art creation tool for kids
- Canvas-based, touch-friendly
- Kids can save or submit their artwork

### 4. גלריה — Fan Art / Art Gallery
- Supabase-backed: kids upload artwork, admin approves it
- Grid shows only approved artworks
- Upload form with 5MB guard, Hebrew feedback, image preview

### 5. Admin Panel (/admin)
- Password-gated (env var ADMIN_PASSWORD)
- Approve/delete pending artwork without going to Supabase dashboard
- Uses service role key via server-side API route

## Design System (extracted from style guide images)

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-blue` | `#68B8ED` | Primary background (podcast screens) |
| `bg-yellow` | `#F5A820` | Alternate background (episode variant) |
| `bg-lavender` | `#9090CC` | Third background variant |
| `bg-coral` | `#F08060` | Bottom strip accent, highlights |
| `bg-ink` / `text-ink` | `#1C1C1E` | Text, play button, dark elements |
| `bg-white` | `#FFFFFF` | Cards, nav bar |

### Typography
- **Font**: Heebo (Hebrew + Latin, loaded via `next/font/google`)
- **Weights used**: 400 (body), 700 (bold), 900 (display headings)
- **Headings**: Very large, very bold (900 weight), white on colored bg
- **Subheadings**: Medium weight, smaller, white/light
- **Labels**: Small, medium weight (e.g. "פודקאסט לילדים", episode number)

### Layout Patterns
- **Full-bleed colored background** per screen (blue, yellow, or lavender)
- **Logo** centered near top, in wobbly display style
- **Giant bold title** — 2–3 words, `text-4xl`/`text-5xl`, `font-black`
- **Play button** — large circle, near-black `bg-ink`, centered on screen
- **Illustration** — cartoon characters pinned to the bottom of the screen
- **Bottom edge** — layered coral/salmon strip below main content color
- Use `pb-24` on page content to clear the floating home button

### Component Conventions
- Big tap targets for children — buttons min `h-16`
- No dense text or small UI elements
- Illustrations from the brand sit at `bottom-20` (above nav), `absolute` positioned
- Mobile-first, portrait orientation assumed
