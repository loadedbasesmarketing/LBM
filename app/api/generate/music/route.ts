import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  const {
    prompt,
    duration = 30,
    genre = 'Hip-Hop',
    mood = 'Hype',
  } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  const apiKey = process.env.INFERENCE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'INFERENCE_API_KEY not configured' }, { status: 500 })
  }

  const fullPrompt = `${genre} ${mood} instrumental: ${prompt}`

  try {
    const { stdout } = await execAsync(
      `INFERENCE_API_KEY="${apiKey}" inference music generate \
        --prompt "${fullPrompt.replace(/"/g, '\\"')}" \
        --duration ${duration} \
        --format json`,
      { timeout: 180_000 }
    )

    const result = JSON.parse(stdout.trim())

    return NextResponse.json({
      url:      result.url || result.output_url || result.audio_url,
      duration: result.duration || duration,
      jobId:    result.job_id || result.id,
    })
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string }
    console.error('Music generation error:', error.stderr || error.message)
    return NextResponse.json(
      { error: error.stderr || error.message || 'Music generation failed' },
      { status: 500 }
    )
  }
}
