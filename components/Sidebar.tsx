'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  PlusCircle,
  Library,
  CalendarClock,
  Settings,
  Zap,
  Activity,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/campaign/new', icon: PlusCircle, label: 'New Campaign' },
  { href: '/library', icon: Library, label: 'Content Library' },
  { href: '/schedule', icon: CalendarClock, label: 'Schedule' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] flex-shrink-0 bg-surface border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-ember rounded-md flex items-center justify-center ember-glow flex-shrink-0">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-800 text-sm tracking-widest text-text-primary uppercase leading-none">
              LBM
            </div>
            <div className="text-[10px] text-text-muted font-mono tracking-wider uppercase leading-none mt-0.5">
              Loaded Bases
            </div>
          </div>
        </div>
      </div>

      {/* Live status indicator */}
      <div className="mx-4 my-3 px-3 py-2 bg-panel border border-border rounded-md">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success status-pulse flex-shrink-0" />
          <span className="text-[11px] font-mono text-text-secondary tracking-wide">Pipeline active</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 group',
                active
                  ? 'bg-panel text-text-primary nav-active'
                  : 'text-text-secondary hover:text-text-primary hover:bg-panel/60'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  active ? 'text-ember' : 'text-text-muted group-hover:text-text-secondary'
                )}
                strokeWidth={active ? 2 : 1.5}
              />
              <span className="font-body text-[13px]">{label}</span>
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full bg-ember" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Pipeline stats mini */}
      <div className="mx-4 mb-4 p-3 bg-panel border border-border rounded-md space-y-2">
        <div className="text-[10px] font-mono text-text-muted tracking-wider uppercase mb-2">
          Today
        </div>
        {[
          { label: 'Generated', value: '12', color: 'text-gold' },
          { label: 'Published', value: '8', color: 'text-success' },
          { label: 'Queued', value: '4', color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">{label}</span>
            <span className={cn('text-[11px] font-mono font-medium', color)}>{value}</span>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-panel/60 transition-all duration-150 group"
        >
          <Settings className="w-4 h-4 text-text-muted group-hover:text-text-secondary" strokeWidth={1.5} />
          <span className="text-[13px]">Settings</span>
        </Link>
      </div>
    </aside>
  )
}
