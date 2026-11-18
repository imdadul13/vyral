-- VYRAL — The AI Operating System for Viral Content
-- Production PostgreSQL & Supabase Schema
-- Includes per-user isolation via Row Level Security (RLS), background job tracking,
-- AI clip viral scoring, VYRAL Viral Optimizer publishing kits, and periodic YouTube view snapshots.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles & Brand Kits
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'pro' CHECK (plan_tier IN ('starter', 'pro', 'agency', 'enterprise')),
  youtube_oauth_connected BOOLEAN NOT NULL DEFAULT FALSE,
  youtube_channel_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brand_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'VYRAL Studio Pro',
  primary_color TEXT NOT NULL DEFAULT '#8B5CF6',
  secondary_color TEXT NOT NULL DEFAULT '#38BDF8',
  accent_color TEXT NOT NULL DEFAULT '#FACC15',
  default_font TEXT NOT NULL DEFAULT 'Inter',
  watermark_text TEXT DEFAULT '@vyral.ai',
  watermark_opacity NUMERIC(3,2) NOT NULL DEFAULT 0.75,
  watermark_position TEXT NOT NULL DEFAULT 'top-right',
  default_preset_id TEXT NOT NULL DEFAULT 'hormozi-bold',
  outro_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Source Video Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  title TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_subscribers BIGINT DEFAULT 0,
  duration_seconds INTEGER NOT NULL,
  thumbnail_url TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  caption_source TEXT NOT NULL DEFAULT 'youtube_captions' CHECK (caption_source IN ('youtube_captions', 'whisper_fallback', 'user_upload')),
  ownership_verified BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('queued', 'transcribing', 'analyzing', 'rendering', 'completed', 'failed')),
  avg_viral_score NUMERIC(5,2) DEFAULT 0,
  transcript_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Generated Viral Clips
CREATE TABLE IF NOT EXISTS public.clips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  suggested_description TEXT NOT NULL,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  start_time NUMERIC(10,2) NOT NULL,
  end_time NUMERIC(10,2) NOT NULL,
  duration NUMERIC(10,2) NOT NULL,
  aspect_ratio TEXT NOT NULL DEFAULT '9:16' CHECK (aspect_ratio IN ('9:16', '16:9', '1:1', '4:5')),
  resolution TEXT NOT NULL DEFAULT '1080p' CHECK (resolution IN ('720p', '1080p', '1440p', '4K')),
  fps INTEGER NOT NULL DEFAULT 30 CHECK (fps IN (24, 25, 30, 50, 60)),
  viral_score INTEGER NOT NULL CHECK (viral_score BETWEEN 0 AND 100),
  hook_strength INTEGER NOT NULL CHECK (hook_strength BETWEEN 0 AND 100),
  retention_potential INTEGER NOT NULL CHECK (retention_potential BETWEEN 0 AND 100),
  emotional_engagement INTEGER NOT NULL CHECK (emotional_engagement BETWEEN 0 AND 100),
  shareability INTEGER NOT NULL CHECK (shareability BETWEEN 0 AND 100),
  moment_category TEXT NOT NULL,
  ai_reasoning TEXT NOT NULL,
  subtitle_preset TEXT NOT NULL DEFAULT 'hormozi-bold',
  subtitle_style_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  words_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  editor_settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  publishing_package_json JSONB DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'published', 'failed')),
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  rendered_video_url TEXT,
  published_platform TEXT,
  published_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. VYRAL Viral Optimizer Publishing Packages (Dedicated Relational Table + Version History)
CREATE TABLE IF NOT EXISTS public.publishing_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clip_id UUID NOT NULL REFERENCES public.clips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_platform TEXT NOT NULL DEFAULT 'youtube_shorts' CHECK (target_platform IN ('youtube_shorts', 'instagram_reels', 'tiktok', 'youtube_longform')),
  selected_title TEXT NOT NULL,
  titles_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  descriptions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  hashtags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  hook_analysis_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  pinned_comments_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  platform_packages_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  optimization_score_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  version_history_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. My Winning Titles (Future & Live Performance Intelligence Table)
CREATE TABLE IF NOT EXISTS public.winning_titles_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES public.clips(id) ON DELETE SET NULL,
  title_text TEXT NOT NULL,
  title_style TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  views BIGINT,
  impressions BIGINT,
  ctr_percent NUMERIC(5,2),
  avg_view_duration_sec NUMERIC(8,2),
  retention_percent NUMERIC(5,2),
  likes BIGINT,
  comments BIGINT,
  shares BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Periodic YouTube View Count Snapshots (For Real-Time Velocity Estimation)
CREATE TABLE IF NOT EXISTS public.youtube_view_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_subscribers BIGINT NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  language TEXT NOT NULL DEFAULT 'en',
  duration_seconds INTEGER NOT NULL DEFAULT 600,
  published_at TIMESTAMPTZ NOT NULL,
  view_count BIGINT NOT NULL,
  like_count BIGINT,
  comment_count BIGINT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_video_observed
  ON public.youtube_view_snapshots (youtube_video_id, observed_at DESC);

-- 7. Background Processing Jobs (BullMQ / Worker Mirror)
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES public.clips(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('ingest_metadata', 'speech_transcription', 'gemini_viral_analysis', 'ffmpeg_render', 'youtube_publish', 'vyral_publishing_kit')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'active', 'completed', 'failed', 'retrying')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  worker_node TEXT DEFAULT 'worker-mac-arm64-01',
  attempts INTEGER NOT NULL DEFAULT 1,
  logs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winning_titles_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users manage own brand kits" ON public.brand_kits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own clips" ON public.clips
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own publishing packages" ON public.publishing_packages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own winning titles" ON public.winning_titles_analytics
  FOR ALL USING (auth.uid() = user_id);
