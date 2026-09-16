/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Lottie Rasterizer
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * O FFmpeg não lê JSON. Este módulo usa Puppeteer (Headless Chrome)
 * para renderizar cada frame de uma animação Lottie como PNG transparente.
 * 
 * Fluxo:
 * 1. Recebe o .json do Lottie no upload
 * 2. Gera hash do conteúdo (para cache dedup)
 * 3. Verifica se já existe em /tmp/lottie_cache/[hash]/
 * 4. Se não existe: Puppeteer renderiza cada frame → PNG sequence
 * 5. Retorna o path da sequência (frame_%04d.png) para o FFmpeg usar
 * 
 * Por que Lottie?
 * - Arquivos JSON de 5-50KB (vs vídeos de MBs)
 * - Animações vetoriais escaláveis
 * - Suporte a transparência (alpha channel)
 * - Usado como overlays em vídeos (partículas, textos animados, etc.)
 * 
 * @module lottieRasterizer
 * @version 1.0.0
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ─── Configurações ───────────────────────────────────────────────────────
const LOTTIE_DEFAULTS = {
  cacheDir: '/tmp/lottie_cache',
  defaultWidth: 1920,
  defaultHeight: 1080,
  defaultFps: 25,
  maxFrames: 300,           // Limite de segurança (12s @ 25fps)
  puppeteerTimeout: 30000,  // 30s timeout para renderização
  background: 'transparent',
};

// Template HTML que carrega o lottie-web e renderiza a animação
const RENDER_HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; }
    body { 
      background: transparent; 
      width: {{WIDTH}}px; 
      height: {{HEIGHT}}px; 
      overflow: hidden;
    }
    #lottie-container {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="lottie-container"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
  <script>
    const animationData = {{ANIMATION_DATA}};
    
    const anim = lottie.loadAnimation({
      container: document.getElementById('lottie-container'),
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: animationData,
    });
    
    // Expondo funções para o Puppeteer controlar
    window.lottieAPI = {
      totalFrames: anim.totalFrames,
      frameRate: anim.frameRate,
      
      goToFrame: function(frame) {
        anim.goToAndStop(frame, true);
      },
      
      isReady: function() {
        return anim.isLoaded;
      }
    };
  </script>
