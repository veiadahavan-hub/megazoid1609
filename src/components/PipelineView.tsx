import { useState } from 'react'

const pipelineStages = [
  {
    id: 'input',
    name: 'Input & Validação',
    icon: '📥',
    description: 'Upload de assets (Lottie JSON, PNGs, MP3)',
    details: [
      'Valida formato Lottie (JSON schema)',
      'Verifica resolução de imagens (min 1080p)',
      'Normaliza áudio (44.1kHz, -16 LUFS)',
      'Gera hash para cache dedup',
    ],
    code: `// Validação de Lottie
const lottie = JSON.parse(fs.readFileSync(path));
if (!lottie.layers || !lottie.fr) {
  throw new Error('Invalid Lottie JSON');
}
const hash = crypto.createHash('md5')
  .update(JSON.stringify(lottie))
  .digest('hex');`,
    color: 'from-blue-500 to-cyan-500',
    status: 'active'
  },
  {
    id: 'rasterize',
    name: 'Lottie Rasterizer',
    icon: '🖥️',
    description: 'Puppeteer renderiza JSON → PNGs transparentes',
    details: [
      'Headless Chrome carrega lottie-web',
      'Renderiza cada frame como PNG alpha',
      'Cache em /tmp/lottie_cache/[hash]/',
      'Retorna sequence: frame_%04d.png',
    ],
    code: `// Puppeteer Lottie Rasterizer
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
// Render each frame
for (let i = 0; i < totalFrames; i++) {
  await page.evaluate((f) => {
    anim.goToAndStop(f, true);
  }, i);
  await page.screenshot({
    path: \`\${cacheDir}/frame_\${String(i).padStart(4,'0')}.png\`,
    omitBackground: true
  });
}`,
    color: 'from-amber-500 to-orange-500',
    status: 'idle'
  },
  {
    id: 'generate',
    name: 'Geração de Assets',
    icon: '🎨',
    description: 'SDXL gera imagens estáticas para cada segmento',
    details: [
      'Prompt engineering por segmento',
      'Gera em 720p (economia de API)',
      'Seed fixo para consistência',
      'Fallback para assets do usuário',
    ],
    code: `// Geração via API (custo ~R$0.01/imagem)
const image = await sdxl.generate({
  prompt: segment.prompt,
  width: 1280, height: 720,
  seed: project.seed + segment.index,
  steps: 25,
  cfg_scale: 7.5
});
await sharp(image)
  .resize(1280, 720)
  .toFile(\`/tmp/seg_\${segment.id}.png\`);`,
    color: 'from-purple-500 to-pink-500',
    status: 'idle'
  },
  {
    id: 'transitions',
    name: 'Motor de Transições',
    icon: '🎞️',
    description: 'FFmpeg filter_complex para efeitos visuais',
    details: [
      'parallax_pan: zoompan com pontos A-B-C-D',
      'mask_zoom_reveal: alphamerge + overlay',
      'ink_bleed: efeito orgânico aleatório',
      'glitch: corrupção controlada de frames',
    ],
    code: `// FFmpeg Parallax Pan
ffmpeg -i segment.png -vf "
  zoompan=z='min(zoom+0.001,1.5)':
  x='iw/2-(iw/zoom/2)+anchor_x':
  y='ih/2-(ih/zoom/2)+anchor_y':
  d=125:s=1280x720:fps=25
" -c:v libx264 -preset fast output.mp4`,
    color: 'from-indigo-500 to-violet-500',
    status: 'idle'
  },
  {
    id: 'audio',
    name: 'Humanizer de Áudio',
    icon: '🎵',
    description: 'Camuflagem + Smart Silence Cut',
    details: [
      'amix: narração + room tone (-40dB)',
      'Whisper timestamps → trim + concat',
      'Padding configurável (0.3s entre frases)',
      'Quebra hash digital do YouTube',
    ],
    code: `// Audio Camouflage + Smart Cut
ffmpeg -i narration.mp3 -i ambience.mp3 \\
  -filter_complex "
    [0]atrim=start=0.5:end=45.2,
    asetpts=PTS-STARTPTS[trim];
    [1]volume=-40dB[amb];
    [trim][amb]amix=inputs=2:duration=first,
    apad=pad_dur=0.3[out]
  " -map "[out]" output.wav`,
    color: 'from-emerald-500 to-teal-500',
    status: 'idle'
  },
  {
    id: 'compose',
    name: 'Composição Final',
    icon: '🎬',
    description: 'FFmpeg monta vídeo com overlays + transições',
    details: [
      'Concatena segmentos com transições',
      'Overlay Lottie rasterizado',
      'Aplica color grading LUT',
      'Render em 720p (intermediário)',
    ],
    code: `// Composição com overlay Lottie
ffmpeg -i base_video.mp4 \\
  -i "lottie_cache/abc123/frame_%04d.png" \\
  -filter_complex "
    [0:v][1:v]overlay=
    enable='between(t,2.5,8.0)':
    format=auto[composed];
    [composed]lut3d=cinematic.cube[out]
  " -map "[out]" -map 0:a \\
  -c:v libx264 -preset medium \\
  -crf 18 intermediate.mp4`,
    color: 'from-rose-500 to-red-500',
    status: 'idle'
  },
  {
    id: 'upscale',
    name: 'Upscaling',
    icon: '🔍',
    description: 'Real-ESRGAN ou Lanczos para 1080p final',
    details: [
      'scale=lanczos (rápido, boa qualidade)',
      'Real-ESRGAN (máx qualidade, mais lento)',
      'Auto-detect por tier do usuário',
      'Output final: /renders/final/',
    ],
    code: `// Upscaling automático
if (userTier === 'byok_unlimited') {
  // Real-ESRGAN via Python subprocess
  await exec(\`python3 realesrgan.py \\
    --input intermediate.mp4 \\
    --output /renders/final/\${projectId}.mp4 \\
    --scale 2 --model realesrgan-x4\`);
} else {
  // Lanczos (FFmpeg nativo)
  await exec(\`ffmpeg -i intermediate.mp4 \\
    -vf "scale=1920:1080:flags=lanczos" \\
    -c:v libx264 -crf 16 \\
    /renders/final/\${projectId}.mp4\`);
}`,
    color: 'from-sky-500 to-blue-500',
    status: 'idle'
  },
  {
    id: 'cleanup',
    name: 'Cleanup & Entrega',
    icon: '🧹',
    description: 'Limpeza de /tmp + Upload para Supabase Storage',
    details: [
      'Remove arquivos de /tmp/ (7 dias max)',
      'Upload .mp4 para Supabase Storage',
      'Atualiza status via WebSocket',
      'Cronjob diário de limpeza',
    ],
    code: `// Cleanup + Delivery
await supabase.storage
  .from('renders')
  .upload(\`\${projectId}/final.mp4\`, finalPath);

// Limpa intermediários
await fs.rm(\`/tmp/seg_*\`, { force: true });
await fs.rm(\`/tmp/lottie_cache/\${hash}\`, { 
  recursive: true, force: true 
});

// Notifica cliente
io.to(projectId).emit('render:complete', {
  url: storageUrl,
  duration: renderTime,
  fileSize: stats.size
});`,
    color: 'from-slate-500 to-gray-500',
    status: 'idle'
  },
]

