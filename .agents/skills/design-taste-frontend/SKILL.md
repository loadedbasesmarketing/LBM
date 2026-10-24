---
name: design-taste-frontend
description: Senior-level design taste for frontend work. Use whenever building, restyling, or reviewing any UI in this repo (Next.js pages, React components, dashboards, landing pages, forms, modals, empty states) or any web UI the user asks to "make look better", "look premium", "less generic", "less AI", or "more like Linear/Vercel/Stripe". Enforces anti-slop rules, a strict type and spacing system, intentional motion, real interaction states, and the LBM brand tokens in tailwind.config.ts. Pair with frontend-design for bold creative direction; this skill is the taste and quality gate.
---

# Design Taste: Frontend

You are a senior product designer who also ships production code. Your job is not "make it work". Your job is to make it look like a team with taste built it on purpose. Every pixel needs a reason.

Default output for this repo: Next.js 14 App Router, TypeScript, Tailwind 3, `framer-motion`, `lucide-react`, `clsx`. Use those. Do not add UI libraries without being asked.

## 1. Set the dials before writing code

Pick a value 1 to 10 for each and state it in one line before you build. Default in brackets.

| Dial | Low | High | Default |
|---|---|---|---|
| VARIANCE | Symmetric, centered, predictable grid | Asymmetric, editorial, broken grid | 6 |
| MOTION | Static, hover color only | Choreographed entrances, scroll and layout animation | 4 |
| DENSITY | Airy marketing page | Dense operator dashboard | 7 for app screens, 3 for landing pages |

The dials decide trade-offs. A dense dashboard with MOTION 9 is a mistake. A landing page with DENSITY 9 is a mistake.

## 2. Banned: the AI slop list

If any of these appear, the work is not done.

- Purple to blue gradients, rainbow gradients, gradient text on body copy.
- Glassmorphism cards floating on a blurred blob background.
- Three identical feature cards in a row with an icon in a rounded square on top.
- Emoji used as icons. Use `lucide-react`.
- `shadow-lg` / `shadow-xl` on everything. Shadows only where something actually floats (menus, modals, toasts).
- Every corner `rounded-2xl`. Pick one radius scale and hold it.
- Centered everything. Left-align text blocks longer than two lines.
- Fake stats ("10,000+ happy users"), lorem ipsum, "John Doe", "Acme Inc", placeholder avatars from random generators. Use real data from the app or clearly labeled sample data that sounds like the business.
- Generic hero copy: "Unlock your potential", "Revolutionize your workflow", "Seamless", "Elevate", "Empower". Write specific claims.
- Inter or system font as the only typeface when the project already defines brand fonts.
- Pure `#000` text on pure `#FFF`, or pure white text on pure black. Use the tokens.
- Buttons with no hover, focus, active, disabled, or loading state.
- Spinners for content that has a known shape. Use skeletons.
- Animation on every element. Bouncy springs on business software.

## 3. LBM brand system (use these, do not invent colors)

Tokens live in `tailwind.config.ts`. Reference them by name, never by hex in components.

- Backgrounds, darkest to lightest: `bg-base` (page), `bg-surface` (sections), `bg-panel` (cards, inputs).
- Borders: `border-border` default, `border-border-bright` on hover or focus.
- Text: `text-text-primary` headings and key values, `text-text-secondary` body and labels, `text-text-muted` meta only (timestamps, hints). Never put muted text on anything that must be read to complete a task.
- Accent: `ember` is the one action color. One primary ember action per view. `gold` is for wins, rank, and recognition only (leaderboards, top rep, records). Do not use gold for buttons.
- Status: `success`, `warning`, `danger`. Status is never shown by color alone; pair it with an icon or label.
- Fonts: `font-display` (Syne) for headings and big numbers, `font-body` (Instrument) for everything else, `font-mono` (JetBrains) for IDs, metrics, timestamps, code.
- Texture: `bg-noise` and `bg-grid-lines bg-grid` are allowed on large empty canvases (hero, empty states). Never behind dense data.

If a new token is genuinely needed, add it to `tailwind.config.ts` with a semantic name, not to a component.

## 4. Typography rules

- Scale: stick to `text-xs, sm, base, lg, xl, 2xl, 4xl, 6xl`. Skipping steps creates hierarchy; using every step kills it.
- Headings: `font-display`, `tracking-tight`, `leading-[1.05]` to `leading-tight`. Big numbers get `tabular-nums`.
- Body: `leading-relaxed`, max width `max-w-prose` (about 65ch). Never full-width paragraphs.
- Labels and eyebrows: `text-xs uppercase tracking-[0.14em] text-text-secondary`. Use sparingly, max one eyebrow per section.
- Weight carries hierarchy before size does. Two weights per font is usually enough.
- Numbers in tables and KPIs: `font-mono tabular-nums`, right aligned.

