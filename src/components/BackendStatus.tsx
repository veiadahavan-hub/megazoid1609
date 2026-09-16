import { useState } from 'react'

const backendModules = [
  {
    name: 'transitions.js',
    path: 'server/src/utils/transitions.js',
    description: 'Motor de transições modular — Parallax, Mask Reveal, Ink Bleed, Glitch',
    status: 'implemented',
    functions: ['parallax_pan', 'mask_zoom_reveal', 'ink_bleed', 'glitch', 'dissolve'],
    lines: '~280',
    icon: '🎞️',
  },
  {
    name: 'audioHumanizer.js',
    path: 'server/src/utils/audioHumanizer.js',
    description: 'Camuflagem de áudio + Smart Silence Cut com timestamps do Whisper',
    status: 'implemented',
    functions: ['audioCamouflage', 'smartSilenceCut', 'fullAudioPipeline', 'normalizeAudio'],
    lines: '~250',
    icon: '🎵',
  },
  {
    name: 'lottieRasterizer.js',
    path: 'server/src/utils/lottieRasterizer.js',
    description: 'Puppeteer renderiza Lottie JSON → sequência de PNGs transparentes',
    status: 'implemented',
    functions: ['validateLottie', 'generateLottieHash', 'rasterize', 'cleanupCache', 'getCacheStatus'],
    lines: '~260',
    icon: '🖥️',
  },
  {
    name: 'renderWorker.js',
    path: 'server/src/workers/renderWorker.js',
    description: 'BullMQ worker que orquestra todo o pipeline de renderização',
    status: 'implemented',
    functions: ['renderWorker', 'executeFFmpeg', 'notifyProgress', 'uploadToStorage'],
    lines: '~350',
    icon: '⚡',
  },
  {
    name: 'upscaler.js',
    path: 'server/src/utils/upscaler.js',
    description: 'Upscaling automático — Lanczos (rápido) ou Real-ESRGAN (máx qualidade)',
    status: 'implemented',
    functions: ['upscaler', 'upscaleLanczos', 'upscaleRealESRGAN', 'detectResolution'],
    lines: '~200',
    icon: '🔍',
  },
  {
    name: 'cleanup.js',
    path: 'server/src/utils/cleanup.js',
    description: 'Limpeza automática de /tmp — cronjob diário, 7 dias de retenção',
    status: 'implemented',
    functions: ['runCleanup', 'getCleanupStatus'],
    lines: '~100',
    icon: '🧹',
  },
  {
    name: 'server.js',
    path: 'server/src/server.js',
    description: 'Express API + Socket.io — endpoints REST, upload, enfileiramento',
    status: 'implemented',
    functions: ['POST /api/projects', 'POST /api/assets/upload', 'GET /api/projects/:id/status', 'GET /api/transitions'],
    lines: '~280',
    icon: '🌐',
  },
]

const deploySteps = [
  { step: 1, name: 'Clonar na VPS', command: 'git clone <repo> /opt/ai-studio-pro', status: 'ready' },
  { step: 2, name: 'Instalar dependências', command: 'cd server && npm install', status: 'ready' },
  { step: 3, name: 'Configurar .env', command: 'cp .env.example .env && nano .env', status: 'ready' },
  { step: 4, name: 'Instalar Redis', command: 'apt install redis-server && systemctl enable redis', status: 'ready' },
  { step: 5, name: 'Instalar FFmpeg', command: 'apt install ffmpeg', status: 'ready' },
  { step: 6, name: 'Instalar Chromium', command: 'apt install chromium-browser', status: 'ready' },
  { step: 7, name: 'Criar diretórios', command: 'mkdir -p /renders/final /tmp/renders /tmp/lottie_cache', status: 'ready' },
  { step: 8, name: 'Iniciar com PM2', command: 'pm2 start ecosystem.config.js', status: 'ready' },
  { step: 9, name: 'Configurar Nginx', command: 'nano /etc/nginx/sites-available/ai-studio', status: 'ready' },
  { step: 10, name: 'SSL Let\'s Encrypt', command: 'certbot --nginx -d seu-dominio.com', status: 'ready' },
]