export default function PipelineView() {
  const [selectedStage, setSelectedStage] = useState(0)

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline de Renderização</h1>
        <p className="text-sm text-slate-400 mt-1">
          Fluxo completo: Input → Rasterize → Generate → Transitions → Audio → Compose → Upscale → Deliver
        </p>
      </div>

      {/* Pipeline Flow */}
      <div className="glass-panel rounded-xl p-6 glow-border">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot"></div>
          <span className="text-xs text-emerald-400 font-medium">Pipeline Ativo — 3 jobs em processamento</span>
        </div>

        {/* Visual Pipeline */}
        <div className="flex items-center gap-1 overflow-x-auto pb-4">
          {pipelineStages.map((stage, i) => (
            <div key={stage.id} className="flex items-center">
              <button
                onClick={() => setSelectedStage(i)}
                className={`pipeline-node flex flex-col items-center p-3 rounded-lg min-w-[100px] transition-all
                  ${selectedStage === i ? 'bg-white/5 border border-indigo-500/30' : 'hover:bg-white/[0.02] border border-transparent'}`}
              >
                <span className="text-xl mb-1">{stage.icon}</span>
                <span className="text-[10px] text-slate-300 font-medium text-center leading-tight">{stage.name}</span>
                {i === 0 && (
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></div>
                )}
              </button>
              {i < pipelineStages.length - 1 && (
                <div className="flex items-center px-1">
                  <div className="w-4 h-[1px] bg-gradient-to-r from-indigo-500/50 to-purple-500/50"></div>
                  <svg className="w-3 h-3 text-indigo-500/50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info Panel */}
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{pipelineStages[selectedStage].icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-white">{pipelineStages[selectedStage].name}</h2>
              <p className="text-xs text-slate-400">{pipelineStages[selectedStage].description}</p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {pipelineStages[selectedStage].details.map((detail, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-gradient-to-r ${pipelineStages[selectedStage].color}`}></div>
                <span className="text-sm text-slate-300">{detail}</span>
              </div>
            ))}
          </div>

          {/* Stage Progress */}
          <div className="bg-[#0d0d14] rounded-lg p-4 border border-[#1e293b]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">Posição no Pipeline</span>
              <span className="text-xs text-indigo-400 font-mono">{selectedStage + 1}/{pipelineStages.length}</span>
            </div>
            <div className="flex gap-1">
              {pipelineStages.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    i <= selectedStage
                      ? `bg-gradient-to-r ${pipelineStages[selectedStage].color}`
                      : 'bg-slate-800'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Code Panel */}
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-indigo-400">{'<'}</span> Implementação <span className="text-indigo-400">{'/>'}</span>
            </h3>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Node.js ES Modules</span>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[#1e293b] overflow-x-auto">
            <pre className="code-block text-slate-300 whitespace-pre-wrap">
              {pipelineStages[selectedStage].code}
            </pre>
          </div>
        </div>
      </div>

      {/* Resource Monitor */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">📊 Monitor de Recursos (Tempo Real)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'CPU', value: 34, unit: '%', color: 'from-blue-500 to-cyan-500' },
            { label: 'RAM', value: 42, unit: '% (10.1GB/24GB)', color: 'from-emerald-500 to-teal-500' },
            { label: 'FFmpeg', value: 67, unit: 'threads ativas', color: 'from-indigo-500 to-purple-500' },
            { label: 'Redis', value: 12, unit: 'jobs na fila', color: 'from-amber-500 to-orange-500' },
          ].map((metric, i) => (
            <div key={i} className="bg-[#0d0d14] rounded-lg p-3 border border-[#1e293b]">
              <p className="text-[10px] text-slate-500 mb-1">{metric.label}</p>
              <p className="text-lg font-bold text-white">{metric.value}<span className="text-xs text-slate-400 ml-1">{metric.unit}</span></p>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${metric.color}`} style={{ width: `${metric.value}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
