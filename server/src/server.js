/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — API Server (Express + Socket.io)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Servidor principal que:
 * 1. Expõe endpoints REST para o frontend
 * 2. Gerencia WebSocket para progresso em tempo real
 * 3. Enfileira jobs no BullMQ/Redis
 * 4. Valida uploads de assets (Lottie, imagens, áudio)
 * 
 * @module server
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Queue } = require('bullmq');
const { Server: SocketServer } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { validateLottie } = require('./utils/lottieRasterizer');
const transitions = require('./utils/transitions');

// ─── Config ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// ─── App Setup ───────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' })); // Aceita JSONs grandes (Lottie)

// Socket.io
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// BullMQ Queue
const renderQueue = new Queue('video-render', { connection: REDIS_CONNECTION });

// Multer (upload de arquivos)
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/png', 'image/jpeg', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/json', // Lottie
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }
  },
});

// ─── Socket.io Handler ───────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Cliente conectado: ${socket.id}`);

  // Cliente entra na room de um projeto específico
  socket.on('project:join', (projectId) => {
    socket.join(projectId);
    console.log(`[WS] ${socket.id} entrou na room ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Cliente desconectado: ${socket.id}`);
  });
});

// Expondo io para o worker usar
global.io = io;

// ─── Routes ──────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
  });
});

// Lista transições disponíveis
app.get('/api/transitions', (req, res) => {
  res.json({
    transitions: transitions.listTransitions(),
    defaults: transitions.DEFAULTS,
    anchorPresets: transitions.ANCHOR_PRESETS,
  });
});

