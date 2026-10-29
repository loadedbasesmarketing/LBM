# Sources

**Read this first.** designeer.xyz sits behind a Cloudflare bot check that blocked every automated request on 2026-10-29 (curl, fetch and headless browser all got HTTP 403). So the Designeer listing itself could NOT be read. The names below are spelled the way each site names itself, and the links are the live URLs that loaded during the study. Before relying on "exactly as Designeer lists them", open https://designeer.xyz in a normal browser and reconcile; update this file if Designeer spells or links anything differently.

Column "Status": **studied** = 12 latest featured entries opened, screenshotted and measured; **skimmed** = catalogue browsed, nothing measured; **blocked** = could not load.

---

## Finding layout and visual references (Inspiration)

| Use it when you need | Name | Link | Status |
|---|---|---|---|
| Live sites across every style; fastest general scan | Curated Design | https://www.curated.design | studied |
| Restrained, type-led and service-business sites; filter by tag (Real estate, Consulting, Food and drink, Architecture and interior design) | Minimal Gallery | https://minimal.gallery | studied |
| Startup and product sites with a one-line positioning under each | SEESAW | https://www.seesaw.website | studied |
| Hero sections only: the first viewport, side by side | Supahero | https://supahero.io | studied |
| Dark-background sites | Dark Mode Design | https://www.darkmodedesign.com | studied |
| One-page sites; filter by genre (Service, Restaurant, Event, SaaS) and style (Bold, Typographic, Minimal) | One Page Love | https://onepagelove.com | studied |
| Filter by style (Typographic, Dark, Fullscreen, Grid, Photographic) and type (Service, Property, Ecommerce) | Httpster | https://www.httpster.net | studied |
| SaaS landing pages only | Saaspo | https://saaspo.com | blocked (Cloudflare 403); open manually |
| Recent design work posted on X: motion, components, brand | Recent (godly.website redirects here) | https://recent.design | skimmed |

## Finding motion references

| Use it when you need | Name | Link | Status |
|---|---|---|---|
| Real app and website interactions as video; "App Sites" for websites, "Shots" for app UI, filter by 108 tags (Bottom Sheet, Blur, Bounce...) | 60fps | https://60fps.design | studied (App Sites) |

## Building components

| Use it when you need | Name | Link | Status |
|---|---|---|---|
| Accessible React components you own the code of: Button, Card, Dialog, Sheet, Tabs, Table, Data Table, Chart, Sidebar, Command, Toast and 50+ more | shadcn/ui | https://ui.shadcn.com | skimmed |
| Unstyled accessible primitives when you want full styling control: Dialog, Dropdown Menu, Navigation Menu, Popover, Tabs, Toast, Tooltip, Toolbar | Radix UI | https://www.radix-ui.com | skimmed |
| Animated React parts: Text Effect, Text Loop, Text Morph, Sliding Number, Animated Number, In View, Transition Panel, Morphing Dialog, Image Comparison, Progressive Blur, Infinite Slider | Motion Primitives | https://motion-primitives.com | skimmed |

Warning on Motion Primitives: its **Glow Effect**, **Spotlight**, **Border Trail**, **Text Shimmer** and **Text Shimmer Wave** produce tells T2, T9 and T11 by default. Do not use them unless the brief justifies it in writing.

Warning on shadcn/ui: the defaults (one radius, one shadow, Inter-like system font) are a starting point, not a design. Restyle the tokens to the chosen direction before using.

## Fonts

| Use it when you need | Name | Link | Status |
|---|---|---|---|
| Free display and text faces with character, free for commercial use (Clash Display, Cabinet Grotesk, Satoshi, General Sans, Switzer, Supreme, Gambetta, Zodiak, Erode, Sentient, Boska, Tanker; 100 families) | Fontshare | https://www.fontshare.com | skimmed (API catalogue read) |
| Self-hosting open-source fonts via npm, including variable versions (Inter, Geist, Geist Mono, Instrument Serif, Fraunces, Newsreader, DM Sans, Bricolage Grotesque, Hanken Grotesk, Schibsted Grotesk, Anton, Bebas Neue; 2,103 families) | Fontsource | https://fontsource.org | skimmed (API catalogue read) |

Install example (Fontsource): `npm i @fontsource-variable/geist` then `import '@fontsource-variable/geist';`. Fontshare serves CSS from `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap`.
