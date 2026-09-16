import { useState } from 'react'

interface Segment {
  id: number
  text: string
  startTime: number
  endTime: number
  isCut: boolean
  transition?: string
}

const initialSegments: Segment[] = [
  { id: 1, text: 'Olá, bem-vindos ao vídeo de hoje.', startTime: 0.0, endTime: 3.2, isCut: false },
  { id: 2, text: 'Nós vamos explorar um tema muito interessante.', startTime: 4.7, endTime: 8.9, isCut: false, transition: 'parallax_pan' },
  { id: 3, text: 'Primeiro, precisamos entender o contexto histórico.', startTime: 9.7, endTime: 14.1, isCut: false, transition: 'mask_zoom_reveal' },
  { id: 4, text: 'Isso é fundamental para o que vem a seguir.', startTime: 16.2, endTime: 20.5, isCut: false },
  { id: 5, text: 'Vamos começar pela origem de tudo.', startTime: 21.1, endTime: 26.8, isCut: false, transition: 'ink_bleed' },
  { id: 6, text: 'Muitos pesquisadores já discutiram esse ponto.', startTime: 28.0, endTime: 33.4, isCut: false },
  { id: 7, text: 'E os resultados são surpreendentes.', startTime: 34.3, endTime: 39.7, isCut: false, transition: 'glitch' },
]

const availableTransitions = ['parallax_pan', 'mask_zoom_reveal', 'ink_bleed', 'glitch', 'none']

