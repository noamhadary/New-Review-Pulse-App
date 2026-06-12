# Review Pulse — Design System (Master)

Source of truth for UI work in this repo. Page-specific overrides go in `design-system/pages/<page>.md` and take precedence over this file.

## Identity

- **Product**: Hebrew-first SaaS for review/reputation management (dashboard, reviews inbox, analytics, reports).
- **Direction**: RTL everywhere (`<html lang="he" dir="rtl">`, `body { direction: rtl }`). UI copy is Hebrew; emails, prices (₪), and brand names stay LTR inline.
- **Style**: clean data dashboard on light surfaces, with dark navy→purple gradient "hero" bands for page headers and marketing sections.

## Color tokens (defined in `src/index.css` @theme)

| Role | Token | Hex |
|---|---|---|
| Primary (brand navy) | `--color-primary` | `#00113a` |
| Primary container | `--color-primary-container` | `#002366` |
| Secondary (brand purple, accents/CTA) | `--color-secondary` | `#871dd3` |
| Background / surface | `--color-background` | `#f8f9fa` |
| Card surface | `--color-surface-container-lowest` | `#ffffff` |
| Body text | `--color-on-background` | `#191c1d` |
| Muted text | `--color-on-surface-variant` | `#444650` |
| Faint text / captions | `--color-outline` | `#757682` |
| Borders | `--color-outline-variant` | `#c5c6d2` (commonly used at 30% alpha) |
| Error | `--color-error` | `#ba1a1a` |
| Success (ad-hoc) | — | `#16a34a` |
| Warning/stars (ad-hoc) | — | `#f59e0b` |

Signature gradient: `linear-gradient(135deg, #00113a 0%, #871dd3 100%)` (hero bands, primary CTAs, plan highlights).

Prefer Tailwind theme classes (`bg-primary`, `text-on-surface-variant`, …) over repeating hex values in `style={}`.

## Typography

- **Stack**: `'Plus Jakarta Sans', 'Heebo', sans-serif`. Plus Jakarta Sans has no Hebrew glyphs — Heebo renders all Hebrew text; keep both imports in `src/index.css`.
- Page titles: `text-4xl/5xl font-extrabold tracking-tight`; KPI values: `text-5xl font-extrabold`; body: `text-sm`/`text-base`; captions: `text-xs`.

## Icons

- Material Symbols Outlined (ligature font, `display=block` to avoid ligature-text flash). Active/selected state uses `.icon-filled`.
- Never emojis as icons.

## Components & patterns

- **Cards**: white, `rounded-xl`/`rounded-2xl`, `border 1px rgba(197,198,210,0.3)`, soft shadow `0 4px 20px rgba(0,0,0,0.05)`.
- **Buttons**: `rounded-xl font-bold text-sm`, purple or navy-purple gradient for primary, `bg-white/10 + border-white/25` ghost variant on dark bands; always `cursor-pointer`, transition 150–300ms.
- **Layout**: fixed TopBar `h-28` (dark `#002366`), Sidebar `w-64` fixed on the **right** (RTL), content offset `pt-28 md:pr-64`. If TopBar height changes, update Sidebar `top-28`/`h-[calc(100vh-112px)]` and Layout `pt-28` together.
- **Active nav**: purple tint bg `rgba(135,29,211,0.08)` + purple text + filled icon.

## Accessibility baseline (enforced globally in `src/index.css`)

- `:focus-visible` → 2px purple outline. Do not add `outline-none` without a visible replacement.
- `prefers-reduced-motion: reduce` → animations/transitions effectively disabled. New animations must not bypass this.
- Form fields: associate `<label htmlFor>` with input `id`. LTR-content inputs (email, URL, phone) get `direction: ltr`.
- Touch targets ≥ 44px on mobile; min 4.5:1 contrast for text.

## Anti-patterns (avoid)

- Hardcoding new hex values instead of the tokens above.
- Physical-direction utilities (`ml-/mr-/pl-/pr-/left-/right-`) for new code — prefer logical ones (`ms-/me-/ps-/pe-/start-/end-`) so RTL stays correct.
- JS `onMouseEnter`/`onMouseLeave` style mutation for hover — use CSS `hover:` classes.
- More than 1–2 ambient animations per view; infinite animations on data screens.
