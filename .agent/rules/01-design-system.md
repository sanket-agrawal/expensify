# Design system: "chill holiday, but premium"

Goal: a polished, calm holiday app on the level of Splitwise or Airbnb. It must NOT look like a generic AI-generated template.
If this file conflicts with the generic guidance in `skills/frontend-design`, this file wins.

## Mood
Golden-hour beach, calm sea, relaxed. Airy, generous whitespace, soft depth. Warm and friendly, not corporate.

## Colour tokens
Define as CSS variables and in the Tailwind config. Never hard-code hex values in components.

| Token | Hex | Use |
|---|---|---|
| sand | `#FBF7F0` | page background |
| card | `#FFFFFF` | surfaces |
| ink | `#1F2A33` | primary text |
| muted | `#6B7A86` | secondary text |
| lagoon | `#1FA3A3` | primary actions |
| deep-sea | `#0E5A6B` | headings accents, pressed states |
| coral | `#FF7A59` | accent, "you owe" |
| sunshine | `#FFC857` | highlights |
| seafoam | `#BFE9DD` | positive tint, "you are owed" |
| sky | `#CFE8F5` | soft tint |

- Positive (owed to you) uses seafoam and teal. Negative (you owe) uses coral. Avoid harsh red and green.
- Category chips use soft tinted backgrounds with a darker icon colour from the same hue.
- Dark mode is "night at the beach": deep navy `#0B1D26` background, never pure black. Tokens flip through CSS variables.
- Text and controls meet WCAG AA contrast in both themes.

## Typography
- Display: **Fraunces** for headings and big numbers.
- UI: **Plus Jakarta Sans** for everything else.
- Self-host with `@fontsource` (no Google Fonts requests).
- All money uses tabular numerals (`font-variant-numeric: tabular-nums`).
- Sentence case everywhere. Avoid ALL CAPS labels and tiny eyebrow labels above headings.
- Do not highlight a single word in a headline with a different colour or italic.

## Shape and depth
- Radii 16 to 24px on cards and sheets, full pill on chips and buttons. Vary radius by hierarchy, not one value everywhere.
- Soft layered shadows tinted teal (for example `0 8px 24px -8px rgba(14,90,107,.18)`), not flat grey.
- Subtle paper or grain texture on the page background.
- Dashboard hero has a hand-built wavy SVG divider. Empty states use hand-built SVG illustrations (sun, waves, palm, sandals). No stock illustrations.

## Do not
- Purple or indigo gradients, generic glassmorphism blobs, default Tailwind blue buttons.
- The "SaaS landing" look: hero plus three identical feature cards plus gradient CTA.
- Emoji as a design element (trip emoji chosen by the user is fine).
- Identical grey-shadowed card grids for everything.
- Fade-and-slide-up on every section, or hover animations on every card.

## Motion
- Purposeful and calm. Spring-like easing, short durations (150 to 300ms).
- Allowed: count-up on totals, category icon pop-in when detected, bottom sheet slide, page transitions, skeleton loaders.
- One orchestrated moment on the dashboard load is better than many small effects.
- Always respect `prefers-reduced-motion`.

## Mobile first (375px baseline)
- Bottom tab bar, a floating "Add expense" button, thumb-reachable primary actions.
- Bottom sheets instead of centred modals.
- Respect safe-area insets (`env(safe-area-inset-*)`).
- Touch targets at least 44px.
- Desktop: centre the app in a comfortable max width with a two-column layout where it helps. Do not just stretch the mobile layout.

## Reusable components (build once, reuse everywhere)
Button, IconChip, Avatar (coloured initials), MoneyText, Card, BottomSheet, Toast, EmptyState, Skeleton, SegmentedControl, PhotoGrid, Lightbox.

## Copy
- Plain, friendly, specific. A button says what it does: "Save expense", "Mark as paid".
- Keep an action's name consistent through the flow (button "Save expense" gives toast "Expense saved").
- Errors say what went wrong and how to fix it. Empty states invite an action ("No expenses yet. Add the first bill.").

## Accessibility
Visible focus rings, labelled inputs, keyboard-navigable sheets and lightbox (Esc closes, focus is trapped and restored), alt text on bill photos.