export default function TextEditor() {
  const [segments, setSegments] = useState<Segment[]>(initialSegments)
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const toggleCut = (id: number) => {
    setSegments(segments.map(s =>
      s.id === id ? { ...s, isCut: !s.isCut } : s
    ))
  }

  const setTransition = (id: number, transition: string) => {
    setSegments(segments.map(s =>
      s.id === id ? { ...s, transition: transition === 'none' ? undefined : transition } : s
    ))
  }

  const activeSegments = segments.filter(s => !s.isCut)
  const totalDuration = activeSegments.length > 0
    ? activeSegments[activeSegments.length - 1].endTime - activeSegments[0].startTime
    : 0

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Editor por Texto</h1>
          <p className="text-sm text-slate-400 mt-1">
            Clique na frase para cortar • Arraste para reordenar • Transições automáticas entre segmentos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showPreview ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            👁 Preview
          </button>
          <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            🚀 Enviar para Render
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Text Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Project Info */}
          <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                <span className="text-lg">🎬</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Canal Dark #47 — Mistérios do Oceano</h3>
                <p className="text-[10px] text-slate-500">project_8f2a • 7 segmentos • Narrador: Lucas (ElevenLabs)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">{totalDuration.toFixed(1)}s</p>
              <p className="text-[10px] text-slate-500">duração final</p>
            </div>
          </div>

          {/* Text Segments */}
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Transcrição (Whisper)</h3>
              <span className="text-[10px] text-slate-500">
                {activeSegments.length}/{segments.length} segmentos ativos
              </span>
            </div>

            <div className="space-y-2">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  onClick={() => setSelectedSegment(segment.id === selectedSegment ? null : segment.id)}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                    segment.isCut
                      ? 'bg-red-500/5 border border-red-500/20 opacity-50'
                      : selectedSegment === segment.id
                        ? 'bg-indigo-500/10 border border-indigo-500/30'
                        : 'bg-[#0d0d14] border border-[#1e293b] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Cut Toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCut(segment.id) }}
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                        segment.isCut
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      {segment.isCut ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Text */}
                    <div className="flex-1">
                      <p className={`text-sm ${segment.isCut ? 'line-through text-slate-500' : 'text-white'}`}>
                        {segment.text}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[9px] font-mono text-slate-500">
                          {segment.startTime.toFixed(1)}s → {segment.endTime.toFixed(1)}s
                        </span>
                        <span className="text-[9px] text-slate-600">•</span>
                        <span className="text-[9px] text-slate-500">
                          {(segment.endTime - segment.startTime).toFixed(1)}s
                        </span>
                        {segment.transition && !segment.isCut && (
                          <>
                            <span className="text-[9px] text-slate-600">•</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                              → {segment.transition}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Transition Selector (visible on select) */}
                    {selectedSegment === segment.id && !segment.isCut && (
                      <select
                        value={segment.transition || 'none'}
                        onChange={(e) => setTransition(segment.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 outline-none focus:border-indigo-500"
                      >
                        {availableTransitions.map(t => (
                          <option key={t} value={t}>{t === 'none' ? 'Sem transição' : t}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Transition arrow between segments */}
                  {!segment.isCut && segment.id < segments.length && (
                    <div className="absolute -bottom-2 left-8 text-indigo-500/30 text-xs">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="glass-panel rounded-xl p-4 border border-indigo-500/10">
            <div className="flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div>
                <p className="text-xs text-white font-medium">Como funciona a Edição por Texto</p>
                <ul className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                  <li>• Clique no <span className="text-slate-300">✓</span> para manter a frase, ou <span className="text-red-400">✗</span> para cortar</li>
                  <li>• Clique na frase para selecionar e escolher uma transição</li>
                  <li>• O FFmpeg gera automaticamente os comandos <code className="text-indigo-400">atrim</code> + <code className="text-indigo-400">concat</code></li>
                  <li>• Transições são aplicadas entre segmentos adjacentes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Preview */}
          {showPreview && (
            <div className="glass-panel rounded-xl p-5 glow-border">
              <h3 className="text-sm font-semibold text-white mb-3">📺 Preview</h3>
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-[10px] text-slate-400">Preview do render</p>
                  </div>
                </div>
                {/* Simulated progress */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                  <div className="h-full bg-indigo-500 w-1/3 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {/* Render Queue */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">📋 Fila de Render</h3>
            <div className="space-y-2">
              <div className="p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white font-medium">Segmentos ativos</span>
                  <span className="text-xs text-indigo-400 font-mono">{activeSegments.length}</span>
                </div>
              </div>
              <div className="p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white font-medium">Transições aplicadas</span>
                  <span className="text-xs text-purple-400 font-mono">{activeSegments.filter(s => s.transition).length}</span>
                </div>
              </div>
              <div className="p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white font-medium">Estimativa de render</span>
                  <span className="text-xs text-emerald-400 font-mono">~45s</span>
                </div>
              </div>
              <div className="p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white font-medium">Resolução final</span>
                  <span className="text-xs text-amber-400 font-mono">1920×1080</span>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Status */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">🎨 Assets</h3>
            <div className="space-y-2">
              {[
                { name: 'Imagens SDXL', status: 'ready', count: 7 },
                { name: 'Lottie Overlays', status: 'ready', count: 3 },
                { name: 'Áudio Narração', status: 'ready', count: 1 },
                { name: 'Camuflagem', status: 'ready', count: 1 },
              ].map((asset, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-[#0d0d14] border border-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></div>
                    <span className="text-[10px] text-slate-300">{asset.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{asset.count}x</span>
                </div>
              ))}
            </div>
          </div>

          {/* Split Screen Option */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">📱 Split-Screen (Sludge)</h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Adicione um vídeo de satisfação na metade inferior para retenção.
            </p>
            <div className="space-y-2">
              {[
                { label: 'Minecraft Parkour', enabled: false },
                { label: 'Subway Surfers', enabled: false },
                { label: 'Areia Cinética', enabled: true },
                { label: 'Hydraulic Press', enabled: false },
              ].map((option, i) => (
                <label key={i} className="flex items-center gap-2 p-2 rounded bg-[#0d0d14] border border-[#1e293b] cursor-pointer hover:border-slate-600">
                  <input type="radio" name="sludge" defaultChecked={option.enabled} className="accent-indigo-500" />
                  <span className="text-[10px] text-slate-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
