import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─── Supabase Client ─────────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// ─── API Config ──────────────────────────────────────────────────────────
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001'

// ─── Types ───────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  api_usage_tier: 'free' | 'pro' | 'byok_unlimited'
  api_keys: Record<string, string>
  monthly_render_limit: number
  renders_used_this_month: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  type: 'dark' | 'edtech' | 'custom'
  status: 'draft' | 'queued' | 'rendering' | 'completed' | 'failed'
  bullmq_job_id: string | null
  segments_count: number
  config: Record<string, unknown>
  output_url: string | null
  output_duration: number | null
  render_time_ms: number | null
  created_at: string
  updated_at: string
}

export interface RenderProgress {
  jobId: string
  projectId: string
  stage: string
  message: string
  progress: number
  timestamp: number
}

export interface UserStats {
  user_id: string
  username: string
  total_projects: number
  completed_projects: number
  rendering_projects: number
  total_api_cost: number
  avg_render_time_ms: number
  renders_used_this_month: number
  monthly_render_limit: number
}

export interface DailyRenderStat {
  render_date: string
  total_renders: number
  successful_renders: number
  failed_renders: number
  total_cost: number
  avg_render_time_ms: number
}

// ─── API Helper ──────────────────────────────────────────────────────────
export async function apiCall<T>(
  endpoint: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ─── Auth Helpers ────────────────────────────────────────────────────────
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// ─── Projects API ────────────────────────────────────────────────────────
export async function fetchProjects(token: string | null): Promise<Project[]> {
  const data = await apiCall<{ projects: Project[] }>('/api/projects', token)
  return data.projects
}

export async function createProject(
  token: string | null,
  projectData: {
    name: string
    type: 'dark' | 'edtech' | 'custom'
    segments: unknown[]
    audioConfig?: unknown
    lottieOverlays?: unknown[]
    options?: Record<string, unknown>
  }
) {
  return apiCall<{ project: Project; jobId: string }>('/api/projects', token, {
    method: 'POST',
    body: JSON.stringify(projectData),
  })
}

export async function fetchProjectStatus(token: string | null, projectId: string) {
  return apiCall<{ project: Project; jobStatus: unknown }>(
    `/api/projects/${projectId}/status`,
    token
  )
}

// ─── Assets API ──────────────────────────────────────────────────────────
export async function uploadAsset(
  token: string | null,
  file: File,
  projectId: string,
  assetType: string
) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('projectId', projectId)
  formData.append('assetType', assetType)

  const response = await fetch(`${API_BASE}/api/assets/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ─── Analytics API ───────────────────────────────────────────────────────
export async function fetchUserStats(): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .single()

  if (error) return null
  return data
}

export async function fetchDailyStats(days = 30): Promise<DailyRenderStat[]> {
  const { data, error } = await supabase
    .from('daily_render_stats')
    .select('*')
    .order('render_date', { ascending: false })
    .limit(days)

  if (error) return []
  return data
}

// ─── Transitions API ─────────────────────────────────────────────────────
export async function fetchTransitions(token: string | null) {
  return apiCall<{
    transitions: string[]
    defaults: Record<string, unknown>
    anchorPresets: Record<string, { x: number; y: number }>
  }>('/api/transitions', token)
}

// ─── Cache API ───────────────────────────────────────────────────────────
export async function fetchLottieCacheStatus(token: string | null) {
  return apiCall<{
    totalEntries: number
    totalSizeMB: string
    totalFrames: number
  }>('/api/cache/lottie', token)
}

export async function fetchCleanupStatus(token: string | null) {
  return apiCall<Record<string, { exists: boolean; entries: number; sizeMB: string }>>(
    '/api/cleanup/status',
    token
  )
}

export async function triggerCleanup(token: string | null) {
  return apiCall<{ removed: number; freedMB: string }>('/api/cleanup/run', token, {
    method: 'POST',
  })
}
