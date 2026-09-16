# 📚 AI Studio Pro — API Documentation

> **Base URL:** `https://api.aistudiopro.com`
> **Versão:** 1.0.0
> **Autenticação:** Bearer Token (Supabase JWT)

---

## 🔐 Autenticação

Todas as rotas protegidas requerem um token JWT válido no header `Authorization`:

```http
Authorization: Bearer <your-supabase-jwt-token>
```

### Obter Token

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Login
const {  { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

const token = session.access_token
```

---

## 📋 Endpoints

### Health Check

#### `GET /health`
Verifica se a API está online.

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "memory": {
    "rss": 123456789,
    "heapTotal": 98765432,
    "heapUsed": 87654321
  },
  "version": "1.0.0"
}
```

---

### Projects

#### `GET /api/projects`
Lista todos os projetos do usuário autenticado.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Canal Dark #47",
      "type": "dark",
      "status": "completed",
      "segments_count": 12,
      "output_url": "https://storage.supabase.co/...",
      "output_duration": 612.5,
      "render_time_ms": 45000,
      "created_at": "2026-01-15T14:23:00Z",
      "updated_at": "2026-01-15T14:30:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` — Sucesso
- `401` — Não autenticado
- `500` — Erro interno

---

#### `POST /api/projects`
Cria um novo projeto e enfileira para renderização.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Canal Dark #48",
  "type": "dark",
  "template_id": "canal_dark",
  "segments": [
    {
      "text": "Intro — Mistérios do Oceano",
      "duration": 5,
      "transition": "parallax_pan",
      "transitionConfig": {
        "path": "A-B-C-D",
        "zoomStart": 1.0,
        "zoomEnd": 1.5
      }
    }
  ],
  "audioConfig": {
    "narrationPath": "/path/to/narration.mp3",
    "camouflagePath": "/path/to/ambient.wav",
    "whisperTimestamps": [
      { "start": 0.0, "end": 3.2, "text": "Olá..." }
    ],
    "paddingMs": 300,
    "camouflageDb": -40
  },
  "lottieOverlays": [
    {
      "id": "particles_dust",
      "jsonData": { /* Lottie JSON */ },
      "startTime": 0,
      "endTime": 10,
      "x": 0,
      "y": 0
    }
  ],
  "options": {
    "upscaleMethod": "lanczos",
    "width": 1920,
    "height": 1080,
    "fps": 25,
    "priority": 0
  }
}
```

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "name": "Canal Dark #48",
    "status": "queued",
    "bullmq_job_id": "job_123",
    "created_at": "2026-01-15T15:00:00Z"
  },
  "jobId": "job_123",
  "message": "Projeto criado e enfileirado para renderização"
}
```

**Status Codes:**
- `200` — Projeto criado com sucesso
- `400` — Dados inválidos
- `401` — Não autenticado
- `429` — Limite mensal atingido
- `500` — Erro interno

---

#### `GET /api/projects/:id/status`
Retorna o status de um projeto específico.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "name": "Canal Dark #48",
    "status": "rendering",
    "bullmq_job_id": "job_123"
  },
  "jobStatus": {
    "state": "active",
    "progress": 67,
    "attemptsMade": 0,
    "finishedOn": null,
    "failedReason": null
  }
}
```

**Status Codes:**
- `200` — Sucesso
- `401` — Não autenticado
- `404` — Projeto não encontrado
- `500` — Erro interno

---

### Assets

#### `POST /api/assets/upload`
Upload de asset (imagem, áudio, Lottie).

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**
```
file: <binary>
projectId: "uuid"
assetType: "image" | "audio" | "lottie"
```

**Response:**
```json
{
  "asset": {
    "id": "uuid",
    "project_id": "uuid",
    "type": "lottie",
    "file_path": "/tmp/uploads/abc123.json",
    "original_name": "particles.json",
    "file_size": 45678,
    "mime_type": "application/json",
    "meta {
      "frameRate": 30,
      "totalFrames": 60,
      "width": 1920,
      "height": 1080,
      "layers": 5
    },
    "lottie_hash": "md5hash123",
    "created_at": "2026-01-15T15:00:00Z"
  },
  "lottieMeta {
    "frameRate": 30,
    "totalFrames": 60,
    "width": 1920,
    "height": 1080,
    "layers": 5
  },
  "message": "Lottie validado e salvo com sucesso"
}
```

**Status Codes:**
- `200` — Upload realizado com sucesso
- `400` — Arquivo inválido ou tipo não permitido
- `401` — Não autenticado
- `413` — Arquivo muito grande (>50MB)
- `500` — Erro interno

---

### Transitions

#### `GET /api/transitions`
Lista todas as transições disponíveis.

**Response:**
```json
{
  "transitions": [
    "parallax_pan",
    "mask_zoom_reveal",
    "ink_bleed",
    "glitch",
    "dissolve"
  ],
  "defaults": {
    "fps": 25,
    "width": 1280,
    "height": 720,
    "preset": "fast",
    "crf": 18,
    "threads": 4,
    "pixelFormat": "yuv420p"
  },
  "anchorPresets": {
    "A": { "x": 0.2, "y": 0.2 },
    "B": { "x": 0.8, "y": 0.2 },
    "C": { "x": 0.8, "y": 0.8 },
    "D": { "x": 0.2, "y": 0.8 },
    "CENTER": { "x": 0.5, "y": 0.5 }
  }
}
```

---

### Templates

#### `GET /api/templates`
Lista todos os templates de projeto disponíveis.

**Response:**
```json
{
  "templates": [
    {
      "id": "canal_dark",
      "name": "Canal Dark — Mistério & Terror",
      "description": "Template otimizado para canais de mistério, terror e conspiração",
      "icon": "🌑",
      "category": "dark"
    },
    {
      "id": "edtech",
      "name": "EdTech — Educacional & Tutoriais",
      "description": "Template otimizado para conteúdo educacional e tutoriais",
      "icon": "📚",
      "category": "edtech"
    },
    {
      "id": "custom",
      "name": "Custom — Personalizado",
      "description": "Template vazio para configuração personalizada",
      "icon": "🎯",
      "category": "custom"
    }
  ]
}
```

---

#### `GET /api/templates/:id`
Retorna detalhes completos de um template.

**Response:**
```json
{
  "id": "canal_dark",
  "name": "Canal Dark — Mistério & Terror",
  "description": "Template otimizado para canais de mistério, terror e conspiração",
  "icon": "🌑",
  "category": "dark",
  "defaultTransitions": {
    "primary": "parallax_pan",
    "secondary": "mask_zoom_reveal",
    "effects": ["ink_bleed", "glitch"],
    "effectProbability": 0.15
  },
  "audioConfig": {
    "camouflage": {
      "enabled": true,
      "defaultTrack": "room_tone_studio",
      "volumeDb": -42
    },
    "smartCut": {
      "enabled": true,
      "paddingMs": 250,
      "minPhraseDuration": 0.4
    }
  },
  "lottieOverlays": [
    {
      "id": "particles_dust",
      "name": "Partículas de Poeira",
      "description": "Partículas flutuando — atmosfera de mistério",
      "defaultPosition": { "x": 0, "y": 0 },
      "defaultOpacity": 0.3,
      "blendMode": "screen"
    }
  ],
  "promptExamples": [
    {
      "category": "Paisagem Misteriosa",
      "prompt": "dark misty forest at night, fog, moonlight, eerie atmosphere, cinematic, 8k, highly detailed",
      "negative": "bright, cheerful, cartoon, low quality"
    }
  ],
  "videoConfig": {
    "resolution": "1920x1080",
    "fps": 25,
    "duration": {
      "min": 480,
      "max": 900,
      "optimal": 600
    },
    "segmentDuration": {
      "min": 3,
      "max": 8,
      "default": 5
    }
  },
  "styleConfig": {
    "colorPalette": ["#0a0a0f", "#1a1a2e", "#16213e", "#0f3460", "#533483"],
    "mood": "dark, mysterious, eerie, suspenseful",
    "lighting": "dramatic, low-key, shadows"
  }
}
```

---

### Cache

#### `GET /api/cache/lottie`
Retorna status do cache de Lottie.

**Response:**
```json
{
  "totalEntries": 47,
  "totalSizeMB": "234.56",
  "totalFrames": 2820
}
```

---

#### `GET /api/cleanup/status`
Retorna status dos diretórios temporários.

**Response:**
```json
{
  "/tmp/renders": {
    "exists": true,
    "entries": 3,
    "sizeMB": "1.23"
  },
  "/tmp/lottie_cache": {
    "exists": true,
    "entries": 47,
    "sizeMB": "234.56"
  },
  "/tmp/audio_pipeline": {
    "exists": true,
    "entries": 0,
    "sizeMB": "0"
  }
}
```

---

#### `POST /api/cleanup/run`
Executa limpeza manual de arquivos temporários.

**Response:**
```json
{
  "scanned": 50,
  "removed": 12,
  "freedBytes": 123456789,
  "freedMB": "117.74",
  "errors": [],
  "timestamp": "2026-01-15T15:00:00Z"
}
```

---

## 🔌 WebSocket

### Conexão

```javascript
import { io } from 'socket.io-client'

