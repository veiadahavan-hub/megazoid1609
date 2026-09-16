import { useState, useEffect } from 'react'

const transitions = [
  {
    id: 'parallax_pan',
    name: 'Parallax Pan',
    description: 'ZoomPan com pontos de ancoragem A, B, C, D. Cria ilusão de profundidade em imagens estáticas.',
    category: 'camera',
    complexity: 'Médio',
    params: {
      anchorPoints: ['A: topLeft', 'B: topRight', 'C: bottomRight', 'D: bottomLeft'],
      zoomRange: '1.0 → 1.5',
      duration: '5s (125 frames @ 25fps)',
      easing: 'easeInOutQuad',
    },
    ffmpeg: `ffmpeg -i input.png -vf "
  zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':
  x='if(gte(zoom,1.5),x,x+1)':
  y='ih/2-(ih/zoom/2)':
  d=125:s=1280x720:fps=25
" -c:v libx264 -pix_fmt yuv420p output.mp4`,
    preview: 'parallax',
  },
  {
    id: 'mask_zoom_reveal',
    name: 'Mask Zoom Reveal',
    description: 'Usa alphamerge + overlay com máscara PNG. A imagem atual dá zoom até a próxima ocupar a tela.',
    category: 'mask',
    complexity: 'Alto',
    params: {
      maskType: 'PNG com alpha channel',
      blendMode: 'normal + dissolve',
      zoomTarget: '2.0x (até cobrir frame)',
      transitionDuration: '1.5s',
    },
    ffmpeg: `ffmpeg -i current.png -i next.png -i mask.png \\
  -filter_complex "
    [0:v]zoompan=z='min(zoom+0.016,2.0)':
    x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':
    d=37:s=1280x720:fps=25[zoomed];
    [1:v][2:v]alphamerge[masked];
    [zoomed][masked]overlay=
    enable='gte(t,0)':format=auto[out]
  " -map "[out]" -t 1.5 transition.mp4`,
    preview: 'mask',
  },
  {
    id: 'ink_bleed',
    name: 'Ink Bleed',
    description: 'Efeito orgânico que simula tinta expandindo. Quebra o padrão metronômico de IA.',
    category: 'organic',
    complexity: 'Médio',
    params: {
      noiseType: 'perlin + simplex',
      threshold: '0.3-0.7 (aleatório)',
      spread: 'radial from center',
      color: 'black → transparent',
    },
    ffmpeg: `ffmpeg -i input.png -vf "
  geq=lum='p(X,Y)':
  cb='p(X,Y)':
  alpha='if(gt(random(0),0.7),
    255*smoothstep(0,1,distance(X,Y,W/2,H/2)/(W/2)),
    0)'
" -c:v png ink_bleed_%04d.png

# Overlay como máscara de transição
ffmpeg -i bg.mp4 -i ink_bleed.mp4 \\
  -filter_complex "[0:v][1:v]overlay=format=auto" \\
  output.mp4`,
    preview: 'ink',
  },
  {
    id: 'glitch',
    name: 'Digital Glitch',
    description: 'Corrupção controlada de frames. RGB shift + scanlines + noise burst.',
    category: 'digital',
    complexity: 'Alto',
    params: {
      rgbShift: '±15px horizontal',
      scanlines: '2px spacing, 30% opacity',
      noiseBurst: '5-10 frames aleatórios',
      triggerChance: '15% por segmento',
    },
    ffmpeg: `ffmpeg -i input.mp4 -vf "
  split[a][b];
  [a]lutrgb=r=val:b=0:g=0,
  scroll=horizontal=0.02[r];
  [a]lutrgb=r=0:g=val:b=0,
  scroll=horizontal=-0.02[g];
  [a]lutrgb=r=0:g=0:b=val,
  scroll=horizontal=0.01[bl];
  [r][g][bl]blend=all_mode=addition[rgb];
  [b][rgb]blend=all_mode=screen:
  all_opacity=0.7[out]
" -frames:v 8 glitch_frames.mp4`,
    preview: 'glitch',
  },
]

