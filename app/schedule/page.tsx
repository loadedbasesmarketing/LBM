'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import {
  CalendarClock, Twitter, Instagram, Youtube,
  Video, Music, Image, Clock, Check, X,
  ChevronLeft, ChevronRight, Zap, MoreHorizontal,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const MOCK_SCHEDULED = [
  {
    id: '1',
    title: 'Studio Day BTS',
    platform: 'instagram',
    type: 'video',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    status: 'scheduled',
    caption: 'Raw studio session footage. Authentic vibes only. 🎵',
  },
  {
    id: '2',
    title: 'Product Launch Teaser',
    platform: 'twitter',
    type: 'video',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    status: 'scheduled',
    caption: 'Something big is coming. Stay tuned. 🔥',
  },
  {
    id: '3',
    title: 'Product Launch Teaser',
    platform: 'instagram',
    type: 'video',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    status: 'scheduled',
    caption: 'The drop is almost here. 👀 #NewMusic',
  },
  {
    id: '4',
    title: 'Fan Appreciation Post',
    platform: 'twitter',
    type: 'music',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    status: 'scheduled',
    caption: 'This one\'s for the fans. Thank you for everything. ❤️',
  },
  {
    id: '5',
    title: 'Weekly Recap - July W3',
    platform: 'youtube',
    type: 'video',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    status: 'scheduled',
    caption: 'Best moments from this week\'s sessions.',
  },
]

const PLATFORM_CONFIG = {
  twitter:   { Icon: Twitter,   label: 'Twitter / X', color: '#1DA1F2' },
  instagram: { Icon: Instagram, label: 'Instagram',   color: '#E1306C' },
  youtube:   { Icon: Youtube,   label: 'YouTube',     color: '#FF0000' },
}

const TYPE_CONFIG = {
  video:     { Icon: Video, color: '#FF5A1F' },
  music:     { Icon: Music, color: '#F5C542' },
  thumbnail: { Icon: Image, color: '#3B82F6' },
}

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) return `${Math.floor(hours / 24)}d`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function isUrgent(dateStr: string): boolean {
  return new Date(dateStr).getTime() - Date.now() < 1000 * 60 * 60 * 3
}

export default function SchedulePage() {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear]   = useState(now.getFullYear())

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay    = new Date(currentYear, currentMonth, 1).getDay()
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7

  const calendarDays = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDay + 1
    if (dayNum < 1 || dayNum > daysInMonth) return null
    return dayNum
  })

  const scheduledDates = new Set(
    MOCK_SCHEDULED.map((s) => new Date(s.scheduledAt).getDate())
  )

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1) }
    else setCurrentMonth((m) => m - 1)
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1) }
    else setCurrentMonth((m) => m + 1)
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-base/80 backdrop-blur-sm border-b border-border px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-700 text-text-primary tracking-tight">Schedule</h1>
          <p className="text-[12px] text-text-secondary mt-0.5">{MOCK_SCHEDULED.length} posts queued</p>
        </div>
        <a
          href="/campaign/new"
          className="flex items-center gap-2 bg-ember hover:bg-ember-dim text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ember-glow"
        >
          <Zap className="w-3.5 h-3.5" />
          Add Post
        </a>
      </div>

      <div className="px-8 py-6 grid grid-cols-[320px_1fr] gap-6 animate-slide-up">
        {/* Calendar */}
        <div className="bg-surface border border-border rounded-xl p-5 h-fit">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 hover:bg-panel rounded-md transition-colors text-text-secondary hover:text-text-primary">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-display text-sm font-600 text-text-primary">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-panel rounded-md transition-colors text-text-secondary hover:text-text-primary">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-mono text-text-muted uppercase py-1">
                {d[0]}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()
              const hasPost = scheduledDates.has(day)
              return (
                <button
                  key={day}
                  className={cn(
                    'aspect-square rounded-lg flex flex-col items-center justify-center text-[12px] font-mono transition-all relative',
                    isToday ? 'bg-ember text-white ember-glow' : 'hover:bg-panel text-text-secondary hover:text-text-primary'
                  )}
                >
                  {day}
                  {hasPost && !isToday && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ember" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
              <span className="w-2 h-2 rounded-full bg-ember" />
              Scheduled
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
              <span className="w-2 h-2 rounded-full bg-success" />
              Published
            </div>
          </div>
        </div>

        {/* Queue */}
        <div>
          <h2 className="font-display text-sm font-600 text-text-primary mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ember" />
            Upcoming Posts
          </h2>

          <div className="space-y-2 stagger">
            {MOCK_SCHEDULED
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .map((post) => {
                const platformCfg = PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG]
                const typeCfg     = TYPE_CONFIG[post.type as keyof typeof TYPE_CONFIG]
                const urgent      = isUrgent(post.scheduledAt)

                return (
                  <div
                    key={post.id}
                    className={cn(
                      'bg-surface border rounded-xl p-4 transition-all group animate-slide-up',
                      urgent ? 'border-ember/40 hover:border-ember/60' : 'border-border hover:border-border-bright'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Platform icon */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${platformCfg.color}15` }}
                      >
                        <platformCfg.Icon className="w-4 h-4" style={{ color: platformCfg.color }} strokeWidth={1.5} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-[13px] font-medium text-text-primary truncate">{post.title}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {urgent && (
                              <AlertCircle className="w-3 h-3 text-ember" />
                            )}
                            <span className={cn(
                              'text-[11px] font-mono px-1.5 py-0.5 rounded',
                              urgent ? 'text-ember bg-ember/10' : 'text-text-muted bg-panel'
                            )}>
                              {timeUntil(post.scheduledAt)}
                            </span>
                            <button className="text-text-muted hover:text-text-secondary">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[12px] text-text-secondary truncate mb-2">{post.caption}</p>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
                            <typeCfg.Icon className="w-3 h-3" style={{ color: typeCfg.color }} strokeWidth={1.5} />
                            <span className="capitalize">{post.type}</span>
                          </div>
                          <span className="text-[11px] font-mono text-text-muted">
                            {formatDate(post.scheduledAt)}
                          </span>
                          <span className="ml-auto text-[11px] font-mono" style={{ color: platformCfg.color }}>
                            {platformCfg.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions on hover */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-panel hover:bg-border rounded-md text-[11px] font-mono text-text-secondary hover:text-text-primary transition-colors">
                        Edit
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 hover:bg-success/20 rounded-md text-[11px] font-mono text-success transition-colors">
                        <Check className="w-3 h-3" />
                        Publish Now
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 hover:bg-danger/20 rounded-md text-[11px] font-mono text-danger transition-colors ml-auto">
                        <X className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