const socket = io('https://api.aistudiopro.com', {
  transports: ['websocket', 'polling'],
})
```

### Eventos

#### `project:join`
Entra na room de um projeto para receber atualizações em tempo real.

**Client → Server:**
```javascript
socket.emit('project:join', projectId)
```

#### `render:progress`
Recebe atualizações de progresso do render.

**Server → Client:**
```json
{
  "jobId": "job_123",
  "projectId": "uuid",
  "stage": "transitions",
  "message": "Aplicando transições...",
  "progress": 45,
  "timestamp": 1642251600000
}
```

**Stages:**
- `preparing` — Preparando assets
- `rasterizing` — Rasterizando Lotties
- `audio` — Processando áudio
- `segment` — Processando segmento
- `transitions` — Aplicando transições
- `composing` — Compondo vídeo
- `overlay` — Aplicando overlays
- `audio_mix` — Mixando áudio
- `upscaling` — Upscaling para 1080p
- `uploading` — Enviando para storage
- `complete` — Renderização concluída

#### `render:complete`
Renderização concluída com sucesso.

**Server → Client:**
```json
{
  "projectId": "uuid",
  "url": "https://storage.supabase.co/...",
  "duration": 612.5,
  "fileSize": 123456789,
  "renderTime": 45000
}
```

#### `render:failed`
Renderização falhou.

**Server → Client:**
```json
{
  "projectId": "uuid",
  "error": "FFmpeg failed: Invalid input",
  "jobId": "job_123"
}
```

---

## ⚠️ Erros

### Formato de Erro

Todas as respostas de erro seguem este formato:

```json
{
  "error": "Mensagem de erro legível",
  "details": "Detalhes técnicos (opcional)"
}
```

### Status Codes Comuns

| Code | Descrição |
|------|-----------|
| `400` | Bad Request — Dados inválidos |
| `401` | Unauthorized — Token inválido ou expirado |
| `403` | Forbidden — Acesso negado |
| `404` | Not Found — Recurso não encontrado |
| `413` | Payload Too Large — Arquivo muito grande |
| `429` | Too Many Requests — Limite mensal atingido |
| `500` | Internal Server Error — Erro no servidor |

---

## 📝 Exemplos

### Criar Projeto Completo

```javascript
const token = 'your-supabase-jwt-token'

