#!/usr/bin/env tsx
/**
 * PUBLISHER — Meta Marketing API Deployment Agent
 *
 * Pipeline Step 3: Polls /ads/pending/ for approved creatives, uploads them
 * to Meta's asset library, creates ad sets, and pushes ads live.
 * Also handles LOOPER pause/rewrite flags from /ads/publisher-flags/.
 *
 * Usage:
 *   tsx scripts/publisher.ts --campaign-id 123456789 --poll
 *   tsx scripts/publisher.ts --campaign-id 123456789 --asset ./ads/pending/brief_001_0.meta.json
 *   tsx scripts/publisher.ts --process-flags         (handle LOOPER pause/rewrite instructions)
 */

import fs   from 'fs/promises'
import path from 'path'

// ─── Config ────────────────────────────────────────────────────────────────

const META_ACCESS_TOKEN  = process.env.META_ACCESS_TOKEN
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID  // e.g. "act_123456789"
const META_PAGE_ID       = process.env.META_PAGE_ID
const META_API_VERSION   = 'v20.0'
const META_BASE_URL      = `https://graph.facebook.com/${META_API_VERSION}`

const PENDING_DIR      = path.resolve('./ads/pending')
const REJECTED_DIR     = path.resolve('./ads/rejected')
const PUBLISHED_DIR    = path.resolve('./ads/published')
const FLAG_DIR         = path.resolve('./ads/publisher-flags')
const PIPELINE_LOG     = path.resolve('./logs/pipeline.json')
const LOG_FILE         = path.resolve('./logs/publisher.log')

// ─── Types ─────────────────────────────────────────────────────────────────

interface ForgeMeta {
  brief_id:      string
  hook_used:     string
  headline:      string
  format:        'image' | 'video'
  created_at:    string
  fal_job_id:    string
  source_agent:  string
  variant_index: number
  approved?:     boolean
  asset_url?:    string
}

interface AdSetConfig {
  name:               string
  daily_budget_cents: number
  optimization_goal:  string
  billing_event:      string
  targeting:          object
  start_time?:        string
  end_time?:          string
  attribution_spec:   object[]
}

interface PublishedAd {
  ad_id:        string
  ad_set_id:    string
  campaign_id:  string
  creative_id:  string
  brief_id:     string
  status:       'active' | 'paused' | 'learning'
  daily_budget: number
  published_at: string
  meta_file:    string
}

interface PublisherFlag {
  ad_id:           string
  action:          'pause' | 'rewrite'
  reason:          string
  metric_snapshot: object
  flagged_at:      string
}

// ─── Logging ───────────────────────────────────────────────────────────────

async function log(msg: string) {
  const line = `[${new Date().toISOString()}] PUBLISHER: ${msg}\n`
  process.stdout.write(line)
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true })
  await fs.appendFile(LOG_FILE, line)
}

// ─── Pipeline log ──────────────────────────────────────────────────────────

async function appendPipelineLog(entry: PublishedAd) {
  let current: PublishedAd[] = []
  try {
    current = JSON.parse(await fs.readFile(PIPELINE_LOG, 'utf8'))
  } catch {
    // start fresh
  }
  current.push(entry)
  await fs.mkdir(path.dirname(PIPELINE_LOG), { recursive: true })
  await fs.writeFile(PIPELINE_LOG, JSON.stringify(current, null, 2))
}

// ─── Meta API helpers ──────────────────────────────────────────────────────

