import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const { prompt, duration = 5, aspectRatio = '16:9', style = 'Cinematic' } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  const apiKey = process.env.INFERENCE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'INFERENCE_API_KEY not configured' }, { status: 500 })
  }

  const fullPrompt = `${style} style: ${prompt}`
  const aspectFlag = aspectRatio === '9:16' ? '--aspect-ratio 9:16' : aspectRatio === '1:1' ? '--aspect-ratio 1:1' : '--aspect-ratio 16:9'

  try {
    const { stdout, stderr } = await execAsync(
      `INFERENCE_API_KEY="${apiKey}" inference video generate \
        --prompt "${fullPrompt.replace(/"/g, '\\"')}" \
        --duration ${duration} \
        ${aspectFlag} \
        --format json`,
      { timeout: 300_000 } // 5 min timeout
    )

    const result = JSON.parse(stdout.trim())

    return NextResponse.json({
      url:      result.url || result.output_url,
      duration: result.duration || duration,
      jobId:    result.job_id || result.id,
    })
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string }
    console.error('Video generation error:', error.stderr || error.message)
    return NextResponse.json(
      { error: error.stderr || error.message || 'Video generation failed' },
      { status: 500 }
    )
  }
}
