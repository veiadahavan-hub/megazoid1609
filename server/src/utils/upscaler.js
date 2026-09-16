/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Upscaling Automático
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Após o FFmpeg gerar o vídeo base em 720p (para economizar tempo de render),
 * este módulo faz o upscaling para 1080p.
 * 
 * Dois métodos:
 * 1. Lanczos (FFmpeg nativo) — Rápido, boa qualidade, zero custo
 * 2. Real-ESRGAN (Python subprocess) — Máxima qualidade, mais lento, requer GPU
 * 
 * A escolha depende do tier do usuário:
 * - Plano gratuito/pro: Lanczos (rápido)
 * - Plano byok_unlimited: Real-ESRGAN (máxima qualidade)
 * 
 * @module upscaler
 * @version 1.0.0
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execFileAsync = promisify(execFile);

// ─── Configurações ───────────────────────────────────────────────────────
const UPSCALE_DEFAULTS = {
  targetWidth: 1920,
  targetHeight: 1080,
  method: 'lanczos',       // 'lanczos' | 'realesrgan'
  ffmpegPreset: 'medium',
  ffmpegCrf: 16,           // Qualidade alta para output final
  realesrganModel: 'realesrgan-x4plus',
  realesrganScript: '/opt/realesrgan/upscale.py',
  maxInputResolution: 1280, // Não upscalamos acima disso (já é suficiente)
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 1. UPSCALING COM LANCZOS (FFmpeg Nativo)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Método rápido e eficiente. O filtro lanczos do FFmpeg usa interpolação
 * de alta qualidade que preserva detalhes melhor que bilinear/bicubic.
 * 
 * Custo: Zero (processamento local na VPS)
 * Tempo: ~30s para um vídeo de 10min
 * Qualidade: 8/10 (excelente para conteúdo de YouTube)
 * 
 * @param {Object} config
 * @param {string} config.input - Path do vídeo de entrada (720p)
 * @param {string} config.output - Path do vídeo de saída (1080p)
 * @param {number} [config.targetWidth=1920]
 * @param {number} [config.targetHeight=1080]
 * @returns {Object} { command, metadata }
 */
function upscaleLanczos(config = {}) {
  const {
    input,
    output,
    targetWidth = UPSCALE_DEFAULTS.targetWidth,
    targetHeight = UPSCALE_DEFAULTS.targetHeight,
    preset = UPSCALE_DEFAULTS.ffmpegPreset,
    crf = UPSCALE_DEFAULTS.ffmpegCrf,
  } = config;

  if (!input || !output) {
    throw new Error('upscaleLanczos: input e output são obrigatórios');
  }

  // O filtro scale com flags=lanczos é o coração do upscaling
  // format=yuv420p garante compatibilidade com todos os players
  const filterComplex = `scale=${targetWidth}:${targetHeight}:flags=lanczos,format=yuv420p`;

  const command = [
    'ffmpeg -y',
    `-i "${input}"`,
    `-vf "${filterComplex}"`,
    `-c:v libx264`,
    `-preset ${preset}`,
    `-crf ${crf}`,
    `-pix_fmt yuv420p`,
    `-threads 4`,
    `-movflags +faststart`,
    `-c:a copy`,
    `"${output}"`,
  ].join(' \\\n  ');

  return {
    command,
    filter: filterComplex,
    metadata: {
      type: 'lanczos',
      inputResolution: '720p',
      outputResolution: `${targetWidth}x${targetHeight}`,
      estimatedTime: '~30s per 10min video',
      quality: '8/10',
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 2. UPSCALING COM REAL-ESRGAN (AI-Based)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Usa o modelo Real-ESRGAN via script Python para upscaling com IA.
 * Resultado significativamente melhor que Lanczos, mas:
 * - Requer GPU (ou é MUITO lento em CPU)
 * - Consome ~4GB de VRAM
 * - Tempo: ~5-10min para um vídeo de 10min
 * 
 * Na VPS Oracle com 24GB RAM (sem GPU dedicada), usamos a versão CPU
 * que é mais lenta mas funcional. Para produção com GPU, considerar
 * uma instância com GPU (Oracle GPU.A1 ou similar).
 * 
 * @param {Object} config
 * @param {string} config.input - Path do vídeo de entrada
 * @param {string} config.output - Path do vídeo de saída
 * @param {number} [config.scale=2] - Fator de escala (2x ou 4x)
 * @param {string} [config.model='realesrgan-x4plus']
 * @returns {Object} { command, metadata }
 */
function upscaleRealESRGAN(config = {}) {
  const {
    input,
    output,
    scale = 2,
    model = UPSCALE_DEFAULTS.realesrganModel,
    scriptPath = UPSCALE_DEFAULTS.realesrganScript,
    targetWidth = UPSCALE_DEFAULTS.targetWidth,
    targetHeight = UPSCALE_DEFAULTS.targetHeight,
  } = config;

  if (!input || !output) {
    throw new Error('upscaleRealESRGAN: input e output são obrigatórios');
  }

  // O script Python faz:
  // 1. Extrai frames do vídeo (FFmpeg)
  // 2. Upscale cada frame com Real-ESRGAN
  // 3. Re-monta o vídeo (FFmpeg)
  // 4. Copia o áudio original
  
  const tempDir = path.join('/tmp', `esrgan_${Date.now()}`);
  
  const command = [
    `python3 "${scriptPath}"`,
    `--input "${input}"`,
    `--output "${output}"`,
    `--scale ${scale}`,
    `--model ${model}`,
    `--temp_dir "${tempDir}"`,
    `--target_width ${targetWidth}`,
    `--target_height ${targetHeight}`,
    `--threads 4`,
    `--fp32`,  // Usa float32 (mais compatível com CPU)
  ].join(' \\\n  ');

  return {
    command,
    metadata: {
      type: 'realesrgan',
      model,
      scale: `${scale}x`,
      inputResolution: '720p',
      outputResolution: `${targetWidth}x${targetHeight}`,
      estimatedTime: '~5-10min per 10min video (CPU)',
      quality: '10/10',
      requirements: 'Python 3.10+, PyTorch, realesrgan package',
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 3. UPSCALER UNIFICADO
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Interface única que escolhe o método baseado no config.
 * 
 * @param {Object} config
 * @param {string} config.input
 * @param {string} config.output
 * @param {string} [config.method='lanczos'] - 'lanczos' ou 'realesrgan'
 * @param {number} [config.targetWidth=1920]
 * @param {number} [config.targetHeight=1080]
 * @returns {Object} { command, metadata, method }
 */
function upscaler(config = {}) {
  const {
    input,
    output,
    method = UPSCALE_DEFAULTS.method,
    targetWidth = UPSCALE_DEFAULTS.targetWidth,
    targetHeight = UPSCALE_DEFAULTS.targetHeight,
    ...rest
  } = config;

  // Verifica se já está na resolução alvo (não precisa upscaling)
  // Isso será verificado pelo worker antes de chamar esta função
  
  switch (method) {
    case 'realesrgan':
      return {
        ...upscaleRealESRGAN({ input, output, targetWidth, targetHeight, ...rest }),
        method: 'realesrgan',
      };
    
    case 'lanczos':
    default:
      return {
        ...upscaleLanczos({ input, output, targetWidth, targetHeight, ...rest }),
        method: 'lanczos',
      };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 4. DETECÇÃO DE RESOLUÇÃO
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Usa ffprobe para detectar a resolução de um vídeo.
 * Útil para decidir se upscaling é necessário.
 * 
 * @param {string} videoPath - Path do vídeo
 * @returns {Promise<Object>} { width, height, isUpscaleNeeded }
 */
async function detectResolution(videoPath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-select_streams', 'v:0',
      videoPath,
    ]);

    const data = JSON.parse(stdout);
    const videoStream = data.streams[0];
    
    const width = parseInt(videoStream.width);
    const height = parseInt(videoStream.height);
    
    return {
      width,
      height,
      resolution: `${width}x${height}`,
      isUpscaleNeeded: width < UPSCALE_DEFAULTS.targetWidth,
      codec: videoStream.codec_name,
      fps: eval(videoStream.r_frame_rate), // "25/1" → 25
    };
  } catch (error) {
    throw new Error(`Failed to detect resolution: ${error.message}`);
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────
module.exports = {
  upscaler,
  upscaleLanczos,
  upscaleRealESRGAN,
  detectResolution,
  UPSCALE_DEFAULTS,
};