async function metaPost(endpoint: string, body: object): Promise<Record<string, unknown>> {
  const url = `${META_BASE_URL}/${endpoint}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ ...body, access_token: META_ACCESS_TOKEN }),
  })

  const data = await res.json() as Record<string, unknown>

  if (!res.ok || data.error) {
    const err = (data.error as { message?: string; error_user_msg?: string } | undefined)
    throw Object.assign(
      new Error(err?.message || `Meta API error ${res.status}`),
      { isPolicy: (err?.message || '').toLowerCase().includes('policy'), metaError: data.error }
    )
  }

  return data
}

async function metaGet(endpoint: string, params: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const qs  = new URLSearchParams({ ...params, access_token: META_ACCESS_TOKEN! }).toString()
  const res = await fetch(`${META_BASE_URL}/${endpoint}?${qs}`)
  const data = await res.json() as Record<string, unknown>
  if (!res.ok || data.error) throw new Error(JSON.stringify(data.error))
  return data
}

// ─── Upload creative to Meta ───────────────────────────────────────────────

async function uploadCreative(meta: ForgeMeta): Promise<string> {
  if (!meta.asset_url) throw new Error('asset_url missing from sidecar')

  if (meta.format === 'video') {
    // For video, use the video upload endpoint
    const uploadRes = await metaPost(`${META_AD_ACCOUNT_ID}/advideos`, {
      file_url:    meta.asset_url,
      name:        `FORGE_${meta.brief_id}_v${meta.variant_index}`,
      description: meta.hook_used,
    })
    const videoId = uploadRes.id as string

    // Wait briefly for video to process (Meta usually needs a moment)
    await new Promise((r) => setTimeout(r, 5_000))

    const creative = await metaPost(`${META_AD_ACCOUNT_ID}/adcreatives`, {
      name:            `Creative_${meta.brief_id}_v${meta.variant_index}`,
      object_story_spec: {
        page_id:        META_PAGE_ID,
        video_data: {
          video_id:   videoId,
          message:    meta.hook_used,
          call_to_action: { type: 'SHOP_NOW' },
        },
      },
    })

    await log(`  Uploaded video creative → ${creative.id}`)
    return creative.id as string

  } else {
    // Image creative — upload image first
    const imageRes = await metaPost(`${META_AD_ACCOUNT_ID}/adimages`, {
      url:  meta.asset_url,
      name: `FORGE_${meta.brief_id}_v${meta.variant_index}`,
    })
    const images   = imageRes.images as Record<string, { hash: string }>
    const hash     = Object.values(images)[0]?.hash
    if (!hash) throw new Error('Image upload returned no hash')

    const creative = await metaPost(`${META_AD_ACCOUNT_ID}/adcreatives`, {
      name: `Creative_${meta.brief_id}_v${meta.variant_index}`,
      object_story_spec: {
        page_id:   META_PAGE_ID,
        link_data: {
          image_hash:  hash,
          message:     meta.hook_used,
          link:        `https://www.facebook.com/${META_PAGE_ID}`,
          call_to_action: { type: 'SHOP_NOW' },
        },
      },
    })

    await log(`  Uploaded image creative → ${creative.id}`)
    return creative.id as string
  }
}

// ─── Create ad set ─────────────────────────────────────────────────────────

async function createAdSet(
  campaignId: string,
  config: Partial<AdSetConfig>,
  meta: ForgeMeta
): Promise<string> {
  const defaults: AdSetConfig = {
    name:               `FORGE_${meta.brief_id}_${Date.now()}`,
    daily_budget_cents: 5000,    // $50.00
    optimization_goal:  'OFFSITE_CONVERSIONS',
    billing_event:      'IMPRESSIONS',
    targeting: {
      geo_locations:    { countries: ['US'] },
      age_min:          18,
      age_max:          65,
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions:  ['feed', 'story', 'reels'],
      instagram_positions: ['stream', 'story', 'reels'],
    },
    attribution_spec: [
      { event_type: 'CLICK_THROUGH', window_days: 7 },
      { event_type: 'VIEW_THROUGH',  window_days: 1 },
    ],
  }

  const merged = { ...defaults, ...config }

  const adSet = await metaPost(`${META_AD_ACCOUNT_ID}/adsets`, {
    name:              merged.name,
    campaign_id:       campaignId,
    daily_budget:      merged.daily_budget_cents,
    optimization_goal: merged.optimization_goal,
    billing_event:     merged.billing_event,
    targeting:         merged.targeting,
    attribution_spec:  merged.attribution_spec,
    status:            'ACTIVE',
    start_time:        merged.start_time || new Date().toISOString(),
  })

  await log(`  Created ad set ${adSet.id} — $${(merged.daily_budget_cents / 100).toFixed(2)}/day`)
  return adSet.id as string
}

// ─── Create and publish ad ─────────────────────────────────────────────────