// Cria um novo projeto e enfileira o render
app.post('/api/projects', async (req, res) => {
  try {
    const { name, type, segments, audioConfig, lottieOverlays, options } = req.body;

    // Validação básica
    if (!name || !segments || segments.length === 0) {
      return res.status(400).json({ error: 'Nome e segmentos são obrigatórios' });
    }

    // Cria projeto no Supabase
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        type,
        status: 'queued',
        segments_count: segments.length,
        config: { segments, audioConfig, lottieOverlays, options },
      })
      .select()
      .single();

    if (error) throw error;

    // Enfileira o job no BullMQ
    const job = await renderQueue.add('render', {
      projectId: project.id,
      userId: req.user?.id || 'anonymous',
      segments,
      audioConfig,
      lottieOverlays,
      options: options || {},
    }, {
      priority: options?.priority || 0,
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    // Atualiza status do projeto
    await supabase
      .from('projects')
      .update({ status: 'rendering', bullmq_job_id: job.id })
      .eq('id', project.id);

    res.json({
      project,
      jobId: job.id,
      message: 'Projeto criado e enfileirado para renderização',
    });

  } catch (error) {
    console.error('[API] Erro ao criar projeto:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Upload de asset (imagem, áudio, Lottie)
app.post('/api/assets/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { projectId, assetType } = req.body;
    const filePath = req.file.path;

    // Validação especial para Lottie
    if (assetType === 'lottie' || req.file.mimetype === 'application/json') {
      const jsonContent = fs.readFileSync(filePath, 'utf-8');
      const validation = validateLottie(jsonContent);
      
      if (!validation.valid) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: `Lottie inválido: ${validation.error}` });
      }

      // Salva metadata no Supabase
      const { data, error } = await supabase
        .from('assets')
        .insert({
          project_id: projectId,
          type: 'lottie',
          file_path: filePath,
          metadata: validation.metadata,
          original_name: req.file.originalname,
        })
        .select()
        .single();

      if (error) throw error;

      return res.json({
        asset: data,
        lottieMetadata: validation.metadata,
        message: 'Lottie validado e salvo com sucesso',
      });
    }

    // Para outros tipos de asset
    const { data, error } = await supabase
      .from('assets')
      .insert({
        project_id: projectId,
        type: assetType || 'image',
        file_path: filePath,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      asset: data,
      message: 'Asset enviado com sucesso',
    });

  } catch (error) {
    console.error('[API] Erro no upload:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Status de um job/projeto
app.get('/api/projects/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Se tem job ID, busca status no BullMQ
    let jobStatus = null;
    if (project.bullmq_job_id) {
      const job = await renderQueue.getJob(project.bullmq_job_id);
      if (job) {
        const state = await job.getState();
        jobStatus = {
          state,
          progress: job.progress,
          attemptsMade: job.attemptsMade,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
        };
      }
    }

    res.json({ project, jobStatus });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lista todos os projetos do usuário
app.get('/api/projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ projects: data });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status do cache Lottie
app.get('/api/cache/lottie', (req, res) => {
  try {
    const { getCacheStatus } = require('./utils/lottieRasterizer');
    const status = getCacheStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status do cleanup
app.get('/api/cleanup/status', (req, res) => {
  try {
    const { getCleanupStatus } = require('./utils/cleanup');
    const status = getCleanupStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual de cleanup
app.post('/api/cleanup/run', (req, res) => {
  try {
    const { runCleanup } = require('./utils/cleanup');
    const results = runCleanup();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Templates Routes ──────────────────────────────────────────────────────

// Lista todos os templates
app.get('/api/templates', (req, res) => {
  try {
    const { listTemplates } = require('./utils/projectTemplates');
    const templates = listTemplates();
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detalhes de um template específico
app.get('/api/templates/:id', (req, res) => {
  try {
    const { getTemplate } = require('./utils/projectTemplates');
    const template = getTemplate(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── BYOK Routes ───────────────────────────────────────────────────────────

// Salvar API keys do usuário
app.post('/api/byok/keys', async (req, res) => {
  try {
    const { requireAuth } = require('./middleware/auth');
    await requireAuth(req, res, async () => {
      const { saveUserApiKeys } = require('./utils/byokManager');
      const { keys } = req.body;
      
      if (!keys || typeof keys !== 'object') {
        return res.status(400).json({ error: 'Keys inválidas' });
      }
      
      const result = await saveUserApiKeys(req.user.id, keys);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json({ success: true, keys: result.keys });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar API keys do usuário (mascaradas)
app.get('/api/byok/keys', async (req, res) => {
  try {
    const { requireAuth } = require('./middleware/auth');
    await requireAuth(req, res, async () => {
      const { getUserApiKeys } = require('./utils/byokManager');
      const result = await getUserApiKeys(req.user.id);
      
      // Mascarar keys para segurança
      const maskedKeys = {};
      for (const [provider, key] of Object.entries(result.keys)) {
        if (key && key.length > 8) {
          maskedKeys[provider] = key.substring(0, 4) + '...' + key.substring(key.length - 4);
        } else {
          maskedKeys[provider] = '***';
        }
      }
      
      res.json({
        keys: maskedKeys,
        isBYOK: result.isBYOK,
        missing: result.missing,
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Analytics Routes ──────────────────────────────────────────────────────

// Stats do usuário
app.get('/api/analytics/stats', async (req, res) => {
  try {
    const { requireAuth } = require('./middleware/auth');
    await requireAuth(req, res, async () => {
      const {  data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', req.user.id)
        .single();
      
      if (error) throw error;
      
      res.json(data);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats diários (últimos 30 dias)
app.get('/api/analytics/daily', async (req, res) => {
  try {
    const { requireAuth } = require('./middleware/auth');
    await requireAuth(req, res, async () => {
      const {  data, error } = await supabase
        .from('daily_render_stats')
        .select('*')
        .order('render_date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      
      res.json({ stats: data });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Notifications Routes ──────────────────────────────────────────────────

// Testar notificação
app.post('/api/notifications/test', async (req, res) => {
  try {
    const { requireAuth } = require('./middleware/auth');
    await requireAuth(req, res, async () => {
      const { notifyRenderComplete } = require('./utils/notificationService');
      
      const result = await notifyRenderComplete(req.user.id, {
        id: 'test-project',
        name: 'Teste de Notificação',
        output_duration: 600,
        render_time_ms: 45000,
        output_url: 'https://example.com/test.mp4',
      });
      
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Start Server ────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║          AI STUDIO PRO — API Server                      ║
╠══════════════════════════════════════════════════════════╣
║  Port:      ${PORT}                                      ║
║  Env:       ${process.env.NODE_ENV || 'development'}     ║
║  Redis:     ${REDIS_CONNECTION.host}:${REDIS_CONNECTION.port}
║  Supabase:  ${process.env.SUPABASE_URL ? '✓ Connected' : '✗ Not configured'}
║  WebSocket: ✓ Socket.io ready                           ║
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
