/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Middleware de Autenticação
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Valida tokens JWT do Supabase Auth e carrega o perfil do usuário.
 * 
 * Fluxo:
 * 1. Frontend envia Authorization: Bearer <token>
 * 2. Middleware valida o token com Supabase Auth
 * 3. Busca o profile no PostgreSQL
 * 4. Anexa user e profile ao req
 * 5. Verifica limites de uso (mensal)
 * 
 * @module authMiddleware
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Middleware principal de autenticação
 * Valida o token e carrega o perfil do usuário
 */
async function requireAuth(req, res, next) {
  try {
    // 1. Extrai o token do header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de autenticação não fornecido' 
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // 2. Valida o token com Supabase Auth
    const {  user, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Token inválido ou expirado',
        details: authError?.message 
      });
    }

    // 3. Busca o perfil do usuário no PostgreSQL
    const {  profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Perfil não existe — cria automaticamente
      const {  newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
          api_usage_tier: 'free',
          monthly_render_limit: 10,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Auth] Erro ao criar perfil:', createError.message);
        return res.status(500).json({ error: 'Erro ao criar perfil do usuário' });
      }

      req.user = user;
      req.profile = newProfile;
    } else {
      req.user = user;
      req.profile = profile;
    }

    // 4. Anexa ao request
    next();

  } catch (error) {
    console.error('[Auth] Erro inesperado:', error.message);
    res.status(500).json({ error: 'Erro interno de autenticação' });
  }
}

/**
 * Middleware para verificar limites de uso (renders mensais)
 * Deve ser usado APÓS requireAuth
 */
function checkRenderLimit(req, res, next) {
  const { profile } = req;

  // BYOK unlimited não tem limite
  if (profile.api_usage_tier === 'byok_unlimited') {
    return next();
  }

  // Verifica se atingiu o limite mensal
  if (profile.renders_used_this_month >= profile.monthly_render_limit) {
    return res.status(429).json({
      error: 'Limite mensal de renders atingido',
      used: profile.renders_used_this_month,
      limit: profile.monthly_render_limit,
      tier: profile.api_usage_tier,
      message: 'Faça upgrade para o plano Pro ou BYOK para continuar',
    });
  }

  next();
}

/**
 * Middleware para verificar se o usuário tem API keys (modo BYOK)
 * Usado quando o usuário quer usar suas próprias chaves de API
 */
function requireBYOKKeys(requiredKeys = []) {
  return (req, res, next) => {
    const { profile } = req;

    // Se não é BYOK, não precisa verificar keys
    if (profile.api_usage_tier !== 'byok_unlimited') {
      return next();
    }

    // Verifica se tem as keys necessárias
    const userKeys = profile.api_keys || {};
    const missingKeys = requiredKeys.filter(key => !userKeys[key]);

    if (missingKeys.length > 0) {
      return res.status(400).json({
        error: 'API keys necessárias não configuradas',
        missing: missingKeys,
        message: `Configure as seguintes keys no seu perfil: ${missingKeys.join(', ')}`,
      });
    }

    // Anexa as keys ao request para uso nos workers
    req.apiKeys = userKeys;
    next();
  };
}

/**
 * Middleware opcional — não bloqueia se não autenticado
 * Útil para endpoints públicos que podem ter dados extras se autenticado
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.profile = null;
      return next();
    }

    const token = authHeader.substring(7);
    const {  user } = await supabase.auth.getUser(token);

    if (user) {
      const {  profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      req.user = user;
      req.profile = profile;
    }

    next();
  } catch (error) {
    // Continua sem auth em caso de erro
    req.user = null;
    req.profile = null;
    next();
  }
}

/**
 * Middleware para admin (futuro)
 * Verifica se o usuário tem role de admin
 */
function requireAdmin(req, res, next) {
  const { profile } = req;

  // Por enquanto, verifica por email (pode evoluir para role-based)
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }

  next();
}

module.exports = {
  requireAuth,
  checkRenderLimit,
  requireBYOKKeys,
  optionalAuth,
  requireAdmin,
};
