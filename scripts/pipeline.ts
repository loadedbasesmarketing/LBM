#!/usr/bin/env tsx
/**
 * Vizznary Pipeline Runner
 *
 * Orchestrates the full SCRAPER → FORGE → PUBLISHER → LOOPER cycle.
 *
 * Usage:
 *   tsx scripts/pipeline.ts --urls "https://example.com/product" --campaign-id 3821X
 *   tsx scripts/pipeline.ts --urls-file ./urls.txt --campaign-id 3821X --variants 4
 *   tsx scripts/pipeline.ts --loop-only --campaign-id 3821X   (LOOPER + PUBLISHER flags only)
 */

import { execSync } from 'child_process'
import path          from 'path'
import fs            from 'fs/promises'

const LOG_FILE = path.resolve('./logs/pipeline-runner.log')

async function log(msg: string) {
  const line = `[${new Date().toISOString()}] PIPELINE: ${msg}\n`
  process.stdout.write(line)
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true })
  await fs.appendFile(LOG_FILE, line)
}

function run(cmd: string) {
  execSync(`npx tsx ${cmd}`, { stdio: 'inherit' })
}

const args   = process.argv.slice(2)
const argMap: Record<string, string> = {}
for (let i = 0; i < args.length; i += 2) {
  argMap[args[i].replace(/^--/, '')] = args[i + 1]
}
const flags = new Set(args.filter((a) => !a.startsWith('--') || args[args.indexOf(a) - 1]?.startsWith('--') === false))

async function main() {
  const campaignId = argMap['campaign-id']
  if (!campaignId) { console.error('--campaign-id required'); process.exit(1) }

  // ── LOOP ONLY: skip SCRAPER + FORGE, run LOOPER then PUBLISHER flags ──
  if (args.includes('--loop-only')) {
    await log('Running LOOPER + PUBLISHER flag processing only')
    run(`scripts/looper.ts --lookback ${argMap.lookback || '24'}`)
    run(`scripts/publisher.ts --process-flags`)
    await log('Loop cycle complete')
    return
  }

  const urls         = argMap.urls ? `--urls "${argMap.urls}"` : argMap['urls-file'] ? `--urls-file "${argMap['urls-file']}"` : ''
  const brandContext = argMap['brand-context'] ? `--brand-context "${argMap['brand-context']}"` : ''
  const maxHooks     = argMap['max-hooks']     ? `--max-hooks ${argMap['max-hooks']}`           : ''
  const variants     = argMap.variants         ? `--variants ${argMap.variants}`                 : ''
  const format       = argMap.format           ? `--format ${argMap.format}`                     : ''
  const dailyBudget  = argMap['daily-budget']  ? `--daily-budget ${argMap['daily-budget']}`      : ''
  const lookback     = argMap.lookback         ? `--lookback ${argMap.lookback}`                 : ''

  if (!urls) { console.error('--urls or --urls-file required'); process.exit(1) }

  // ── Step 1: SCRAPER ──
  await log('Step 1 — SCRAPER')
  run(`scripts/scraper.ts ${urls} ${brandContext} ${maxHooks}`.trim())

  // ── Step 2: FORGE (run on each brief in /briefs/) ──
  await log('Step 2 — FORGE')
  const briefs = (await fs.readdir(path.resolve('./briefs'))).filter((f) => f.endsWith('.json'))
  for (const brief of briefs) {
    run(`scripts/forge.ts --brief briefs/${brief} ${variants} ${format}`.trim())
  }

  // ── Step 3: PUBLISHER ──
  await log('Step 3 — PUBLISHER (requires manual approval of sidecars)')
  await log('  → Set approved: true in /ads/pending/*.meta.json, then run:')
  await log(`  → tsx scripts/publisher.ts --campaign-id ${campaignId} --poll ${dailyBudget}`)

  // Auto-poll if --auto-publish flag is set
  if (args.includes('--auto-publish')) {
    await log('  --auto-publish set — polling immediately (all pending assets)')
    run(`scripts/publisher.ts --campaign-id ${campaignId} --poll ${dailyBudget}`.trim())

    // ── Step 4: LOOPER ──
    await log('Step 4 — LOOPER (first cycle, may have limited data)')
    run(`scripts/looper.ts ${lookback}`.trim())
    run(`scripts/publisher.ts --process-flags`)
  }

  await log('Pipeline run complete')
}

main().catch((err) => {
  console.error('Pipeline fatal error:', err.message)
  process.exit(1)
})