function TransitionPreview({ type }: { type: string }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 60)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  switch (type) {
    case 'parallax':
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 transition-transform duration-100"
            style={{ transform: `scale(${1 + frame * 0.005}) translate(${-frame * 0.3}px, ${-frame * 0.2}px)` }}
          >
            <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-indigo-500/30 blur-sm"></div>
            <div className="absolute bottom-6 right-8 w-24 h-24 rounded-full bg-purple-500/20 blur-md"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-indigo-400/50 rounded"></div>
          </div>
          <div className="absolute bottom-2 left-2 text-[9px] text-slate-500 font-mono">
            zoom: {(1 + frame * 0.005).toFixed(3)}x
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            {['A', 'B', 'C', 'D'].map((p, i) => (
              <span key={p} className={`text-[8px] px-1 rounded ${i === Math.floor(frame / 15) % 4 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )
    case 'mask':
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 to-orange-900/30"></div>
          <div
            className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-teal-900/50"
            style={{
              clipPath: `circle(${frame * 1.5}% at 50% 50%)`,
            }}
          ></div>
          <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-lg"></div>
          <div className="absolute bottom-2 left-2 text-[9px] text-slate-500 font-mono">
            mask: circle({(frame * 1.5).toFixed(1)}%)
          </div>
        </div>
      )
    case 'ink':
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-rose-500/20 blur-sm"
              style={{
                width: `${20 + Math.sin((frame + i * 30) * 0.1) * 15}px`,
                height: `${20 + Math.cos((frame + i * 20) * 0.1) * 15}px`,
                left: `${20 + i * 12}%`,
                top: `${30 + Math.sin((frame + i * 15) * 0.08) * 20}%`,
                transform: `scale(${1 + frame * 0.01})`,
              }}
            ></div>
          ))}
          <div className="absolute bottom-2 left-2 text-[9px] text-slate-500 font-mono">
            spread: {(frame * 1.2).toFixed(1)}px
          </div>
        </div>
      )
    case 'glitch':
      return (
        <div className="relative w-full h-40 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-transparent"
            style={{ transform: `translateX(${Math.sin(frame * 0.5) * 5}px)` }}
          ></div>
          <div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent"
            style={{ transform: `translateX(${-Math.sin(frame * 0.5) * 5}px)` }}
          ></div>
          <div
            className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent"
            style={{ transform: `translateX(${Math.cos(frame * 0.3) * 3}px)` }}
          ></div>
          {frame % 8 < 2 && (
            <div className="absolute inset-0 bg-white/5" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
            }}></div>
          )}
          <div className="absolute bottom-2 left-2 text-[9px] text-slate-500 font-mono">
            rgb_shift: {Math.sin(frame * 0.5) * 5 > 0 ? '+' : ''}{(Math.sin(frame * 0.5) * 5).toFixed(1)}px
          </div>
        </div>
      )
    default:
      return null
  }
}

export default function TransitionsEngine() {
  const [selectedTransition, setSelectedTransition] = useState(0)

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Motor de Transições</h1>
        <p className="text-sm text-slate-400 mt-1">
          <code className="text-indigo-400">src/utils/transitions.js</code> — Filtros FFmpeg modulares para a Engenharia de Ilusão
        </p>
      </div>

      {/* Transition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {transitions.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setSelectedTransition(i)}
            className={`text-left p-4 rounded-xl transition-all ${
              selectedTransition === i
                ? 'glass-panel glow-border border-indigo-500/30'
                : 'bg-[#12121a] border border-[#1e293b] hover:border-indigo-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-indigo-400">{t.id}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                t.complexity === 'Alto' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
              }`}>{t.complexity}</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{t.name}</h3>
            <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{t.category}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview + Params */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Preview (Simulação)</h3>
            <TransitionPreview type={transitions[selectedTransition].preview} />
          </div>

          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Parâmetros</h3>
            <div className="space-y-2">
              {Object.entries(transitions[selectedTransition].params).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
                  <span className="text-[10px] font-mono text-indigo-400 min-w-[100px]">{key}</span>
                  <span className="text-xs text-slate-300">{Array.isArray(value) ? value.join(', ') : value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FFmpeg Command */}
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Comando FFmpeg</h3>
            <button className="text-[10px] px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
              📋 Copiar
            </button>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[#1e293b] overflow-x-auto">
            <pre className="code-block text-emerald-300/80 whitespace-pre-wrap">
              {transitions[selectedTransition].ffmpeg}
            </pre>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-[10px] text-amber-400 font-medium mb-1">⚠️ Nota de Performance</p>
            <p className="text-[11px] text-slate-400">
              {transitions[selectedTransition].complexity === 'Alto'
                ? 'Este filtro consome mais GPU/RAM. Limitar a 1 instância simultânea no worker. Usar -threads 4.'
                : 'Filtro leve. Pode rodar em paralelo com outros segmentos. Usar -threads 8.'}
            </p>
          </div>
        </div>
      </div>

      {/* Integration Note */}
      <div className="glass-panel rounded-xl p-5 border border-indigo-500/10">
        <div className="flex items-start gap-3">
          <span className="text-lg">🔗</span>
          <div>
            <h4 className="text-sm font-semibold text-white">Integração com renderWorker.js</h4>
            <p className="text-xs text-slate-400 mt-1">
              Cada função em <code className="text-indigo-400">transitions.js</code> retorna uma string de filtro que é injetada
              no <code className="text-indigo-400">-filter_complex</code> do FFmpeg. O worker seleciona a transição baseada no
              <code className="text-indigo-400">transition_config</code> do <code className="text-indigo-400">video_segments</code> no PostgreSQL.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
