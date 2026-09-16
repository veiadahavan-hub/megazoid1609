/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Render Worker (BullMQ Consumer)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Worker que consome jobs da fila BullMQ/Redis e executa o pipeline
 * completo de renderização de vídeo.
 * 
 * Pipeline:
 * 1. Busca projeto + segmentos do Supabase
 * 2. Para cada segmento: gera imagem (SDXL) ou usa asset do usuário
 * 3. Rasteriza Lotties (se houver overlays)
 * 4. Aplica transições entre segmentos (FFmpeg)
 * 5. Processa áudio (Smart Cut + Camuflagem)
 * 6. Compõe vídeo final (FFmpeg overlay + concat)
 * 7. Upscaling para 1080p
 * 8. Upload para Supabase Storage
 * 9. Cleanup de arquivos temporários
 * 10. Notifica cliente via WebSocket
 * 
 * @module renderWorker
 * @version 1.0.0
 */

const { Worker } = require('bullmq');
const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const execFileAsync = promisify(execFile);

// Módulos internos
const transitions = require('../utils/transitions');
const { fullAudioPipeline, normalizeAudio } = require('../utils/audioHumanizer');
const { rasterize, getCacheStatus } = require('../utils/lottieRasterizer');
const { upscaler } = require('../utils/upscaler');

// Config
const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const WORKER_CONFIG = {
  concurrency: 2,          // Máximo 2 renders simultâneos (24GB RAM)
  maxStalledCount: 1,      // Re-processa job stalled 1x antes de falhar
  limiter: {
    max: 5,                // Máx 5 jobs por...
    duration: 60000,       // ...60 segundos
  },
};

const PATHS = {
  temp: '/tmp/renders',
  final: '/renders/final',
  lottieCache: '/tmp/lottie_cache',
};

// ─── Worker Principal ────────────────────────────────────────────────────

