/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Testes Automatizados (Jest)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Testes unitários para os módulos core do backend.
 * 
 * Executar: npm test
 * Coverage: npm run test:coverage
 * 
 * @module tests
 */

// Os mocks são carregados automaticamente via setup.js

const transitions = require('../src/utils/transitions');
const { validateLottie, generateLottieHash } = require('../src/utils/lottieRasterizer');
const { audioCamouflage, smartSilenceCut } = require('../src/utils/audioHumanizer');
const { listTemplates, getTemplate, applyTemplate } = require('../src/utils/projectTemplates');

// ═══════════════════════════════════════════════════════════════════════
// TESTES: Motor de Transições
// ═══════════════════════════════════════════════════════════════════════

describe('Motor de Transições', () => {
  
  describe('parallax_pan', () => {
    test('deve gerar comando FFmpeg válido', () => {
      const result = transitions.parallax_pan({
        input: 'test.png',
        output: 'test.mp4',
        duration: 5,
      });

      expect(result).toHaveProperty('command');
      expect(result).toHaveProperty('filter');
      expect(result).toHaveProperty('meta');
      expect(result.command).toContain('ffmpeg');
      expect(result.command).toContain('zoompan');
      expect(result.meta.type).toBe('parallax_pan');
    });

    test('deve aceitar diferentes paths de ancoragem', () => {
      const result = transitions.parallax_pan({
        path: 'A-B-C-D',
        duration: 5,
      });

      expect(result.meta.anchors).toEqual(['A', 'B', 'C', 'D']);
    });

    test('deve calcular totalFrames corretamente', () => {
      const result = transitions.parallax_pan({
        duration: 10,
        fps: 30,
      });

      expect(result.meta.totalFrames).toBe(300); // 10s * 30fps
    });

    test('deve suportar diferentes easings', () => {
      const easings = ['linear', 'easeIn', 'easeOut', 'easeInOut'];
      
      easings.forEach(easing => {
        const result = transitions.parallax_pan({ easing });
        expect(result.filter).toBeDefined();
      });
    });
  });

  describe('mask_zoom_reveal', () => {
    test('deve gerar comando com alphamerge', () => {
      const result = transitions.mask_zoom_reveal({
        currentImage: 'current.png',
        nextImage: 'next.png',
        maskImage: 'mask.png',
      });

      expect(result.command).toContain('alphamerge');
      expect(result.command).toContain('overlay');
      expect(result.meta.type).toBe('mask_zoom_reveal');
    });

    test('deve aceitar zoomTarget customizado', () => {
      const result = transitions.mask_zoom_reveal({
        zoomTarget: 3.0,
      });

      expect(result.meta.zoomTarget).toBe(3.0);
    });
  });

  describe('glitch', () => {
    test('deve gerar comando com RGB shift', () => {
      const result = transitions.glitch({
        rgbShift: 20,
        frames: 10,
      });

      expect(result.command).toContain('lutrgb');
      expect(result.meta.rgbShift).toBe(20);
      expect(result.meta.frames).toBe(10);
    });

    test('deve calcular duração corretamente', () => {
      const result = transitions.glitch({
        frames: 25,
        fps: 25,
      });

      expect(result.meta.duration).toBe(1.0); // 25 frames / 25 fps = 1s
    });
  });

  describe('TRANSITION_REGISTRY', () => {
    test('deve listar todas as transições disponíveis', () => {
      const list = transitions.listTransitions();
      
      expect(list).toContain('parallax_pan');
      expect(list).toContain('mask_zoom_reveal');
      expect(list).toContain('ink_bleed');
      expect(list).toContain('glitch');
      expect(list).toContain('dissolve');
    });

    test('deve buscar transição por nome', () => {
      const fn = transitions.getTransition('parallax_pan');
      
      expect(fn).toBeDefined();
      expect(typeof fn).toBe('function');
    });

    test('deve retornar null para transição inexistente', () => {
      const fn = transitions.getTransition('nonexistent');
      
      expect(fn).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TESTES: Lottie Rasterizer
// ═══════════════════════════════════════════════════════════════════════

describe('Lottie Rasterizer', () => {
  
  describe('validateLottie', () => {
    test('deve validar Lottie JSON válido', () => {
      const validLottie = {
        v: '5.7.4',
        fr: 30,
        ip: 0,
        op: 60,
        w: 1920,
        h: 1080,
        layers: [{ type: 'shape' }],
      };

      const result = validateLottie(validLottie);

      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalFrames).toBe(60);
    });

    test('deve rejeitar JSON inválido', () => {
      const result = validateLottie('not a json');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('JSON inválido');
    });

    test('deve rejeitar Lottie sem campos obrigatórios', () => {
      const invalidLottie = { v: '5.7.4' }; // Faltam fr, ip, op, layers

      const result = validateLottie(invalidLottie);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Campos obrigatórios faltando');
    });

    test('deve rejeitar Lottie com frame rate inválido', () => {
      const invalidLottie = {
        v: '5.7.4',
        fr: -30, // Frame rate negativo
        ip: 0,
        op: 60,
        layers: [{ type: 'shape' }],
      };

      const result = validateLottie(invalidLottie);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('frame rate');
    });
  });

  describe('generateLottieHash', () => {
    test('deve gerar hash consistente para mesmo conteúdo', () => {
      const lottie = { v: '5.7.4', fr: 30, layers: [] };
      
      const hash1 = generateLottieHash(lottie);
      const hash2 = generateLottieHash(lottie);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(32); // MD5 hash
    });

    test('deve gerar hash diferente para conteúdo diferente', () => {
      const lottie1 = { v: '5.7.4', fr: 30, layers: [] };
      const lottie2 = { v: '5.7.4', fr: 60, layers: [] };
      
      const hash1 = generateLottieHash(lottie1);
      const hash2 = generateLottieHash(lottie2);

      expect(hash1).not.toBe(hash2);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TESTES: Audio Humanizer
// ═══════════════════════════════════════════════════════════════════════

describe('Audio Humanizer', () => {
  
  describe('audioCamouflage', () => {
    test('deve gerar comando FFmpeg com amix', () => {
      const result = audioCamouflage({
        narrationPath: 'narration.mp3',
        camouflagePath: 'ambient.wav',
        outputPath: 'output.wav',
        camouflageDb: -40,
      });

      expect(result.command).toContain('amix');
      expect(result.command).toContain('volume=-40dB');
      expect(result.meta.type).toBe('audio_camouflage');
    });

    test('deve lançar erro se paths obrigatórios faltarem', () => {
      expect(() => {
        audioCamouflage({});
      }).toThrow('obrigatórios');
    });

    test('deve aceitar loop configurável', () => {
      const result = audioCamouflage({
        narrationPath: 'narration.mp3',
        camouflagePath: 'ambient.wav',
        outputPath: 'output.wav',
        loop: false,
      });

      expect(result.command).not.toContain('-stream_loop');
    });
  });

  describe('smartSilenceCut', () => {
    test('deve gerar comando com atrim e concat', () => {
      const timestamps = [
        { start: 0.0, end: 3.0, text: 'Frase 1' },
        { start: 5.0, end: 8.0, text: 'Frase 2' },
      ];

      const result = smartSilenceCut({
        inputPath: 'input.wav',
        outputPath: 'output.wav',
        timestamps,
        paddingMs: 300,
      });

      expect(result.command).toContain('atrim');
      expect(result.command).toContain('concat');
      expect(result.meta.totalSegments).toBe(2);
    });

    test('deve filtrar frases muito curtas', () => {
      const timestamps = [
        { start: 0.0, end: 3.0, text: 'Frase normal' },
        { start: 5.0, end: 5.1, text: 'Muito curta' }, // 0.1s < 0.3s mínimo
      ];

      const result = smartSilenceCut({
        inputPath: 'input.wav',
        outputPath: 'output.wav',
        timestamps,
        minDuration: 0.3,
      });

      expect(result.meta.totalSegments).toBe(1); // Só a frase normal
    });

    test('deve calcular stats corretamente', () => {
      const timestamps = [
        { start: 0.0, end: 5.0, text: 'Frase 1' },
        { start: 10.0, end: 15.0, text: 'Frase 2' },
      ];

      const result = smartSilenceCut({
        inputPath: 'input.wav',
        outputPath: 'output.wav',
        timestamps,
        paddingMs: 500,
      });

      expect(result.stats.speechDuration).toBe('10.00'); // 5s + 5s
      expect(result.stats.silenceRemoved).toBe('5.00'); // 10s - 5s
      expect(result.stats.totalPadding).toBe('0.50'); // 1 padding de 0.5s
    });

    test('deve lançar erro se timestamps estiver vazio', () => {
      expect(() => {
        smartSilenceCut({
          inputPath: 'input.wav',
          outputPath: 'output.wav',
          timestamps: [],
        });
      }).toThrow('obrigatórios');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TESTES: Project Templates
// ═══════════════════════════════════════════════════════════════════════

describe('Project Templates', () => {
  
  describe('listTemplates', () => {
    test('deve listar todos os templates', () => {
      const templates = listTemplates();

      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.id)).toContain('canal_dark');
      expect(templates.map(t => t.id)).toContain('edtech');
      expect(templates.map(t => t.id)).toContain('custom');
    });
  });

  describe('getTemplate', () => {
    test('deve buscar template existente', () => {
      const template = getTemplate('canal_dark');

      expect(template).toBeDefined();
      expect(template.id).toBe('canal_dark');
      expect(template.name).toContain('Canal Dark');
    });

    test('deve retornar null para template inexistente', () => {
      const template = getTemplate('nonexistent');

      expect(template).toBeNull();
    });
  });

  describe('applyTemplate', () => {
    test('deve aplicar template com valores padrão', () => {
      const config = applyTemplate('canal_dark');

      expect(config.id).toBe('canal_dark');
      expect(config.audioConfig).toBeDefined();
      expect(config.videoConfig).toBeDefined();
    });

    test('deve aceitar overrides customizados', () => {
      const config = applyTemplate('canal_dark', {
        audioConfig: {
          camouflage: { volumeDb: -35 },
        },
      });

      expect(config.audioConfig.camouflage.volumeDb).toBe(-35);
    });

    test('deve lançar erro para template inexistente', () => {
      expect(() => {
        applyTemplate('nonexistent');
      }).toThrow('não encontrado');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TESTES DE INTEGRAÇÃO
// ═══════════════════════════════════════════════════════════════════════

describe('Integração', () => {
  
  test('deve criar projeto a partir de template e gerar transições', () => {
    const template = getTemplate('canal_dark');
    const transition = transitions.parallax_pan({
      duration: template.videoConfig.segmentDuration.default,
    });

    expect(transition.meta.duration).toBe(5);
    expect(transition.command).toContain('zoompan');
  });

  test('deve validar Lottie e aplicar template', () => {
    const lottie = {
      v: '5.7.4',
      fr: 30,
      ip: 0,
      op: 60,
      layers: [{ type: 'shape' }],
    };

    const validation = validateLottie(lottie);
    const template = applyTemplate('canal_dark');

    expect(validation.valid).toBe(true);
    expect(template.lottieOverlays).toBeDefined();
  });
});
