/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Motor de Transições Modular
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Cada função retorna uma string de filtro FFmpeg (-filter_complex)
 * que é injetada dinamicamente pelo renderWorker.js.
 * 
 * Princípio: Custo Zero de API de Vídeo.
 * Tudo é manipulação matemática de pixels via FFmpeg.
 * 
 * Uso:
 *   const filter = transitions.parallax_pan({ ...config });
 *   // => string para injetar no -filter_complex do ffmpeg
 * 
 * @module transitions
 * @version 1.0.0
 */

// ─── Configurações padrão ────────────────────────────────────────────────
const DEFAULTS = {
  fps: 25,
  width: 1280,
  height: 720,
  preset: 'fast',       // libx264 preset (fast = bom custo-benefício)
  crf: 18,              // qualidade intermediária (18-23 é o sweet spot)
  threads: 4,           // limite de threads por instância FFmpeg
  pixelFormat: 'yuv420p',
};

// ─── Pontos de ancoragem para Parallax ───────────────────────────────────
// Cada ponto define para onde a "câmera" vai durante o zoom
const ANCHOR_PRESETS = {
  A: { x: 0.2, y: 0.2 },   // Top-Left
  B: { x: 0.8, y: 0.2 },   // Top-Right
  C: { x: 0.8, y: 0.8 },   // Bottom-Right
  D: { x: 0.2, y: 0.8 },   // Bottom-Left
  CENTER: { x: 0.5, y: 0.5 },
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 1. PARALLAX PAN
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Aplica zoompan com interpolação entre pontos de ancoragem A→B→C→D.
 * Cria a ilusão de que a câmera está se movendo sobre uma imagem estática.
 * 
 * A "Engenharia de Ilusão" está aqui: uma imagem 2D ganha profundidade
 * porque o zoom + pan simulam movimento de câmera real.
 * 
 * @param {Object} config
 * @param {string} config.input - Path do arquivo de entrada
 * @param {string} config.output - Path do arquivo de saída
 * @param {string} [config.path='A-B-C-D'] - Sequência de ancoragens
 * @param {number} [config.zoomStart=1.0] - Zoom inicial
 * @param {number} [config.zoomEnd=1.5] - Zoom final
 * @param {number} [config.duration=5] - Duração em segundos
 * @param {string} [config.easing='easeInOut'] - Função de easing
 * @returns {string} Comando FFmpeg completo
 */
function parallax_pan(config = {}) {
  const {
    input = 'input.png',
    output = 'output.mp4',
    path = 'A-B-C-D',
    zoomStart = 1.0,
    zoomEnd = 1.5,
    duration = 5,
    easing = 'easeInOut',
    fps = DEFAULTS.fps,
    width = DEFAULTS.width,
    height = DEFAULTS.height,
  } = config;

  const totalFrames = duration * fps;
  
  // Parseia o path (ex: "A-B-C-D" → [ANCHOR_A, ANCHOR_B, ...])
  const anchorKeys = path.split('-');
  const anchors = anchorKeys.map(key => ANCHOR_PRESETS[key] || ANCHOR_PRESETS.CENTER);
  
  // Calcula interpolação linear entre os pontos
  // Cada segmento do path ocupa uma fração igual do tempo total
  const segmentFrames = Math.floor(totalFrames / (anchors.length - 1));
  
  // Gera as expressões de zoom e posição
  let zoomExpr, xExpr, yExpr;
  
  switch (easing) {
    case 'linear':
      zoomExpr = `${zoomStart}+(${zoomEnd - zoomStart})*on/${totalFrames}`;
      break;
    case 'easeIn':
      // Quadratic ease-in: acelera gradualmente
      zoomExpr = `${zoomStart}+(${zoomEnd - zoomStart})*(on/${totalFrames})^2`;
      break;
    case 'easeOut':
      // Quadratic ease-out: desacelera no final
      zoomExpr = `${zoomEnd}-(${zoomEnd - zoomStart})*(1-on/${totalFrames})^2`;
      break;
    case 'easeInOut':
    default:
      // Smooth step: acelera e desacelera
      zoomExpr = `${zoomStart}+(${zoomEnd - zoomStart})*(3*(on/${totalFrames})^2-2*(on/${totalFrames})^3)`;
      break;
  }

  // Para múltiplos pontos, interpolamos X e Y separadamente
  if (anchors.length === 2) {
    const [from, to] = anchors;
    const progressExpr = `on/${totalFrames}`;
    xExpr = `(${from.x}+(${to.x}-${from.x})*${progressExpr})*iw-iw/zoom/2`;
    yExpr = `(${from.y}+(${to.y}-${from.y})*${progressExpr})*ih-ih/zoom/2`;
  } else if (anchors.length >= 3) {
    // Para 3+ pontos, usamos interpolação por segmentos
    // Cada segmento usa uma fração do tempo
    const conditions = [];
    for (let i = 0; i < anchors.length - 1; i++) {
      const from = anchors[i];
      const to = anchors[i + 1];
      const segStart = i * segmentFrames;
      const segEnd = (i + 1) * segmentFrames;
      const localProgress = `(on-${segStart})/${segmentFrames}`;
      
      const segX = `(${from.x}+(${to.x}-${from.x})*${localProgress})*iw-iw/zoom/2`;
      const segY = `(${from.y}+(${to.y}-${from.y})*${localProgress})*ih-ih/zoom/2`;
      
      conditions.push({ start: segStart, end: segEnd, x: segX, y: segY });
    }
    
    // Monta a expressão condicional do zoompan
    // if(lt(on,seg1_end), seg1_x, if(lt(on,seg2_end), seg2_x, seg3_x))
    xExpr = buildConditionalExpr(conditions, 'x', totalFrames);
    yExpr = buildConditionalExpr(conditions, 'y', totalFrames);
  } else {
    // Fallback: centro estático
    xExpr = `iw/2-(iw/zoom/2)`;
    yExpr = `ih/2-(ih/zoom/2)`;
  }

  // Monta o filtro zoompan
  const zoompanFilter = [
    `zoompan=`,
    `z='${zoomExpr}':`,
    `x='${xExpr}':`,
    `y='${yExpr}':`,
    `d=${totalFrames}:`,
    `s=${width}x${height}:`,
    `fps=${fps}`,
  ].join('');

  // Comando FFmpeg completo
  const command = [
    `ffmpeg -y`,
    `-i "${input}"`,
    `-vf "${zoompanFilter}"`,
    `-c:v libx264`,
    `-preset ${DEFAULTS.preset}`,
    `-crf ${DEFAULTS.crf}`,
    `-pix_fmt ${DEFAULTS.pixelFormat}`,
    `-threads ${DEFAULTS.threads}`,
    `-movflags +faststart`,
    `"${output}"`,
  ].join(' \\\n  ');

  return {
    command,
    filter: zoompanFilter,
    metadata: {
      type: 'parallax_pan',
      totalFrames,
      anchors: anchorKeys,
      zoomRange: [zoomStart, zoomEnd],
      duration,
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 2. MASK ZOOM REVEAL
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Usa alphamerge + overlay para aplicar uma máscara PNG com buracos.
 * A imagem atual dá zoom até a próxima imagem ocupar a tela completamente.
 * 
 * Efeito: parece que a câmera está "entrando" dentro de um buraco na imagem,
 * revelando a próxima cena. Muito usado em vídeos dark/mistério.
 * 
 * @param {Object} config
 * @param {string} config.currentImage - Imagem atual (que vai dar zoom)
 * @param {string} config.nextImage - Próxima imagem (que será revelada)
 * @param {string} config.maskImage - PNG com alpha channel (máscara)
 * @param {string} config.output - Arquivo de saída
 * @param {number} [config.zoomTarget=2.0] - Zoom máximo da imagem atual
 * @param {number} [config.transitionDuration=1.5] - Duração da transição
 * @returns {string} Comando FFmpeg completo
 */
function mask_zoom_reveal(config = {}) {
  const {
    currentImage = 'current.png',
    nextImage = 'next.png',
    maskImage = 'mask.png',
    output = 'transition.mp4',
    zoomTarget = 2.0,
    transitionDuration = 1.5,
    fps = DEFAULTS.fps,
    width = DEFAULTS.width,
    height = DEFAULTS.height,
  } = config;

  const totalFrames = Math.ceil(transitionDuration * fps);
  const zoomIncrement = (zoomTarget - 1.0) / totalFrames;

  const filterComplex = [
    // Step 1: Zoom na imagem atual (ela vai "entrando" no buraco)
    `[0:v]zoompan=`,
    `z='min(zoom+${zoomIncrement.toFixed(4)},${zoomTarget})':`,
    `x='iw/2-(iw/zoom/2)':`,
    `y='ih/2-(ih/zoom/2)':`,
    `d=${totalFrames}:`,
    `s=${width}x${height}:`,
    `fps=${fps}[zoomed];`,
    
    // Step 2: Aplica a máscara na próxima imagem (combina RGB + Alpha)
    `[1:v][2:v]alphamerge[next_masked];`,
    
    // Step 3: Overlay da próxima imagem (com máscara) sobre a atual (com zoom)
    // A máscara controla a transparência — onde há buraco, vê-se a próxima imagem
    `[zoomed][next_masked]overlay=`,
    `eof_action=pass:`,
    `format=auto`,
    `[out]`,
  ].join('');

  const command = [
    `ffmpeg -y`,
    `-i "${currentImage}"`,
    `-i "${nextImage}"`,
    `-i "${maskImage}"`,
    `-filter_complex "${filterComplex}"`,
    `-map "[out]"`,
    `-t ${transitionDuration}`,
    `-c:v libx264`,
    `-preset ${DEFAULTS.preset}`,
    `-crf ${DEFAULTS.crf}`,
    `-pix_fmt ${DEFAULTS.pixelFormat}`,
    `-threads ${DEFAULTS.threads}`,
    `"${output}"`,
  ].join(' \\\n  ');

  return {
    command,
    filter: filterComplex,
    metadata: {
      type: 'mask_zoom_reveal',
      totalFrames,
      zoomTarget,
      transitionDuration,
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 3. INK BLEED
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Efeito orgânico que simula tinta expandindo sobre a imagem.
 * Usa noise procedural + threshold para criar bordas irregulares.
 * 
 * Objetivo: quebrar o padrão metronômico/perfeito de IA.
 * Vídeos 100% gerados por IA têm um "feel" robótico — este efeito
 * adiciona imperfeição orgânica que o cérebro humano aceita como "natural".
 * 
 * @param {Object} config
 * @param {string} config.input - Imagem de entrada
 * @param {string} config.output - Sequência de PNGs de saída
 * @param {number} [config.spreadSpeed=0.02] - Velocidade de expansão
 * @param {number} [config.threshold=0.5] - Threshold do noise (0-1)
 * @param {number} [config.frames=37] - Número de frames da animação
 * @returns {string} Comando FFmpeg completo
 */
function ink_bleed(config = {}) {
  const {
    input = 'input.png',
    output = '/tmp/ink_bleed/frame_%04d.png',
    spreadSpeed = 0.02,
    threshold = 0.5,
    frames = 37,
    width = DEFAULTS.width,
    height = DEFAULTS.height,
    fps = DEFAULTS.fps,
  } = config;

  // O geq (Generic EQ) filter permite manipulação pixel-a-pixel
  // Usamos noise procedural para criar a máscara de tinta
  const filterComplex = [
    // Gera frames com máscara de tinta expandinge
    `color=black:s=${width}x${height}:d=${frames / fps}:r=${fps},`,
    `geq=`,
    `lum='255':`,
    `cb='128':`,
    `cr='128':`,
    `alpha='`,
    // Alpha: 255 onde o noise ultrapassa o threshold (tinta visível)
    // O threshold diminui com o tempo → mais área coberta
    `if(gt(random(1)+${spreadSpeed}*on, ${threshold}), 255, 0)`,
    `'[ink_mask];`,
    
    // Aplica a máscara como overlay na imagem original
    `[0:v][ink_mask]overlay=`,
    `format=auto:`,
    `eof_action=pass[out]`,
  ].join('');

  // Alternativa: gera PNGs separados para usar como máscara de transição
  const maskOnlyFilter = [
    `color=black:s=${width}x${height}:d=${frames / fps}:r=${fps},`,
    `geq=`,
    `lum='255':cb='128':cr='128':`,
    `alpha='`,
    `if(gt(random(1)+${spreadSpeed}*on, ${threshold}),`,
    `255*smoothstep(0,1,`,
    `distance(X,Y,W/2,H/2)/(W/2)*on/${frames}`,
    `),0)`,
    `'`,
  ].join('');

  const command = [
    `ffmpeg -y`,
    `-i "${input}"`,
    `-filter_complex "${filterComplex}"`,
    `-map "[out]"`,
    `-frames:v ${frames}`,
    `-c:v png`,
    `"${output}"`,
  ].join(' \\\n  ');

  return {
    command,
    filter: filterComplex,
    maskFilter: maskOnlyFilter,
    metadata: {
      type: 'ink_bleed',
      frames,
      spreadSpeed,
      threshold,
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 4. DIGITAL GLITCH
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Corrupção controlada de frames: RGB shift + scanlines + noise burst.
 * 
 * Trigger: aleatório (15% de chance por segmento) para evitar padrão.
 * Duração: curta (5-10 frames = 0.2-0.4s) para não cansar o viewer.
 * 
 * Este efeito é o "tempero" que diferencia um vídeo AI Studio Pro
 * de um vídeo genérico de IA. A imperfeição deliberada gera engajamento.
 * 
 * @param {Object} config
 * @param {string} config.input - Vídeo de entrada
 * @param {string} config.output - Vídeo de saída
 * @param {number} [config.rgbShift=15] - Deslocamento RGB em pixels
 * @param {number} [config.frames=8] - Duração do glitch em frames
 * @param {boolean} [config.scanlines=true] - Adicionar scanlines CRT
 * @param {number} [config.noiseIntensity=0.1] - Intensidade do noise
 * @returns {string} Comando FFmpeg completo
 */
function glitch(config = {}) {
  const {
    input = 'input.mp4',
    output = 'glitch_output.mp4',
    rgbShift = 15,
    frames = 8,
    scanlines = true,
    noiseIntensity = 0.1,
    fps = DEFAULTS.fps,
  } = config;

  const filters = [];

  // Step 1: RGB Channel Shift (cada canal se move em direção diferente)
  filters.push(
    `split=3[r][g][b];`,
    
    // Canal Red: shift para direita
    `[r]lutrgb=r=val:g=0:b=0,`,
    `scroll=horizontal=${(rgbShift / 1920).toFixed(4)}[r_shift];`,
    
    // Canal Green: shift para esquerda
    `[g]lutrgb=r=0:g=val:b=0,`,
    `scroll=horizontal=-${(rgbShift / 1920).toFixed(4)}[g_shift];`,
    
    // Canal Blue: shift sutil para cima (simula interferência)
    `[b]lutrgb=r=0:g=0:b=val,`,
    `scroll=vertical=-${Math.floor(rgbShift / 3)}[b_shift];`,
    
    // Recombina os canais deslocados
    `[r_shift][g_shift][b_shift]blend=all_mode=addition:all_opacity=0.8[rgb_shifted];`,
    
    // Step 2: Scanlines (efeito CRT)
    scanlines ? `[rgb_shifted]dither=5x3[scanlined];` : `[rgb_shifted][scanlined];`,
    
    // Step 3: Noise burst (corrupção aleatória)
    `[scanlined]noise=alls=${Math.floor(noiseIntensity * 100)}:allf=t+u[noisy];`,
    
    // Step 4: Limita aos frames do glitch
    `[noisy]trim=0:${frames / fps},setpts=PTS-STARTPTS[out]`
  );

  const filterComplex = filters.join('');

  const command = [
    `ffmpeg -y`,
    `-i "${input}"`,
    `-vf "${filterComplex}"`,
    `-map "[out]"`,
    `-frames:v ${frames}`,
    `-c:v libx264`,
    `-preset ${DEFAULTS.preset}`,
    `-crf ${DEFAULTS.crf}`,
    `-pix_fmt ${DEFAULTS.pixelFormat}`,
    `-threads ${DEFAULTS.threads}`,
    `"${output}"`,
  ].join(' \\\n  ');

  return {
    command,
    filter: filterComplex,
    metadata: {
      type: 'glitch',
      rgbShift,
      frames,
      scanlines,
      noiseIntensity,
      duration: frames / fps,
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 5. DISSOLVE (Cross-fade com zoom sutil)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Transição clássica mas com um twist: zoom sutil na imagem de saída.
 * Isso evita o "fade morto" e mantém o viewer engajado.
 * 
 * @param {Object} config
 * @param {string} config.from - Imagem/vídeo de origem
 * @param {string} config.to - Imagem/vídeo de destino
 * @param {number} [config.duration=1.0] - Duração do crossfade
 * @returns {string} Comando FFmpeg completo
 */
function dissolve(config = {}) {
  const {
    from = 'from.mp4',
    to = 'to.mp4',
    duration = 1.0,
    fps = DEFAULTS.fps,
    width = DEFAULTS.width,
    height = DEFAULTS.height,
  } = config;

  const offset = duration; // Quando o dissolve começa
  
  const filterComplex = [
    // Aplica zoom sutil na imagem de destino
    `[1:v]zoompan=z='1+0.001*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=${width}x${height}:fps=${fps}[to_zoomed];`,
    
    // Crossfade entre as duas imagens
    `[0:v][to_zoomed]xfade=transition=fade:duration=${duration}:offset=${offset}[out]`,
  ].join('');

  const command = [
    `ffmpeg -y`,
    `-i "${from}"`,
    `-i "${to}"`,
    `-filter_complex "${filterComplex}"`,
    `-map "[out]"`,
    `-c:v libx264`,
    `-preset ${DEFAULTS.preset}`,
    `-crf ${DEFAULTS.crf}`,
    `-pix_fmt ${DEFAULTS.pixelFormat}`,
    `-threads ${DEFAULTS.threads}`,
    `"output_dissolve.mp4"`,
  ].join(' \\\n  ');

  return {
    command,
    filter: filterComplex,
    metadata: {
      type: 'dissolve',
      duration,
    },
  };
}

// ─── Helper: Expressão condicional para zoompan ──────────────────────────
function buildConditionalExpr(conditions, axis, totalFrames) {
  if (conditions.length === 0) return axis === 'x' ? 'iw/2-(iw/zoom/2)' : 'ih/2-(ih/zoom/2)';
  if (conditions.length === 1) return conditions[0][axis];
  
  // Constrói de trás para frente: if(lt(on,end1), x1, if(lt(on,end2), x2, x3))
  let expr = conditions[conditions.length - 1][axis];
  for (let i = conditions.length - 2; i >= 0; i--) {
    expr = `if(lte(on,${conditions[i].end}),${conditions[i][axis]},${expr})`;
  }
  return expr;
}

// ─── Export: Todas as transições disponíveis ─────────────────────────────
module.exports = {
  parallax_pan,
  mask_zoom_reveal,
  ink_bleed,
  glitch,
  dissolve,
  DEFAULTS,
  ANCHOR_PRESETS,
  
  // Registry para o renderWorker selecionar por nome
  TRANSITION_REGISTRY: {
    parallax_pan,
    mask_zoom_reveal,
    ink_bleed,
    glitch,
    dissolve,
  },
  
  // Função helper para o worker
  getTransition(name) {
    return this.TRANSITION_REGISTRY[name] || null;
  },
  
  // Lista todas as transições disponíveis
  listTransitions() {
    return Object.keys(this.TRANSITION_REGISTRY);
  },
};
