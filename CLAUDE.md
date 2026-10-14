# LBM

Loaded Bases Marketing internal ad ops app. Next.js 14 (App Router), React 18, Tailwind 3, framer-motion, lucide-react.

- `app/` routes: dashboard (`page.tsx`), `campaign/new`, `library`, `schedule`, `settings`, plus `api/generate` and `api/publish`
- `components/` shared UI (`Sidebar.tsx`)
- `.agents/` pipeline agents (forge, looper, publisher, scraper) and skill sources
- Scripts: `npm run dev`, `npm run build`, `npm run lint`

## Design skills: who owns what

Three design skills are installed and their triggers overlap. Use exactly one per surface. Never stack taste and impeccable on the same page.

| Surface | Skill | Use for |
|---|---|---|
| Public-facing marketing pages | `taste` (`design-taste-frontend`) | Recruiting funnels, rep sign-up pages, sales pages, landing pages, one-pagers |
| App UI inside this repo | `impeccable-design` (`impeccable`) | Every route under `app/`, dashboards, forms, settings, leaderboards, rep portal, UI audits and critiques |
| Motion and interaction polish | `emil-kowalski-design` (`emil-design-eng`) | Animations, transitions, hover and press states, toasts. Only after layout is locked |

Rules:

1. Everything under `app/` is app UI. Use `impeccable`. Do not use `taste` here; it is built for marketing sites, not dashboards.
2. A new standalone marketing or recruiting page gets `taste`, start to finish.
3. `emil-design-eng` is a finishing pass, not a design driver. Run it last, and keep motion on `framer-motion`, which is already a dependency.
4. Reviewing or critiquing existing UI: `impeccable` (`audit` / `critique`). Reviewing animations: `emil-design-eng`.
5. `impeccable` downloads its engine binary from its GitHub releases on first run. Ask before running its scripts in a new environment.

## Skills layout

Skill files live in `.agents/skills/<name>/`. `.claude/skills/<name>` are symlinks into them. `skills-lock.json` is managed by the `skills` CLI (`npx skills add` / `npx skills update`). Do not hand-edit skill files; updates will overwrite them and break the lock hash. Impeccable expects its files at `.agents/skills/impeccable`, so do not rename that folder.
