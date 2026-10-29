# AI-slop tells

A tell is a default that a model reaches for when nobody made a decision. One tell on its own can be a choice. Three together read as "generated". The curated sites in `principles.md` sometimes use one tell; almost none stack them. The clearest stacked example in the study is motionsites.ai (glowing gradient headline, glowing pill CTA, pill badge, "UNLOCK YOUR AI DESIGN SUPERPOWERS").

Each tell has a name, what it looks like, how to detect it in code, and the fix.

---

### T1. Purple-to-blue or blue-to-pink gradient
- **Looks like:** hero background, headline fill or button fill running violet to blue, or blue to pink.
- **Detect:** `linear-gradient` or `radial-gradient` with two or more stops in hue 200 to 330. Tailwind `from-purple-* to-blue-*`, `from-indigo-* to-pink-*`, `via-fuchsia-*`.
- **Fix:** a flat colour from the direction's palette. If the brand genuinely is a gradient (MeltKit sells gradient backgrounds), use it once, on the product, never on chrome.

### T2. Glow behind buttons or cards
- **Looks like:** a coloured halo, `box-shadow: 0 0 40px <brand colour>`, or a blurred blob behind the hero product shot (Wope's purple bloom).
- **Detect:** `box-shadow` with 0 offset and 10px+ blur, or `filter: blur()` on an absolutely positioned coloured div.
- **Fix:** no shadow, or a neutral shadow under 8px blur with y-offset. Separate with a hairline or a background step instead.

### T3. Glowing pill button
- **Looks like:** fully rounded button with a gradient fill and an outer glow, often with a sparkle or arrow icon.
- **Detect:** `rounded-full` plus a gradient plus T2.
- **Fix:** pill shape is fine (20 of 56 curated sites use it). Remove the gradient and the glow: solid fill, one colour, text label.

### T4. One font, one weight, no scale
- **Looks like:** Inter, Roboto, Arial or `system-ui` everywhere, headings just bolder body, H1 under 3x body, tracking untouched.
- **Detect:** one `font-family`; H1/body ratio under 3; display `letter-spacing` 0 or `normal`; only weights 400 and 700.
- **Fix:** pick a display face and a text face (see `directions.md`). H1 around 4 to 5x body, line height 0.95 to 1.1, tracking -0.01 to -0.04em. If Inter must stay, tune it the way Authier does: weight 670, -0.075em.

### T5. Emoji used as icons
- **Looks like:** 🚀 ⚡ 🎯 ✨ 💡 at the start of feature titles or list items.
- **Detect:** any emoji codepoint inside headings, buttons, list items or nav.
- **Fix:** numbers (01, 02, 03), a single-weight icon set used consistently, or nothing. Runner uses plain numbered circles. Tachyon uses Ω as a bullet: a typographic mark, not an emoji.

### T6. Centred hero, two buttons, screenshot underneath, all generic
- **Looks like:** centred category headline ("The all-in-one platform for..."), grey subline, "Get started" plus "Learn more", then a floating dashboard with placeholder data.
- **Detect:** centred H1 and two equal-weight buttons and a screenshot whose content is lorem, "Acme" or round fake numbers.
- **Fix:** the layout alone is not the tell. Zed and Gaia use it exactly; Causal uses it with one button. What saves them is a specific headline, one dominant CTA, and a product shot full of real content. Change at least two of those three, or go left-aligned.

### T7. Row of three icon cards
- **Looks like:** three equal boxes, each with a rounded icon tile, a 2-word title and two lines of text.
- **Detect:** a 3-column grid of identical cards with an icon at the top of each.
- **Fix:** numbered steps in a line (Runner), text columns split by hairlines with no icons (Zed), a list (Tachyon), or one real screenshot per feature.

### T8. Same big radius and shadow on everything
- **Looks like:** every card, image, button and input at `rounded-2xl` with `shadow-lg`.
- **Detect:** one radius at 16px+ and one shadow token applied to more than 70% of boxed elements.
- **Fix:** one radius family chosen for the direction (square on Tachyon, Harish and Zed; small 4 to 8px on Tequs; pill only on buttons for Runner), and shadows only where something floats.

### T9. Endless decorative animation
- **Looks like:** floating blobs, gradients that shift forever, marquee logos, every section fading up on scroll, shimmer on text.
- **Detect:** `animation-iteration-count: infinite` on decorative elements; more than one scroll-reveal per viewport; durations over 600ms on UI.
- **Fix:** UI transitions 150 to 300ms (median on curated sites: 220ms). One hero moment at most. Respect `prefers-reduced-motion`. Add a pause control if anything loops (Baked Design, Little Website Co.).

### T10. Hype verbs in copy
- **Looks like:** "Revolutionize", "Supercharge", "Unlock", "Empower", "Seamless", "Elevate", "Unleash", "Next-gen", "Game-changing", "New era", "Effortless", "Transform your".
- **Detect:** case-insensitive search of all visible copy for those stems.
- **Fix:** a number or a scene. "Cut energy use by up to 80 percent." (Tequs), "30x cheaper than Datadog" (Better Stack), "Nobody has to ask when the last feed was." (Gaia).

## Added from the study

### T11. Gradient-filled headline text
- **Looks like:** `background-clip: text` with a multi-hue gradient on the H1 (motionsites.ai, Wope's chrome-to-grey).
- **Detect:** `bg-clip-text text-transparent` or `-webkit-background-clip: text` on headings.
- **Fix:** solid colour. Emphasise one word with weight, italics or a single accent colour (Harish sets "alone." in green italic).

### T12. Pill badge above the H1
- **Looks like:** a small rounded tag over the headline: "✨ New", "Now with AI", "FRESH DROPS EVERYDAY".
- **Detect:** a `rounded-full` element with under 5 words directly above the H1.
- **Fix:** delete it, or turn real news into a full-width text bar (Zed's "News: Delta is now in public beta", Spectrum.Life's acquisition note).

### T13. Unverifiable social proof
- **Looks like:** "Trusted by 10,000+ teams", grey placeholder logos, testimonials from "Sarah J., CEO" with a stock avatar.
- **Detect:** round numbers with "+", logos that are not real customers, testimonials without full name, role and company.
- **Fix:** names that can be checked (Tachyon's Los Alamos, SLAC, Brookhaven; s.engineering's client list), or exact ratings with counts (Voice Tag Gods: "4.7 out of 5, 28 reviews"). If the user has none yet, leave the section out.

### T14. Glass panels everywhere
- **Looks like:** frosted translucent cards stacked on a gradient.
- **Detect:** `backdrop-filter: blur()` on more than the nav and one overlay.
- **Fix:** keep blur for a sticky nav over imagery or one overlay. Cards get solid fills.

### T15. Intro loader on a page that has to convert
- **Looks like:** a full-screen loader, counter or blank intro before content.
- **Detect:** nothing readable in the first viewport 3 seconds after load. At 5 seconds after load, Planes, Zero University and Vlad Prozapas still showed intros.
- **Fix:** content first. Save intros for portfolios where the intro is the work.

---

## Pre-show checklist

Run this on the 1440 and 390 screenshots and on the code. **Every answer must be NO.** Any YES: fix it, re-screenshot, run it again.

1. Is there a purple, violet, blue-to-pink or multi-hue gradient anywhere, or gradient-filled text? (T1, T11)
2. Does any element have a coloured glow: zero-offset shadow with 10px+ blur, or a blurred colour blob? (T2, T3)
3. Is the H1 under 3x the body size, or is the whole page one family at default tracking? (T4)
4. Is there an emoji in a heading, button, nav item or list bullet? (T5)
5. Does the page have more than one saturated accent hue, or use the same radius and shadow on over 70% of boxes? (T8, principles section 2)
6. Is there a row of three icon cards, or a pill badge above the H1? (T7, T12)
7. Does any visible copy contain revolutionize, supercharge, unlock, empower, seamless, elevate, unleash, next-gen, game-changing, transform, or an unverifiable "10,000+" claim? (T10, T13)
8. Does anything animate forever, take over 600ms on UI, or block the content behind a loader, or does the 390 view scroll sideways? (T9, T15)
