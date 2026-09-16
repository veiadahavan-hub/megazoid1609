import { useState, useRef, useEffect } from 'react'

interface TimelineSegment {
  id: number
  text: string
  startTime: number
  endTime: number
  color: string
  transition?: string
  imageAsset?: string
}

const COLORS = [
  'from-indigo-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-blue-500',
  'from-violet-500 to-fuchsia-500',
]

const initialSegments: TimelineSegment[] = [
  { id: 1, text: 'Intro — Mistérios do Oceano', startTime: 0, endTime: 5, color: COLORS[0], transition: 'parallax_pan' },
  { id: 2, text: 'A Fossa das Marianas', startTime: 5, endTime: 12, color: COLORS[1], transition: 'mask_zoom_reveal' },
  { id: 3, text: 'Criaturas Abissais', startTime: 12, endTime: 20, color: COLORS[2], transition: 'ink_bleed' },
  { id: 4, text: 'O Mistério do Bloop', startTime: 20, endTime: 28, color: COLORS[3], transition: 'glitch' },
  { id: 5, text: 'Civilizações Submersas?', startTime: 28, endTime: 35, color: COLORS[4], transition: 'dissolve' },
  { id: 6, text: 'Conclusão — O que sabemos', startTime: 35, endTime: 42, color: COLORS[5] },
]

