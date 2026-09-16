# 🖥️ AI Studio Pro — Backend

Backend Node.js para o AI Studio Pro — plataforma de geração de vídeos com IA.

## 📦 Instalação

```bash
cd server
npm install
```

## 🚀 Uso

### Desenvolvimento

```bash
# Inicia API server com hot reload
npm run dev

# Inicia worker em outro terminal
npm run worker
```

### Produção

```bash
# Inicia todos os serviços com PM2
pm2 start ecosystem.config.js

# Ou manualmente
npm start        # API server
npm run worker   # Render worker
```

## 🧪 Testes

```bash
# Executa todos os testes
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📁 Estrutura

```
server/
├── src/
│   ├── server.js              # Express API + Socket.io
│   ├── workers/
│   │   └── renderWorker.js    # BullMQ consumer
│   ├── middleware/
│   │   ├── auth.js            # Autenticação Supabase
│   │   └── rateLimiter.js     # Rate limiting
│   └── utils/
│       ├── transitions.js     # Motor de transições FFmpeg
│       ├── audioHumanizer.js  # Camuflagem + Smart Cut
│       ├── lottieRasterizer.js # Lottie → PNGs
│       ├── upscaler.js        # Upscaling automático
│       ├── cleanup.js         # Limpeza de /tmp
│       ├── byokManager.js     # Sistema BYOK
│       ├── notificationService.js # Emails
│       └── projectTemplates.js # Templates de projetos
├── database/
│   └── schema.sql             # Schema PostgreSQL
├── tests/
│   └── core.test.js           # Testes unitários
├── scripts/
│   └── setup-vps.sh           # Setup automático VPS
├── ecosystem.config.js        # PM2 config
├── jest.config.js             # Jest config
├── package.json
└── .env.example
```

## 🔧 Endpoints

Ver [API Documentation](../API_DOCS.md) para documentação completa.

### Principais Endpoints

- `GET /health` — Health check
- `GET /api/projects` — Lista projetos
- `POST /api/projects` — Cria projeto
- `GET /api/projects/:id/status` — Status do projeto
- `POST /api/assets/upload` — Upload de asset
- `GET /api/transitions` — Lista transições
- `GET /api/templates` — Lista templates
- `GET /api/cache/lottie` — Status do cache
- `POST /api/cleanup/run` — Limpeza manual

## 🔌 WebSocket

Conecte-se ao WebSocket para receber atualizações em tempo real:

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001')

socket.on('connect', () => {
  socket.emit('project:join', projectId)
})

socket.on('render:progress', (data) => {
  console.log(`Progresso: ${data.progress}%`)
})
```

## 🗄️ Banco de Dados

### Schema

Execute `database/schema.sql` no Supabase SQL Editor.

### Tabelas Principais

- `profiles` — Perfis de usuário
- `projects` — Projetos de vídeo
- `video_segments` — Segmentos de vídeo
- `assets` — Assets (imagens, áudio, Lottie)
- `audio_camouflage_library` — Biblioteca de áudio ambiente
- `render_logs` — Logs de renderização
- `lottie_cache_registry` — Cache de Lottie

## ⚙️ Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
nano .env
```

### Variáveis Obrigatórias

- `SUPABASE_URL` — URL do projeto Supabase
- `SUPABASE_ANON_KEY` — Chave anônima do Supabase
- `SUPABASE_SERVICE_KEY` — Chave de serviço do Supabase
- `REDIS_HOST` — Host do Redis (padrão: 127.0.0.1)
- `REDIS_PORT` — Porta do Redis (padrão: 6379)

### Variáveis Opcionais

- `EMAIL_PROVIDER` — Provider de email (resend, sendgrid, nodemailer)
- `RESEND_API_KEY` — API key do Resend
- `SDXL_API_KEY` — API key do Stability AI
- `ELEVENLABS_API_KEY` — API key do ElevenLabs
- `OPENAI_API_KEY` — API key do OpenAI

## 🔒 Segurança

- Autenticação JWT via Supabase Auth
- Rate limiting (100 req/min por usuário)
- CORS configurado para domínios autorizados
- Validação de uploads (tipo e tamanho)
- Keys de API criptografadas no banco

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
pm2 logs

# Ou diretamente
tail -f /var/log/ai-studio/api-out.log
tail -f /var/log/ai-studio/worker-out.log
```

### Métricas

- `GET /health` — Status do servidor
- `GET /api/cache/lottie` — Status do cache
- `GET /api/cleanup/status` — Status dos diretórios temporários

## 🧹 Limpeza Automática

O sistema limpa automaticamente arquivos temporários (>7 dias) via cronjob:

```bash
# Executa limpeza manual
npm run cleanup

# Ou via API
curl -X POST http://localhost:3001/api/cleanup/run
```

## 🐛 Debug

### Worker não inicia

```bash
# Verificar Redis
redis-cli ping

# Verificar logs
pm2 logs ai-studio-worker
```

### FFmpeg falha

```bash
# Verificar instalação
ffmpeg -version

# Verificar permissões
ls -la /tmp/renders/
```

### Lottie não renderiza

```bash
# Verificar Chromium
chromium-browser --version

# Testar Puppeteer
node -e "require('puppeteer').launch().then(b => { console.log('OK'); b.close(); })"
```

## 📝 Licença

Proprietário — AI Studio Pro © 2026
