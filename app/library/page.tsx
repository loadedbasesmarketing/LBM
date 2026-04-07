'use client'

import { useState } from 'react'
import { formatRelative } from '@/lib/utils'
import {
  Video, Music, Image, Search, Filter,
  Play, Download, Twitter, Instagram,
  Youtube, MoreHorizontal, Zap, Grid, List
} from 'lucide-react'
import { cn } from '@/lib/utils'

type AssetType = 'all' | 'video' | 'music' | 'thumbnail'
type ViewMode = 'grid' | 'list'

const MOCK_ASSETS = [
  { id: '1', type: 'video', title: 'Summer Drop Promo', duration: '0:15', status: 'published', platforms: ['twitter', 'instagram'], createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), thumbnailColor: '#FF5A1F' },
  { id: '2', type: 'music', title: 'Summer Drop — Beat', duration: '0:30', status: 'published', platforms: ['instagram'], createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), thumbnailColor: '#F5C542' },
  { id: '3', type: 'thumbnail', title: 'Summer Drop — Cover', duration: null, status: 'published', platforms: ['youtube'], createdAt: new Date(Date.now() - 1000 * 60 * 46).toISOString(), thumbnailColor: '#3B82F6' },
  { id: '4', type: 'video', title: 'Studio Day BTS', duration: '0:45', status: 'scheduled', platforms: ['instagram'], createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), thumbnailColor: '#8B5CF6' },
  { id: '5', type: 'thumbnail', title: 'Studio Day Cover', duration: null, status: 'scheduled', platforms: ['instagram'], createdAt: new Date(Date.now() - 1000 * 60 * 121).toISOString(), thumbnailColor: '#EC4899' },
  { id: '6', type: 'video', title: 'Product Teaser', duration: '0:10', status: 'generating', platforms: ['twitter', 'instagram', 'youtube'], createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), thumbnailColor: '#10B981' },
  { id: '7', type: 'music', title: 'Fan Appreciation Track', duration: '1:00', status: 'ready', platforms: ['twitter'], createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), thumbnailColor: '#F59E0B' },
  { id: '8', type: 'video', title: 'Weekly Recap July W2', duration: '0:60', status: 'published', platforms: ['youtube', 'instagram'], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), thumbnailColor: '#6366F1' },
  { id: '9', type: 'thumbnail', title: 'Weekly Recap Cover', duration: null, status: 'published', platforms: ['youtube'], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), thumbnailColor: '#EF4444' },
]

const TYPE_ICONS = {
  video:     { Icon: Video,  color: '#FF5A1F', bg: 'bg-ember/15'      },
  music:     { Icon: Music,  color: '#F5C542', bg: 'bg-gold/15'       },
  thumbnail: { Icon: Image,  color: '#3B82F6', bg: 'bg-blue-500/15'   },
}

const PLATFORM_ICONS = {
  twitter:   { Icon: Twitter,   color: '#1DA1F2' },
  instagram: { Icon: Instagram, color: '#E1306C' },
  youtube:   { Icon: Youtube,   color: '#FF0000' },
}

const STATUS_CONFIG = {
  draft:      { label: 'Draft',      dot: 'bg-text-muted' },
  generating: { label: 'Generating', dot: 'bg-gold status-pulse' },
  ready:      { label: 'Ready',      dot: 'bg-blue-400' },
  scheduled:  { label: 'Scheduled',  dot: 'bg-blue-400' },
  published:  { label: 'Published',  dot: 'bg-success' },
  failed:     { label: 'Failed',     dot: 'bg-danger' },
}

export default function LibraryPage() {
  const [filter, setFilter] = useState<AssetType>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const filtered = MOCK_ASSETS.filter((a) => {
    const matchType   = filter === 'all' || a.type === filter
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-base/80 backdrop-blur-sm border-b border-border px-8 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-700 text-text-primary tracking-tight">Content Library</h1>
            <p className="text-[12px] text-text-secondary mt-0.5">{MOCK_ASSETS.length} assets total</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-panel text-ember' : 'text-text-muted hover:text-text-secondary')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-panel text-ember' : 'text-text-muted hover:text-text-secondary')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets…"
              className="w-full bg-surface border border-border focus:border-ember rounded-lg pl-9 pr-4 py-2 text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors"
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-1.5">
            {(['all', 'video', 'music', 'thumbnail'] as AssetType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wide transition-all',
                  filter === t
                    ? 'bg-ember/20 text-ember border border-ember/30'
                    : 'bg-surface border border-border text-text-secondary hover:border-border-bright'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 py-6 animate-slide-up">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-4 stagger">
            {filtered.map((asset) => {
              const typeCfg   = TYPE_ICONS[asset.type as keyof typeof TYPE_ICONS]
              const statusCfg = STATUS_CONFIG[asset.status as keyof typeof STATUS_CONFIG]

              return (
                <div key={asset.id} className="bg-surface border border-border hover:border-border-bright rounded-xl overflow-hidden transition-all group cursor-pointer animate-slide-up">
                  {/* Preview */}
                  <div
                    className="aspect-video flex items-center justify-center relative"
                    style={{ backgroundColor: `${asset.thumbnailColor}12` }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${asset.thumbnailColor}25` }}
                    >
                      <typeCfg.Icon className="w-6 h-6" style={{ color: asset.thumbnailColor }} strokeWidth={1.5} />
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center transition-colors">
                        <Play className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center transition-colors">
                        <Download className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>

                    {/* Duration badge */}
                    {asset.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                        {asset.duration}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[13px] font-medium text-text-primary line-clamp-1">{asset.title}</span>
                      <button className="text-text-muted hover:text-text-secondary flex-shrink-0">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        <span className="text-[10px] font-mono text-text-muted">{statusCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {asset.platforms.map((p) => {
                          const cfg = PLATFORM_ICONS[p as keyof typeof PLATFORM_ICONS]
                          if (!cfg) return null
                          return <cfg.Icon key={p} className="w-3 h-3" style={{ color: cfg.color }} strokeWidth={1.5} />
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-1.5 stagger">
            {filtered.map((asset) => {
              const typeCfg   = TYPE_ICONS[asset.type as keyof typeof TYPE_ICONS]
              const statusCfg = STATUS_CONFIG[asset.status as keyof typeof STATUS_CONFIG]
              return (
                <div key={asset.id} className="bg-surface border border-border hover:border-border-bright rounded-xl px-4 py-3 flex items-center gap-4 transition-all group animate-slide-up">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeCfg.bg}`}>
                    <typeCfg.Icon className="w-4 h-4" style={{ color: typeCfg.color }} strokeWidth={1.5} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-text-primary truncate">{asset.title}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] font-mono text-text-muted capitalize">{asset.type}</span>
                      {asset.duration && <span className="text-[11px] font-mono text-text-muted">{asset.duration}</span>}
                      <span className="text-[11px] font-mono text-text-muted">{formatRelative(asset.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    <span className="text-[11px] font-mono text-text-muted">{statusCfg.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {asset.platforms.map((p) => {
                      const cfg = PLATFORM_ICONS[p as keyof typeof PLATFORM_ICONS]
                      if (!cfg) return null
                      return <cfg.Icon key={p} className="w-3.5 h-3.5" style={{ color: cfg.color }} strokeWidth={1.5} />
                    })}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-panel rounded-md text-text-muted hover:text-text-secondary transition-colors">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 hover:bg-panel rounded-md text-text-muted hover:text-text-secondary transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-surface border border-border rounded-xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-[13px] text-text-secondary">No assets match your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
