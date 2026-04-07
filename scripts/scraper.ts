#!/usr/bin/env tsx
/**
 * SCRAPER — Product Page → Structured Ad Brief
 *
 * Pipeline Step 1: Fetches product URLs, extracts copy hooks, pricing,
 * headlines, and visual references, then writes structured briefs to
 * /briefs/ for FORGE to consume.
 *
 * Usage:
 *   tsx scripts/scraper.ts --urls "https://example.com/product"
 *   tsx scripts/scraper.ts --urls "https://a.com/p1,https://b.com/p2" --max-hooks 8
 *   tsx scripts/scraper.ts --urls-file ./urls.txt --brand-context "Bold, direct, sports audience"
 */

import fs   from 'fs/promises'
import path from 'path'

// ─── Config ────────────────────────────────────────────────────────────────

const BRIEFS_DIR = path.resolve('./briefs')
const LOG_FILE   = path.resolve('./logs/scraper.log')

const DEFAULT_MAX_HOOKS = 5
const MIN_HOOKS         = 3
const MAX_HOOKS_CAP     = 12

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Brief {
  brief_id:       string
  url:            string
  product_name:   string
  price:          string
  price_flagged:  boolean
  hooks:          string[]
  headlines:      string[]
  visual_refs:    string[]
  tone:           string
  brand_tone:     string
  target_audience: string
  objective:      'AWARENESS' | 'CONSIDERATION' | 'CONVERSION'
  brief_text:     string
  hook:           string          // primary hook — used by FORGE as top-level field
  headline:       string          // primary headline
  visual_notes:   string          // primary visual ref
  scraped_at:     string
}

// ─── Logging ───────────────────────────────────────────────────────────────

async function log(msg: string) {
  const line = `[${new Date().toISOString()}] SCRAPER: ${msg}\n`
  process.stdout.write(line)
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true })
  await fs.appendFile(LOG_FILE, line)
}

// ─── Fetch with timeout + retry ────────────────────────────────────────────

async function fetchPage(url: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer      = setTimeout(() => controller.abort(), 15_000)

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':      USER_AGENT,
          'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control':   'no-cache',
        },
        signal: controller.signal,
        redirect: 'follow',
      })
      clearTimeout(timer)

      if (res.status === 403 || res.status === 401) {
        throw Object.assign(new Error(`Blocked (${res.status})`), { blocked: true })
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      return await res.text()
    } catch (err: unknown) {
      clearTimeout(timer)
      const e = err as { blocked?: boolean; message?: string; name?: string }
      if (e.blocked) throw err                        // don't retry paywalls
      if (e.name === 'AbortError') throw new Error('Timeout after 15s')
      if (attempt === retries) throw err
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
    }
  }
  throw new Error('All retries exhausted')
}

// ─── HTML parsing utilities (no external deps) ─────────────────────────────

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]+)"`, 'i'),
    new RegExp(`<meta[^>]+content="([^"]+)"[^>]+property="${property}"`, 'i'),
    new RegExp(`<meta[^>]+name="${property}"[^>]+content="([^"]+)"`, 'i'),
    new RegExp(`<meta[^>]+content="([^"]+)"[^>]+name="${property}"`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function extractTitle(html: string): string {
  return (
    extractMeta(html, 'og:title') ||
    extractMeta(html, 'twitter:title') ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    ''
  )
}

function extractDescription(html: string): string {
  return (
    extractMeta(html, 'og:description') ||
    extractMeta(html, 'description') ||
    extractMeta(html, 'twitter:description') ||
    ''
  )
}

function extractPrice(html: string): { price: string; flagged: boolean } {
  // Structured data (JSON-LD)
  const jsonLdMatches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
  for (const m of jsonLdMatches) {
    try {
      const obj = JSON.parse(m[1]) as { offers?: { price?: string | number; priceCurrency?: string } | Array<{ price?: string | number; priceCurrency?: string }> }
      const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers
      if (offers?.price) {
        const currency = offers.priceCurrency || 'USD'
        return { price: `${currency} ${offers.price}`, flagged: false }
      }
    } catch { /* skip malformed JSON-LD */ }
  }

  // Common price patterns in HTML
  const pricePatterns = [
    /class="[^"]*price[^"]*"[^>]*>[\s$£€¥]*([\d,]+\.?\d*)/i,
    /itemprop="price"[^>]*content="([\d.]+)"/i,
    /data-price="([\d.]+)"/i,
    /\$\s*([\d,]+\.?\d{0,2})\b/,
    /£\s*([\d,]+\.?\d{0,2})\b/,
    /€\s*([\d,]+\.?\d{0,2})\b/,
  ]

  for (const p of pricePatterns) {
    const m = html.match(p)
    if (m?.[1]) return { price: m[1].replace(/,/g, ''), flagged: false }
  }

  return { price: '', flagged: true }
}

function extractImageAlts(html: string, max = 8): string[] {
  const alts: string[] = []
  const regex = /<img[^>]+alt="([^"]{10,120})"/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null && alts.length < max) {
    const alt = m[1].trim()
    if (!alts.includes(alt)) alts.push(alt)
  }
  return alts
}

