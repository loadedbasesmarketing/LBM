'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Lightbulb, Sparkles, Eye, Send,
  Video, Music, Image, ChevronRight,
  Twitter, Instagram, Youtube, Check,
  Loader2, AlertCircle, Play, Download,
  ArrowLeft, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Stage = 'ideate' | 'generate' | 'review' | 'publish'
type Platform = 'twitter' | 'instagram' | 'youtube'
type AssetStatus = 'idle' | 'generating' | 'done' | 'error'

interface GeneratedAsset {
  type: 'video' | 'music' | 'thumbnail'
  status: AssetStatus
  url?: string
  error?: string
  duration?: number
}

const STAGES: { id: Stage; label: string; icon: React.ElementType }[] = [
  { id: 'ideate',   label: 'Ideate',   icon: Lightbulb },
  { id: 'generate', label: 'Generate', icon: Sparkles   },
  { id: 'review',   label: 'Review',   icon: Eye        },
  { id: 'publish',  label: 'Publish',  icon: Send       },
]

const PLATFORM_CONFIG = {
  twitter:   { Icon: Twitter,   label: 'Twitter / X', color: '#1DA1F2', charLimit: 280 },
  instagram: { Icon: Instagram, label: 'Instagram',   color: '#E1306C', charLimit: 2200 },
  youtube:   { Icon: Youtube,   label: 'YouTube',     color: '#FF0000', charLimit: 5000 },
}

const VIDEO_STYLES = ['Cinematic', 'Energetic', 'Minimal', 'Vlog', 'Animated', 'Dramatic']
const MUSIC_MOODS  = ['Hype',      'Chill',     'Dramatic', 'Uplifting', 'Dark', 'Ambient']
const MUSIC_GENRES = ['Hip-Hop', 'Electronic', 'Pop', 'Cinematic', 'Lo-Fi', 'Rock']