const renderWorker = new Worker('video-render', async (job) => {
  const { projectId, userId, segments, audioConfig, lottieOverlays, options } = job.data;
  
  console.log(`[renderWorker] Job ${job.id} iniciado — Projeto: ${projectId}`);

  // Cria diretórios temporários para este job
  const jobDir = path.join(PATHS.temp, `job_${job.id}_${Date.now()}`);
  await fs.mkdir(jobDir, { recursive: true });
  await fs.mkdir(path.join(jobDir, 'segments'), { recursive: true });
  await fs.mkdir(path.join(jobDir, 'audio'), { recursive: true });
  await fs.mkdir(path.join(jobDir, 'transitions'), { recursive: true });

  try {
    // ─── FASE 1: Preparação de Assets ────────────────────────────────
    await job.updateProgress(5);
    await notifyProgress(job, 'preparing', 'Preparando assets...', 5);

    // 1a. Rasteriza Lotties (se houver)
    const lottiePaths = {};
    if (lottieOverlays && lottieOverlays.length > 0) {
      await notifyProgress(job, 'rasterizing', 'Rasterizando Lotties...', 8);
      
      for (const overlay of lottieOverlays) {
        const result = await rasterize({
          lottieData: overlay.jsonData,
          width: options.width || 1280,
          height: options.height || 720,
          fps: options.fps || 25,
          onProgress: (current, total) => {
            console.log(`[Lottie ${overlay.id}] Frame ${current}/${total}`);
          },
        });
        lottiePaths[overlay.id] = result.sequencePath;
      }
    }

    // ─── FASE 2: Processa Áudio ──────────────────────────────────────
    await job.updateProgress(15);
    await notifyProgress(job, 'audio', 'Processando áudio...', 15);

    let processedAudioPath = null;
    if (audioConfig && audioConfig.narrationPath) {
      const audioPipeline = fullAudioPipeline({
        narrationPath: audioConfig.narrationPath,
        camouflagePath: audioConfig.camouflagePath,
        outputPath: path.join(jobDir, 'audio', 'final_narration.wav'),
        timestamps: audioConfig.whisperTimestamps,
        options: {
          paddingMs: audioConfig.paddingMs || 300,
          camouflageDb: audioConfig.camouflageDb || -40,
        },
      });

      // Executa cada step do pipeline de áudio
      for (const step of audioPipeline.steps) {
        console.log(`[Audio] Executando: ${step.name}`);
        await executeFFmpeg(step.command, jobDir);
      }

      processedAudioPath = audioConfig.narrationPath; // Output do último step
    }

    // ─── FASE 3: Aplica Transições nos Segmentos ─────────────────────
    await job.updateProgress(30);
    await notifyProgress(job, 'transitions', 'Aplicando transições...', 30);

    const segmentVideos = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const progress = 30 + Math.floor((i / segments.length) * 35);
      await job.updateProgress(progress);
      await notifyProgress(job, 'segment', `Segmento ${i + 1}/${segments.length}`, progress);

      // 3a. Prepara a imagem do segmento (já deve estar gerada pelo SDXL ou upload)
      const segmentImagePath = segment.imagePath || path.join(jobDir, 'segments', `seg_${i}.png`);
      
      // 3b. Aplica transição (parallax pan é o padrão)
      const transitionType = segment.transition || 'parallax_pan';
      const transitionFn = transitions.getTransition(transitionType);
      
      if (!transitionFn) {
        console.warn(`[renderWorker] Transição desconhecida: ${transitionType}. Usando parallax_pan.`);
      }

      const transitionConfig = segment.transitionConfig || {};
      const transitionResult = (transitionFn || transitions.parallax_pan)({
        input: segmentImagePath,
        output: path.join(jobDir, 'segments', `seg_${i}_animated.mp4`),
        duration: segment.duration || 5,
        ...transitionConfig,
      });

      await executeFFmpeg(transitionResult.command, jobDir);
      segmentVideos.push(transitionResult.metadata);
    }

    // ─── FASE 4: Composição Final ────────────────────────────────────
    await job.updateProgress(70);
    await notifyProgress(job, 'composing', 'Compondo vídeo final...', 70);

    // 4a. Concatena todos os segmentos
    const concatListPath = path.join(jobDir, 'concat_list.txt');
    const concatEntries = segmentVideos.map((_, i) => 
      `file '${path.join(jobDir, 'segments', `seg_${i}_animated.mp4`)}'`
    ).join('\n');
    await fs.writeFile(concatListPath, concatEntries);

    const concatCommand = [
      'ffmpeg -y',
      `-f concat -safe 0 -i "${concatListPath}"`,
      `-c:v libx264 -preset fast -crf 18`,
      `-pix_fmt yuv420p`,
      `"${path.join(jobDir, 'composed_base.mp4')}"`,
    ].join(' \\\n  ');

    await executeFFmpeg(concatCommand, jobDir);

    // 4b. Adiciona overlays de Lottie (se houver)
    let composedPath = path.join(jobDir, 'composed_base.mp4');
    
    if (lottieOverlays && lottieOverlays.length > 0) {
      await notifyProgress(job, 'overlay', 'Aplicando overlays Lottie...', 75);
      
      for (const overlay of lottieOverlays) {
        const overlayOutput = path.join(jobDir, `overlay_${overlay.id}.mp4`);
        const sequencePath = lottiePaths[overlay.id];
        
        const overlayCommand = [
          'ffmpeg -y',
          `-i "${composedPath}"`,
          `-i "${sequencePath}"`,
          `-filter_complex "`,
          `  [1:v]format=rgba[lottie];`,
          `  [0:v][lottie]overlay=`,
          `    x=${overlay.x || 0}:y=${overlay.y || 0}:`,
          `    enable='between(t,${overlay.startTime || 0},${overlay.endTime || 999})':`,
          `    format=auto[out]`,
          `"`,
          `-map "[out]"`,
          `-c:v libx264 -preset fast -crf 18`,
          `"${overlayOutput}"`,
        ].join(' \\\n  ');

        await executeFFmpeg(overlayCommand, jobDir);
        composedPath = overlayOutput;
      }
    }

    // 4c. Adiciona áudio processado
    if (processedAudioPath) {
      await notifyProgress(job, 'audio_mix', 'Mixando áudio final...', 80);
      
      const audioMixOutput = path.join(jobDir, 'with_audio.mp4');
      const audioMixCommand = [
        'ffmpeg -y',
        `-i "${composedPath}"`,
        `-i "${processedAudioPath}"`,
        `-c:v copy`,
        `-c:a aac -b:a 192k`,
        `-shortest`,
        `-map 0:v:0 -map 1:a:0`,
        `"${audioMixOutput}"`,
      ].join(' \\\n  ');

      await executeFFmpeg(audioMixCommand, jobDir);
      composedPath = audioMixOutput;
    }

    // ─── FASE 5: Upscaling ───────────────────────────────────────────
    await job.updateProgress(85);
    await notifyProgress(job, 'upscaling', 'Upscaling para 1080p...', 85);

    const finalOutputPath = path.join(PATHS.final, `${projectId}.mp4`);
    await fs.mkdir(PATHS.final, { recursive: true });

    // Decide método de upscaling baseado no tier do usuário
    const upscaleMethod = options.upscaleMethod || 'lanczos';
    
    const upscaleResult = await upscaler({
      input: composedPath,
      output: finalOutputPath,
      method: upscaleMethod, // 'lanczos' ou 'realesrgan'
      targetWidth: 1920,
      targetHeight: 1080,
    });

    await executeFFmpeg(upscaleResult.command, jobDir);

    // ─── FASE 6: Entrega ─────────────────────────────────────────────
    await job.updateProgress(95);
    await notifyProgress(job, 'uploading', 'Enviando para storage...', 95);

    // Upload para Supabase Storage
    const storageUrl = await uploadToStorage(finalOutputPath, projectId, userId);

    // ─── FASE 7: Cleanup ─────────────────────────────────────────────
    await job.updateProgress(100);
    await notifyProgress(job, 'complete', 'Renderização concluída!', 100);

    // Limpa arquivos temporários do job
    await fs.rm(jobDir, { recursive: true, force: true });

    // Retorna resultado
    return {
      projectId,
      outputUrl: storageUrl,
      outputPath: finalOutputPath,
      segments: segments.length,
      duration: segmentVideos.reduce((acc, s) => acc + (s.duration || 0), 0),
      lottieOverlays: lottieOverlays ? lottieOverlays.length : 0,
      renderTime: Date.now() - job.timestamp,
    };

  } catch (error) {
    console.error(`[renderWorker] Job ${job.id} falhou:`, error.message);
    
    // Cleanup em caso de erro
    try {
      await fs.rm(jobDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('[renderWorker] Erro no cleanup:', cleanupError.message);
    }

    throw error; // BullMQ vai marcar o job como failed
  }

}, {
  connection: REDIS_CONNECTION,
  ...WORKER_CONFIG,
});