function extractHeadings(html: string): string[] {
  const headings: string[] = []
  const regex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null) {
    const text = stripTags(m[1]).trim()
    if (text.length >= 5 && text.length <= 120 && !headings.includes(text)) {
      headings.push(text)
    }
  }
  return headings.slice(0, 10)
}

function extractListItems(html: string): string[] {
  const items: string[] = []
  const regex = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null) {
    const text = stripTags(m[1]).trim()
    if (text.length >= 10 && text.length <= 200 && !items.includes(text)) {
      items.push(text)
    }
  }
  return items.slice(0, 20)
}

// ─── Hook generation from raw text ─────────────────────────────────────────

function deriveHooks(
  title: string,
  description: string,
  headings: string[],
  listItems: string[],
  maxHooks: number
): string[] {
  const candidates: string[] = [
    title,
    description,
    ...headings,
    ...listItems,
  ].filter(Boolean)

  // Score by hook signal words
  const hookSignals = [
    'new', 'free', 'save', 'sale', 'limited', 'exclusive', 'proven',
    'best', 'only', 'now', 'finally', 'secret', 'never', 'always',
    'stop', 'start', 'discover', 'warning', 'attention', 'introducing',
    '%', 'off', 'deal', 'today', 'last chance',
  ]

  const scored = candidates.map((c) => {
    const lower = c.toLowerCase()
    const score = hookSignals.reduce((acc, s) => acc + (lower.includes(s) ? 1 : 0), 0)
    return { text: c, score }
  })

  scored.sort((a, b) => b.score - a.score)

  // Deduplicate and cap
  const seen = new Set<string>()
  const hooks: string[] = []
  for (const { text } of scored) {
    const key = text.toLowerCase().substring(0, 40)
    if (!seen.has(key) && text.length >= 10) {
      seen.add(key)
      hooks.push(text)
    }
    if (hooks.length >= Math.min(maxHooks, MAX_HOOKS_CAP)) break
  }

  return hooks
}

// ─── Tone inference ────────────────────────────────────────────────────────

function inferTone(text: string): string {
  const t = text.toLowerCase()

  if (/luxury|premium|exclusive|elegant|refined|bespoke/.test(t)) return 'Luxury / Premium'
  if (/sport|athletic|performance|fast|race|win|compete/.test(t))  return 'Athletic / High-Energy'
  if (/natural|organic|sustainable|eco|green|clean/.test(t))       return 'Natural / Eco-Conscious'
  if (/tech|smart|ai|digital|innovation|advanced|cutting-edge/.test(t)) return 'Tech / Innovative'
  if (/fun|playful|cool|chill|vibe|fresh|lit/.test(t))             return 'Playful / Youth'
  if (/trusted|proven|expert|professional|certified/.test(t))       return 'Professional / Trust'
  if (/sale|deal|save|cheap|affordable|discount|%/.test(t))         return 'Deal / Value'
  return 'Direct / Neutral'
}

function inferObjective(tone: string, price: string): 'AWARENESS' | 'CONSIDERATION' | 'CONVERSION' {
  if (!price || tone.includes('Deal')) return 'CONVERSION'
  if (tone.includes('Luxury') || tone.includes('Tech')) return 'CONSIDERATION'
  return 'CONVERSION'
}

// ─── Main scrape ───────────────────────────────────────────────────────────