async function publishAd(
  campaignId: string,
  adSetId:    string,
  creativeId: string,
  meta:       ForgeMeta
): Promise<string> {
  const ad = await metaPost(`${META_AD_ACCOUNT_ID}/ads`, {
    name:        `AD_${meta.brief_id}_v${meta.variant_index}`,
    adset_id:    adSetId,
    creative:    { creative_id: creativeId },
    status:      'ACTIVE',
    tracking_specs: [{ action_type: ['offsite_conversion'], fb_pixel: [] }],
  })

  await log(`  Published ad → ${ad.id}`)
  return ad.id as string
}

// ─── Main publish flow ─────────────────────────────────────────────────────

async function processAsset(
  metaFilePath: string,
  campaignId:   string,
  adSetConfig:  Partial<AdSetConfig> = {}
) {
  const meta: ForgeMeta = JSON.parse(await fs.readFile(metaFilePath, 'utf8'))

  if (!meta.approved) {
    await log(`Skipping ${metaFilePath} — not approved`)
    return null
  }

  await log(`Processing ${meta.brief_id} v${meta.variant_index} (${meta.format})`)

  try {
    // 1. Upload creative to Meta
    const creativeId = await uploadCreative(meta)

    // 2. Create ad set
    const adSetId = await createAdSet(campaignId, adSetConfig, meta)

    // 3. Publish ad
    const adId = await publishAd(campaignId, adSetId, creativeId, meta)

    // 4. Write ad_id back to sidecar
    meta.approved = true
    await fs.writeFile(metaFilePath, JSON.stringify({ ...meta, ad_id: adId, published_at: new Date().toISOString() }, null, 2))

    // 5. Move to published/
    await fs.mkdir(PUBLISHED_DIR, { recursive: true })
    const basename = path.basename(metaFilePath)
    await fs.rename(metaFilePath, path.join(PUBLISHED_DIR, basename))

    // Also move the URL/asset file if present
    const urlFile = metaFilePath.replace('.meta.json', '.url')
    try {
      await fs.rename(urlFile, path.join(PUBLISHED_DIR, path.basename(urlFile)))
    } catch { /* no url file is fine */ }

    // 6. Append to pipeline log
    const entry: PublishedAd = {
      ad_id:        adId,
      ad_set_id:    adSetId,
      campaign_id:  campaignId,
      creative_id:  creativeId,
      brief_id:     meta.brief_id,
      status:       'active',
      daily_budget: (adSetConfig.daily_budget_cents ?? 5000) / 100,
      published_at: new Date().toISOString(),
      meta_file:    path.join(PUBLISHED_DIR, basename),
    }
    await appendPipelineLog(entry)

    await log(`✓ Published ad ${adId} → campaign ${campaignId} — campaign log updated`)
    return entry

  } catch (err: unknown) {
    const error = err as { isPolicy?: boolean; message?: string }

    if (error.isPolicy) {
      // Policy rejection — move to rejected/
      await log(`✗ Policy rejection on ${meta.brief_id} v${meta.variant_index}: ${error.message}`)
      await fs.mkdir(REJECTED_DIR, { recursive: true })
      await fs.rename(metaFilePath, path.join(REJECTED_DIR, path.basename(metaFilePath)))
      await fs.appendFile(
        path.join(REJECTED_DIR, 'rejections.log'),
        `${new Date().toISOString()} | ${meta.brief_id}_${meta.variant_index} | ${error.message}\n`
      )
    } else {
      await log(`✗ Error publishing ${meta.brief_id} v${meta.variant_index}: ${error.message}`)
    }
    return null
  }
}

// ─── Poll /ads/pending/ ────────────────────────────────────────────────────

async function pollPending(campaignId: string, adSetConfig: Partial<AdSetConfig> = {}) {
  await fs.mkdir(PENDING_DIR, { recursive: true })
  const files  = await fs.readdir(PENDING_DIR)
  const metas  = files.filter((f) => f.endsWith('.meta.json'))

  if (metas.length === 0) {
    await log('No approved assets in /ads/pending/')
    return
  }

  await log(`Found ${metas.length} sidecar(s) in /ads/pending/`)
  let published = 0

  for (const file of metas) {
    const result = await processAsset(path.join(PENDING_DIR, file), campaignId, adSetConfig)
    if (result) published++
  }

  await log(`Poll complete — ${published}/${metas.length} published`)
}