export default function NewCampaignPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('ideate')
  const [title, setTitle] = useState('')
  const [brief, setBrief] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [videoStyle, setVideoStyle] = useState('Cinematic')
  const [musicMood, setMusicMood] = useState('Hype')
  const [musicGenre, setMusicGenre] = useState('Hip-Hop')
  const [generateVideo, setGenerateVideo] = useState(true)
  const [generateMusic, setGenerateMusic] = useState(true)
  const [generateThumb, setGenerateThumb] = useState(true)
  const [assets, setAssets] = useState<GeneratedAsset[]>([])
  const [caption, setCaption] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishDone, setPublishDone] = useState(false)

  const stageIndex = STAGES.findIndex((s) => s.id === stage)

  function togglePlatform(p: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  async function handleGenerate() {
    const toGenerate: GeneratedAsset[] = []
    if (generateVideo) toGenerate.push({ type: 'video', status: 'idle' })
    if (generateMusic) toGenerate.push({ type: 'music', status: 'idle' })
    if (generateThumb) toGenerate.push({ type: 'thumbnail', status: 'idle' })
    setAssets(toGenerate)
    setStage('generate')

    for (let i = 0; i < toGenerate.length; i++) {
      setAssets((prev) =>
        prev.map((a, idx) => (idx === i ? { ...a, status: 'generating' } : a))
      )

      try {
        const endpoint =
          toGenerate[i].type === 'video'     ? '/api/generate/video'     :
          toGenerate[i].type === 'music'     ? '/api/generate/music'     :
                                               '/api/generate/thumbnail'

        const body =
          toGenerate[i].type === 'video'     ? { prompt: brief, style: videoStyle }          :
          toGenerate[i].type === 'music'     ? { prompt: brief, mood: musicMood, genre: musicGenre } :
                                               { title, brief }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        const data = await res.json()

        setAssets((prev) =>
          prev.map((a, idx) =>
            idx === i
              ? { ...a, status: res.ok ? 'done' : 'error', url: data.url, error: data.error, duration: data.duration }
              : a
          )
        )
      } catch (err) {
        setAssets((prev) =>
          prev.map((a, idx) =>
            idx === i ? { ...a, status: 'error', error: 'Request failed' } : a
          )
        )
      }
    }

    setCaption(brief.substring(0, 200))
    setStage('review')
  }

  async function handlePublish() {
    if (selectedPlatforms.length === 0) return
    setIsPublishing(true)

    try {
      const assetUrls = assets.filter((a) => a.url).map((a) => a.url!)

      for (const platform of selectedPlatforms) {
        await fetch(`/api/publish/${platform}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caption, assetUrls, title }),
        })
      }

      setPublishDone(true)
      setStage('publish')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-base/80 backdrop-blur-sm border-b border-border px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="p-1.5 hover:bg-panel rounded-md transition-colors text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-xl font-700 text-text-primary tracking-tight">New Campaign</h1>
          <p className="text-[12px] text-text-secondary mt-0.5">Build and launch your content</p>
        </div>
      </div>

      {/* Pipeline stepper */}
      <div className="px-8 pt-6">
        <div className="flex items-center gap-0 mb-8">
          {STAGES.map(({ id, label, icon: Icon }, i) => {
            const isActive   = id === stage
            const isDone     = STAGES.findIndex((s) => s.id === stage) > i
            const isCurrent  = isActive

            return (
              <div key={id} className="flex items-center flex-1">
                <div className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all',
                  isDone    ? 'text-success' :
                  isCurrent ? 'text-ember bg-ember/10 border border-ember/20' :
                              'text-text-muted'
                )}>
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-mono border transition-all',
                    isDone    ? 'bg-success/20 border-success text-success' :
                    isCurrent ? 'bg-ember/20 border-ember text-ember ember-glow' :
                                'bg-surface border-border text-text-muted'
                  )}>
                    {isDone ? <Check className="w-2.5 h-2.5" /> : i + 1}
                  </div>
                  <span className="font-display">{label}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className={cn(
                    'flex-1 h-px mx-2 transition-colors',
                    isDone ? 'bg-success/30' : 'bg-border'
                  )} />
                )}
              </div>
            )
          })}
        </div>

        {/* Stage content */}
        <div className="max-w-2xl animate-slide-up">

          {/* ─── IDEATE ─── */}
          {stage === 'ideate' && (
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase tracking-widest mb-2">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Drop Promo"
                  className="w-full bg-surface border border-border focus:border-ember rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted outline-none transition-colors font-body"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase tracking-widest mb-2">
                  Content Brief
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Describe your content idea, tone, audience, and any references…"
                  rows={5}
                  className="w-full bg-surface border border-border focus:border-ember rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted outline-none transition-colors resize-none font-body"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase tracking-widest mb-3">
                  Platforms
                </label>
                <div className="flex gap-2">
                  {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG[Platform]][]).map(([key, { Icon, label, color }]) => (
                    <button
                      key={key}
                      onClick={() => togglePlatform(key)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] transition-all',
                        selectedPlatforms.includes(key)
                          ? 'border-transparent text-white'
                          : 'border-border text-text-secondary hover:border-border-bright hover:text-text-primary bg-surface'
                      )}
                      style={selectedPlatforms.includes(key) ? { backgroundColor: `${color}20`, borderColor: color, color } : undefined}
                    >
                      <Icon className="w-3.5 h-3.5" style={selectedPlatforms.includes(key) ? { color } : undefined} />
                      {label}
                      {selectedPlatforms.includes(key) && <Check className="w-3 h-3 ml-1" style={{ color }} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase tracking-widest mb-3">
                  Assets to Generate
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'video', icon: Video, label: 'AI Video', toggle: setGenerateVideo, state: generateVideo, desc: 'Veo, Seedance, Wan' },
                    { key: 'music', icon: Music, label: 'AI Music', toggle: setGenerateMusic, state: generateMusic, desc: 'ElevenLabs, Diffry.' },
                    { key: 'thumb', icon: Image, label: 'Thumbnail', toggle: setGenerateThumb, state: generateThumb, desc: 'Claude Vision' },
                  ].map(({ key, icon: Icon, label, toggle, state, desc }) => (
                    <button
                      key={key}
                      onClick={() => toggle((v) => !v)}
                      className={cn(
                        'flex flex-col items-start p-3 rounded-lg border transition-all text-left',
                        state
                          ? 'bg-ember/10 border-ember/30 text-ember'
                          : 'bg-surface border-border text-text-secondary hover:border-border-bright'
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                        <div className={cn(
                          'w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all',
                          state ? 'bg-ember border-ember' : 'border-border'
                        )}>
                          {state && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-[12px] font-medium">{label}</span>
                      <span className="text-[10px] font-mono opacity-60">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-text-muted uppercase tracking-widest mb-2">Video Style</label>
                  <div className="flex flex-wrap gap-1.5">
                    {VIDEO_STYLES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setVideoStyle(s)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[11px] font-mono transition-all',
                          videoStyle === s
                            ? 'bg-ember/20 text-ember border border-ember/30'
                            : 'bg-surface border border-border text-text-secondary hover:border-border-bright'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-text-muted uppercase tracking-widest mb-2">Music Mood</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSIC_MOODS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMusicMood(m)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[11px] font-mono transition-all',
                          musicMood === m
                            ? 'bg-gold/20 text-gold border border-gold/30'
                            : 'bg-surface border border-border text-text-secondary hover:border-border-bright'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!title || !brief || selectedPlatforms.length === 0}
                className="w-full bg-ember hover:bg-ember-dim disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-[14px] font-medium transition-all flex items-center justify-center gap-2 ember-glow"
              >
                <Sparkles className="w-4 h-4" />
                Generate Assets
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}

          {/* ─── GENERATE ─── */}
          {stage === 'generate' && (
            <div className="space-y-3">
              <p className="text-[13px] text-text-secondary mb-5">
                Generating your assets via inference.sh…
              </p>
              {assets.map((asset) => (
                <div key={asset.type} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    asset.status === 'done'       ? 'bg-success/15' :
                    asset.status === 'generating' ? 'bg-gold/15'    :
                    asset.status === 'error'      ? 'bg-danger/15'  :
                                                    'bg-surface'
                  )}>
                    {asset.type === 'video'     && <Video  className="w-4 h-4" style={{ color: asset.status === 'done' ? '#22C55E' : asset.status === 'generating' ? '#F5C542' : '#888' }} strokeWidth={1.5} />}
                    {asset.type === 'music'     && <Music  className="w-4 h-4" style={{ color: asset.status === 'done' ? '#22C55E' : asset.status === 'generating' ? '#F5C542' : '#888' }} strokeWidth={1.5} />}
                    {asset.type === 'thumbnail' && <Image  className="w-4 h-4" style={{ color: asset.status === 'done' ? '#22C55E' : asset.status === 'generating' ? '#F5C542' : '#888' }} strokeWidth={1.5} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-text-primary capitalize">{asset.type}</div>
                    <div className="text-[11px] font-mono text-text-muted mt-0.5">
                      {asset.status === 'idle'       ? 'Waiting…'     :
                       asset.status === 'generating' ? 'Generating…'  :
                       asset.status === 'done'       ? 'Complete'      :
                                                       asset.error || 'Failed'}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {asset.status === 'generating' && <Loader2 className="w-4 h-4 text-gold animate-spin" />}
                    {asset.status === 'done'       && <Check   className="w-4 h-4 text-success" />}
                    {asset.status === 'error'      && <AlertCircle className="w-4 h-4 text-danger" />}
                  </div>
                  {asset.status === 'generating' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border rounded-b-xl overflow-hidden">
                      <div className="h-full bg-gold shimmer" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── REVIEW ─── */}
          {stage === 'review' && (
            <div className="space-y-5">
              <p className="text-[13px] text-text-secondary">Review your generated assets before publishing.</p>

              {/* Asset previews */}
              <div className="grid grid-cols-3 gap-3">
                {assets.filter((a) => a.status === 'done').map((asset) => (
                  <div key={asset.type} className="bg-surface border border-border rounded-xl overflow-hidden">
                    {asset.type === 'thumbnail' && asset.url ? (
                      <img src={asset.url} alt="Thumbnail" className="w-full aspect-video object-cover" />
                    ) : (
                      <div className="aspect-video bg-panel flex items-center justify-center">
                        {asset.type === 'video' && <Play className="w-8 h-8 text-text-muted" />}
                        {asset.type === 'music' && <Music className="w-8 h-8 text-text-muted" />}
                        {asset.type === 'thumbnail' && <Image className="w-8 h-8 text-text-muted" />}
                      </div>
                    )}
                    <div className="p-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-text-secondary capitalize">{asset.type}</span>
                      {asset.url && (
                        <a
                          href={asset.url}
                          download
                          className="text-[10px] font-mono text-text-muted hover:text-ember flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3" /> Save
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase tracking-widest mb-2">
                  Caption / Post Text
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  className="w-full bg-surface border border-border focus:border-ember rounded-lg px-4 py-3 text-[14px] text-text-primary outline-none transition-colors resize-none font-body"
                />
                <div className="text-[11px] font-mono text-text-muted mt-1 text-right">
                  {caption.length} chars
                </div>
              </div>

              <button
                onClick={() => setStage('publish')}
                className="w-full bg-ember hover:bg-ember-dim text-white px-6 py-3 rounded-lg text-[14px] font-medium transition-all flex items-center justify-center gap-2 ember-glow"
              >
                Looks good — Proceed to Publish
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ─── PUBLISH ─── */}
          {stage === 'publish' && !publishDone && (
            <div className="space-y-5">
              <p className="text-[13px] text-text-secondary">Choose where to publish your content.</p>

              <div className="space-y-2">
                {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG[Platform]][]).map(([key, { Icon, label, color }]) => (
                  <button
                    key={key}
                    onClick={() => togglePlatform(key)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                      selectedPlatforms.includes(key)
                        ? 'border-transparent'
                        : 'bg-surface border-border hover:border-border-bright'
                    )}
                    style={selectedPlatforms.includes(key)
                      ? { backgroundColor: `${color}12`, borderColor: `${color}40` }
                      : undefined}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-text-primary">{label}</div>
                      <div className="text-[11px] font-mono text-text-muted">
                        {PLATFORM_CONFIG[key].charLimit.toLocaleString()} char limit
                      </div>
                    </div>
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                      selectedPlatforms.includes(key)
                        ? 'border-transparent'
                        : 'border-border'
                    )}
                      style={selectedPlatforms.includes(key) ? { backgroundColor: color, borderColor: color } : undefined}
                    >
                      {selectedPlatforms.includes(key) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handlePublish}
                disabled={selectedPlatforms.length === 0 || isPublishing}
                className="w-full bg-ember hover:bg-ember-dim disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-[14px] font-medium transition-all flex items-center justify-center gap-2 ember-glow"
              >
                {isPublishing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                ) : (
                  <><Send className="w-4 h-4" /> Publish Now</>
                )}
              </button>
            </div>
          )}

          {/* ─── DONE ─── */}
          {publishDone && (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto ember-glow">
                <Check className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-700 text-text-primary">Published!</h2>
                <p className="text-[13px] text-text-secondary mt-1">
                  Your content is live on {selectedPlatforms.join(', ')}.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => router.push('/')}
                  className="px-5 py-2.5 bg-surface border border-border hover:border-border-bright rounded-lg text-[13px] text-text-secondary hover:text-text-primary transition-all"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => {
                    setStage('ideate')
                    setTitle('')
                    setBrief('')
                    setAssets([])
                    setCaption('')
                    setPublishDone(false)
                  }}
                  className="px-5 py-2.5 bg-ember hover:bg-ember-dim text-white rounded-lg text-[13px] transition-all flex items-center gap-2 ember-glow"
                >
                  <Zap className="w-3.5 h-3.5" /> New Campaign
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
