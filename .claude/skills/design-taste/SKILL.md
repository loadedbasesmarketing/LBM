---
name: design-taste
description: Use for any website, landing page, portfolio, dashboard or UI build, including single sections, components and redesigns, and whenever the user says "make it look better", "less generic", "looks AI-made" or "make it look designed". Runs a reference-driven design process built on the Designeer catalogue (designeer.xyz), with an AI-slop checklist that must pass before anything is shown.
---

# Design taste

Goal: every page you ship looks like a person with taste designed it, not like the default output of a model. This skill is a process. Follow the steps in order. Do not skip to building.

## Step 0. Read, in this order

1. `taste.md`: the user's own approvals and rejections. **It outranks every other file in this skill.** If it contradicts anything below, it wins.
2. `references/principles.md`: what the best curated sites share, with numbers.
3. `references/ai-slop-tells.md`: the patterns that make a site look AI-made, plus the 8-point checklist.
4. `references/directions.md`: the named visual directions.
5. `references/sources.md`: where to find references, by use.

## Step 1. Pick ONE direction and say why

Choose exactly one direction from `directions.md`. In two or three sentences, tell the user:
- which direction
- why it fits this audience, offer and goal (what the visitor must do)
- which direction you rejected and why

Never blend two directions. If the user has a brand already (logo, colours, fonts), the direction must work with it. Say how.

## Step 2. Pull two or three real references

Open the galleries that `directions.md` lists for that direction (links are in `sources.md`). Pick two or three live sites that solve a problem this build has. Screenshot them at 1440 wide if you can browse; if a gallery blocks you, say so and ask the user for screenshots. Do not invent a reference you did not look at.

## Step 3. Write the take/leave brief

Copy `prompts/reference-brief.md`, fill it in, and show it to the user before building. Patterns only: never copy assets, logos, photography, illustrations or copy.

## Step 4. Build, in this order

1. **Type first.** Set the families, weights, body size, the H1 size and the full scale. Check the H1-to-body ratio against `principles.md`.
2. **Spacing second.** Section padding, gutters, line length (55 to 75 characters for body copy), vertical rhythm.
3. **Colour third.** Background, text, one accent. Count every distinct colour; stay inside the direction's budget.
4. **Layout last.** Only now decide grid, hero arrangement, section order.

Motion is added after layout, inside the motion budget from the brief. Write copy with specific nouns and numbers from the user's real business; if you do not have them, ask instead of writing filler.

## Step 5. Screenshot at 1440 and 390 wide

Render the page and capture both widths, full page. With Playwright (pre-installed in Claude Code cloud sessions, `require('playwright')`):

```js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [1440, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: w === 390 ? 844 : 900 } });
    await p.goto(process.argv[2], { waitUntil: 'networkidle' });
    await p.screenshot({ path: `shot-${w}.png`, fullPage: true });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(w, overflow ? 'HORIZONTAL SCROLL: fix it' : 'ok');
  }
  await b.close();
})();
```

Look at both screenshots yourself. At 390: H1 must not break mid-word, tap targets at least 44px tall, no horizontal scroll, side gutter at least 16px.

## Step 6. Run the checklist and fix every hit

Run the 8-point checklist at the bottom of `ai-slop-tells.md` against the screenshots and the code. Any "yes" is a fail. Fix it, re-screenshot, re-run. Only show the user the page once every answer passes. When you show it, include the brief, both screenshots and the checklist results.

## Step 7. Log taste

When the user approves or rejects anything (a font, a colour, a section, a whole page), append one line to `taste.md` under Approved or Rejected:

`YYYY-MM-DD | "<what they said>" | Rule: <the rule it implies>`

Do this in the same turn, before continuing. Rules must be checkable ("no serif headlines on recruiting pages"), not moods ("make it nicer").
