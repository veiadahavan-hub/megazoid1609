/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Middleware de Rate Limiting
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Limita o número de requisições por usuário para prevenir abuso.
 * 
 * Limites:
 * - API geral: 100 requests/minuto
 * - Upload: 10 uploads/minuto
 * - Criação de projetos: 5 projetos/minuto
 * 
 * @module rateLimiter
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Config ──────────────────────────────────────────────────────────────
const RATE_LIMITS = {
  // Limites por minuto
  api: {
    windowMs: 60 * 1000, // 1 minuto
    max: 100,
    message: 'Muitas requisições. Tente novamente em 1 minuto.',
  },
  upload: {
    windowMs: 60 * 1000,
    max: 10,
    message: 'Muitos uploads. Tente novamente em 1 minuto.',
  },
  projectCreate: {
    windowMs: 60 * 1000,
    max: 5,
    message: 'Muitos projetos criados. Tente novamente em 1 minuto.',
  },
};

// ─── In-Memory Store (para desenvolvimento) ──────────────────────────────
// Em produção, usar Redis para rate limiting distribuído
const memoryStore = new Map();

/**
 * ═══════════════════════════════════════════════════════════════════════
 * RATE LIMITER GENÉRICO
 * ═══════════════════════════════════════════════════════════════════════
 */
function rateLimiter(config = RATE_LIMITS.api) {
  return async (req, res, next) => {
    try {
      // Identifica o usuário (por ID ou IP)
      const userId = req.user?.id || req.ip || req.connection.remoteAddress;
      
      if (!userId) {
        return next(); // Não limita se não conseguir identificar
      }

      const key = `${req.path}:${userId}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Busca ou cria entrada no store
      if (!memoryStore.has(key)) {
        memoryStore.set(key, []);
      }

      const requests = memoryStore.get(key);

      // Remove requests fora da janela
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      memoryStore.set(key, validRequests);

      // Verifica limite
      if (validRequests.length >= config.max) {
        const retryAfter = Math.ceil((validRequests[0] + config.windowMs - now) / 1000);
        
        res.set('Retry-After', retryAfter);
        res.set('X-RateLimit-Limit', config.max);
        res.set('X-RateLimit-Remaining', 0);
        res.set('X-RateLimit-Reset', new Date(validRequests[0] + config.windowMs).toISOString());

        return res.status(429).json({
          error: config.message,
          retryAfter,
          limit: config.max,
          remaining: 0,
        });
      }

      // Adiciona request atual
      validRequests.push(now);
      memoryStore.set(key, validRequests);

      // Seta headers
      res.set('X-RateLimit-Limit', config.max);
      res.set('X-RateLimit-Remaining', config.max - validRequests.length);
      res.set('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());

      next();

    } catch (error) {
      console.error('[RateLimiter] Erro:', error.message);
      next(); // Continua mesmo se houver erro no rate limiter
    }
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * RATE LIMITERS ESPECÍFICOS
 * ═══════════════════════════════════════════════════════════════════════
 */

// Rate limiter para API geral (100 req/min)
const apiRateLimiter = rateLimiter(RATE_LIMITS.api);

// Rate limiter para uploads (10 uploads/min)
const uploadRateLimiter = rateLimiter(RATE_LIMITS.upload);

// Rate limiter para criação de projetos (5 projetos/min)
const projectCreateRateLimiter = rateLimiter(RATE_LIMITS.projectCreate);

/**
 * ═══════════════════════════════════════════════════════════════════════
 * LIMPEZA DO STORE (para evitar memory leak)
 * ═══════════════════════════════════════════════════════════════════════
 */
function cleanupStore() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutos

  for (const [key, timestamps] of memoryStore.entries()) {
    const validTimestamps = timestamps.filter(ts => now - ts < maxAge);
    
    if (validTimestamps.length === 0) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, validTimestamps);
    }
  }
}

// Limpa o store a cada 5 minutos
setInterval(cleanupStore, 5 * 60 * 1000);

/**
 * ═══════════════════════════════════════════════════════════════════════
 * RATE LIMITER BASEADO EM REDIS (para produção)
 * ═══════════════════════════════════════════════════════════════════════
 */
function redisRateLimiter(config = RATE_LIMITS.api) {
  return async (req, res, next) => {
    try {
      const Redis = require('ioredis');
      const redis = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      });

      const userId = req.user?.id || req.ip;
      if (!userId) return next();

      const key = `ratelimit:${req.path}:${userId}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Remove timestamps antigos
      await redis.zremrangebyscore(key, 0, windowStart);

      // Conta requests na janela
      const count = await redis.zcard(key);

      if (count >= config.max) {
        const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const retryAfter = Math.ceil((parseInt(oldest[1]) + config.windowMs - now) / 1000);

        res.set('Retry-After', retryAfter);
        res.set('X-RateLimit-Limit', config.max);
        res.set('X-RateLimit-Remaining', 0);

        await redis.quit();
        return res.status(429).json({
          error: config.message,
          retryAfter,
          limit: config.max,
          remaining: 0,
        });
      }

      // Adiciona request atual
      await redis.zadd(key, now, `${now}:${Math.random()}`);
      await redis.expire(key, Math.ceil(config.windowMs / 1000));

      res.set('X-RateLimit-Limit', config.max);
      res.set('X-RateLimit-Remaining', config.max - count - 1);

      await redis.quit();
      next();

    } catch (error) {
      console.error('[RedisRateLimiter] Erro:', error.message);
      next(); // Continua mesmo se Redis falhar
    }
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────
module.exports = {
  rateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  projectCreateRateLimiter,
  redisRateLimiter,
  RATE_LIMITS,
  cleanupStore,
};
