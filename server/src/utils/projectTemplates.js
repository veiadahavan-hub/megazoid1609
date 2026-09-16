/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Sistema de Templates de Projetos
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Presets pré-configurados para diferentes tipos de conteúdo:
 * - Canal Dark (mistério, terror, conspiração)
 * - EdTech (educacional, tutoriais)
 * - Custom (personalizado pelo usuário)
 * 
 * Cada template define:
 * - Transições padrão
 * - Configurações de áudio
 * - Overlays Lottie recomendados
 * - Prompts de exemplo para SDXL
 * 
 * @module projectTemplates
 */

// ─── Template: Canal Dark ────────────────────────────────────────────────
const TEMPLATE_CANAL_DARK = {
  id: 'canal_dark',
  name: 'Canal Dark — Mistério & Terror',
  description: 'Template otimizado para canais de mistério, terror e conspiração',
  icon: '🌑',
  category: 'dark',
  
  // Configurações padrão de transições
  defaultTransitions: {
    primary: 'parallax_pan',
    secondary: 'mask_zoom_reveal',
    effects: ['ink_bleed', 'glitch'],
    effectProbability: 0.15, // 15% de chance de usar efeito especial
  },
  
  // Configurações de áudio
  audioConfig: {
    camouflage: {
      enabled: true,
      defaultTrack: 'room_tone_studio',
      volumeDb: -42,
    },
    smartCut: {
      enabled: true,
      paddingMs: 250,
      minPhraseDuration: 0.4,
    },
  },
  
  // Overlays Lottie recomendados
  lottieOverlays: [
    {
      id: 'particles_dust',
      name: 'Partículas de Poeira',
      description: 'Partículas flutuando — atmosfera de mistério',
      defaultPosition: { x: 0, y: 0 },
      defaultOpacity: 0.3,
      blendMode: 'screen',
    },
    {
      id: 'vignette_dark',
      name: 'Vinheta Escura',
      description: 'Escurece as bordas — foco no centro',
      defaultPosition: { x: 0, y: 0 },
      defaultOpacity: 0.5,
      blendMode: 'multiply',
    },
    {
      id: 'film_grain',
      name: 'Film Grain',
      description: 'Granulação de filme — estética vintage',
      defaultPosition: { x: 0, y: 0 },
      defaultOpacity: 0.15,
      blendMode: 'overlay',
    },
  ],
  
  // Prompts de exemplo para SDXL
  promptExamples: [
    {
      category: 'Paisagem Misteriosa',
      prompt: 'dark misty forest at night, fog, moonlight, eerie atmosphere, cinematic, 8k, highly detailed',
      negative: 'bright, cheerful, cartoon, low quality',
    },
    {
      category: 'Objeto Antigo',
      prompt: 'ancient mysterious artifact, glowing runes, dark background, dramatic lighting, photorealistic',
      negative: 'modern, plastic, toy, low quality',
    },
    {
      category: 'Criatura Sombria',
      prompt: 'shadowy creature silhouette, glowing eyes, dark forest background, horror atmosphere, cinematic',
      negative: 'cute, friendly, cartoon, bright colors',
    },
    {
      category: 'Cenário Urbano',
      prompt: 'abandoned urban exploration, dark alley, fog, street lights, mysterious atmosphere, cinematic',
      negative: 'crowded, bright, daytime, cheerful',
    },
  ],
  
  // Configurações de vídeo
  videoConfig: {
    resolution: '1920x1080',
    fps: 25,
    duration: {
      min: 8 * 60, // 8 minutos
      max: 15 * 60, // 15 minutos
      optimal: 10 * 60, // 10 minutos (ótimo para YouTube)
    },
    segmentDuration: {
      min: 3,
      max: 8,
      default: 5,
    },
  },
  
  // Estilo visual
  styleConfig: {
    colorPalette: ['#0a0a0f', '#1a1a2e', '#16213e', '#0f3460', '#533483'],
    mood: 'dark, mysterious, eerie, suspenseful',
    lighting: 'dramatic, low-key, shadows',
  },
};