async function scrapeUrl(
  url: string,
  brandContext: string,
  maxHooks: number
): Promise<Brief | null> {
  await log(`Scraping ${url}`)

  let html: string
  try {
    html = await fetchPage(url)
  } catch (err: unknown) {
    const e = err as { message?: string }
    await log(`  ✗ Failed to fetch ${url}: ${e.message}`)
    return null
  }

  const title       = extractTitle(html)
  const description = extractDescription(html)
  const { price, flagged: priceFlagged } = extractPrice(html)
  const imageAlts   = extractImageAlts(html)
  const headings    = extractHeadings(html)
  const listItems   = extractListItems(html)

  const hooks = deriveHooks(title, description, headings, listItems, maxHooks)

  if (hooks.length < MIN_HOOKS) {
    await log(`  ⚠ Only ${hooks.length} hook(s) extracted from ${url} (min ${MIN_HOOKS}) — including anyway`)
  }

  const tone      = inferTone(`${title} ${description} ${headings.join(' ')}`)
  const objective = inferObjective(tone, price)

  const headlines = [
    title,
    ...headings.filter((h) => h !== title),
  ].slice(0, 5)

  const productName = title || new URL(url).hostname

  if (priceFlagged) {
    await log(`  ⚠ Price not found on ${url} — flagged in brief`)
  }

  const briefText = [
    productName,
    price ? `Price: ${price}` : 'Price: NOT FOUND',
    description,
    hooks[0] ? `Lead hook: "${hooks[0]}"` : '',
    brandContext ? `Brand voice: ${brandContext}` : '',
  ].filter(Boolean).join(' | ')

  const briefId = `brief_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  const brief: Brief = {
    brief_id:        briefId,
    url,
    product_name:    productName,
    price:           price || 'NOT FOUND',
    price_flagged:   priceFlagged,
    hooks,
    headlines,
    visual_refs:     imageAlts,
    tone,
    brand_tone:      brandContext || tone,
    target_audience: 'General',
    objective,
    brief_text:      briefText,
    hook:            hooks[0]     || '',
    headline:        headlines[0] || '',
    visual_notes:    imageAlts[0] || '',
    scraped_at:      new Date().toISOString(),
  }

  await log(
    `  ✓ ${productName} — ${hooks.length} hook(s), price: ${price || 'MISSING'}, tone: ${tone}`
  )

  return brief
}

// ─── Write brief to disk ───────────────────────────────────────────────────

async function writeBrief(brief: Brief): Promise<string> {
  await fs.mkdir(BRIEFS_DIR, { recursive: true })
  const filename = `${brief.brief_id}.json`
  await fs.writeFile(path.join(BRIEFS_DIR, filename), JSON.stringify(brief, null, 2))
  return filename
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const args   = process.argv.slice(2)
const argMap: Record<string, string> = {}
for (let i = 0; i < args.length; i += 2) {
  argMap[args[i].replace(/^--/, '')] = args[i + 1]
}

async function main() {
  let urls: string[] = []

  if (argMap.urls) {
    urls = argMap.urls.split(',').map((u) => u.trim()).filter(Boolean)
  } else if (argMap['urls-file']) {
    const raw = await fs.readFile(argMap['urls-file'], 'utf8')
    urls = raw.split('\n').map((u) => u.trim()).filter((u) => u.startsWith('http'))
  } else {
    console.error(
      'Usage:\n' +
      '  tsx scripts/scraper.ts --urls "https://example.com/p1,https://example.com/p2"\n' +
      '  tsx scripts/scraper.ts --urls-file ./urls.txt\n' +
      '\nOptions:\n' +
      '  --brand-context "Bold, direct, sports audience"\n' +
      '  --max-hooks 8   (default: 5, max: 12)'
    )
    process.exit(1)
  }

  const brandContext = argMap['brand-context'] || ''
  const maxHooks     = Math.min(
    parseInt(argMap['max-hooks'] || String(DEFAULT_MAX_HOOKS), 10),
    MAX_HOOKS_CAP
  )

  await log(`Starting scrape of ${urls.length} URL(s) — max ${maxHooks} hooks each`)

  let scraped   = 0
  let totalHooks = 0

  for (const url of urls) {
    const brief = await scrapeUrl(url, brandContext, maxHooks)
    if (!brief) continue

    const filename = await writeBrief(brief)
    await log(`  Brief written → briefs/${filename}`)
    scraped++
    totalHooks += brief.hooks.length
  }

  await log(
    `Scrape complete — ${scraped}/${urls.length} succeeded, ${totalHooks} total hooks extracted → /briefs/`
  )
}

main().catch((err) => {
  console.error('SCRAPER fatal error:', err.message)
  process.exit(1)
})
