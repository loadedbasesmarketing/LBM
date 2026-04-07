'use client'

import Link from 'next/link'
import { formatRelative } from '@/lib/utils'
import {
  TrendingUp,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Video,
  Music,
  Image,
  Twitter,
  Instagram,
  Youtube,
  Play,
  MoreHorizontal,
  Activity,
} from 'lucide-react'

const MOCK_CAMPAIGNS = [
  {
    id: '1',
    title: 'Summer Drop Promo',
    brief: 'Hype video for new summer collection with energetic music and bold visuals',
    status: 'published',
    platforms: ['twitter', 'instagram'],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    assets: ['video', 'music', 'thumbnail'],
  },
  {
    id: '2',
    title: 'Behind the Scenes - Studio Day',
    brief: 'Raw studio footage with ambient music, authentic content for Instagram',
    status: 'scheduled',
    platforms: ['instagram'],
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    assets: ['video', 'thumbnail'],
  },
  {
    id: '3',
    title: 'Product Launch Teaser',
    brief: 'Cinematic teaser for upcoming product drop with dramatic music',
    status: 'generating',
    platforms: ['twitter', 'instagram', 'youtube'],
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    assets: ['video'],
  },
  {
    id: '4',
    title: 'Fan Appreciation Post',
    brief: 'Heartfelt message to fans with uplifting background track',
    status: 'ready',
    platforms: ['twitter'],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    assets: ['thumbnail', 'music'],
  },
  {
    id: '5',
    title: 'Weekly Recap - July W3',
    brief: 'Compilation of best moments with energetic music',
    status: 'draft',
    platforms: ['youtube', 'instagram'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    assets: [],
  },
]

const STATUS_CONFIG = {
  draft:      { label: 'Draft',      color: 'text-text-muted',  bg: 'bg-text-muted/10',    dot: 'bg-text-muted'  },
  generating: { label: 'Generating', color: 'text-gold',        bg: 'bg-gold/10',          dot: 'bg-gold'        },
  ready:      { label: 'Ready',      color: 'text-blue-400',    bg: 'bg-blue-400/10',      dot: 'bg-blue-400'    },
  scheduled:  { label: 'Scheduled',  color: 'text-blue-400',    bg: 'bg-blue-400/10',      dot: 'bg-blue-400'    },
  published:  { label: 'Published',  color: 'text-success',     bg: 'bg-success/10',       dot: 'bg-success'     },
  failed:     { label: 'Failed',     color: 'text-danger',      bg: 'bg-danger/10',        dot: 'bg-danger'      },
} as const

const PLATFORM_ICONS = {
  twitter:   { Icon: Twitter,   color: '#1DA1F2' },
  instagram: { Icon: Instagram, color: '#E1306C' },
  youtube:   { Icon: Youtube,   color: '#FF0000' },
}

const ASSET_ICONS = {
  video:     { Icon: Video,  label: 'Video'   },
  music:     { Icon: Music,  label: 'Audio'   },
  thumbnail: { Icon: Image,  label: 'Thumb'   },
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-bright transition-colors">
      <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">{label}</div>
      <div className={`font-display text-3xl font-700 mb-1 ${color || 'text-text-primary'}`}>{value}</div>
      {sub && <div className="text-[12px] text-text-secondary">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const stats = [
    { label: 'Total Campaigns', value: 24, sub: '+3 this week', color: 'text-text-primary' },
    { label: 'Published Today', value: 8, sub: 'across 3 platforms', color: 'text-success' },
    { label: 'Scheduled', value: 4, sub: 'next 48 hours', color: 'text-blue-400' },
    { label: 'Generating', value: 2, sub: '~3 min remaining', color: 'text-gold' },
  ]

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-base/80 backdrop-blur-sm border-b border-border px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-700 text-text-primary tracking-tight">Dashboard</h1>
          <p className="text-[12px] text-text-secondary mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/campaign/new"
          className="flex items-center gap-2 bg-ember hover:bg-ember-dim text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ember-glow"
        >
          <Zap className="w-3.5 h-3.5" />
          New Campaign
        </Link>
      </div>

      <div className="px-8 py-6 space-y-8 animate-slide-up">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 stagger">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Pipeline activity bar */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-ember" />
              <span className="font-display text-sm font-600 text-text-primary">Pipeline Activity</span>
            </div>
            <span className="text-[11px] font-mono text-text-muted">Last 7 days</span>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[6, 9, 4, 12, 8, 15, 10].map((val, i) => {
              const today = i === 6
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm transition-all ${today ? 'bg-ember' : 'bg-border-bright'}`}
                    style={{ height: `${(val / 15) * 100}%` }}
                  />
                  <span className="text-[9px] font-mono text-text-muted">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-700 text-text-primary">Recent Campaigns</h2>
            <Link href="/library" className="text-[12px] text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2 stagger">
            {MOCK_CAMPAIGNS.map((campaign) => {
              const statusCfg = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]
              return (
                <Link
                  key={campaign.id}
                  href={`/campaign/${campaign.id}`}
                  className="block bg-surface border border-border hover:border-border-bright rounded-xl p-4 transition-all hover:bg-panel/50 group animate-slide-up"
                >
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-2 h-2 rounded-full ${statusCfg.dot} ${campaign.status === 'generating' ? 'status-pulse' : ''}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2.5 mb-0.5">
                            <span className="font-display text-sm font-600 text-text-primary group-hover:text-ember transition-colors">
                              {campaign.title}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-[12px] text-text-secondary truncate max-w-md">{campaign.brief}</p>
                        </div>
                        <span className="text-[11px] font-mono text-text-muted flex-shrink-0">
                          {formatRelative(campaign.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2.5">
                        {/* Assets */}
                        <div className="flex items-center gap-1.5">
                          {campaign.assets.map((asset) => {
                            const cfg = ASSET_ICONS[asset as keyof typeof ASSET_ICONS]
                            if (!cfg) return null
                            return (
                              <div key={asset} className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
                                <cfg.Icon className="w-3 h-3" strokeWidth={1.5} />
                                <span>{cfg.label}</span>
                              </div>
                            )
                          })}
                        </div>

                        {/* Platforms */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          {campaign.platforms.map((platform) => {
                            const cfg = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]
                            if (!cfg) return null
                            return (
                              <cfg.Icon
                                key={platform}
                                className="w-3.5 h-3.5"
                                style={{ color: cfg.color }}
                                strokeWidth={1.5}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="font-display text-base font-700 text-text-primary mb-4">Quick Generate</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Video,  label: 'AI Video',     desc: 'Veo 3, Seedance, Wan', href: '/campaign/new?type=video',     accent: '#FF5A1F' },
              { icon: Music,  label: 'AI Music',     desc: 'ElevenLabs, Diffrythm', href: '/campaign/new?type=music',   accent: '#F5C542' },
              { icon: Image,  label: 'AI Thumbnail', desc: 'Claude Vision',          href: '/campaign/new?type=thumb',   accent: '#22C55E' },
            ].map(({ icon: Icon, label, desc, href, accent }) => (
              <Link
                key={label}
                href={href}
                className="bg-surface border border-border hover:border-border-bright rounded-xl p-4 flex items-center gap-3 transition-all hover:bg-panel/50 group"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${accent}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: accent }} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-text-primary group-hover:text-ember transition-colors">{label}</div>
                  <div className="text-[11px] text-text-muted font-mono">{desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