// ─── Template: EdTech ────────────────────────────────────────────────────
const TEMPLATE_EDTECH = {
  id: 'edtech',
  name: 'EdTech — Educacional & Tutoriais',
  description: 'Template otimizado para conteúdo educacional e tutoriais',
  icon: '📚',
  category: 'edtech',
  
  defaultTransitions: {
    primary: 'dissolve',
    secondary: 'parallax_pan',
    effects: [],
    effectProbability: 0,
  },
  
  audioConfig: {
    camouflage: {
      enabled: true,
      defaultTrack: 'white_noise_filt',
      volumeDb: -45,
    },
    smartCut: {
      enabled: true,
      paddingMs: 400,
      minPhraseDuration: 0.5,
    },
  },
  
  lottieOverlays: [
    {
      id: 'code_highlights',
      name: 'Code Highlights',
      description: 'Destaque de código — animação de syntax highlighting',
      defaultPosition: { x: 100, y: 100 },
      defaultOpacity: 1.0,
      blendMode: 'normal',
    },
    {
      id: 'arrows_pointers',
      name: 'Setas e Ponteiros',
      description: 'Setas animadas para apontar elementos',
      defaultPosition: { x: 0, y: 0 },
      defaultOpacity: 1.0,
      blendMode: 'normal',
    },
    {
      id: 'progress_bar',
      name: 'Barra de Progresso',
      description: 'Barra de progresso animada',
      defaultPosition: { x: 0, y: 1000 },
      defaultOpacity: 0.8,
      blendMode: 'normal',
    },
  ],
  
  promptExamples: [
    {
      category: 'Interface de Software',
      prompt: 'clean modern software interface, code editor, dark theme, professional, high quality, 4k',
      negative: 'blurry, low quality, cluttered, old-fashioned',
    },
    {
      category: 'Diagrama Técnico',
      prompt: 'technical diagram, flowchart, clean design, professional, white background, high quality',
      negative: 'messy, hand-drawn, unprofessional, low quality',
    },
    {
      category: 'Conceito Abstrato',
      prompt: 'abstract concept visualization, modern design, clean, professional, educational, 4k',
      negative: 'complex, confusing, dark, scary',
    },
  ],
  
  videoConfig: {
    resolution: '1920x1080',
    fps: 30,
    duration: {
      min: 5 * 60,
      max: 20 * 60,
      optimal: 12 * 60,
    },
    segmentDuration: {
      min: 4,
      max: 10,
      default: 6,
    },
  },
  
  styleConfig: {
    colorPalette: ['#ffffff', '#f8f9fa', '#e9ecef', '#6c757d', '#007bff'],
    mood: 'clean, professional, educational, clear',
    lighting: 'bright, even, well-lit',
  },
};

// ─── Template: Custom ────────────────────────────────────────────────────
const TEMPLATE_CUSTOM = {
  id: 'custom',
  name: 'Custom — Personalizado',
  description: 'Template vazio para configuração personalizada',
  icon: '🎯',
  category: 'custom',
  
  defaultTransitions: {
    primary: 'dissolve',
    secondary: 'parallax_pan',
    effects: [],
    effectProbability: 0,
  },
  
  audioConfig: {
    camouflage: {
      enabled: false,
      defaultTrack: null,
      volumeDb: -40,
    },
    smartCut: {
      enabled: true,
      paddingMs: 300,
      minPhraseDuration: 0.3,
    },
  },
  
  lottieOverlays: [],
  
  promptExamples: [],
  
  videoConfig: {
    resolution: '1920x1080',
    fps: 25,
    duration: {
      min: 1 * 60,
      max: 60 * 60,
      optimal: 10 * 60,
    },
    segmentDuration: {
      min: 2,
      max: 15,
      default: 5,
    },
  },
  
  styleConfig: {
    colorPalette: ['#000000', '#ffffff'],
    mood: 'custom',
    lighting: 'custom',
  },
};

// ─── Registry de Templates ───────────────────────────────────────────────
const TEMPLATES = {
  canal_dark: TEMPLATE_CANAL_DARK,
  edtech: TEMPLATE_EDTECH,
  custom: TEMPLATE_CUSTOM,
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * FUNÇÕES EXPORTADAS
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Lista todos os templates disponíveis
 */
function listTemplates() {
  return Object.values(TEMPLATES).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    category: t.category,
  }));
}

/**
 * Busca um template específico
 */
function getTemplate(templateId) {
  return TEMPLATES[templateId] || null;
}

/**
 * Aplica um template a um projeto
 * Retorna a configuração completa do projeto com os valores do template
 */
function applyTemplate(templateId, customOverrides = {}) {
  const template = getTemplate(templateId);
  
  if (!template) {
    throw new Error(`Template não encontrado: ${templateId}`);
  }
  
  // Deep merge com overrides customizados
  const config = {
    ...template,
    ...customOverrides,
    audioConfig: {
      ...template.audioConfig,
      ...(customOverrides.audioConfig || {}),
    },
    videoConfig: {
      ...template.videoConfig,
      ...(customOverrides.videoConfig || {}),
    },
    styleConfig: {
      ...template.styleConfig,
      ...(customOverrides.styleConfig || {}),
    },
  };
  
  return config;
}

/**
 * Gera um projeto inicial baseado no template
 */
function generateProjectFromTemplate(templateId, projectName) {
  const template = getTemplate(templateId);
  
  if (!template) {
    throw new Error(`Template não encontrado: ${templateId}`);
  }
  
  return {
    name: projectName,
    type: template.category,
    template_id: templateId,
    config: {
      transitions: template.defaultTransitions,
      audio: template.audioConfig,
      video: template.videoConfig,
      style: template.styleConfig,
      lottieOverlays: template.lottieOverlays.map(overlay => ({
        ...overlay,
        enabled: false, // Começa desabilitado
      })),
    },
    segments: [], // Usuário adiciona segmentos depois
  };
}

/**
 * Sugere prompts baseados no template e categoria
 */
function suggestPrompts(templateId, category) {
  const template = getTemplate(templateId);
  
  if (!template || !template.promptExamples) {
    return [];
  }
  
  if (category) {
    const specific = template.promptExamples.find(p => p.category === category);
    if (specific) return [specific];
  }
  
  return template.promptExamples;
}

// ─── Exports ─────────────────────────────────────────────────────────────
module.exports = {
  listTemplates,
  getTemplate,
  applyTemplate,
  generateProjectFromTemplate,
  suggestPrompts,
  TEMPLATES,
  TEMPLATE_CANAL_DARK,
  TEMPLATE_EDTECH,
  TEMPLATE_CUSTOM,
};
