/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Sistema BYOK (Bring Your Own Key)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Permite que usuários tragam suas próprias API keys para:
 * - SDXL (geração de imagens)
 * - ElevenLabs (narração TTS)
 * - OpenAI Whisper (transcrição)
 * 
 * Vantagens:
 * - Usuário tem controle total sobre custos
 * - Plataforma não paga pelas APIs do usuário
 * - Usuário pode usar contas enterprise/premium
 * 
 * Fluxo:
 * 1. Usuário configura API keys no perfil
 * 2. Worker verifica se usuário é BYOK
 * 3. Se sim, usa as keys do usuário (não as da plataforma)
 * 4. Logs de uso são salvos para analytics
 * 
 * @module byokManager
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Configurações ───────────────────────────────────────────────────────
const BYOK_PROVIDERS = {
  stability: {
    name: 'Stability AI (SDXL)',
    keyPrefix: 'sk-',
    baseUrl: 'https://api.stability.ai',
    required: ['stability'],
  },
  elevenlabs: {
    name: 'ElevenLabs (TTS)',
    keyPrefix: null, // ElevenLabs keys não têm prefixo fixo
    baseUrl: 'https://api.elevenlabs.io',
    required: ['elevenlabs'],
  },
  openai: {
    name: 'OpenAI (Whisper)',
    keyPrefix: 'sk-',
    baseUrl: 'https://api.openai.com',
    required: ['openai'],
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 1. VALIDAÇÃO DE API KEYS
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Valida se uma API key é válida fazendo uma request mínima.
 * 
 * @param {string} provider - Nome do provider (stability, elevenlabs, openai)
 * @param {string} apiKey - API key a ser validada
 * @returns {Promise<Object>} { valid, error, meta }
 */
async function validateApiKey(provider, apiKey) {
  const providerConfig = BYOK_PROVIDERS[provider];
  
  if (!providerConfig) {
    return { valid: false, error: `Provider desconhecido: ${provider}` };
  }

  try {
    // Validação básica de formato
    if (providerConfig.keyPrefix && !apiKey.startsWith(providerConfig.keyPrefix)) {
      return { 
        valid: false, 
        error: `API key deve começar com "${providerConfig.keyPrefix}"` 
      };
    }

    // Testa a key com uma request mínima
    let testEndpoint;
    let headers = {};

    switch (provider) {
      case 'stability':
        testEndpoint = `${providerConfig.baseUrl}/v1/user/account`;
        headers = { Authorization: `Bearer ${apiKey}` };
        break;
      
      case 'elevenlabs':
        testEndpoint = `${providerConfig.baseUrl}/v1/user`;
        headers = { 'xi-api-key': apiKey };
        break;
      
      case 'openai':
        testEndpoint = `${providerConfig.baseUrl}/v1/models`;
        headers = { Authorization: `Bearer ${apiKey}` };
        break;
      
      default:
        return { valid: false, error: 'Provider não suportado' };
    }

    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers,
      timeout: 10000,
    });

    if (response.ok) {
      return { valid: true, error: null };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { 
        valid: false, 
        error: errorData.error?.message || `HTTP ${response.status}` 
      };
    }

  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 2. SALVAR API KEYS DO USUÁRIO
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Salva as API keys criptografadas no perfil do usuário.
 * 
 * @param {string} userId - ID do usuário
 * @param {Object} keys - { stability: '...', elevenlabs: '...', openai: '...' }
 * @returns {Promise<Object>} { success, error }
 */
async function saveUserApiKeys(userId, keys) {
  try {
    // Valida todas as keys antes de salvar
    const validations = {};
    
    for (const [provider, apiKey] of Object.entries(keys)) {
      if (apiKey && apiKey.trim() !== '') {
        const validation = await validateApiKey(provider, apiKey);
        validations[provider] = validation;
        
        if (!validation.valid) {
          return {
            success: false,
            error: `API key inválida para ${provider}: ${validation.error}`,
            provider,
          };
        }
      }
    }

    // Busca perfil atual
    const {  profile, error: fetchError } = await supabase
      .from('profiles')
      .select('api_keys')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Merge com keys existentes
    const currentKeys = profile.api_keys || {};
    const updatedKeys = { ...currentKeys };

    for (const [provider, apiKey] of Object.entries(keys)) {
      if (apiKey && apiKey.trim() !== '') {
        // Aqui você poderia criptografar a key antes de salvar
        // Por enquanto, salvamos em plain text (NÃO RECOMENDADO PARA PRODUÇÃO)
        // Em produção, usar: encrypt(apiKey, process.env.ENCRYPTION_KEY)
        updatedKeys[provider] = apiKey;
      } else if (apiKey === '') {
        // Se key vazia, remove
        delete updatedKeys[provider];
      }
    }

    // Atualiza no banco
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        api_keys: updatedKeys,
        api_usage_tier: Object.keys(updatedKeys).length > 0 ? 'byok_unlimited' : 'free',
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { success: true, keys: updatedKeys };

  } catch (error) {
    console.error('[BYOK] Erro ao salvar keys:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 3. OBTER API KEYS DO USUÁRIO
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Retorna as API keys do usuário para uso no worker.
 * 
 * @param {string} userId - ID do usuário
 * @param {Array<string>} requiredProviders - Providers necessários (ex: ['stability', 'elevenlabs'])
 * @returns {Promise<Object>} { keys, missing, isBYOK }
 */
async function getUserApiKeys(userId, requiredProviders = []) {
  try {
    const {  profile, error } = await supabase
      .from('profiles')
      .select('api_keys, api_usage_tier')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const userKeys = profile.api_keys || {};
    const isBYOK = profile.api_usage_tier === 'byok_unlimited';

    // Verifica se tem todas as keys necessárias
    const missing = requiredProviders.filter(p => !userKeys[p]);

    return {
      keys: userKeys,
      missing,
      isBYOK,
      hasAllKeys: missing.length === 0,
    };

  } catch (error) {
    console.error('[BYOK] Erro ao buscar keys:', error.message);
    return { keys: {}, missing: requiredProviders, isBYOK: false, hasAllKeys: false };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 4. LOG DE USO DE API (BYOK)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Registra o uso de APIs do usuário para analytics.
 * 
 * @param {Object} logData
 * @param {string} logData.userId
 * @param {string} logData.provider - stability, elevenlabs, openai
 * @param {string} logData.action - generate_image, synthesize_speech, transcribe
 * @param {number} logData.credits - Créditos/units usados
 * @param {string} logData.projectId
 */
async function logApiUsage(logData) {
  try {
    await supabase
      .from('byok_api_usage_logs')
      .insert({
        user_id: logData.userId,
        provider: logData.provider,
        action: logData.action,
        credits_used: logData.credits || 1,
        project_id: logData.projectId,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    // Não falha o render se o log falhar
    console.error('[BYOK] Erro ao logar uso:', error.message);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 5. VERIFICAR LIMITE DE CRÉDITOS (BYOK)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Alguns providers têm limites de créditos (ex: ElevenLabs).
 * Esta função verifica se o usuário ainda tem créditos disponíveis.
 * 
 * @param {string} provider
 * @param {string} apiKey
 * @returns {Promise<Object>} { hasCredits, remaining, error }
 */
async function checkCredits(provider, apiKey) {
  try {
    switch (provider) {
      case 'elevenlabs': {
        const response = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': apiKey },
        });
        
        if (!response.ok) {
          return { hasCredits: false, remaining: 0, error: 'Failed to fetch credits' };
        }
        
        const data = await response.json();
        const remaining = data.subscription?.character_count || 0;
        const limit = data.subscription?.character_limit || 0;
        
        return {
          hasCredits: remaining < limit,
          remaining,
          limit,
          percentage: ((remaining / limit) * 100).toFixed(1),
        };
      }
      
      case 'stability': {
        // Stability não expõe créditos via API facilmente
        // Retornamos true por padrão (o usuário gerencia seus créditos no dashboard deles)
        return { hasCredits: true, remaining: null, note: 'Check Stability dashboard' };
      }
      
      case 'openai': {
        // OpenAI também não expõe créditos facilmente
        return { hasCredits: true, remaining: null, note: 'Check OpenAI dashboard' };
      }
      
      default:
        return { hasCredits: true, remaining: null };
    }
  } catch (error) {
    return { hasCredits: false, remaining: 0, error: error.message };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 6. REMOVER API KEY
 * ═══════════════════════════════════════════════════════════════════════
 */
async function removeApiKey(userId, provider) {
  try {
    const {  profile } = await supabase
      .from('profiles')
      .select('api_keys')
      .eq('id', userId)
      .single();

    const keys = profile.api_keys || {};
    delete keys[provider];

    await supabase
      .from('profiles')
      .update({ 
        api_keys: keys,
        api_usage_tier: Object.keys(keys).length > 0 ? 'byok_unlimited' : 'free',
      })
      .eq('id', userId);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────
module.exports = {
  validateApiKey,
  saveUserApiKeys,
  getUserApiKeys,
  logApiUsage,
  checkCredits,
  removeApiKey,
  BYOK_PROVIDERS,
};
