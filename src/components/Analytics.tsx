import { useState, useEffect } from 'react'
import { fetchDailyStats, fetchUserStats, type DailyRenderStat, type UserStats } from '../hooks/api'

// Dados mock para demo (quando Supabase não está configurado)
const mockDailyStats: DailyRenderStat[] = [
  { render_date: '2026-01-15', total_renders: 12, successful_renders: 11, failed_renders: 1, total_cost: 1.44, avg_render_time_ms: 45000 },
  { render_date: '2026-01-14', total_renders: 8, successful_renders: 8, failed_renders: 0, total_cost: 0.96, avg_render_time_ms: 38000 },
  { render_date: '2026-01-13', total_renders: 15, successful_renders: 14, failed_renders: 1, total_cost: 1.80, avg_render_time_ms: 52000 },
  { render_date: '2026-01-12', total_renders: 6, successful_renders: 6, failed_renders: 0, total_cost: 0.72, avg_render_time_ms: 35000 },
  { render_date: '2026-01-11', total_renders: 10, successful_renders: 9, failed_renders: 1, total_cost: 1.20, avg_render_time_ms: 48000 },
  { render_date: '2026-01-10', total_renders: 4, successful_renders: 4, failed_renders: 0, total_cost: 0.48, avg_render_time_ms: 32000 },
  { render_date: '2026-01-09', total_renders: 9, successful_renders: 9, failed_renders: 0, total_cost: 1.08, avg_render_time_ms: 41000 },
]

const mockUserStats: UserStats = {
  user_id: 'demo-user',
  username: 'demo',
  total_projects: 47,
  completed_projects: 42,
  rendering_projects: 2,
  total_api_cost: 56.28,
  avg_render_time_ms: 43000,
  renders_used_this_month: 12,
  monthly_render_limit: 50,
}

interface AnalyticsProps {
  useMockData?: boolean
}

export default function Analytics({ useMockData = true }: AnalyticsProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyRenderStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (useMockData) {
        setStats(mockUserStats)
        setDailyStats(mockDailyStats)
        setLoading(false)
        return
      }

      try {
        const [userStats, daily] = await Promise.all([
          fetchUserStats(),
          fetchDailyStats(),
        ])
        setStats(userStats)
        setDailyStats(daily)
      } catch (err) {
        // Fallback para mock data
        setStats(mockUserStats)
        setDailyStats(mockDailyStats)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [useMockData])

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const maxRenders = Math.max(...dailyStats.map(d => d.total_renders))
  const totalRenders7d = dailyStats.slice(0, 7).reduce((acc, d) => acc + d.total_renders, 0)
  const totalCost7d = dailyStats.slice(0, 7).reduce((acc, d) => acc + d.total_cost, 0)
  const successRate = stats
    ? ((stats.completed_projects / Math.max(stats.total_projects, 1)) * 100).toFixed(0)
    : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">📊 Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {useMockData ? 'Dados de demonstração' : 'Dados em tempo real do Supabase'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            Últimos 7 dias
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Renders (7d)</span>
            <span className="text-lg">🎬</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalRenders7d}</p>
          <p className="text-[10px] text-indigo-400 mt-1">
            ↑ {((totalRenders7d / 7) * 30).toFixed(0)} projetado/mês
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Custo (7d)</span>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-2xl font-bold text-white">R$ {totalCost7d.toFixed(2)}</p>
          <p className="text-[10px] text-emerald-400 mt-1">
            R$ {(totalCost7d / Math.max(totalRenders7d, 1)).toFixed(2)} /render
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Taxa de Sucesso</span>
            <span className="text-lg">✅</span>
          </div>
          <p className="text-2xl font-bold text-white">{successRate}%</p>
          <p className="text-[10px] text-amber-400 mt-1">
            {stats?.completed_projects || 0}/{stats?.total_projects || 0} projetos
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4 bg-gradient-to-br from-rose-500/10 to-pink-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Limite Mensal</span>
            <span className="text-lg">📊</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.renders_used_this_month || 0}/{stats?.monthly_render_limit || 50}
          </p>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
              style={{ width: `${((stats?.renders_used_this_month || 0) / (stats?.monthly_render_limit || 50)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Chart: Renders por Dia */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Renders por Dia</h3>
        <div className="flex items-end gap-2 h-32">
          {dailyStats.slice(0, 7).reverse().map((day, i) => {
            const height = (day.total_renders / maxRenders) * 100
            const successHeight = (day.successful_renders / maxRenders) * 100
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative w-full flex flex-col justify-end h-24">
                  {/* Total (background) */}
                  <div
                    className="w-full bg-slate-700/50 rounded-t transition-all duration-500"
                    style={{ height: `${height}%` }}
                  ></div>
                  {/* Successful (foreground) */}
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all duration-500"
                    style={{ height: `${successHeight}%` }}
                  ></div>
                </div>
                <span className="text-[9px] text-slate-500">
                  {new Date(day.render_date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">{day.total_renders}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded bg-gradient-to-t from-indigo-600 to-indigo-400"></div>
            <span className="text-[9px] text-slate-400">Sucesso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded bg-slate-700/50"></div>
            <span className="text-[9px] text-slate-400">Total</span>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">💰 Breakdown de Custo</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎨</span>
              <span className="text-xs text-slate-300">API de Imagem (SDXL)</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-white font-mono">
                R$ {(totalCost7d * 0.67).toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-500 ml-2">67%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎵</span>
              <span className="text-xs text-slate-300">API de Áudio (ElevenLabs)</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-white font-mono">
                R$ {(totalCost7d * 0.33).toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-500 ml-2">33%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎞️</span>
              <span className="text-xs text-slate-300">FFmpeg (Local)</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-400 font-mono">R$ 0.00</span>
              <span className="text-[9px] text-emerald-400/60 ml-2">∞</span>
            </div>
          </div>
          <div className="border-t border-[#1e293b] pt-2 flex items-center justify-between">
            <span className="text-xs text-white font-medium">Total (7 dias)</span>
            <span className="text-sm text-indigo-400 font-bold font-mono">
              R$ {totalCost7d.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">⚡ Performance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded bg-[#0d0d14] border border-[#1e293b]">
            <p className="text-lg font-bold text-white">
              {stats ? (stats.avg_render_time_ms / 1000).toFixed(0) : '43'}s
            </p>
            <p className="text-[10px] text-slate-500">Tempo médio/render</p>
          </div>
          <div className="text-center p-3 rounded bg-[#0d0d14] border border-[#1e293b]">
            <p className="text-lg font-bold text-white">
              {stats?.total_projects || 47}
            </p>
            <p className="text-[10px] text-slate-500">Total de projetos</p>
          </div>
          <div className="text-center p-3 rounded bg-[#0d0d14] border border-[#1e293b]">
            <p className="text-lg font-bold text-emerald-400">
              R$ {stats ? (stats.total_api_cost).toFixed(2) : '56.28'}
            </p>
            <p className="text-[10px] text-slate-500">Custo total acumulado</p>
          </div>
        </div>
      </div>
    </div>
  )
}
