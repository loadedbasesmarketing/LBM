import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const { caption, assetUrls = [], title, scheduledAt } = await req.json()

  if (!caption) {
    return NextResponse.json({ error: 'caption is required' }, { status: 400 })
  }

  const apiKey       = process.env.INFERENCE_API_KEY
  const sessionId    = process.env.INSTAGRAM_SESSION_ID

  if (!apiKey) {
    return NextResponse.json({ error: 'INFERENCE_API_KEY not configured' }, { status: 500 })
  }
  if (!sessionId) {
    return NextResponse.json({ error: 'INSTAGRAM_SESSION_ID not configured' }, { status: 500 })
  }

  try {
    const mediaFlag = assetUrls.length > 0
      ? assetUrls.slice(0, 10).map((url: string) => `--media "${url}"`).join(' ')
      : ''

    const scheduleFlag = scheduledAt
      ? `--scheduled-at "${scheduledAt}"`
      : ''

    const { stdout } = await execAsync(
      `INFERENCE_API_KEY="${apiKey}" inference run instagram-scraper/post-create \
        --session-id "${sessionId}" \
        --caption "${caption.replace(/"/g, '\\"')}" \
        ${mediaFlag} \
        ${scheduleFlag} \
        --format json`,
      { timeout: 120_000 }
    )

    const result = JSON.parse(stdout.trim())

    return NextResponse.json({
      postId:    result.id || result.media_id,
      url:       result.url || result.permalink,
      platform:  'instagram',
      published: !scheduledAt,
      scheduled: !!scheduledAt,
    })
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string }
    console.error('Instagram publish error:', error.stderr || error.message)
    return NextResponse.json(
      { error: error.stderr || error.message || 'Instagram publish failed' },
      { status: 500 }
    )
  }
}
