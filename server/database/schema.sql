-- ═══════════════════════════════════════════════════════════════════════
-- AI STUDIO PRO — Schema SQL (Supabase/PostgreSQL)
-- ═══════════════════════════════════════════════════════════════════════
-- Execute este script no SQL Editor do Supabase Dashboard
-- ou via CLI: supabase db push

-- ─── Extensões ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Profiles (extensão do auth.users) ───────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  api_usage_tier TEXT DEFAULT 'free' CHECK (api_usage_tier IN ('free', 'pro', 'byok_unlimited')),
  -- BYOK = Bring Your Own Key (usuário traz suas próprias API keys)
  api_keys JSONB DEFAULT '{}',
  -- Ex: {"openai": "sk-...", "elevenlabs": "...", "stability": "..."}
  monthly_render_limit INTEGER DEFAULT 10,
  renders_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── Projects ────────────────────────────────────────────────────────────
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dark', 'edtech', 'custom')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'rendering', 'completed', 'failed')),
  bullmq_job_id TEXT,
  segments_count INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  -- config armazena: segments, audioConfig, lottieOverlays, options
  output_url TEXT,
  output_duration FLOAT,
  output_file_size BIGINT,
  render_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- ─── Video Segments ──────────────────────────────────────────────────────
CREATE TABLE public.video_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  text_content TEXT,
  -- Texto da narração (para editor por texto)
  image_asset_id UUID,
  -- Referência ao asset de imagem (SDXL ou upload)
  transition_type TEXT DEFAULT 'parallax_pan' 
    CHECK (transition_type IN ('parallax_pan', 'mask_zoom_reveal', 'ink_bleed', 'glitch', 'dissolve', 'none')),
  transition_config JSONB DEFAULT '{}',
  -- Ex: {"path": "A-B-C-D", "zoomStart": 1.0, "zoomEnd": 1.5, "duration": 5}
  camera_path JSONB,
  -- Pontos de ancoragem para parallax: [{"x": 0.2, "y": 0.2}, ...]
  duration FLOAT DEFAULT 5.0,
  -- Duração do segmento em segundos
  is_cut BOOLEAN DEFAULT FALSE,
  -- Se true, segmento foi cortado no editor
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_segments_project_id ON public.video_segments(project_id);
CREATE INDEX idx_video_segments_position ON public.video_segments(project_id, position);

-- ─── Assets ──────────────────────────────────────────────────────────────
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'audio', 'lottie', 'video', 'mask')),
  file_path TEXT NOT NULL,
  -- Path no Supabase Storage ou /tmp
  storage_url TEXT,
  -- URL pública do Supabase Storage
  original_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  meta JSONB DEFAULT '{}',
  -- Para Lottie: {frameRate, totalFrames, width, height, layers}
  -- Para imagens: {width, height, format}
  -- Para áudio: {duration, sampleRate, channels}
  lottie_hash TEXT,
  -- Hash MD5 para cache dedup de Lottie
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_project_id ON public.assets(project_id);
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_lottie_hash ON public.assets(lottie_hash);

-- ─── Audio Camouflage Library ────────────────────────────────────────────
CREATE TABLE public.audio_camouflage_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_url TEXT,
  duration FLOAT NOT NULL,
  -- Duração do áudio em segundos
  category TEXT CHECK (category IN ('ambient', 'nature', 'urban', 'synthetic')),
  default_db INTEGER DEFAULT -40,
  -- Volume padrão em dB (quase imperceptível)
  file_size BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audio_camouflage_category ON public.audio_camouflage_library(category);

-- ─── Render Logs (Analytics) ─────────────────────────────────────────────
CREATE TABLE public.render_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'cancelled')),
  render_time_ms INTEGER,
  -- Tempo total de renderização
  segments_count INTEGER,
  output_duration FLOAT,
  output_resolution TEXT,
  -- Ex: "1920x1080"
  transitions_used JSONB,
  -- Ex: ["parallax_pan", "mask_zoom_reveal", "glitch"]
  lottie_overlays_count INTEGER DEFAULT 0,
  audio_camouflage_used BOOLEAN DEFAULT FALSE,
  smart_cut_used BOOLEAN DEFAULT FALSE,
  upscale_method TEXT CHECK (upscale_method IN ('lanczos', 'realesrgan')),
  api_cost FLOAT DEFAULT 0,
  -- Custo em R$ das APIs externas (SDXL, ElevenLabs, etc)
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_render_logs_user_id ON public.render_logs(user_id);
CREATE INDEX idx_render_logs_created_at ON public.render_logs(created_at DESC);
CREATE INDEX idx_render_logs_status ON public.render_logs(status);

