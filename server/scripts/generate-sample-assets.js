/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Gerador de Assets de Exemplo
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Gera arquivos de áudio e Lottie de exemplo para testes.
 * 
 * Executar: node scripts/generate-sample-assets.js
 * 
 * @module generateSampleAssets
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'sample-assets');

// ─── Gerar Áudios de Exemplo ─────────────────────────────────────────────

function generateSampleAudios() {
  console.log('🎵 Gerando áudios de exemplo...');

  const audioDir = path.join(OUTPUT_DIR, 'audio');
  fs.mkdirSync(audioDir, { recursive: true });

  // Criar arquivos WAV de exemplo (silêncio com header WAV válido)
  const audioFiles = [
    { name: 'room_tone_studio.wav', duration: 60 },
    { name: 'birds_morning.wav', duration: 120 },
    { name: 'rain_light.wav', duration: 180 },
    { name: 'cafe_ambient.wav', duration: 90 },
    { name: 'wind_gentle.wav', duration: 150 },
    { name: 'white_noise_filt.wav', duration: 300 },
  ];

  audioFiles.forEach(file => {
    const filePath = path.join(audioDir, file.name);
    
    // Criar arquivo WAV válido (header + silêncio)
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const numSamples = sampleRate * file.duration;
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    
    const buffer = Buffer.alloc(44 + dataSize);
    
    // WAV Header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Chunk size
    buffer.writeUInt16LE(1, 20); // PCM format
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    
    // Dados (silêncio — todos zeros)
    // Não precisa escrever nada, Buffer.alloc já preenche com zeros
    
    fs.writeFileSync(filePath, buffer);
    console.log(`  ✓ ${file.name} (${file.duration}s)`);
  });

  console.log(`✅ ${audioFiles.length} áudios gerados em ${audioDir}\n`);
}

// ─── Gerar Lotties de Exemplo ────────────────────────────────────────────

function generateSampleLotties() {
  console.log('🎨 Gerando Lotties de exemplo...');

  const lottieDir = path.join(OUTPUT_DIR, 'lottie');
  fs.mkdirSync(lottieDir, { recursive: true });

  // Lottie 1: Partículas simples
  const particlesLottie = {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 60,
    w: 1920,
    h: 1080,
    nm: 'Particles',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Particle 1',
        sr: 1,
        ks: {
          o: { a: 1, k: [{ t: 0, s: [0] }, { t: 30, s: [100] }, { t: 60, s: [0] }] },
          r: { a: 0, k: 0 },
          p: { a: 1, k: [{ t: 0, s: [960, 540, 0] }, { t: 60, s: [960, 440, 0] }] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: [
          {
            ty: 'el',
            d: 1,
            s: { a: 0, k: [20, 20] },
            p: { a: 0, k: [0, 0] },
            nm: 'Ellipse',
          },
          {
            ty: 'fl',
            c: { a: 0, k: [1, 1, 1, 1] },
            o: { a: 0, k: 100 },
            r: 1,
            bm: 0,
            nm: 'Fill',
          },
        ],
        ip: 0,
        op: 60,
        st: 0,
        bm: 0,
      },
    ],
    markers: [],
  };

  // Lottie 2: Vinheta
  const vignetteLottie = {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 60,
    w: 1920,
    h: 1080,
    nm: 'Vignette',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Vignette',
        sr: 1,
        ks: {
          o: { a: 0, k: 50 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [960, 540, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: [
          {
            ty: 'rc',
            d: 1,
            s: { a: 0, k: [1920, 1080] },
            p: { a: 0, k: [0, 0] },
            r: { a: 0, k: 0 },
            nm: 'Rectangle',
          },
          {
            ty: 'gf',
            o: { a: 0, k: 100 },
            r: 1,
            gf: 1,
            g: {
              p: 3,
              k: {
                a: 0,
                k: [0, 0, 0, 0, 0.5, 0, 0, 0.5, 1, 0, 0, 1],
              },
            },
            t: 2,
            s: { a: 0, k: [0, 0] },
            e: { a: 0, k: [960, 0] },
            h: { a: 0, k: 0 },
            a: { a: 0, k: 0 },
            nm: 'Gradient',
          },
        ],
        ip: 0,
        op: 60,
        st: 0,
        bm: 0,
      },
    ],
    markers: [],
  };

  // Lottie 3: Film Grain
  const filmGrainLottie = {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 60,
    w: 1920,
    h: 1080,
    nm: 'Film Grain',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Grain',
        sr: 1,
        ks: {
          o: { a: 1, k: [{ t: 0, s: [10] }, { t: 30, s: [20] }, { t: 60, s: [10] }] },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [960, 540, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: [
          {
            ty: 'rc',
            d: 1,
            s: { a: 0, k: [1920, 1080] },
            p: { a: 0, k: [0, 0] },
            r: { a: 0, k: 0 },
            nm: 'Rectangle',
          },
          {
            ty: 'fl',
            c: { a: 0, k: [1, 1, 1, 1] },
            o: { a: 0, k: 100 },
            r: 1,
            bm: 0,
            nm: 'Fill',
          },
        ],
        ip: 0,
        op: 60,
        st: 0,
        bm: 0,
      },
    ],
    markers: [],
  };

  const lotties = [
    { name: 'particles.json', data: particlesLottie },
    { name: 'vignette.json', data: vignetteLottie },
    { name: 'film_grain.json', data: filmGrainLottie },
  ];

  lotties.forEach(lottie => {
    const filePath = path.join(lottieDir, lottie.name);
    fs.writeFileSync(filePath, JSON.stringify(lottie.data, null, 2));
    console.log(`  ✓ ${lottie.name}`);
  });

  console.log(`✅ ${lotties.length} Lotties gerados em ${lottieDir}\n`);
}

// ─── Main ────────────────────────────────────────────────────────────────

console.log('🎬 AI Studio Pro — Gerador de Assets de Exemplo\n');
console.log('═══════════════════════════════════════════════════════════\n');

generateSampleAudios();
generateSampleLotties();

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ Todos os assets de exemplo foram gerados!');
console.log(`📁 Diretório: ${OUTPUT_DIR}`);
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Próximos passos:');
console.log('1. Faça upload dos áudios para o Supabase Storage');
console.log('2. Faça upload dos Lotties para o Supabase Storage');
console.log('3. Atualize os paths na tabela audio_camouflage_library');
console.log('4. Use os Lotties como overlays nos seus projetos\n');
