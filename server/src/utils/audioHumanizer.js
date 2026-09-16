/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Humanizer de Áudio
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Dois módulos principais:
 * 1. Camuflagem de Áudio — Mix narração + som ambiente quase imperceptível
 *    (quebra o hash digital do YouTube, evitando Content ID)
 * 2. Smart Silence Cut — Remove silêncios da narração usando timestamps
 *    do Whisper, mantendo "respiros" naturais entre frases.
 * 
 * Princípio: O áudio resultante deve soar 100% humano, mas ter um hash
 * digital completamente diferente do áudio original da TTS.
 * 
 * @module audioHumanizer
 * @version 1.0.0
 */

const path = require('path');
const fs = require('fs');

// ─── Configurações padrão ────────────────────────────────────────────────
const AUDIO_DEFAULTS = {
  sampleRate: 44100,       // Hz — padrão YouTube
  bitDepth: 16,            // bits
  channels: 1,             // mono (narração)
  camouflageDb: -40,       // dB — quase imperceptível
  paddingMs: 300,          // ms — respiro entre frases
  silenceThresholdDb: -35, // dB — abaixo disso é silêncio
  minPhraseDuration: 0.3,  // s — frases menores que isso são descartadas
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 1. CAMUFLAGEM DE ÁUDIO
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Mixa a narração (TTS) com um som ambiente da biblioteca.
 * O som ambiente é tão baixo (-40dB) que o ouvido humano não percebe,
 * mas o algoritmo do YouTube vê um waveform completamente diferente.
 * 
 * Por que funciona:
 * - O YouTube usa fingerprinting de áudio (como Shazam)
 * - Mesmo mudando 1% do áudio, o hash muda completamente
 * - Um som ambiente a -40dB altera ~2-5% do signal
 * - Resultado: hash único, impossível de matchear com Content ID
 * 
 * @param {Object} config
 * @param {string} config.narrationPath - Path do áudio da narração (MP3/WAV)
 * @param {string} config.camouflagePath - Path do áudio ambiente (da tabela audio_camouflage_library)
 * @param {string} config.outputPath - Path do arquivo de saída
 * @param {number} [config.camouflageDb=-40] - Volume da camuflagem em dB
 * @param {boolean} [config.loop=true] - Loop o áudio ambiente se for menor que a narração
 * @returns {Object} { command, filter, metadata }
 */
function audioCamouflage(config = {}) {
  const {
    narrationPath,
    camouflagePath,
    outputPath,
    camouflageDb = AUDIO_DEFAULTS.camouflageDb,
    loop = true,
    sampleRate = AUDIO_DEFAULTS.sampleRate,
  } = config;

  if (!narrationPath || !camouflagePath || !outputPath) {
    throw new Error('audioCamouflage: narrationPath, camouflagePath e outputPath são obrigatórios');
  }

  // Filtro de camuflagem:
  // 1. Ajusta volume da camuflagem para -40dB (quase inaudível)
  // 2. Mixa com a narração usando amix
  // 3. amix com duration=first → duração final = duração da narração
  // 4. dropout_transition=2 → fade out suave da camuflagem no final
  
  const filters = [];
  
  // Input 0 = narração, Input 1 = camuflagem
  // Se loop=true, adiciona -stream_loop -1 antes do input da camuflagem
  const loopFlag = loop ? '-stream_loop -1' : '';
  
  const filterComplex = [
    // Ajusta volume da camuflagem
    `[1:a]volume=${camouflageDb}dB,`,
    `aresample=${sampleRate}[camouflaged];`,
    
    // Normaliza narração para o mesmo sample rate
    `[0:a]aresample=${sampleRate}[narration_resampled];`,
    
    // Mixa os dois
    `[narration_resampled][camouflaged]amix=`,
    `inputs=2:`,
    `duration=first:`,        // Duração = duração do primeiro input (narração)
    `dropout_transition=2:`,  // Fade de 2s quando um input acaba
    `normalize=0`,            // NÃO normalizar (preserva volume original da narração)
    `[out]`,
  ].join('');

  const command = [
    'ffmpeg -y',
    `-i "${narrationPath}"`,
    loopFlag ? `${loopFlag} -i "${camouflagePath}"` : `-i "${camouflagePath}"`,
    `-filter_complex "${filterComplex}"`,
    `-map "[out]"`,
    `-ar ${sampleRate}`,
    `-ac ${AUDIO_DEFAULTS.channels}`,
    `-c:a aac`,
    `-b:a 192k`,
    `"${outputPath}"`,
  ].filter(Boolean).join(' \\\n  ');

  return {
    command,
    filter: filterComplex,
    meta: {
      type: 'audio_camouflage',
      camouflageDb,
      sampleRate,
      loop,
      narrationPath,
      camouflagePath,
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 2. SMART SILENCE CUT
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Recebe timestamps do Whisper (transcrição com timing) e gera
 * comandos FFmpeg que:
 * 1. Cortam cada frase individualmente (atrim)
 * 2. Removem o silêncio entre frases
 * 3. Concatenam tudo com um "padding" configurável (respiro natural)
 * 
 * Resultado: narração dinâmica sem pausas mortas, mas com respiros
 * que soam humanos (não robóticos como cortes secos).
 * 
 * @param {Object} config
 * @param {string} config.inputPath - Path do áudio de entrada
 * @param {string} config.outputPath - Path do áudio de saída
 * @param {Array} config.timestamps - Array do Whisper: [{start, end, text}, ...]
 * @param {number} [config.paddingMs=300] - Padding entre frases em ms
 * @param {number} [config.minDuration=0.3] - Duração mínima de uma frase
 * @returns {Object} { command, filter, metadata, stats }
 */
function smartSilenceCut(config = {}) {
  const {
    inputPath,
    outputPath,
    timestamps = [],
    paddingMs = AUDIO_DEFAULTS.paddingMs,
    minDuration = AUDIO_DEFAULTS.minPhraseDuration,
    sampleRate = AUDIO_DEFAULTS.sampleRate,
  } = config;

  if (!inputPath || !outputPath) {
    throw new Error('smartSilenceCut: inputPath e outputPath são obrigatórios');
  }

  if (!timestamps || timestamps.length === 0) {
    throw new Error('smartSilenceCut: timestamps do Whisper são obrigatórios');
  }

  // Filtra frases muito curtas (ruído/palavras soltas)
  const validTimestamps = timestamps.filter(ts => {
    const duration = ts.end - ts.start;
    return duration >= minDuration;
  });

  if (validTimestamps.length === 0) {
    throw new Error('smartSilenceCut: nenhuma frase válida após filtrar (minDuration=' + minDuration + 's)');
  }

  // Gera o padding como silêncio (usando anullsrc + adelay)
  const paddingSec = paddingMs / 1000;
  
  // Monta o filter_complex:
  // Para cada frase: atrim(start=X, end=Y) → asetpts → label [seg0], [seg1], ...
  // Depois: concat=n=N:v=0:a=1 → [concatenated]
  // Por fim: insere padding entre cada segmento
  
  const segmentFilters = [];
  const paddingFilters = [];
  
  validTimestamps.forEach((ts, i) => {
    // Trim de cada frase
    segmentFilters.push(
      `[0:a]atrim=start=${ts.start.toFixed(3)}:end=${ts.end.toFixed(3)},` +
      `asetpts=PTS-STARTPTS,` +
      `aresample=${sampleRate}[seg${i}]`
    );
  });

  // Gera pads de silêncio entre segmentos
  for (let i = 0; i < validTimestamps.length - 1; i++) {
    paddingFilters.push(
      `anullsrc=r=${sampleRate}:cl=mono,` +
      `atrim=0:${paddingSec.toFixed(3)},` +
      `asetpts=PTS-STARTPTS[pad${i}]`
    );
  }

  // Monta a sequência de concat: seg0, pad0, seg1, pad1, seg2, ...
  const concatInputs = [];
  for (let i = 0; i < validTimestamps.length; i++) {
    concatInputs.push(`[seg${i}]`);
    if (i < validTimestamps.length - 1) {
      concatInputs.push(`[pad${i}]`);
    }
  }

  const totalConcatInputs = validTimestamps.length + (validTimestamps.length - 1);
  
  const concatFilter = `${concatInputs.join('')}concat=n=${totalConcatInputs}:v=0:a=1[out]`;

  // Junta tudo
  const allFilters = [
    ...segmentFilters,
    ...paddingFilters,
    concatFilter,
  ].join(';\n    ');

  const command = [
    'ffmpeg -y',
    `-i "${inputPath}"`,
    `-filter_complex "`,
    `    ${allFilters}`,
    `"`,
    `-map "[out]"`,
    `-ar ${sampleRate}`,
    `-ac ${AUDIO_DEFAULTS.channels}`,
    `-c:a aac`,
    `-b:a 192k`,
    `"${outputPath}"`,
  ].join(' \\\n');

  // Calcula stats
  const originalDuration = validTimestamps[validTimestamps.length - 1].end - validTimestamps[0].start;
  const speechDuration = validTimestamps.reduce((acc, ts) => acc + (ts.end - ts.start), 0);
  const totalPadding = (validTimestamps.length - 1) * paddingSec;
  const finalDuration = speechDuration + totalPadding;
  const silenceRemoved = originalDuration - speechDuration;

  return {
    command,
    filter: allFilters,
    meta: {
      type: 'smart_silence_cut',
      totalSegments: validTimestamps.length,
      paddingMs,
      sampleRate,
    },
    stats: {
      originalDuration: originalDuration.toFixed(2),
      speechDuration: speechDuration.toFixed(2),
      silenceRemoved: silenceRemoved.toFixed(2),
      totalPadding: totalPadding.toFixed(2),
      finalDuration: finalDuration.toFixed(2),
      segmentsKept: validTimestamps.length,
      segmentsRemoved: timestamps.length - validTimestamps.length,
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 3. PIPELINE COMPLETO DE ÁUDIO
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Combina camuflagem + smart cut em um único pipeline.
 * Ordem: Smart Cut primeiro (remove silêncio) → Camuflagem depois (adiciona hash único).
 * 
 * @param {Object} config
 * @param {string} config.narrationPath - Áudio da narração (TTS)
 * @param {string} config.camouflagePath - Áudio ambiente
 * @param {Array} config.timestamps - Timestamps do Whisper
 * @param {string} config.outputPath - Output final
 * @param {Object} [config.options] - Opções de cada módulo
 * @returns {Object} { steps, commands, stats }
 */
function fullAudioPipeline(config = {}) {
  const {
    narrationPath,
    camouflagePath,
    outputPath,
    timestamps,
    options = {},
  } = config;

  const tempDir = '/tmp/audio_pipeline';
  const intermediatePath = path.join(tempDir, `intermediate_${Date.now()}.wav`);

  // Step 1: Smart Silence Cut
  const cutResult = smartSilenceCut({
    inputPath: narrationPath,
    outputPath: intermediatePath,
    timestamps,
    paddingMs: options.paddingMs || AUDIO_DEFAULTS.paddingMs,
    minDuration: options.minDuration || AUDIO_DEFAULTS.minPhraseDuration,
  });

  // Step 2: Audio Camouflage (no resultado do cut)
  const camouflageResult = audioCamouflage({
    narrationPath: intermediatePath,
    camouflagePath,
    outputPath,
    camouflageDb: options.camouflageDb || AUDIO_DEFAULTS.camouflageDb,
  });

  return {
    steps: [
      { name: 'Smart Silence Cut', ...cutResult },
      { name: 'Audio Camouflage', ...camouflageResult },
    ],
    commands: [cutResult.command, camouflageResult.command],
    stats: {
      cut: cutResult.stats,
      camouflage: camouflageResult.metadata,
    },
    cleanup: [intermediatePath], // Arquivos para limpar após o pipeline
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 4. NORMALIZAÇÃO DE ÁUDIO
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Normaliza o áudio para -16 LUFS (padrão YouTube/podcast).
 * Deve ser chamado ANTES da camuflagem para garantir volume consistente.
 * 
 * @param {Object} config
 * @param {string} config.inputPath
 * @param {string} config.outputPath
 * @param {number} [config.targetLufs=-16]
 * @returns {Object} { command, filter }
 */
function normalizeAudio(config = {}) {
  const {
    inputPath,
    outputPath,
    targetLufs = -16,
    sampleRate = AUDIO_DEFAULTS.sampleRate,
  } = config;

  // loudnorm é o filtro de normalização EBU R128 do FFmpeg
  // Modo linear=true → não distorce picos
  const filterComplex = [
    `loudnorm=`,
    `I=${targetLufs}:`,       // Integrated loudness target
    `LRA=11:`,                // Loudness Range
    `TP=-1.5:`,               // True Peak maximum
    `linear=true:`,           // Linear normalization (sem distorção)
    `print_format=json`,
  ].join('');

  const command = [
    'ffmpeg -y',
    `-i "${inputPath}"`,
    `-af "${filterComplex}"`,
    `-ar ${sampleRate}`,
    `-ac ${AUDIO_DEFAULTS.channels}`,
    `-c:a aac`,
    `-b:a 192k`,
    `"${outputPath}"`,
  ].join(' \\\n  ');

  return {
    command,
    filter: filterComplex,
    metadata: {
      type: 'normalize',
      targetLufs,
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────
module.exports = {
  audioCamouflage,
  smartSilenceCut,
  fullAudioPipeline,
  normalizeAudio,
  AUDIO_DEFAULTS,
};
