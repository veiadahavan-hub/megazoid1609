import { useState } from 'react'

interface Project {
  id: string
  name: string
  type: 'dark' | 'edtech' | 'custom'
  status: 'draft' | 'rendering' | 'completed' | 'failed'
  segments: number
  duration: string
  createdAt: string
  thumbnail?: string
  tags: string[]
}

const projects: Project[] = [
  {
    id: 'proj_8f2a',
    name: 'Canal Dark #47 — Mistérios do Oceano Profundo',
    type: 'dark',
    status: 'rendering',
    segments: 12,
    duration: '8:32',
    createdAt: '2026-01-15 14:23',
    tags: ['parallax', 'ink_bleed', 'room_tone'],
  },
  {
    id: 'proj_3b1c',
    name: 'EdTech — Curso Python: Listas e Tuplas',
    type: 'edtech',
    status: 'completed',
    segments: 24,
    duration: '15:47',
    createdAt: '2026-01-15 10:05',
    tags: ['mask_reveal', 'smart_cut'],
  },
  {
    id: 'proj_9d4e',
    name: 'Canal Dark #48 — Sinais no Espaço',
    type: 'dark',
    status: 'draft',
    segments: 8,
    duration: '—',
    createdAt: '2026-01-15 09:12',
    tags: ['glitch', 'white_noise'],
  },
  {
    id: 'proj_1a7f',
    name: 'Canal Dark #46 — Civilizações Perdidas',
    type: 'dark',
    status: 'completed',
    segments: 15,
    duration: '11:23',
    createdAt: '2026-01-14 18:45',
    tags: ['parallax', 'birds', 'lottie_overlay'],
  },
  {
    id: 'proj_5c2b',
    name: 'EdTech — React Hooks: useEffect',
    type: 'edtech',
    status: 'completed',
    segments: 18,
    duration: '12:05',
    createdAt: '2026-01-14 14:30',
    tags: ['mask_reveal', 'cafe_ambient'],
  },
  {
    id: 'proj_7e3d',
    name: 'Canal Dark #45 — O Experimento Filadélfia',
    type: 'dark',
    status: 'failed',
    segments: 10,
    duration: '—',
    createdAt: '2026-01-13 22:10',
    tags: ['glitch', 'rain'],
  },
]

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  rendering: { label: 'Renderizando', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  completed: { label: 'Concluído', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed: { label: 'Falhou', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

const typeConfig = {
  dark: { label: 'Canal Dark', icon: '🌑', color: 'text-purple-400' },
  edtech: { label: 'EdTech', icon: '📚', color: 'text-blue-400' },
  custom: { label: 'Custom', icon: '🎯', color: 'text-amber-400' },
}

export default function ProjectList() {
  const [filter, setFilter] = useState<'all' | 'dark' | 'edtech' | 'custom'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'rendering' | 'completed' | 'failed'>('all')

  const filteredProjects = projects.filter(p => {
    if (filter !== 'all' && p.type !== filter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projetos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie seus projetos de vídeo — Canais Dark, EdTech e Custom
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Projeto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-[#12121a] rounded-lg p-1 border border-[#1e293b]">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'dark', label: '🌑 Dark' },
            { id: 'edtech', label: '📚 EdTech' },
            { id: 'custom', label: '🎯 Custom' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-[#12121a] rounded-lg p-1 border border-[#1e293b]">
          {[
            { id: 'all', label: 'Status' },
            { id: 'draft', label: 'Rascunho' },
            { id: 'rendering', label: 'Render' },
            { id: 'completed', label: 'Concluído' },
            { id: 'failed', label: 'Falhou' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === f.id
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <span className="text-xs text-slate-500">{filteredProjects.length} projetos</span>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="glass-panel rounded-xl p-5 hover:border-indigo-500/20 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeConfig[project.type].icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">{project.id}</p>
                </div>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border ${statusConfig[project.status].color}`}>
                {statusConfig[project.status].label}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <span className="text-[10px] text-slate-400">{project.segments} segmentos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] text-slate-400">{project.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] text-slate-400">{project.createdAt}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/50 text-slate-400 border border-slate-700/50"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Progress bar for rendering */}
            {project.status === 'rendering' && (
              <div className="mt-3">
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-indigo-400">Renderizando...</span>
                  <span className="text-slate-400">67%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" style={{ width: '67%' }}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="glass-panel rounded-xl p-12 text-center">
          <span className="text-4xl mb-4 block">📭</span>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum projeto encontrado</h3>
          <p className="text-sm text-slate-400">Tente ajustar os filtros ou crie um novo projeto.</p>
        </div>
      )}

      {/* Stats Footer */}
      <div className="glass-panel rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{projects.length}</p>
            <p className="text-[10px] text-slate-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{projects.filter(p => p.status === 'completed').length}</p>
            <p className="text-[10px] text-slate-500">Concluídos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-400">{projects.filter(p => p.status === 'rendering').length}</p>
            <p className="text-[10px] text-slate-500">Renderizando</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{projects.filter(p => p.type === 'dark').length}</p>
            <p className="text-[10px] text-slate-500">Canais Dark</p>
          </div>
        </div>
      </div>
    </div>
  )
}