export default function TimelineEditor() {
  const [segments, setSegments] = useState<TimelineSegment[]>(initialSegments)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [playhead, setPlayhead] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [showTransitionPanel, setShowTransitionPanel] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<number | null>(null)

  const totalDuration = segments.length > 0
    ? Math.max(...segments.map(s => s.endTime))
    : 60

  // Playhead animation
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setPlayhead(p => {
          if (p >= totalDuration) {
            setIsPlaying(false)
            return 0
          }
          return p + 0.1
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isPlaying, totalDuration])

  const selectedSegment = segments.find(s => s.id === selectedId)

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / rect.width) * totalDuration
    setPlayhead(Math.max(0, Math.min(time, totalDuration)))
  }

  const handleSegmentDrag = (id: number, newStart: number) => {
    setSegments(prev => prev.map(s => {
      if (s.id === id) {
        const duration = s.endTime - s.startTime
        return { ...s, startTime: newStart, endTime: newStart + duration }
      }
      return s
    }))
  }

  const handleSegmentResize = (id: number, newEnd: number) => {
    setSegments(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, endTime: Math.max(s.startTime + 0.5, newEnd) }
      }
      return s
    }))
  }

  const addSegment = () => {
    const lastEnd = segments.length > 0 ? Math.max(...segments.map(s => s.endTime)) : 0
    const newSegment: TimelineSegment = {
      id: Date.now(),
      text: `Novo Segmento ${segments.length + 1}`,
      startTime: lastEnd,
      endTime: lastEnd + 5,
      color: COLORS[segments.length % COLORS.length],
    }
    setSegments([...segments, newSegment])
  }

  const deleteSegment = (id: number) => {
    setSegments(segments.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const transitions = ['parallax_pan', 'mask_zoom_reveal', 'ink_bleed', 'glitch', 'dissolve', 'none']

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Timeline Editor</h1>
          <p className="text-sm text-slate-400 mt-1">
            Editor visual — Arraste segmentos, ajuste timing, adicione transições
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#12121a] rounded-lg p-1 border border-[#1e293b]">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white"
            >
              −
            </button>
            <span className="text-xs text-slate-300 font-mono px-2">{(zoom * 100).toFixed(0)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white"
            >
              +
            </button>
          </div>
          <button
            onClick={addSegment}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            + Segmento
          </button>
          <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            🚀 Render
          </button>
        </div>
      </div>

      {/* Preview + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Preview */}
        <div className="lg:col-span-3 space-y-4">
          {/* Video Preview */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="aspect-video bg-black relative">
              {/* Simulated preview based on playhead */}
              {segments.map(seg => {
                if (playhead >= seg.startTime && playhead < seg.endTime) {
                  return (
                    <div key={seg.id} className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-full h-full bg-gradient-to-br ${seg.color} opacity-20`}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-white text-lg font-semibold">{seg.text}</p>
                          <p className="text-slate-400 text-xs mt-1">
                            {(playhead - seg.startTime).toFixed(1)}s / {(seg.endTime - seg.startTime).toFixed(1)}s
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })}

              {/* Play controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>{playhead.toFixed(1)}s</span>
                      <span>{totalDuration.toFixed(1)}s</span>
                    </div>
                    <div
                      className="w-full h-1 bg-slate-700 rounded-full cursor-pointer"
                      onClick={handleTimelineClick}
                    >
                      <div
                        className="h-full bg-indigo-500 rounded-full relative"
                        style={{ width: `${(playhead / totalDuration) * 100}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Timeline</h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>{segments.length} segmentos</span>
                <span>•</span>
                <span>{totalDuration.toFixed(1)}s total</span>
              </div>
            </div>

            {/* Time ruler */}
            <div className="relative mb-2 h-5 border-b border-[#1e293b]">
              {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }).map((_, i) => {
                const time = i * 5
                if (time > totalDuration) return null
                return (
                  <div
                    key={i}
                    className="absolute top-0 text-[9px] text-slate-600 font-mono"
                    style={{ left: `${(time / totalDuration) * 100}%` }}
                  >
                    {time}s
                  </div>
                )
              })}
            </div>

            {/* Segments track */}
            <div
              ref={timelineRef}
              className="relative h-16 bg-[#0d0d14] rounded-lg border border-[#1e293b] overflow-hidden cursor-pointer"
              onClick={handleTimelineClick}
            >
              {/* Segments */}
              {segments.map((seg) => {
                const left = (seg.startTime / totalDuration) * 100
                const width = ((seg.endTime - seg.startTime) / totalDuration) * 100
                
                return (
                  <div
                    key={seg.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(seg.id) }}
                    className={`absolute top-1 bottom-1 rounded cursor-pointer transition-all group
                      ${selectedId === seg.id ? 'ring-2 ring-white/50 z-10' : 'hover:ring-1 hover:ring-white/20'}
                    `}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <div className={`w-full h-full bg-gradient-to-r ${seg.color} rounded opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-2 overflow-hidden`}>
                      <span className="text-[9px] text-white font-medium truncate">{seg.text}</span>
                    </div>
                    {/* Transition indicator */}
                    {seg.transition && (
                      <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full border-2 border-indigo-500"></div>
                    )}
                    {/* Resize handle */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                )
              })}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
                style={{ left: `${(playhead / totalDuration) * 100}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Transition track */}
            <div className="relative h-6 mt-2 bg-[#0d0d14] rounded border border-[#1e293b]">
              {segments.map((seg, i) => {
                if (!seg.transition || i === segments.length - 1) return null
                const pos = (seg.endTime / totalDuration) * 100
                return (
                  <div
                    key={`trans-${seg.id}`}
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500/50 border border-indigo-400 cursor-pointer hover:bg-indigo-500 transition-colors"
                    style={{ left: `${pos}%`, transform: 'translate(-50%, -50%)' }}
                    title={seg.transition}
                  ></div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          {selectedSegment ? (
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Propriedades</h3>
                <button
                  onClick={() => deleteSegment(selectedSegment.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  🗑️
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">Texto</label>
                  <input
                    type="text"
                    value={selectedSegment.text}
                    onChange={(e) => {
                      setSegments(prev => prev.map(s =>
                        s.id === selectedId ? { ...s, text: e.target.value } : s
                      ))
                    }}
                    className="w-full mt-1 px-2 py-1.5 rounded bg-[#0d0d14] border border-[#1e293b] text-white text-xs focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider">Início</label>
                    <input
                      type="number"
                      value={selectedSegment.startTime.toFixed(1)}
                      step="0.1"
                      onChange={(e) => handleSegmentDrag(selectedSegment.id, parseFloat(e.target.value))}
                      className="w-full mt-1 px-2 py-1.5 rounded bg-[#0d0d14] border border-[#1e293b] text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider">Fim</label>
                    <input
                      type="number"
                      value={selectedSegment.endTime.toFixed(1)}
                      step="0.1"
                      onChange={(e) => handleSegmentResize(selectedSegment.id, parseFloat(e.target.value))}
                      className="w-full mt-1 px-2 py-1.5 rounded bg-[#0d0d14] border border-[#1e293b] text-white text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">Duração</label>
                  <p className="text-xs text-white font-mono mt-1">
                    {(selectedSegment.endTime - selectedSegment.startTime).toFixed(1)}s
                  </p>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Transição</label>
                  <select
                    value={selectedSegment.transition || 'none'}
                    onChange={(e) => {
                      const value = e.target.value
                      setSegments(prev => prev.map(s =>
                        s.id === selectedId ? { ...s, transition: value === 'none' ? undefined : value } : s
                      ))
                    }}
                    className="w-full px-2 py-1.5 rounded bg-[#0d0d14] border border-[#1e293b] text-white text-xs focus:outline-none focus:border-indigo-500/50"
                  >
                    {transitions.map(t => (
                      <option key={t} value={t}>{t === 'none' ? 'Sem transição' : t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Cor</label>
                  <div className="flex gap-1">
                    {COLORS.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSegments(prev => prev.map(s =>
                            s.id === selectedId ? { ...s, color } : s
                          ))
                        }}
                        className={`w-6 h-6 rounded bg-gradient-to-r ${color} ${
                          selectedSegment.color === color ? 'ring-2 ring-white' : ''
                        }`}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-5 text-center">
              <p className="text-xs text-slate-400">Selecione um segmento na timeline para editar suas propriedades</p>
            </div>
          )}

          {/* Segment List */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Segmentos</h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {segments.map((seg, i) => (
                <button
                  key={seg.id}
                  onClick={() => setSelectedId(seg.id)}
                  className={`w-full text-left p-2 rounded transition-all ${
                    selectedId === seg.id
                      ? 'bg-indigo-500/10 border border-indigo-500/30'
                      : 'bg-[#0d0d14] border border-[#1e293b] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded bg-gradient-to-r ${seg.color}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white truncate">{seg.text}</p>
                      <p className="text-[9px] text-slate-500 font-mono">
                        {seg.startTime.toFixed(1)}s → {seg.endTime.toFixed(1)}s
                      </p>
                    </div>
                    {seg.transition && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                        {seg.transition.substring(0, 8)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="glass-panel rounded-xl p-4">
            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Atalhos</h4>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Play/Pause</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Space</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delete</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Del</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Zoom In</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Ctrl +</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
