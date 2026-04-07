#!/usr/bin/env tsx
/**
 * LOOPER — Meta Performance → FORGE Feedback Loop
 *
 * Pipeline Step 4: Polls Meta Insights API, scores live creatives by
 * ROAS/CTR/CPC, forwards winner reference prompts to FORGE, and flags
 * underperformers for PUBLISHER to pause or rewrite.
 *
 * Usage:
 *   tsx scripts/looper.ts --lookback 24 --threshold-roas 4.0 --threshold-ctr 3.5
 *   tsx scripts/looper.ts --ad-ids 123456,789012 --lookback 6
 */

import fs from 'fs/promises'
import path from 'path'

// ─── Config ────────────────────────────────────────────────────────────────

const META_ACCESS_TOKEN  = process.env.META_ACCESS_TOKEN
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID  // e.g. "act_123456789"
const META_API_VERSION   = 'v20.0'
const META_BASE_URL      = `https://graph.facebook.com/${META_API_VERSION}`

const FORGE_QUEUE_DIR    = path.resolve('./ads/forge-queue')
const PUBLISHER_FLAG_DIR = path.resolve('./ads/publisher-flags')
const LOG_FILE           = path.resolve('./logs/looper.log')
const HISTORY_FILE       = path.resolve('./logs/looper-history.json')

// ─── Types ─────────────────────────────────────────────────────────────────

interface AdInsight {
  ad_id:       string
  ad_name:     string
  status:      string
  spend:       number
  impressions: number
  clicks:      number
  ctr:         number
  cpc:         number
  roas:        number
  conversions: number
  created_time: string
  effective_status: string
  hours_live:  number
}

interface ScoredAd extends AdInsight {
  score:       number
  verdict:     'winner' | 'ok' | 'underperformer' | 'skip'
  score_breakdown: { roas_norm: number; ctr_norm: number; cpc_norm: number }
}

interface WinnerPrompt {
  source:       'looper'
  source_ad_id: string
  hook:         string
  headline:     string
  visual_notes: string
  roas:         number
  ctr:          number
  brief_addendum: string
  created_at:   string
}

interface PublisherFlag {
  ad_id:           string
  action:          'pause' | 'rewrite'
  reason:          string
  metric_snapshot: object
  flagged_at:      string
}

interface LoopHistory {
  [ad_id: string]: {
    last_roas:    number
    last_checked: string
    winner_count: number
  }
}

// ─── Logging ───────────────────────────────────────────────────────────────

async function log(msg: string) {
  const line = `[${new Date().toISOString()}] LOOPER: ${msg}\n`
  process.stdout.write(line)
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true })
  await fs.appendFile(LOG_FILE, line)
}

// ─── Meta API ──────────────────────────────────────────────────────────────

