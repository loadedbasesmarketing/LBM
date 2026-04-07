#!/usr/bin/env tsx
/**
 * FORGE — FAL.AI Ad Creative Generator
 *
 * Pipeline Step 2: Receives briefs from SCRAPER / winner refs from LOOPER,
 * generates image/video variants via fal.ai nano-banana-2,
 * writes assets + meta sidecars to /ads/pending/.
 *
 * Usage:
 *   tsx scripts/forge.ts --brief ./briefs/brief_001.json --variants 4 --format image
 *   tsx scripts/forge.ts --brief ./briefs/brief_001.json --winners ./winners/refs.json --format video
 */

import fs from 'fs/promises'
import path from 'path'
import https from 'https'

const FAL_API_KEY = process.env.FAL_API_KEY
const PENDING_DIR = path.resolve('./ads/pending')
const LOG_FILE    = path.resolve('./logs/forge.log')

interface Brief {
  brief_id: string
  headline: string
  hook: string
  body_copy: string
  cta: string
  brand_tone: string
  target_audience: string
  objective: 'AWARENESS' | 'CONSIDERATION' | 'CONVERSION'
  visual_notes?: string
}

interface Meta {
  brief_id:     string
  hook_used:    string
  headline:     string
  format:       'image' | 'video'
  created_at:   string
  fal_job_id:   string
  source_agent: string
  variant_index: number
}

async function log(msg: string) {
  const line = `[${new Date().toISOString()}] FORGE: ${msg}\n`
  process.stdout.write(line)
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true })
  await fs.appendFile(LOG_FILE, line)
}

async function falRequest(endpoint: string, payload: object, retries = 1): Promise<{ job_id: string; url: string }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`https://fal.run/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`fal.ai ${response.status}: ${text}`)
      }

      const data = await response.json() as { request_id?: string; images?: { url: string }[]; video?: { url: string } }
      return {
        job_id: data.request_id || 'unknown',
        url:    data.images?.[0]?.url || data.video?.url || '',
      }
    } catch (err) {
      if (attempt === retries) throw err
      await log(`  Attempt ${attempt + 1} failed, retrying… ${(err as Error).message}`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  throw new Error('All retries exhausted')
}

function buildPrompt(brief: Brief, winnerRef?: string): string {
  const base = winnerRef || `${brief.visual_notes || ''} ${brief.hook}`
  return [
    base.trim(),
    `Brand tone: ${brief.brand_tone}`,
    `Audience: ${brief.target_audience}`,
    'Professional ad creative, high-contrast, eye-catching, commercial photography style',
  ].filter(Boolean).join('. ')
}

async function generateVariant(
  brief: Brief,
  index: number,
  format: 'image' | 'video',
  winnerRef?: string
): Promise<{ url: string; jobId: string }> {
  const prompt = buildPrompt(brief, winnerRef)

  await log(`  Variant ${index + 1}: "${prompt.substring(0, 80)}…"`)

  if (format === 'image') {
    return falRequest('fal-ai/nano-banana-2', {
      prompt,
      image_size: 'landscape_16_9',
      num_images: 1,
    })
  } else {
    return falRequest('fal-ai/nano-banana-2/video', {
      prompt,
      duration: '5s',
      aspect_ratio: '16:9',
    })
  }
}

async function forge({
  briefPath,
  winnersPath,
  variants = 4,
  format   = 'image',
}: {
  briefPath:    string
  winnersPath?: string
  variants:     number
  format:       'image' | 'video'
}) {
  if (!FAL_API_KEY) throw new Error('FAL_API_KEY environment variable is required')

  await fs.mkdir(PENDING_DIR, { recursive: true })

  const brief: Brief     = JSON.parse(await fs.readFile(briefPath, 'utf8'))
  const winners: string[] = winnersPath
    ? JSON.parse(await fs.readFile(winnersPath, 'utf8'))
    : []

  // Video variants take priority for AWARENESS objectives
  const effectiveFormat: 'image' | 'video' =
    brief.objective === 'AWARENESS' ? 'video' : format

  await log(`Processing brief ${brief.brief_id} — ${variants} ${effectiveFormat} variants`)
  await log(`Objective: ${brief.objective}, Hook: "${brief.hook}"`)

  const generated: Array<{ url: string; jobId: string; index: number }> = []

  for (let i = 0; i < Math.max(variants, 2); i++) {
    const winnerRef = winners[i % winners.length]
    try {
      const result = await generateVariant(brief, i, effectiveFormat, winnerRef)
      generated.push({ ...result, index: i })

      // Write asset file reference (URL)
      const ext      = effectiveFormat === 'video' ? 'mp4' : 'jpg'
      const basename = `${brief.brief_id}_${i}`
      const urlFile  = path.join(PENDING_DIR, `${basename}.url`)
      await fs.writeFile(urlFile, result.url)

      // Write meta sidecar
      const meta: Meta = {
        brief_id:      brief.brief_id,
        hook_used:     brief.hook,
        headline:      brief.headline,
        format:        effectiveFormat,
        created_at:    new Date().toISOString(),
        fal_job_id:    result.jobId,
        source_agent:  winners.length > 0 ? 'LOOPER' : 'SCRAPER',
        variant_index: i,
      }
      await fs.writeFile(
        path.join(PENDING_DIR, `${basename}.meta.json`),
        JSON.stringify(meta, null, 2)
      )

      await log(`  ✓ Variant ${i + 1} written → ${basename}.${ext}`)
    } catch (err) {
      await log(`  ✗ Variant ${i + 1} failed, skipping: ${(err as Error).message}`)
    }
  }

  await log(`FORGE complete: ${generated.length}/${variants} variants → /ads/pending/`)

  // Signal PUBLISHER
  const signalPath = path.resolve('./ads/.forge-ready')
  await fs.writeFile(signalPath, JSON.stringify({
    brief_id:   brief.brief_id,
    count:      generated.length,
    format:     effectiveFormat,
    signaled_at: new Date().toISOString(),
  }, null, 2))

  await log(`Signal written → ${signalPath}`)
  return generated
}

// CLI entrypoint
const args = process.argv.slice(2)
const argMap: Record<string, string> = {}
for (let i = 0; i < args.length; i += 2) {
  argMap[args[i].replace(/^--/, '')] = args[i + 1]
}

if (!argMap.brief) {
  console.error('Usage: tsx scripts/forge.ts --brief <path> [--winners <path>] [--variants 4] [--format image|video]')
  process.exit(1)
}

forge({
  briefPath:    argMap.brief,
  winnersPath:  argMap.winners,
  variants:     parseInt(argMap.variants || '4', 10),
  format:       (argMap.format as 'image' | 'video') || 'image',
}).catch((err) => {
  console.error('FORGE fatal error:', err.message)
  process.exit(1)
})