export default function BackendStatus() {
  const [expandedModule, setExpandedModule] = useState<number | null>(null)
  const [showDeploy, setShowDeploy] = useState(false)

  const implementedCount = backendModules.filter(m => m.status === 'implemented').length
  const totalFunctions = backendModules.reduce((acc, m) => acc + m.functions.length, 0)

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Backend — Módulos Implementados</h1>
          <p className="text-sm text-slate-400 mt-1">
            Código completo do servidor, pronto para deploy na VPS Oracle
          </p>
        </div>
        <button
          onClick={() => setShowDeploy(!showDeploy)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          📦 Guia de Deploy
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
          <p className="text-2xl font-bold text-emerald-400">{implementedCount}/{backendModules.length}</p>
          <p className="text-xs text-slate-400">Módulos Implementados</p>
        </div>
        <div className="glass-panel rounded-xl p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <p className="text-2xl font-bold text-indigo-400">{totalFunctions}</p>
          <p className="text-xs text-slate-400">Funções Exportadas</p>
        </div>
        <div className="glass-panel rounded-xl p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <p className="text-2xl font-bold text-amber-400">~1.7k</p>
          <p className="text-xs text-slate-400">Linhas de Código</p>
        </div>
        <div className="glass-panel rounded-xl p-4 bg-gradient-to-br from-rose-500/10 to-pink-500/10">
          <p className="text-2xl font-bold text-rose-400">7</p>
          <p className="text-xs text-slate-400">Arquivos Backend</p>
        </div>
      </div>

      {/* Deploy Guide */}
      {showDeploy && (
        <div className="glass-panel rounded-xl p-6 glow-border border-emerald-500/20">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🚀 Deploy na VPS Oracle — Passo a Passo
          </h2>
          <div className="space-y-2">
            {deploySteps.map((step) => (
              <div key={step.step} className="flex items-start gap-3 p-3 rounded-lg bg-[#0d0d14] border border-[#1e293b]">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-emerald-400 font-bold">{step.step}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-white">{step.name}</p>
                  <code className="text-[10px] text-emerald-400 font-mono mt-1 block bg-black/30 rounded px-2 py-1">
                    $ {step.command}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Cards */}
      <div className="space-y-3">
        {backendModules.map((module, i) => (
          <div
            key={i}
            className="glass-panel rounded-xl overflow-hidden transition-all"
          >
            <button
              onClick={() => setExpandedModule(expandedModule === i ? null : i)}
              className="w-full text-left p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-2xl">{module.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{module.name}</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ Implementado
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{module.description}</p>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <span className="text-[10px] text-slate-500 font-mono">{module.lines} lines</span>
                <span className="text-[10px] text-slate-500">{module.functions.length} functions</span>
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${expandedModule === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expandedModule === i && (
              <div className="px-5 pb-5 border-t border-[#1e293b] pt-4 animate-fade-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Functions */}
                  <div>
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Funções Exportadas</h4>
                    <div className="space-y-1">
                      {module.functions.map((fn, j) => (
                        <div key={j} className="flex items-center gap-2 p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
                          <span className="text-indigo-400 text-[10px]">ƒ</span>
                          <code className="text-[11px] text-slate-300 font-mono">{fn}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Path + Info */}
                  <div>
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Informações</h4>
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
                        <p className="text-[9px] text-slate-500">Path</p>
                        <code className="text-[10px] text-emerald-400 font-mono">{module.path}</code>
                      </div>
                      <div className="p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
                        <p className="text-[9px] text-slate-500">Status</p>
                        <p className="text-[10px] text-emerald-400">✓ Pronto para deploy</p>
                      </div>
                      <div className="p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
                        <p className="text-[9px] text-slate-500">Dependências</p>
                        <p className="text-[10px] text-slate-300">
                          {module.name === 'lottieRasterizer.js' && 'puppeteer, chromium'}
                          {module.name === 'renderWorker.js' && 'bullmq, ioredis, ffmpeg'}
                          {module.name === 'server.js' && 'express, socket.io, supabase, multer'}
                          {module.name === 'transitions.js' && 'ffmpeg (subprocess)'}
                          {module.name === 'audioHumanizer.js' && 'ffmpeg (subprocess)'}
                          {module.name === 'upscaler.js' && 'ffmpeg, python3 (opcional)'}
                          {module.name === 'cleanup.js' && 'fs, path (built-in)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Architecture Diagram */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">🏗️ Arquitetura do Backend</h2>
        <div className="bg-[#0d0d14] rounded-lg p-4 border border-[#1e293b] overflow-x-auto">
          <pre className="code-block text-slate-300 text-[10px] leading-relaxed">
{`
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Vite)                      │
│  Dashboard │ Pipeline │ Transitions │ Audio │ Editor │ Projects  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP + WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API SERVER (Express + Socket.io)              │
│  POST /api/projects ──→ BullMQ Queue ──→ renderWorker           │
│  POST /api/assets  ──→ Multer Upload ──→ Supabase Storage       │
│  GET  /api/status    ──→ BullMQ Job Status → WebSocket Push     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RENDER WORKER (BullMQ Consumer)                │
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Lottie   │  │  Transitions │  │   Audio      │  │ Upscale │ │
│  │ Rasterizer│  │   Engine     │  │  Humanizer   │  │  (1080p)│ │
│  │(Puppeteer)│  │  (FFmpeg)    │  │  (FFmpeg)    │  │(Lanczos)│ │
│  └──────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FFmpeg Pipeline (filter_complex)              │   │
│  │  Input → zoompan → overlay → concat → amix → scale → out │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │  Supabase    │  │   Redis     │  │  File System             │ │
│  │  PostgreSQL  │  │  (BullMQ)   │  │  /renders/final/*.mp4    │ │
│  │  + Storage   │  │  Queue+Jobs │  │  /tmp/lottie_cache/      │ │
│  └─────────────┘  └─────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
`}
          </pre>
        </div>
      </div>
    </div>
  )
}
