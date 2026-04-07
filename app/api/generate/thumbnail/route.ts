import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const {
    title,
    brief,
    style = 'Bold and eye-catching',
    colorScheme = 'dark with orange accents',
  } = await req.json()

  if (!title || !brief) {
    return NextResponse.json({ error: 'title and brief are required' }, { status: 400 })
  }

  const apiKey = process.env.INFERENCE_API_KEY

  // If inference.sh is available, use it for image generation
  if (apiKey) {
    try {
      const imagePrompt = `YouTube thumbnail: "${title}". ${style}. ${colorScheme} color scheme. Professional, high-contrast, bold typography space, cinematic quality. 1280x720.`

      const { stdout } = await execAsync(
        `INFERENCE_API_KEY="${apiKey}" inference image generate \
          --prompt "${imagePrompt.replace(/"/g, '\\"')}" \
          --width 1280 \
          --height 720 \
          --format json`,
        { timeout: 120_000 }
      )

      const result = JSON.parse(stdout.trim())
      return NextResponse.json({
        url:   result.url || result.output_url || result.image_url,
        jobId: result.job_id || result.id,
      })
    } catch (err) {
      console.warn('inference.sh thumbnail failed, falling back to Claude description:', err)
    }
  }

  // Fallback: use Claude to generate a detailed thumbnail brief as SVG placeholder
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate a detailed visual description for a YouTube thumbnail for this content:
Title: "${title}"
Brief: "${brief}"
Style: ${style}
Color Scheme: ${colorScheme}

Describe the thumbnail layout, imagery, text placement, and colors in precise detail for a designer.
Keep it under 150 words.`,
        },
      ],
    })

    const description = (message.content[0] as { type: string; text: string }).text

    // Return a placeholder URL with the description encoded
    return NextResponse.json({
      url:         null,
      description,
      placeholder: true,
      message:     'Thumbnail description generated. Configure INFERENCE_API_KEY to generate actual images.',
    })
  } catch (err: unknown) {
    const error = err as { message?: string }
    console.error('Thumbnail generation error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Thumbnail generation failed' },
      { status: 500 }
    )
  }
}
