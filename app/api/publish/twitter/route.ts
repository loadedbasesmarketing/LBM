import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const { caption, assetUrls = [], title } = await req.json()

  if (!caption) {
    return NextResponse.json({ error: 'caption is required' }, { status: 400 })
  }

  const apiKey = process.env.INFERENCE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'INFERENCE_API_KEY not configured' }, { status: 500 })
  }

  // Truncate caption to Twitter's 280 char limit
  const tweet = caption.length > 280 ? caption.substring(0, 277) + '…' : caption

  try {
    let cmd: string

    if (assetUrls.length > 0) {
      // Post with media using x/post-create app
      const mediaFlag = assetUrls.slice(0, 4).map((url: string) => `--media "${url}"`).join(' ')
      cmd = `INFERENCE_API_KEY="${apiKey}" inference run x/post-create \
        --text "${tweet.replace(/"/g, '\\"')}" \
        ${mediaFlag} \
        --format json`
    } else {
      // Text-only post
      cmd = `INFERENCE_API_KEY="${apiKey}" inference run x/post-tweet \
        --text "${tweet.replace(/"/g, '\\"')}" \
        --format json`
    }

    const { stdout } = await execAsync(cmd, { timeout: 60_000 })
    const result = JSON.parse(stdout.trim())

    return NextResponse.json({
      postId:    result.id || result.post_id,
      url:       result.url || `https://twitter.com/i/web/status/${result.id}`,
      platform:  'twitter',
      published: true,
    })
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string }
    console.error('Twitter publish error:', error.stderr || error.message)
    return NextResponse.json(
      { error: error.stderr || error.message || 'Twitter publish failed' },
      { status: 500 }
    )
  }
}