-- ─── Lottie Cache Registry ───────────────────────────────────────────────
CREATE TABLE public.lottie_cache_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hash TEXT UNIQUE NOT NULL,
  -- Hash MD5 do JSON do Lottie
  frame_count INTEGER NOT NULL,
  frame_rate FLOAT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  cache_path TEXT NOT NULL,
  -- Path em /tmp/lottie_cache/[hash]/
  total_size_bytes BIGINT,
  -- Tamanho total dos PNGs em bytes
  times_used INTEGER DEFAULT 1,
  -- Quantas vezes este Lottie foi usado (para decidir se vale manter em cache)
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lottie_cache_hash ON public.lottie_cache_registry(hash);
CREATE INDEX idx_lottie_cache_last_used ON public.lottie_cache_registry(last_used_at DESC);

-- ─── Row Level Security (RLS) ────────────────────────────────────────────
-- Habilita RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Usuários só veem seus próprios dados
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own segments"
  ON public.video_segments FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert segments for own projects"
  ON public.video_segments FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update segments for own projects"
  ON public.video_segments FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own render logs"
  ON public.render_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ─── Functions ───────────────────────────────────────────────────────────

-- Função para incrementar renders_used_this_month
CREATE OR REPLACE FUNCTION increment_render_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET renders_used_this_month = renders_used_this_month + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_render_on_complete
  AFTER INSERT ON public.render_logs
  FOR EACH ROW
  WHEN (NEW.status = 'success')
  EXECUTE FUNCTION increment_render_count();

-- Função para resetar contador mensal (rodar via cronjob mensal)
CREATE OR REPLACE FUNCTION reset_monthly_render_count()
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET renders_used_this_month = 0;
END;
$$ LANGUAGE plpgsql;

-- ─── Seed Data (Audio Camouflage Library) ────────────────────────────────
INSERT INTO public.audio_camouflage_library (name, file_path, duration, category, default_db) VALUES
  ('Room Tone (Studio)', '/assets/audio/room_tone_studio.wav', 60.0, 'ambient', -40),
  ('Pássaros (Manhã)', '/assets/audio/birds_morning.wav', 120.0, 'nature', -42),
  ('Chuva Leve', '/assets/audio/rain_light.wav', 180.0, 'nature', -38),
  ('Café Ambiente', '/assets/audio/cafe_ambient.wav', 90.0, 'urban', -44),
  ('Vento Suave', '/assets/audio/wind_gentle.wav', 150.0, 'nature', -41),
  ('White Noise (Filtered)', '/assets/audio/white_noise_filt.wav', 300.0, 'synthetic', -45);

-- ─── Views (Analytics) ───────────────────────────────────────────────────

-- View: Stats do usuário
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  p.id as user_id,
  p.username,
  COUNT(pr.id) as total_projects,
  COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) as completed_projects,
  COUNT(CASE WHEN pr.status = 'rendering' THEN 1 END) as rendering_projects,
  COALESCE(SUM(rl.api_cost), 0) as total_api_cost,
  COALESCE(AVG(rl.render_time_ms), 0) as avg_render_time_ms,
  p.renders_used_this_month,
  p.monthly_render_limit
FROM public.profiles p
LEFT JOIN public.projects pr ON pr.user_id = p.id
LEFT JOIN public.render_logs rl ON rl.user_id = p.id AND rl.status = 'success'
GROUP BY p.id, p.username, p.renders_used_this_month, p.monthly_render_limit;

-- View: Renders por dia (últimos 30 dias)
CREATE OR REPLACE VIEW public.daily_render_stats AS
SELECT 
  DATE(created_at) as render_date,
  COUNT(*) as total_renders,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_renders,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_renders,
  COALESCE(SUM(api_cost), 0) as total_cost,
  COALESCE(AVG(render_time_ms), 0) as avg_render_time_ms
FROM public.render_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY render_date DESC;

-- ─── Indexes para Performance ────────────────────────────────────────────
-- Índices adicionais para queries frequentes
CREATE INDEX idx_projects_user_status ON public.projects(user_id, status);
CREATE INDEX idx_render_logs_user_date ON public.render_logs(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- FIM DO SCHEMA
-- ═══════════════════════════════════════════════════════════════════════
