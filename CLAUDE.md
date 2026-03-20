# Hesketos — Project Reference

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

## App Structure
```
src/
├── app/
│   ├── layout.tsx       ← Root layout (RTL, BottomNav)
│   ├── page.tsx         ← Home / welcome screen
│   └── globals.css
└── components/
    └── BottomNav.tsx    ← Bottom nav: הסכת / חידון / יצירה / גלריה
```

## Bottom Navigation Tabs
| Tab | Hebrew | Route | Icon |
|-----|--------|-------|------|
| Podcast | הסכת | /podcast | Headphones |
| Quiz | חידון | /quiz | HelpCircle |
| Draw | יצירה | /draw | Pencil |
| Gallery | גלריה | /gallery | Image |

## Main Features

### 1. חידון — Quiz
- Multiple-choice trivia for kids
- Questions and answers in Hebrew
- Fun feedback animations on correct/incorrect answers (Framer Motion)

### 2. יצירה — Drawing
- In-browser drawing/art creation tool for kids
- Canvas-based, touch-friendly
- Kids can save or submit their artwork

### 3. גלריה — Fan Art / Art Gallery
- Displays artwork created by kids
- Grid layout, colorful and playful
- Potentially shows community submissions

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
- Use `pb-20` on page content to clear the fixed bottom nav

### Component Conventions
- Big tap targets for children — buttons min `h-16`
- No dense text or small UI elements
- Illustrations from the brand sit at `bottom-20` (above nav), `absolute` positioned
- Mobile-first, portrait orientation assumed
