import { useState } from 'react'

const camouflageLibrary = [
  { id: 1, name: 'Room Tone (Studio)', file: 'room_tone_studio.wav', duration: '60s', db: -40, type: 'ambient' },
  { id: 2, name: 'Pássaros (Manhã)', file: 'birds_morning.wav', duration: '120s', db: -42, type: 'nature' },
  { id: 3, name: 'Chuva Leve', file: 'rain_light.wav', duration: '180s', db: -38, type: 'nature' },
  { id: 4, name: 'Café Ambiente', file: 'cafe_ambient.wav', duration: '90s', db: -44, type: 'urban' },
  { id: 5, name: 'Vento Suave', file: 'wind_gentle.wav', duration: '150s', db: -41, type: 'nature' },
  { id: 6, name: 'White Noise (Filtered)', file: 'white_noise_filt.wav', duration: '300s', db: -45, type: 'synthetic' },
]

const whisperTimestamps = [
  { start: 0.0, end: 3.2, text: 'Olá, bem-vindos ao vídeo de hoje.', silence_before: 0, silence_after: 1.5 },
  { start: 4.7, end: 8.9, text: 'Nós vamos explorar um tema muito interessante.', silence_before: 0.3, silence_after: 0.8 },
  { start: 9.7, end: 14.1, text: 'Primeiro, precisamos entender o contexto histórico.', silence_before: 0.2, silence_after: 2.1 },
  { start: 16.2, end: 20.5, text: 'Isso é fundamental para o que vem a seguir.', silence_before: 0.1, silence_after: 0.6 },
  { start: 21.1, end: 26.8, text: 'Vamos começar pela origem de tudo.', silence_before: 0.0, silence_after: 1.2 },
  { start: 28.0, end: 33.4, text: 'Muitos pesquisadores já discutiram esse ponto.', silence_before: 0.4, silence_after: 0.9 },
  { start: 34.3, end: 39.7, text: 'E os resultados são surpreendentes.', silence_before: 0.1, silence_after: 3.0 },
]

