# 🎬 AI Studio Pro — Video Engineering Platform

> **Engenharia de Ilusão**: Plataforma SaaS white-label para geração de vídeos longos (Canais Dark, EdTech) usando FFmpeg + Lottie + TTS, com custo de API reduzido a centavos.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite/Tailwind)                │
│  Dashboard │ Pipeline │ Transitions │ Audio │ Editor │ Projects  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP + WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  API SERVER (Express + Socket.io)                 │
│  POST /api/projects ──→ BullMQ Queue ──→ renderWorker           │
│  POST /api/assets  ──→ Multer Upload ──→ Supabase Storage       │
│  WebSocket           ──→ Progresso em tempo real                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RENDER WORKER (BullMQ Consumer)                   │
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Lottie   │  │  Transitions │  │   Audio      │  │ Upscale │ │
│  │ Rasterizer│  │   Engine     │  │  Humanizer   │  │  (1080p)│ │
│  │(Puppeteer)│  │  (FFmpeg)    │  │  (FFmpeg)    │  │(Lanczos)│ │
│  └──────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                │
│  Supabase (PostgreSQL + Auth + Storage) │ Redis (BullMQ) │ FS   │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura do Projeto

```
.
├── src/                          # Frontend (React/Vite)
│   ├── App.tsx                   # Entry point
│   ├── components/
│   │   ├── Sidebar.tsx           # Navegação lateral
│   │   ├── Dashboard.tsx         # Visão geral + stats
│   │   ├── PipelineView.tsx      # Fluxo de renderização
│   │   ├── TransitionsEngine.tsx # Motor de transições (visual)
│   │   ├── AudioHumanizer.tsx    # Camuflagem + Smart Cut
│   │   ├── TextEditor.tsx        # Editor por texto
│   │   ├── ProjectList.tsx       # Lista de projetos
│   │   └── BackendStatus.tsx     # Status dos módulos backend
│   └── index.css                 # Tailwind + custom styles
│
├── server/                       # Backend (Node.js)
│   ├── src/
│   │   ├── server.js             # Express API + Socket.io
│   │   ├── workers/
│   │   │   └── renderWorker.js   # BullMQ consumer (core)
│   │   └── utils/
│   │       ├── transitions.js    # Motor de transições FFmpeg
│   │       ├── audioHumanizer.js # Camuflagem + Smart Cut
│   │       ├── lottieRasterizer.js # Puppeteer → PNGs
│   │       ├── upscaler.js       # Lanczos / Real-ESRGAN
│   │       └── cleanup.js        # Limpeza de /tmp
│   ├── ecosystem.config.js       # PM2 config
│   ├── package.json              # Dependências
│   └── .env.example              # Template de variáveis
│
└── README.md                     # Este arquivo
```

## 🚀 Deploy na VPS Oracle

### Pré-requisitos
- Ubuntu 22.04+ (24GB RAM, 200GB+ storage)
- Node.js 18+
- Redis 7+
- FFmpeg 5+
- Chromium (para Puppeteer)

### Passo a Passo

```bash
# 1. Clonar o repositório
git clone <repo-url> /opt/ai-studio-pro
cd /opt/ai-studio-pro

# 2. Instalar dependências do sistema
apt update && apt install -y redis-server ffmpeg chromium-browser

# 3. Instalar dependências do backend
cd server
npm install

# 4. Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Preencha com suas credenciais

# 5. Criar diretórios necessários
mkdir -p /renders/final /tmp/renders /tmp/lottie_cache /var/log/ai-studio

# 6. Iniciar com PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Auto-start no boot

# 7. Configurar Nginx (reverse proxy)
nano /etc/nginx/sites-available/ai-studio
# (configuração abaixo)

# 8. SSL
certbot --nginx -d seu-dominio.com
```

### Nginx Config

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎞️ Módulos Backend

### 1. Motor de Transições (`transitions.js`)
Gera filtros FFmpeg `-filter_complex` para:
- **parallax_pan**: ZoomPan com pontos A-B-C-D (ilusão de profundidade)
- **mask_zoom_reveal**: alphamerge + overlay (máscara PNG com buracos)
- **ink_bleed**: Efeito orgânico de tinta expandindo
- **glitch**: RGB shift + scanlines + noise burst
- **dissolve**: Cross-fade com zoom sutil

### 2. Humanizer de Áudio (`audioHumanizer.js`)
- **Camuflagem**: Mix narração + room tone a -40dB (quebra hash do YouTube)
- **Smart Silence Cut**: Remove silêncios via timestamps do Whisper
- **Padding configurável**: 100-800ms entre frases (respiro natural)
- **Normalização**: -16 LUFS (padrão YouTube)

### 3. Lottie Rasterizer (`lottieRasterizer.js`)
- Valida JSON do Lottie
- Gera hash MD5 para cache dedup
- Puppeteer renderiza cada frame → PNG transparente
- Cache em `/tmp/lottie_cache/[hash]/`
- Cleanup automático (>7 dias)

### 4. Render Worker (`renderWorker.js`)
- BullMQ consumer (2 jobs simultâneos)
- Pipeline completo: Assets → Transições → Áudio → Composição → Upscale → Entrega
- Progresso em tempo real via WebSocket
- Upload automático para Supabase Storage
- Cleanup de arquivos temporários

### 5. Upscaler (`upscaler.js`)
- **Lanczos**: Rápido, zero custo, 8/10 qualidade
- **Real-ESRGAN**: AI-based, máxima qualidade, requer GPU
- Detecção automática de resolução (ffprobe)

### 6. Cleanup (`cleanup.js`)
- Cronjob diário (3:00 AM via PM2)
- Remove arquivos >7 dias de `/tmp/`
- Protege `/renders/final/` (nunca deleta)

## 💰 Custo de API

| Serviço | Custo por Vídeo (10min) |
|---------|------------------------|
| SDXL (imagens) | R$ 0.08 |
| ElevenLabs (narração) | R$ 0.04 |
| FFmpeg (render) | R$ 0.00 |
| **Total** | **R$ 0.12** |

> **Princípio**: Custo Zero de API de Vídeo. Tudo é manipulação matemática de pixels via FFmpeg.

## 🔧 Comandos Úteis

```bash
# Iniciar todos os serviços
pm2 start ecosystem.config.js

# Ver logs em tempo real
pm2 logs

# Reiniciar worker (após atualização)
pm2 restart ai-studio-worker

# Limpeza manual de /tmp
npm run cleanup

# Status do cache Lottie
curl http://localhost:3001/api/cache/lottie

# Status do cleanup
curl http://localhost:3001/api/cleanup/status
```

## 📊 Monitoramento

- **PM2**: `pm2 monit` (CPU, RAM, status)
- **Redis**: `redis-cli info` (fila, jobs)
- **FFmpeg**: Logs em `/var/log/ai-studio/worker-out.log`
- **WebSocket**: `io.to(projectId).emit('render:progress', ...)`

## 🎯 Próximos Passos

1. **Integrar Supabase Auth** (middleware de autenticação)
2. **Implementar BYOK** (Bring Your Own Key — usuários com API keys próprias)
3. **Adicionar Real-ESRGAN** (requer GPU na VPS)
4. **Dashboard de analytics** (renders/dia, custo, tempo médio)
5. **Editor de timeline visual** (opcional — atual é por texto)

## 📝 Licença

Proprietário — AI Studio Pro © 2026

---

**Desenvolvido com ⚡ por Engenharia de Ilusão**