</body>
</html>
`;

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 1. VALIDAÇÃO DE LOTTIE JSON
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Verifica se o JSON é um arquivo Lottie válido antes de processar.
 * 
 * @param {Object|string} lottieData - JSON parseado ou string
 * @returns {Object} { valid, data, error, metadata }
 */
function validateLottie(lottieData) {
  let data;
  
  try {
    data = typeof lottieData === 'string' ? JSON.parse(lottieData) : lottieData;
  } catch (err) {
    return { valid: false, data: null, error: 'JSON inválido: ' + err.message };
  }

  // Validação dos campos obrigatórios do Lottie
  const requiredFields = ['v', 'fr', 'ip', 'op', 'layers'];
  const missingFields = requiredFields.filter(f => !(f in data));
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      data: null,
      error: `Campos obrigatórios faltando: ${missingFields.join(', ')}`,
    };
  }

  // Validação de tipos
  if (typeof data.fr !== 'number' || data.fr <= 0) {
    return { valid: false, data: null, error: 'fr (frame rate) deve ser um número positivo' };
  }

  if (!Array.isArray(data.layers) || data.layers.length === 0) {
    return { valid: false, data: null, error: 'layers deve ser um array não-vazio' };
  }

  // Calcula metadata
  const totalFrames = data.op - data.ip;
  const duration = totalFrames / data.fr;

  return {
    valid: true,
    data,
    error: null,
    metadata: {
      version: data.v,
      frameRate: data.fr,
      inPoint: data.ip,
      outPoint: data.op,
      totalFrames,
      duration: duration.toFixed(2) + 's',
      layers: data.layers.length,
      width: data.w || LOTTIE_DEFAULTS.defaultWidth,
      height: data.h || LOTTIE_DEFAULTS.defaultHeight,
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 2. GERAÇÃO DE HASH (Cache Dedup)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Gera um hash MD5 do conteúdo do Lottie para identificar duplicatas.
 * Se o mesmo Lottie é usado em 10 projetos, só renderiza 1 vez.
 * 
 * @param {Object} lottieData - JSON do Lottie
 * @returns {string} Hash MD5 (32 chars)
 */
function generateLottieHash(lottieData) {
  // Normaliza o JSON (remove espaços, ordena keys) para hash consistente
  const normalized = JSON.stringify(lottieData, Object.keys(lottieData).sort());
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 3. RASTERIZAÇÃO (Puppeteer → PNGs)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * O core do módulo. Usa Puppeteer para:
 * 1. Abrir uma página headless com o template HTML
 * 2. Injetar o Lottie JSON
 * 3. Iterar frame por frame, tirando screenshot de cada um
 * 4. Salvar como PNG com alpha channel (transparente)
 * 
 * @param {Object} config
 * @param {Object} config.lottieData - JSON parseado do Lottie
 * @param {number} [config.width=1920] - Largura do output
 * @param {number} [config.height=1080] - Altura do output
 * @param {number} [config.fps=25] - Frame rate do output
 * @param {Function} [config.onProgress] - Callback de progresso (frame, total)
 * @returns {Promise<Object>} { cachePath, hash, frameCount, sequencePath }
 */
async function rasterize(config = {}) {
  const {
    lottieData,
    width = LOTTIE_DEFAULTS.defaultWidth,
    height = LOTTIE_DEFAULTS.defaultHeight,
    fps = LOTTIE_DEFAULTS.defaultFps,
    onProgress = null,
  } = config;

  // Valida o Lottie
  const validation = validateLottie(lottieData);
  if (!validation.valid) {
    throw new Error(`Lottie inválido: ${validation.error}`);
  }

  const hash = generateLottieHash(lottieData);
  const cacheDir = path.join(LOTTIE_DEFAULTS.cacheDir, hash);
  const cacheInfoPath = path.join(cacheDir, 'info.json');

  // Verifica se já está em cache
  if (fs.existsSync(cacheInfoPath)) {
    const cached = JSON.parse(fs.readFileSync(cacheInfoPath, 'utf-8'));
    // Verifica se todos os frames existem
    const allFramesExist = Array.from({ length: cached.frameCount }, (_, i) =>
      fs.existsSync(path.join(cacheDir, `frame_${String(i).padStart(4, '0')}.png`))
    ).every(Boolean);

    if (allFramesExist) {
      return {
        cachePath: cacheDir,
        hash,
        frameCount: cached.frameCount,
        sequencePath: path.join(cacheDir, 'frame_%04d.png'),
        fromCache: true,
        metadata: cached.metadata,
      };
    }
  }

  // Cria o diretório de cache
  fs.mkdirSync(cacheDir, { recursive: true });

  // Prepara o HTML com o Lottie injetado
  const html = RENDER_HTML_TEMPLATE
    .replace('{{WIDTH}}', width.toString())
    .replace('{{HEIGHT}}', height.toString())
    .replace('{{ANIMATION_DATA}}', JSON.stringify(lottieData));

  const htmlPath = path.join(cacheDir, '_render.html');
  fs.writeFileSync(htmlPath, html);

  // Launch Puppeteer
  let browser;
  try {
    const puppeteer = require('puppeteer');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',  // Importante para VPS com pouca memória
        '--disable-gpu',
        '--disable-web-security',
        `--window-size=${width},${height}`,
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
    });

    // Carrega a página com o Lottie
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0',
      timeout: LOTTIE_DEFAULTS.puppeteerTimeout,
    });

    // Aguarda o Lottie carregar
    await page.waitForFunction('window.lottieAPI && window.lottieAPI.isReady()', {
      timeout: 10000,
    });

    // Pega informações da animação
    const animInfo = await page.evaluate(() => ({
      totalFrames: window.lottieAPI.totalFrames,
      frameRate: window.lottieAPI.frameRate,
    }));

    const totalFrames = Math.min(animInfo.totalFrames, LOTTIE_DEFAULTS.maxFrames);

    // Renderiza cada frame
    for (let i = 0; i < totalFrames; i++) {
      // Vai para o frame específico
      await page.evaluate((frame) => {
        window.lottieAPI.goToFrame(frame);
      }, i);

      // Aguarda o SVG renderizar (importante para animações complexas)
      await page.waitForTimeout(16); // ~1 frame de delay

      // Screenshot com background transparente
      const framePath = path.join(cacheDir, `frame_${String(i).padStart(4, '0')}.png`);
      await page.screenshot({
        path: framePath,
        omitBackground: true, // Mantém transparência
        clip: {
          x: 0,
          y: 0,
          width,
          height,
        },
      });

      // Progress callback
      if (onProgress && typeof onProgress === 'function') {
        onProgress(i + 1, totalFrames);
      }
    }

    // Salva info de cache
    const cacheInfo = {
      hash,
      frameCount: totalFrames,
      frameRate: animInfo.frameRate,
      width,
      height,
      createdAt: new Date().toISOString(),
      metadata: validation.metadata,
    };
    fs.writeFileSync(cacheInfoPath, JSON.stringify(cacheInfo, null, 2));

    return {
      cachePath: cacheDir,
      hash,
      frameCount: totalFrames,
      sequencePath: path.join(cacheDir, 'frame_%04d.png'),
      fromCache: false,
      metadata: {
        ...validation.metadata,
        renderedWidth: width,
        renderedHeight: height,
      },
    };

  } finally {
    // Sempre fecha o browser, mesmo em caso de erro
    if (browser) {
      await browser.close();
    }
    // Limpa o HTML temporário
    if (fs.existsSync(htmlPath)) {
      fs.unlinkSync(htmlPath);
    }
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 4. LIMPEZA DE CACHE
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Remove cache de Lottie antigo (> 7 dias) para liberar espaço.
 * Pode ser chamado por um cronjob diário.
 * 
 * @param {number} [maxAgeDays=7] - Idade máxima em dias
 * @returns {Object} { removed, freedBytes }
 */
function cleanupCache(maxAgeDays = 7) {
  const cacheDir = LOTTIE_DEFAULTS.cacheDir;
  
  if (!fs.existsSync(cacheDir)) {
    return { removed: 0, freedBytes: 0 };
  }

  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // ms
  const now = Date.now();
  let removed = 0;
  let freedBytes = 0;

  const entries = fs.readdirSync(cacheDir);
  
  for (const entry of entries) {
    const entryPath = path.join(cacheDir, entry);
    const stat = fs.statSync(entryPath);
    
    if (stat.isDirectory() && (now - stat.mtimeMs) > maxAge) {
      // Calcula tamanho antes de deletar
      const dirSize = getDirSize(entryPath);
      fs.rmSync(entryPath, { recursive: true, force: true });
      removed++;
      freedBytes += dirSize;
    }
  }

  return { removed, freedBytes, freedMB: (freedBytes / 1024 / 1024).toFixed(2) };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 5. STATUS DO CACHE
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Retorna informações sobre o cache de Lottie atual.
 * 
 * @returns {Object} { totalEntries, totalSize, totalFrames }
 */
function getCacheStatus() {
  const cacheDir = LOTTIE_DEFAULTS.cacheDir;
  
  if (!fs.existsSync(cacheDir)) {
    return { totalEntries: 0, totalSize: 0, totalFrames: 0 };
  }

  const entries = fs.readdirSync(cacheDir);
  let totalSize = 0;
  let totalFrames = 0;

  for (const entry of entries) {
    const entryPath = path.join(cacheDir, entry);
    const infoPath = path.join(entryPath, 'info.json');
    
    if (fs.existsSync(infoPath)) {
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
      totalFrames += info.frameCount || 0;
    }
    
    totalSize += getDirSize(entryPath);
  }

  return {
    totalEntries: entries.length,
    totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    totalFrames,
  };
}

// ─── Helper: Tamanho de diretório ────────────────────────────────────────
function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        size += stat.size;
      } else if (stat.isDirectory()) {
        size += getDirSize(filePath);
      }
    }
  } catch (e) {
    // Ignora erros de permissão
  }
  return size;
}

// ─── Exports ─────────────────────────────────────────────────────────────
module.exports = {
  validateLottie,
  generateLottieHash,
  rasterize,
  cleanupCache,
  getCacheStatus,
  LOTTIE_DEFAULTS,
};