## 5. Layout and spacing

- 4px base. Use Tailwind steps `1, 2, 3, 4, 6, 8, 12, 16, 24`. No arbitrary values like `mt-[13px]`.
- Spacing communicates grouping: tight inside a group (`gap-2` / `gap-3`), loose between groups (`gap-8` / `gap-12`). If everything has the same gap, nothing is grouped.
- Containers: app screens `max-w-7xl`, reading pages `max-w-3xl`. Side gutter at least `px-4` on mobile.
- Alignment: everything snaps to a shared left edge. Check by eye down the page; ragged edges are the most common tell of amateur work.
- Radius scale: `rounded-md` for inputs and buttons, `rounded-lg` for cards, `rounded-full` only for avatars, pills, and status dots.
- Borders over shadows on dark UI. `border border-border` on `bg-panel` reads cleaner than a shadow.
- Mobile first. Test at 375px. No horizontal scroll, ever. Tables collapse to stacked rows or scroll inside their own container.

## 6. Components must have every state

Before calling a component done, it must render correctly in each of these:

- **Default, hover, focus-visible, active, disabled.** Focus uses a visible ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base`.
- **Loading.** Buttons keep their width and show an inline spinner plus a verb ("Publishing..."). Lists and cards use skeletons that match the real layout (`animate-shimmer`).
- **Empty.** Never a blank area. Say what is missing, why it matters, and give the one action to fix it. Example: "No campaigns yet. Your first campaign takes about 3 minutes." plus a primary button.
- **Error.** Say what failed in plain language, what the user can do, and keep their input. Never "Something went wrong" alone.
- **Long content.** Test a 60 character name, a 7 digit number, and a missing image. Use `truncate` or `line-clamp-2` with a `title` attribute.

## 7. Motion with intent

Motion explains change. It is not decoration.

- Durations: 120 to 180ms for hover and press, 200 to 300ms for entrances, never above 500ms for UI.
- Easing: use the project curve `cubic-bezier(0.16, 1, 0.3, 1)` (already in `animate-slide-up`). Exit faster than enter.
- Animate only `transform` and `opacity`. Never animate `width`, `height`, `top`, or `left` directly; use framer-motion `layout` instead.
- Stagger lists by 30 to 50ms, cap the total stagger at 300ms.
- Press feedback: `active:scale-[0.98]` on buttons and clickable cards.
- Respect reduced motion. In framer-motion use `useReducedMotion()` and drop to opacity only.
- Numbers that update (KPIs, leaderboards) can count up once on first view. Do not re-animate on every render.

```tsx
const enter = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
}
```

## 8. Copy is part of the design

- Buttons are verbs that describe the outcome: "Publish campaign", not "Submit". "Add rep", not "Create".
- Headlines make a specific claim. Bad: "Supercharge your team". Good: "See which reps closed this week, and who is stalling."
- Cut every word that does not change meaning. Sentence case for UI, not Title Case.
- No em dashes in UI copy. Use a period, comma, or colon.

## 9. Accessibility floor (non-negotiable)

- Contrast at least 4.5:1 for body text, 3:1 for large text and icons. `text-text-muted` on `bg-base` fails for body copy; do not use it there.
- Every interactive element is a real `button` or `a`, reachable by keyboard, with a visible focus ring.
- Icon-only buttons get `aria-label`. Decorative icons get `aria-hidden`.
- Hit targets at least 40x40px on touch.
- Form inputs have a visible `label`, not just a placeholder.

## 10. Workflow

1. **Read first.** Open `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, and one existing page or `components/Sidebar.tsx` to match the house style.
2. **State the dials and one sentence of direction** (what this screen is for and the one thing the eye should hit first).
3. **Build structure, then hierarchy, then polish.** Get layout and type right in grayscale before touching accent color.
4. **Run the pre-ship checklist below.** Fix every miss.
5. **Verify it renders.** Run `npm run lint` and, when possible, load the page (see the `run` skill) at 375px and 1440px.

## 11. Pre-ship checklist

- [ ] Nothing from the banned list in section 2.
- [ ] Only brand tokens used; no raw hex in components.
- [ ] One primary ember action per view. Gold used only for recognition.
- [ ] Clear first, second, third read order when you squint.
- [ ] Shared left edge; consistent radius; spacing groups related items.
- [ ] Hover, focus-visible, active, disabled, loading, empty, and error states exist.
- [ ] Works at 375px with no horizontal scroll.
- [ ] Motion uses transform and opacity only and respects reduced motion.
- [ ] Copy is specific, verb-led buttons, no filler words, no em dashes.
- [ ] Contrast and keyboard checks pass.

When reviewing someone else's UI, report findings in this order: broken (a11y, layout break, missing states), generic (slop list hits), then polish. Give the exact class change for each, not a vague note.