// ─── Event Handlers ──────────────────────────────────────────────────────

renderWorker.on('completed', (job) => {
  console.log(`[renderWorker] ✅ Job ${job.id} completado com sucesso`);
});

renderWorker.on('failed', (job, err) => {
  console.error(`[renderWorker] ❌ Job ${job.id} falhou:`, err.message);
});

renderWorker.on('stalled', (jobId) => {
  console.warn(`[renderWorker] ⚠️ Job ${jobId} stalled — será re-processado`);
});

renderWorker.on('error', (err) => {
  console.error('[renderWorker] Erro crítico no worker:', err.message);
});

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Executa um comando FFmpeg de forma segura
 */
async function executeFFmpeg(command, workDir) {
  return new Promise((resolve, reject) => {
    // Parseia o comando em args
    const args = parseCommand(command);
    
    console.log(`[FFmpeg] Executando: ${args.slice(0, 5).join(' ')}...`);
    
    const child = execFile('ffmpeg', args, {
      timeout: 300000, // 5 min timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      cwd: workDir,
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[FFmpeg] Erro: ${stderr.slice(-500)}`);
        reject(new Error(`FFmpeg failed: ${error.message}\n${stderr.slice(-200)}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Parseia string de comando em array de argumentos
 */
function parseCommand(command) {
  // Remove 'ffmpeg -y' do início e split por espaços (respeitando quotes)
  const cleaned = command.replace(/^ffmpeg\s+-y\s*/, '').trim();
  const args = ['-y'];
  
  // Simple tokenizer (respeita aspas duplas)
  let current = '';
  let inQuotes = false;
  
  for (const char of cleaned) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current.replace(/\\\n\s*/g, ' ').trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) {
    args.push(current.replace(/\\\n\s*/g, ' ').trim());
  }
  
  return args.filter(a => a.length > 0);
}

/**
 * Notifica progresso via WebSocket (Socket.io)
 */
async function notifyProgress(job, stage, message, progress) {
  // Importa o io dinamicamente para evitar circular dependency
  try {
    const { getIO } = require('../ws/socketServer');
    const io = getIO();
    
    if (io) {
      io.to(job.data.projectId).emit('render:progress', {
        jobId: job.id,
        projectId: job.data.projectId,
        stage,
        message,
        progress,
        timestamp: Date.now(),
      });
    }
  } catch (e) {
    // WebSocket não disponível — não é crítico
  }
}

/**
 * Upload para Supabase Storage
 */
async function uploadToStorage(filePath, projectId, userId) {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const fileName = `${projectId}/final_${Date.now()}.mp4`;
  
  const { data, error } = await supabase.storage
    .from('renders')
    .upload(fileName, filePath, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('renders')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  console.log('[renderWorker] SIGTERM recebido — fechando worker...');
  await renderWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[renderWorker] SIGINT recebido — fechando worker...');
  await renderWorker.close();
  process.exit(0);
});

// ─── Exports ─────────────────────────────────────────────────────────────
module.exports = {
  renderWorker,
  executeFFmpeg,
  parseCommand,
};
