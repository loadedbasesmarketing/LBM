'use client'

import { useState } from 'react'
import { Check, Eye, EyeOff, Save, Twitter, Instagram, Youtube, Zap, Key } from 'lucide-react'
import { cn } from '@/lib/utils'

function EnvField({
  label, envKey, placeholder, description, icon: Icon, iconColor
}: {
  label: string
  envKey: string
  placeholder: string
  description: string
  icon: React.ElementType
  iconColor: string
}) {
  const [show, setShow] = useState(false)
  const [value, setValue] = useState('')

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} strokeWidth={1.5} />
        <label className="text-[12px] font-medium text-text-primary">{label}</label>
        <code className="text-[10px] font-mono text-text-muted bg-panel px-1.5 py-0.5 rounded ml-auto">{envKey}</code>
      </div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-surface border border-border focus:border-ember rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors pr-10 font-mono"
        />
        <button
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-[11px] text-text-muted">{description}</p>
    </div>
  )
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 bg-base/80 backdrop-blur-sm border-b border-border px-8 py-4">
        <h1 className="font-display text-xl font-700 text-text-primary tracking-tight">Settings</h1>
        <p className="text-[12px] text-text-secondary mt-0.5">API keys and integrations</p>
      </div>

      <div className="px-8 py-6 max-w-lg space-y-8 animate-slide-up">
        {/* Inference.sh */}
        <div>
          <h2 className="font-display text-sm font-600 text-text-primary mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-ember" />
            inference.sh
          </h2>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <EnvField
              label="API Key"
              envKey="INFERENCE_API_KEY"
              placeholder="inf_xxxxxxxxxxxxxxxx"
              description="Used for AI video, music, and image generation, as well as social media posting."
              icon={Key}
              iconColor="#FF5A1F"
            />
          </div>
        </div>

        {/* Social platforms */}
        <div>
          <h2 className="font-display text-sm font-600 text-text-primary mb-4 flex items-center gap-2">
            <Twitter className="w-4 h-4 text-[#1DA1F2]" />
            Twitter / X
          </h2>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <EnvField
              label="API Key"
              envKey="TWITTER_API_KEY"
              placeholder="xxxxxxxxxxxxxxxxxx"
              description="Twitter Developer App API key."
              icon={Key}
              iconColor="#1DA1F2"
            />
            <EnvField
              label="API Secret"
              envKey="TWITTER_API_SECRET"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              description="Twitter Developer App API secret."
              icon={Key}
              iconColor="#1DA1F2"
            />
          </div>
        </div>

        <div>
          <h2 className="font-display text-sm font-600 text-text-primary mb-4 flex items-center gap-2">
            <Instagram className="w-4 h-4 text-[#E1306C]" />
            Instagram
          </h2>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <EnvField
              label="Session ID"
              envKey="INSTAGRAM_SESSION_ID"
              placeholder="your_instagram_session_id"
              description="Instagram session cookie. Used by the instagram-scraper app to post content."
              icon={Key}
              iconColor="#E1306C"
            />
          </div>
        </div>

        {/* Anthropic */}
        <div>
          <h2 className="font-display text-sm font-600 text-text-primary mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-text-secondary" />
            Anthropic
          </h2>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <EnvField
              label="API Key"
              envKey="ANTHROPIC_API_KEY"
              placeholder="sk-ant-xxxxxxxxxxxxxxxx"
              description="Used for thumbnail generation and AI-assisted content creation."
              icon={Key}
              iconColor="#888"
            />
          </div>
        </div>

        <div className="pt-2">
          <p className="text-[11px] text-text-muted mb-4">
            Add these keys to your <code className="font-mono bg-panel px-1 py-0.5 rounded text-[10px]">.env.local</code> file in the project root. Changes here are for reference only — the app reads from environment variables at runtime.
          </p>
          <button
            onClick={handleSave}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all',
              saved
                ? 'bg-success/20 text-success border border-success/30'
                : 'bg-ember hover:bg-ember-dim text-white ember-glow'
            )}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
          </button>
        </div>
      </div>
    </div>
  )
}
