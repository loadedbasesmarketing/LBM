export type PipelineStage = 'ideate' | 'generate' | 'review' | 'publish'

export type AssetType = 'video' | 'music' | 'thumbnail' | 'image'

export type Platform = 'twitter' | 'instagram' | 'youtube' | 'tiktok'

export type PostStatus = 'draft' | 'generating' | 'ready' | 'scheduled' | 'published' | 'failed'

export interface Asset {
  id: string
  type: AssetType
  url: string
  filename: string
  duration?: number
  thumbnailUrl?: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface Campaign {
  id: string
  title: string
  brief: string
  stage: PipelineStage
  status: PostStatus
  platforms: Platform[]
  assets: Asset[]
  scheduledAt?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface GenerateVideoRequest {
  prompt: string
  duration?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  style?: string
}

export interface GenerateMusicRequest {
  prompt: string
  duration?: number
  genre?: string
  mood?: string
}

export interface GenerateThumbnailRequest {
  title: string
  brief: string
  style?: string
  colorScheme?: string
}

export interface PublishRequest {
  campaignId: string
  platform: Platform
  caption: string
  assetUrls: string[]
  scheduledAt?: string
}

export interface DashboardStats {
  totalCampaigns: number
  published: number
  scheduled: number
  generating: number
  totalReach: number
  engagementRate: number
}