async function fetchMetaInsights(
  adIds: string[],
  lookbackHours: number
): Promise<AdInsight[]> {
  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
    throw new Error('META_ACCESS_TOKEN and META_AD_ACCOUNT_ID are required')
  }

  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const fields = [
    'ad_id', 'ad_name', 'spend', 'impressions', 'clicks',
    'ctr', 'cpc', 'purchase_roas', 'conversions',
    'effective_status', 'created_time',
  ].join(',')

  const filterClause = adIds.length > 0
    ? `&filtering=[{"field":"ad.id","operator":"IN","value":[${adIds.map((id) => `"${id}"`).join(',')}]}]`
    : ''

  const url =
    `${META_BASE_URL}/${META_AD_ACCOUNT_ID}/insights` +
    `?fields=${fields}` +
    `&time_range={"since":"${since}","until":"${new Date().toISOString().split('T')[0]}"}` +
    `&level=ad` +
    `&limit=100` +
    `${filterClause}` +
    `&access_token=${META_ACCESS_TOKEN}`

  const res  = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Meta API error ${res.status}: ${body}`)
  }

  const json = await res.json() as { data: Record<string, unknown>[] }

  return json.data.map((row) => {
    const roasArr = row.purchase_roas as { action_type: string; value: string }[] | undefined
    const roas    = roasArr?.[0]?.value ? parseFloat(roasArr[0].value) : 0
    const convArr = row.conversions    as { action_type: string; value: string }[] | undefined
    const convs   = convArr?.find((a) => a.action_type === 'purchase')?.value ?? '0'

    const createdMs = new Date(row.created_time as string).getTime()
    const hoursLive = (Date.now() - createdMs) / (1000 * 60 * 60)

    return {
      ad_id:            row.ad_id as string,
      ad_name:          row.ad_name as string,
      status:           row.effective_status as string,
      effective_status: row.effective_status as string,
      spend:            parseFloat(row.spend as string || '0'),
      impressions:      parseInt(row.impressions as string || '0', 10),
      clicks:           parseInt(row.clicks as string || '0', 10),
      ctr:              parseFloat(row.ctr as string || '0'),
      cpc:              parseFloat(row.cpc as string || '0'),
      roas,
      conversions:      parseFloat(convs),
      created_time:     row.created_time as string,
      hours_live:       hoursLive,
    }
  })
}

// ─── Scoring ───────────────────────────────────────────────────────────────

const ROAS_BENCHMARK = 4.0   // ≥ this = full ROAS score
const CTR_BENCHMARK  = 3.5   // ≥ this = full CTR score (%)
const CPC_BENCHMARK  = 1.50  // ≤ this = full CPC score ($)

function scoreAd(ad: AdInsight): ScoredAd {
  // Skip ads in learning phase or under 3h live
  if (ad.hours_live < 3 || ad.effective_status === 'LEARNING') {
    return {
      ...ad,
      score: -1,
      verdict: 'skip',
      score_breakdown: { roas_norm: 0, ctr_norm: 0, cpc_norm: 0 },
    }
  }

  // Normalise each metric to [0, 1]
  const roas_norm = Math.min(ad.roas / ROAS_BENCHMARK, 1)
  const ctr_norm  = Math.min(ad.ctr  / CTR_BENCHMARK,  1)
  // CPC: lower is better — invert
  const cpc_norm  = ad.cpc === 0 ? 0 : Math.min(CPC_BENCHMARK / ad.cpc, 1)

  const score = roas_norm * 0.5 + ctr_norm * 0.3 + cpc_norm * 0.2

  const verdict: ScoredAd['verdict'] =
    score >= 0.75 ? 'winner'        :
    score <= 0.35 ? 'underperformer' :
                    'ok'

  return { ...ad, score, verdict, score_breakdown: { roas_norm, ctr_norm, cpc_norm } }
}

// ─── Week-over-week ROAS drop check ────────────────────────────────────────

async function loadHistory(): Promise<LoopHistory> {
  try {
    return JSON.parse(await fs.readFile(HISTORY_FILE, 'utf8'))
  } catch {
    return {}
  }
}

async function saveHistory(history: LoopHistory) {
  await fs.mkdir(path.dirname(HISTORY_FILE), { recursive: true })
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2))
}

function checkWoWROASDrop(ad: ScoredAd, history: LoopHistory): boolean {
  const prev = history[ad.ad_id]
  if (!prev) return false
  const drop = (prev.last_roas - ad.roas) / prev.last_roas
  return drop >= 0.30
}

// ─── Output helpers ────────────────────────────────────────────────────────

function extractHook(adName: string): string {
  // Convention: ad names often formatted as "HOOK | Audience | Date"
  return adName.split('|')[0].trim()
}

function buildBriefAddendum(ad: ScoredAd): string {
  return (
    `This ad achieved ROAS ${ad.roas.toFixed(1)}× and CTR ${ad.ctr.toFixed(2)}% ` +
    `over ${Math.round(ad.hours_live)}h. ` +
    `Replicate its hook and visual energy. ` +
    `Spend was $${ad.spend.toFixed(0)} driving ${ad.conversions} conversions.`
  )
}

async function writeWinnerPrompt(ad: ScoredAd) {
  await fs.mkdir(FORGE_QUEUE_DIR, { recursive: true })
  const prompt: WinnerPrompt = {
    source:         'looper',
    source_ad_id:   ad.ad_id,
    hook:           extractHook(ad.ad_name),
    headline:       ad.ad_name,
    visual_notes:   `High-performing ad with ${ad.ctr.toFixed(2)}% CTR. Match visual energy.`,
    roas:           ad.roas,
    ctr:            ad.ctr,
    brief_addendum: buildBriefAddendum(ad),
    created_at:     new Date().toISOString(),
  }
  const filename = `winner_${ad.ad_id}_${Date.now()}.json`
  await fs.writeFile(path.join(FORGE_QUEUE_DIR, filename), JSON.stringify(prompt, null, 2))
  return filename
}

async function writePublisherFlag(ad: ScoredAd, action: 'pause' | 'rewrite', reason: string) {
  await fs.mkdir(PUBLISHER_FLAG_DIR, { recursive: true })
  const flag: PublisherFlag = {
    ad_id:   ad.ad_id,
    action,
    reason,
    metric_snapshot: {
      roas:        ad.roas,
      ctr:         ad.ctr,
      cpc:         ad.cpc,
      spend:       ad.spend,
      conversions: ad.conversions,
      score:       ad.score,
      hours_live:  Math.round(ad.hours_live),
    },
    flagged_at: new Date().toISOString(),
  }
  const filename = `flag_${ad.ad_id}_${Date.now()}.json`
  await fs.writeFile(path.join(PUBLISHER_FLAG_DIR, filename), JSON.stringify(flag, null, 2))
  return filename
}

// ─── Main loop ─────────────────────────────────────────────────────────────

async function runLoop({
  adIds,
  lookbackHours,
  thresholdRoas,
  thresholdCtr,
}: {
  adIds:         string[]
  lookbackHours: number
  thresholdRoas: number
  thresholdCtr:  number
}) {
  if (!META_ACCESS_TOKEN) throw new Error('META_ACCESS_TOKEN environment variable is required')
  if (!META_AD_ACCOUNT_ID) throw new Error('META_AD_ACCOUNT_ID environment variable is required')

  await log(`Starting loop — lookback ${lookbackHours}h, win thresholds ROAS≥${thresholdRoas} CTR≥${thresholdCtr}%`)

  const history = await loadHistory()
  const raw     = await fetchMetaInsights(adIds, lookbackHours)

  await log(`Fetched ${raw.length} ads from Meta`)

  const scored   = raw.map(scoreAd)
  const eligible = scored.filter((a) => a.verdict !== 'skip')
  const skipped  = scored.length - eligible.length

  if (skipped > 0) await log(`Skipped ${skipped} ads (learning phase or <3h live)`)

  let winners = 0
  let flags   = 0

  for (const ad of eligible) {
    const wowDrop = checkWoWROASDrop(ad, history)

    if (ad.verdict === 'winner') {
      await log(`  ✓ WINNER  ${ad.ad_id} "${extractHook(ad.ad_name)}" — ROAS ${ad.roas.toFixed(1)}× CTR ${ad.ctr.toFixed(2)}% score ${ad.score.toFixed(2)}`)
      const file = await writeWinnerPrompt(ad)
      await log(`    → Winner prompt → ${file}`)
      winners++
    } else if (ad.verdict === 'underperformer') {
      const action: 'pause' | 'rewrite' = ad.score < 0.2 ? 'pause' : 'rewrite'
      const reason =
        `Score ${ad.score.toFixed(2)} below threshold 0.35. ` +
        `ROAS ${ad.roas.toFixed(1)}× (target ${thresholdRoas}×), ` +
        `CTR ${ad.ctr.toFixed(2)}% (target ${thresholdCtr}%)`
      await log(`  ✗ FLAGGED ${ad.ad_id} "${extractHook(ad.ad_name)}" — ${action.toUpperCase()} — ${reason}`)
      const file = await writePublisherFlag(ad, action, reason)
      await log(`    → Publisher flag → ${file}`)
      flags++
    } else if (wowDrop) {
      // Previously winning ad with 30% WoW ROAS drop
      const reason =
        `ROAS dropped >30% week-over-week (was ${history[ad.ad_id].last_roas.toFixed(1)}×, now ${ad.roas.toFixed(1)}×). ` +
        `Current score ${ad.score.toFixed(2)} still above threshold but trending down.`
      await log(`  ⚠ WoW DROP ${ad.ad_id} — rewrite queued — ${reason}`)
      await writePublisherFlag(ad, 'rewrite', reason)
      flags++
    } else {
      await log(`  · OK      ${ad.ad_id} score ${ad.score.toFixed(2)}`)
    }

    // Update history
    history[ad.ad_id] = {
      last_roas:    ad.roas,
      last_checked: new Date().toISOString(),
      winner_count: (history[ad.ad_id]?.winner_count || 0) + (ad.verdict === 'winner' ? 1 : 0),
    }
  }

  await saveHistory(history)

  await log(
    `Loop complete — ${eligible.length} evaluated, ${winners} winners → FORGE, ${flags} flagged → PUBLISHER`
  )

  return { evaluated: eligible.length, winners, flags }
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2)
const argMap: Record<string, string> = {}
for (let i = 0; i < args.length; i += 2) {
  argMap[args[i].replace(/^--/, '')] = args[i + 1]
}

const adIds = argMap['ad-ids']
  ? argMap['ad-ids'].split(',').map((s) => s.trim())
  : []

runLoop({
  adIds,
  lookbackHours: parseInt(argMap.lookback      || '24',  10),
  thresholdRoas: parseFloat(argMap['threshold-roas'] || '4.0'),
  thresholdCtr:  parseFloat(argMap['threshold-ctr']  || '3.5'),
}).catch((err) => {
  console.error('LOOPER fatal error:', err.message)
  process.exit(1)
})