export default function AudioHumanizer() {
  const [selectedTrack, setSelectedTrack] = useState(0)
  const [paddingMs, setPaddingMs] = useState(300)
  const [camouflageDb, setCamouflageDb] = useState(-40)
  const [smartCutEnabled, setSmartCutEnabled] = useState(true)
  const [camouflageEnabled, setCamouflageEnabled] = useState(true)

  const totalOriginalDuration = 39.7
  const totalCutDuration = whisperTimestamps.reduce((acc, ts) => {
    return acc + (ts.end - ts.start) + (paddingMs / 1000)
  }, 0)
  const savedSeconds = totalOriginalDuration - totalCutDuration

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Humanizer de Áudio</h1>
        <p className="text-sm text-slate-400 mt-1">
          Camuflagem de áudio + Smart Silence Cut — Quebra o hash digital do YouTube
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camouflage Settings */}
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              🎭 Camuflagem
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${camouflageEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                {camouflageEnabled ? 'ON' : 'OFF'}
              </span>
            </h3>
            <button
              onClick={() => setCamouflageEnabled(!camouflageEnabled)}
              className={`w-10 h-5 rounded-full transition-colors ${camouflageEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${camouflageEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Volume da Camuflagem</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="-60"
                  max="-20"
                  value={camouflageDb}
                  onChange={(e) => setCamouflageDb(Number(e.target.value))}
                  className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-xs font-mono text-indigo-400 min-w-[40px]">{camouflageDb}dB</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                {camouflageDb > -30 ? '⚠️ Audível — pode distrair' : camouflageDb > -45 ? '✅ Sub-perceptual (ideal)' : '🔇 Quase inaudível'}
              </p>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Biblioteca de Áudio</label>
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                {camouflageLibrary.map((track, i) => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(i)}
                    className={`w-full text-left p-2 rounded-lg transition-all ${
                      selectedTrack === i
                        ? 'bg-indigo-500/10 border border-indigo-500/30'
                        : 'bg-[#0d0d14] border border-[#1e293b] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white">{track.name}</span>
                      <span className="text-[9px] text-slate-500">{track.type}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-500">{track.duration}</span>
                      <span className="text-[9px] text-slate-600">•</span>
                      <span className="text-[9px] text-slate-500">{track.db}dB</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Silence Cut */}
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              ✂️ Smart Silence Cut
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${smartCutEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                {smartCutEnabled ? 'ON' : 'OFF'}
              </span>
            </h3>
            <button
              onClick={() => setSmartCutEnabled(!smartCutEnabled)}
              className={`w-10 h-5 rounded-full transition-colors ${smartCutEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${smartCutEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Padding entre frases</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="100"
                  max="800"
                  step="50"
                  value={paddingMs}
                  onChange={(e) => setPaddingMs(Number(e.target.value))}
                  className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-xs font-mono text-indigo-400 min-w-[50px]">{paddingMs}ms</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                {paddingMs < 200 ? '⚡ Rápido — estilo YouTuber dinâmico' : paddingMs < 500 ? '✅ Natural — respiro humano' : '🐢 Lento — estilo podcast'}
              </p>
            </div>

            {/* Stats */}
            <div className="bg-[#0d0d14] rounded-lg p-3 border border-[#1e293b] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Duração original</span>
                <span className="text-white font-mono">{totalOriginalDuration.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Duração após corte</span>
                <span className="text-emerald-400 font-mono">{totalCutDuration.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Silêncio removido</span>
                <span className="text-amber-400 font-mono">{savedSeconds.toFixed(1)}s</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${(totalCutDuration / totalOriginalDuration) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* FFmpeg Command */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🔧 Comando Gerado</h3>
          <div className="bg-[#0a0a0f] rounded-lg p-3 border border-[#1e293b] overflow-x-auto h-full">
            <pre className="code-block text-emerald-300/80 whitespace-pre-wrap text-[10px]">
{`ffmpeg -i narration.wav \\
  -i ${camouflageLibrary[selectedTrack].file} \\
  -filter_complex "`}
              {smartCutEnabled && whisperTimestamps.map((ts, i) => (
                `\n    [0:a]atrim=start=${ts.start}:end=${ts.end},asetpts=PTS-STARTPTS[seg${i}];`
              )).join('')}
              {smartCutEnabled && `\n    ${whisperTimestamps.map((_, i) => `[seg${i}]`).join('')}concat=n=${whisperTimestamps.length}:v=0:a=1[trimmed];`}
              {`
    [1:a]volume=${camouflageDb}dB[cam];
    [${smartCutEnabled ? 'trimmed' : '0:a'}][cam]amix=
      inputs=2:duration=first:
      dropout_transition=2[out]
  " -map "[out]" -ar 44100 output.wav`}
            </pre>
          </div>
        </div>
      </div>

      {/* Waveform Timeline */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">📊 Timeline — Whisper Timestamps</h3>
          <span className="text-[10px] text-slate-500">Fonte: OpenAI Whisper (transcrição + VAD)</span>
        </div>

        {/* Waveform Visualization */}
        <div className="relative bg-[#0d0d14] rounded-lg p-4 border border-[#1e293b] overflow-x-auto">
          <div className="flex items-end gap-[1px] h-20 mb-3">
            {Array.from({ length: 200 }).map((_, i) => {
              const time = (i / 200) * totalOriginalDuration
              const isSpeech = whisperTimestamps.some(ts => time >= ts.start && time <= ts.end)
              const height = isSpeech
                ? 30 + Math.sin(i * 0.3) * 25 + Math.random() * 20
                : 5 + Math.random() * 8
              return (
                <div
                  key={i}
                  className={`w-[2px] rounded-full transition-colors ${isSpeech ? 'bg-indigo-400' : 'bg-slate-700'}`}
                  style={{ height: `${height}%` }}
                ></div>
              )
            })}
          </div>

          {/* Segments */}
          <div className="relative h-8">
            {whisperTimestamps.map((ts, i) => (
              <div
                key={i}
                className="absolute top-0 h-full rounded bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center"
                style={{
                  left: `${(ts.start / totalOriginalDuration) * 100}%`,
                  width: `${((ts.end - ts.start) / totalOriginalDuration) * 100}%`,
                }}
              >
                <span className="text-[8px] text-indigo-300 truncate px-1">{i + 1}</span>
              </div>
            ))}
            {/* Padding indicators */}
            {smartCutEnabled && whisperTimestamps.slice(0, -1).map((ts, i) => {
              const padStart = ts.end
              const padEnd = whisperTimestamps[i + 1].start
              const padWidth = ((padEnd - padStart) / totalOriginalDuration) * 100
              return (
                <div
                  key={`pad-${i}`}
                  className="absolute top-0 h-full bg-amber-500/10 border-l border-r border-amber-500/30 flex items-center justify-center"
                  style={{
                    left: `${(padStart / totalOriginalDuration) * 100}%`,
                    width: `${padWidth}%`,
                  }}
                >
                  <span className="text-[7px] text-amber-400">{paddingMs}ms</span>
                </div>
              )
            })}
          </div>

          {/* Time markers */}
          <div className="flex justify-between mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="text-[9px] text-slate-600 font-mono">
                {((totalOriginalDuration / 7) * i).toFixed(1)}s
              </span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-indigo-500/30 border border-indigo-500/50"></div>
            <span className="text-[10px] text-slate-400">Fala (mantida)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40"></div>
            <span className="text-[10px] text-slate-400">Padding ({paddingMs}ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded bg-slate-700"></div>
            <span className="text-[10px] text-slate-400">Silêncio (removido)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