// ─── Handle LOOPER flags ───────────────────────────────────────────────────

async function processFlags() {
  await fs.mkdir(FLAG_DIR, { recursive: true })
  const files = (await fs.readdir(FLAG_DIR)).filter((f) => f.endsWith('.json'))

  if (files.length === 0) {
    await log('No pending LOOPER flags')
    return
  }

  await log(`Processing ${files.length} LOOPER flag(s)`)

  for (const file of files) {
    const flagPath = path.join(FLAG_DIR, file)
    const flag: PublisherFlag = JSON.parse(await fs.readFile(flagPath, 'utf8'))

    try {
      if (flag.action === 'pause') {
        await metaPost(`${flag.ad_id}`, { status: 'PAUSED' })
        await log(`  Paused ad ${flag.ad_id} — ${flag.reason}`)
      } else {
        // Rewrite: just pause for now, FORGE will generate new variants
        await metaPost(`${flag.ad_id}`, { status: 'PAUSED' })
        await log(`  Paused ad ${flag.ad_id} for rewrite — ${flag.reason}`)
      }

      // Move flag to processed
      const processedDir = path.join(FLAG_DIR, 'processed')
      await fs.mkdir(processedDir, { recursive: true })
      await fs.rename(flagPath, path.join(processedDir, file))

    } catch (err: unknown) {
      await log(`  Error processing flag for ${flag.ad_id}: ${(err as Error).message}`)
    }
  }
}

// ─── Budget update helper ──────────────────────────────────────────────────

async function updateBudget(adSetId: string, newDailyBudgetCents: number) {
  // Read current budget first for logging
  const current = await metaGet(`${adSetId}`, { fields: 'daily_budget,name' })
  const before  = current.daily_budget

  await metaPost(adSetId, { daily_budget: newDailyBudgetCents })

  await log(
    `Budget updated: ad set ${adSetId} "${current.name}" — ` +
    `$${(Number(before) / 100).toFixed(2)} → $${(newDailyBudgetCents / 100).toFixed(2)}/day`
  )
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const args   = process.argv.slice(2)
const argMap: Record<string, string> = {}
for (let i = 0; i < args.length; i += 2) {
  argMap[args[i].replace(/^--/, '')] = args[i + 1]
}

if (!META_ACCESS_TOKEN)  { console.error('META_ACCESS_TOKEN required'); process.exit(1) }
if (!META_AD_ACCOUNT_ID) { console.error('META_AD_ACCOUNT_ID required'); process.exit(1) }
if (!META_PAGE_ID)       { console.error('META_PAGE_ID required'); process.exit(1) }

const adSetConfig: Partial<AdSetConfig> = {}
if (argMap['daily-budget']) adSetConfig.daily_budget_cents = Math.round(parseFloat(argMap['daily-budget']) * 100)

if ('process-flags' in argMap || args.includes('--process-flags')) {
  processFlags().catch((err) => { console.error(err.message); process.exit(1) })
} else if (argMap.asset) {
  if (!argMap['campaign-id']) { console.error('--campaign-id required'); process.exit(1) }
  processAsset(argMap.asset, argMap['campaign-id'], adSetConfig)
    .catch((err) => { console.error(err.message); process.exit(1) })
} else if ('poll' in argMap || args.includes('--poll')) {
  if (!argMap['campaign-id']) { console.error('--campaign-id required'); process.exit(1) }
  pollPending(argMap['campaign-id'], adSetConfig)
    .catch((err) => { console.error(err.message); process.exit(1) })
} else {
  console.error(
    'Usage:\n' +
    '  tsx scripts/publisher.ts --campaign-id <id> --poll\n' +
    '  tsx scripts/publisher.ts --campaign-id <id> --asset <path/to/meta.json>\n' +
    '  tsx scripts/publisher.ts --process-flags\n' +
    '\nOptions:\n' +
    '  --daily-budget <dollars>   Override default $50/day budget'
  )
  process.exit(1)
}
