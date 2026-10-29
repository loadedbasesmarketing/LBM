# Principles

Distilled on 2026-10-29 from the 12 most recent featured entries of eight galleries the Designeer catalogue lists: Curated Design, Minimal Gallery, SEESAW, Supahero, 60fps (App Sites), Dark Mode Design, One Page Love and Httpster. That gave 84 unique live sites. Each was loaded in headless Chromium at 1440x900 and again at 390x844, screenshotted, and measured from computed styles. 19 were excluded (bot checks, intro loaders, failed loads), leaving **65 measured sites**. "Headline-led" means the largest text above the fold is at least 40px and at least 2.5x body size: **49 sites**.

Numbers are medians, with the middle half (p25 to p75) in brackets. Site names in brackets are where the pattern was seen.

---

## 1. Type

- **Body text is 16px** (14 to 16). 12 of 65 went to 18 to 24px, mostly portfolios and editorial pages (Felix Haas 24, WAM Studio 20, Cosmos 20, Little Website Co. 20, Sundrop 20). None went above 24px.
- **The H1 is 66px at 1440 wide** (58 to 90). Largest seen: 225px (Omeigo), 148px (Harish), 120px (Hello Abdullah), 119px (Eddie).
- **H1-to-body ratio is 4.6x** (3.7 to 5.3). Under 3x reads as a document; above 7x reads as a poster (Grafik 7.2x, Harish 8.5x, Omeigo 14x).
- **Display line height is 1.0** (0.95 to 1.11). 30 of 49 headline-led sites set it at 1.05 or below. Tightest: 13g at 0.70, Grafik at 0.75, Eddie at 0.80.
- **Display tracking is negative: -0.022em** (-0.036 to -0.01). 38 of 49 tighten it. Heaviest: Authier -0.075em, Omeigo -0.066em, Vercel -0.06em, Tachyon and Spectrum.Life -0.05em.
- **Display weight is 400 or 500 on 32 of 49 sites.** Only 14 go to 600+. Big and regular beats big and bold (Runner, Tachyon, Intent at 380, Zed at 340, Google Health, Harish).
- **Two families is the norm.** 2 families on the median site (1 to 2). Common pairings seen:
  - display face plus a neutral grotesk (Spectrum.Life: Raptor plus DM Sans; DG Cinema: Benzin plus Inter; 13g: Ppcirka plus Spline Sans)
  - grotesk plus a mono for labels and data, seen on 10 sites (Tachyon: FK Grotesk SemiMono; Runner: Geist Mono; Anubi: IBM Plex Mono; Eric Jordan: Chivo Mono; Atlas: Apercu Mono; Planes: Geist Mono; Autorouter, Authier, Zed, Mike's CV)
  - serif display plus sans body (Harish: Playfair plus Lora; Zed: Plex Serif plus Zed Mono; Intent: ABC Arizona plus Inter; Eric Jordan: Instrument Serif)
- **Inter is not banned. Default Inter is.** Inter was the body face on 12 of 65 sites, but where it carried the headline it was tuned: Authier at weight 670 and -0.075em, Screen at Inter Display 700 and -0.05em.
- **Paragraph line height is 1.44** (1.30 to 1.54). Paragraph width is about **27em** (22 to 34), roughly 55 to 70 characters.
- **At 390 wide the H1 is about 40px** (34 to 48). It drops 35 to 45% from desktop, not 70%.

## 2. Colour

- **Neutrals plus at most one saturated hue.** Among each site's five largest background colours, 38 of 65 had no saturated colour at all and 20 had exactly one hue. Only 7 used two or more. (Sites declaring colours in oklch/oklab, such as Zed, were counted as neutral, so this slightly undercounts accents.)
- **The accent is used small or as a whole field, not sprinkled.** Small: Tequs blue on one button and a dot, Lando Norris lime on the Store button, Harish green on one word. Whole field: Runner brown, Tachyon maroon, Spectrum.Life lilac panel.
- **Dark is common, not default.** 18 of 65 had a dark page background (Better Stack, Tequs, Harish, Little Website Co., DG Cinema, Cosmos, Screen, Authier).
- **Off-white and off-black are common.** Cream panel on Tachyon (rgb 250,247,239), light grey on Causal (rgb 249,249,249), near-black on Harish (rgb 10,12,9) with cream type.

## 3. Imagery

- **Real product with real-looking data.** Causal's canvas shows a "Harbour Coffee" rebrand plan, Better Stack shows live traces, Zed shows an actual diff, Wope shows a keyword table with volumes and CPCs, AskAiRank shows "81.3%" and "#3 of 7".
- **Real people doing the real thing.** Driessen Architectuur shows a hand sketching a plan, Tequs a hand in warm light, Voice Tag Gods portraits of the actual vocalists, Google Health a person in motion, Grafik a black-and-white portrait.
- **Proof as names, not counts.** Tachyon: "Built by a team from" plus Los Alamos, SLAC, Brookhaven, SpaceX. s.engineering lists 15 client names in a sentence. Voice Tag Gods: "4.7 out of 5, 28 reviews" on each card.
- **When there is no photo, one strong graphic system.** Tachyon's overlapping colour shards, Lando Norris's contour lines, Gaia's line-drawn objects.

## 4. Layout

- **Left-aligned heroes slightly outnumber centred ones: 38 to 27.** Centred is fine. Centred plus generic is the problem (see the tells file).
- **One primary action above the fold.** Median 2 bordered or filled buttons in the first viewport, and that count includes the nav CTA. Typical: one filled CTA plus one text link or one ghost button (Runner, Causal, MeltKit, Spectrum.Life, Better Stack).
- **Structure from lines, not boxes.** Hairline dividers instead of cards: Runner's nav column, Zed's three text columns, Tachyon's list with omega bullets.
- **Steps are numbered, not iconed.** Runner: 1 Train, 2 Validate, 3 Deploy, in small text beside the CTA.
- **Buttons: pill or square, chosen once.** Of 56 sites with filled buttons, 20 used pills, 9 used square corners (Harish, Tachyon, Zed, Little Website Co., Jacky Winter), and the rest used 4 to 20px.
- **Header carries a hard contact action for service businesses.** Driessen: phone number button plus Contact. Atomicdust: "Book a call". Tequs: "Get in touch".

## 5. Motion

- **Interface transitions run 150 to 300ms.** The most-used duration on each site had a median of 220ms (150 to 300). 300ms appeared on 37 sites, 200ms on 29, 150ms on 23. Durations of 1000ms or more appeared on only 8 sites.
- **Motion is opt-out on heavy pages.** Baked Design has a "Pause motion" control. Little Website Co. has a pause button on its hero film.
- **Intro loaders cost content.** At 5 seconds after load, Planes, Zero University and Vlad Prozapas still showed a loader or a blank intro. Fine for a portfolio. Wrong for a page that must convert.
- **Motion references** (60fps App Sites, titles as 60fps lists them; the videos were not watched in this study): "Vercel Sticker Drag and Drop Interaction", "X Money Card Envelop Reveal Animation", "Apple Mac Mini Hero Intro Logo Text Animation".

## 6. Copy

- **Buzzwords are almost absent.** Across 84 hero headlines only 2 used them: motionsites.ai ("UNLOCK YOUR AI DESIGN SUPERPOWERS") and Wope ("New Era of SEO Research").
- **Specific numbers do the selling.** Better Stack: "30x cheaper than Datadog". Tequs: "Cut energy use by up to 80 percent." Autorouter: "Cut your AI bill in half." Gaia: "logged in about five seconds". Runner: "1:1 attention at any scale".
- **Headlines describe a scene or an outcome, not a category.** Gaia: "Nobody has to ask when the last feed was." Zed: "Your last next editor". Harish: "I like being alone."
- **The microcopy under the CTA removes the risk.** Gaia: "Free, and no subscription. Not a trial." MeltKit: "$9, one time". Better Stack: "the rest of your contract is on us."
- **Short headlines.** On the 49 headline-led sites the H1 is 5 words at the median (3 to 8). Only 4 ran past 10 words.