const response = await fetch('https://api.aistudiopro.com/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: 'Meu Vídeo Dark',
    type: 'dark',
    template_id: 'canal_dark',
    segments: [
      {
        text: 'Intro — Bem-vindos ao mistério',
        duration: 5,
        transition: 'parallax_pan',
      },
      {
        text: 'O segredo revelado',
        duration: 7,
        transition: 'mask_zoom_reveal',
      },
    ],
    audioConfig: {
      narrationPath: '/path/to/narration.mp3',
      camouflagePath: '/path/to/ambient.wav',
      whisperTimestamps: [
        { start: 0.0, end: 4.5, text: 'Intro — Bem-vindos ao mistério' },
        { start: 5.0, end: 11.5, text: 'O segredo revelado' },
      ],
      paddingMs: 300,
      camouflageDb: -40,
    },
    options: {
      upscaleMethod: 'lanczos',
      priority: 0,
    },
  }),
})

const { project, jobId } = await response.json()
console.log('Projeto criado:', project.id)
console.log('Job ID:', jobId)
```

### Acompanhar Progresso via WebSocket

```javascript
import { io } from 'socket.io-client'

const socket = io('https://api.aistudiopro.com')

socket.on('connect', () => {
  console.log('Conectado ao WebSocket')
  socket.emit('project:join', projectId)
})

socket.on('render:progress', (data) => {
  console.log(`Progresso: ${data.progress}% — ${data.message}`)
})

socket.on('render:complete', (data) => {
  console.log('Render concluído!')
  console.log('URL do vídeo:', data.url)
})

socket.on('render:failed', (data) => {
  console.error('Render falhou:', data.error)
})
```

---

## 🔒 Segurança

- Todos os endpoints protegidos requerem autenticação JWT
- Tokens expiram em 1 hora (configurável no Supabase)
- Rate limiting: 100 requests/minuto por usuário
- Upload máximo: 50MB por arquivo
- CORS configurado para aceitar apenas domínios autorizados
- HTTPS obrigatório em produção

---

## 📞 Suporte

- **Documentação:** https://docs.aistudiopro.com
- **Status:** https://status.aistudiopro.com
- **Email:** support@aistudiopro.com
- **Discord:** https://discord.gg/aistudiopro

---

**Última atualização:** 2026-01-15
**Versão da API:** 1.0.0
