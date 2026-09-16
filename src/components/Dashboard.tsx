import { ViewType } from '../App'

interface DashboardProps {
  onNavigate: (view: ViewType) => void
}

const stats = [
  { label: 'Renders Hoje', value: '12', change: '+3', icon: '🎬', color: 'from-indigo-500/20 to-purple-500/20' },
  { label: 'Fila BullMQ', value: '3', change: 'Ativo', icon: '⚡', color: 'from-emerald-500/20 to-teal-500/20' },
  { label: 'Cache Lottie', value: '847', change: 'frames', icon: '🎨', color: 'from-amber-500/20 to-orange-500/20' },
  { label: 'Custo API', value: 'R$0.12', change: 'hoje', icon: '💰', color: 'from-pink-500/20 to-rose-500/20' },
]

const recentJobs = [
  { id: 'job_8f2a', project: 'Canal Dark #47 - Mistérios', status: 'rendering', progress: 67, stage: 'FFmpeg Overlay' },
  { id: 'job_3b1c', project: 'EdTech - Aula Python', status: 'upscaling', progress: 89, stage: 'Real-ESRGAN 1080p' },
  { id: 'job_9d4e', project: 'Canal Dark #48 - Terror', status: 'queued', progress: 0, stage: 'Aguardando worker' },
  { id: 'job_1a7f', project: 'Lottie Pack - Transições', status: 'rasterizing', progress: 34, stage: 'Puppeteer → PNGs' },
  { id: 'job_5c2b', project: 'Canal Dark #46 - UFOs', status: 'completed', progress: 100, stage: 'Finalizado' },
]

export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Engenharia de Ilusão</h1>
          <p className="text-sm text-slate-400 mt-1">
            Pipeline ativo — FFmpeg + Lottie Cache + Humanizer de Áudio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot"></div>
            <span className="text-xs text-emerald-400 font-medium">Workers Online</span>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            + Novo Projeto
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`glass-panel rounded-xl p-4 bg-gradient-to-br ${stat.color} hover:scale-[1.02] transition-transform cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold text-white mt-3">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Architecture Overview */}
      <div className="glass-panel rounded-xl p-6 glow-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Arquitetura do Sistema</h2>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">VPS Oracle • Ubuntu</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { name: 'Express API', desc: 'REST + WebSocket', status: 'online', icon: '🌐' },
            { name: 'BullMQ', desc: 'Redis Queue', status: 'online', icon: '📬' },
            { name: 'FFmpeg Worker', desc: 'Render Pipeline', status: 'online', icon: '🎞️' },
            { name: 'Puppeteer', desc: 'Lottie Rasterizer', status: 'idle', icon: '🖥️' },
            { name: 'Supabase', desc: 'PostgreSQL + Auth', status: 'online', icon: '🗄️' },
          ].map((service, i) => (
            <div key={i} className="bg-[#0d0d14] rounded-lg p-3 border border-[#1e293b] hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{service.icon}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${service.status === 'online' ? 'bg-emerald-400 pulse-dot' : 'bg-slate-500'}`}></div>
              </div>
              <p className="text-xs font-medium text-white">{service.name}</p>
              <p className="text-[10px] text-slate-500">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Jobs + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jobs Table */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Jobs Recentes</h2>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#0d0d14] border border-[#1e293b] hover:border-indigo-500/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{job.project}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{job.id}</p>
                </div>
                <div className="hidden sm:block w-32">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-500">{job.stage}</span>
                    <span className="text-slate-400">{job.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        job.status === 'completed' ? 'bg-emerald-500' :
                        job.status === 'rendering' ? 'bg-indigo-500' :
                        job.status === 'upscaling' ? 'bg-purple-500' :
                        job.status === 'rasterizing' ? 'bg-amber-500' :
                        'bg-slate-600'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  job.status === 'rendering' ? 'bg-indigo-500/10 text-indigo-400' :
                  job.status === 'upscaling' ? 'bg-purple-500/10 text-purple-400' :
                  job.status === 'rasterizing' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-slate-500/10 text-slate-400'
                }`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Ações Rápidas</h3>
            <div className="space-y-2">
              {[
                { label: 'Motor de Transições', view: 'transitions' as ViewType, desc: 'Parallax • Mask • Glitch' },
                { label: 'Humanizer de Áudio', view: 'audio' as ViewType, desc: 'Camuflagem + Smart Cut' },
                { label: 'Editor por Texto', view: 'editor' as ViewType, desc: 'Clique = Corte' },
                { label: 'Ver Pipeline', view: 'pipeline' as ViewType, desc: 'FFmpeg Filter Chain' },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(action.view)}
                  className="w-full text-left p-3 rounded-lg bg-[#0d0d14] border border-[#1e293b] hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group"
                >
                  <p className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">{action.label}</p>
                  <p className="text-[10px] text-slate-500">{action.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cost Tracker */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">💰 Custo do Dia</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">API de Imagem (SDXL)</span>
                <span className="text-xs text-white font-mono">R$ 0.08</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">API de Áudio (ElevenLabs)</span>
                <span className="text-xs text-white font-mono">R$ 0.04</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">FFmpeg (Local)</span>
                <span className="text-xs text-emerald-400 font-mono">R$ 0.00</span>
              </div>
              <div className="border-t border-[#1e293b] pt-2 flex justify-between items-center">
                <span className="text-xs text-white font-medium">Total</span>
                <span className="text-sm text-indigo-400 font-bold font-mono">R$ 0.12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
