# 📘 GUIA COMPLETO DE INSTALAÇÃO DO BACKEND
## AI Studio Pro — Passo a Passo para Iniciantes

**Última atualização:** 2026-01-15  
**Tempo estimado:** 30-45 minutos  
**Dificuldade:** Iniciante (com este guia)

---

## 📋 ÍNDICE

1. [Pré-requisitos](#1-pré-requisitos)
2. [Passo 1: Abrir o Terminal](#2-passo-1-abrir-o-terminal)
3. [Passo 2: Navegar até a Pasta do Projeto](#3-passo-2-navegar-até-a-pasta-do-projeto)
4. [Passo 3: Instalar Node.js](#4-passo-3-instalar-nodejs)
5. [Passo 4: Instalar Dependências do Backend](#5-passo-4-instalar-dependências-do-backend)
6. [Passo 5: Configurar Supabase](#6-passo-5-configurar-supabase)
7. [Passo 6: Instalar e Configurar Redis](#7-passo-6-instalar-e-configurar-redis)
8. [Passo 7: Configurar Variáveis de Ambiente](#8-passo-7-configurar-variáveis-de-ambiente)
9. [Passo 8: Executar Schema SQL no Supabase](#9-passo-8-executar-schema-sql-no-supabase)
10. [Passo 9: Gerar Assets de Exemplo](#10-passo-9-gerar-assets-de-exemplo)
11. [Passo 10: Popular Banco com Dados de Exemplo](#11-passo-10-popular-banco-com-dados-de-exemplo)
12. [Passo 11: Iniciar API Server](#12-passo-11-iniciar-api-server)
13. [Passo 12: Iniciar Worker](#13-passo-12-iniciar-worker)
14. [Passo 13: Testar se Está Funcionando](#14-passo-13-testar-se-está-funcionando)
15. [Troubleshooting — Erros Comuns](#15-troubleshooting--erros-comuns)

---

## 1. PRÉ-REQUISITOS

### O que você precisa ANTES de começar:

#### ✅ Computador com:
- **Sistema Operacional:** Windows 10/11, macOS ou Linux (Ubuntu recomendado)
- **RAM:** Mínimo 8GB (16GB recomendado)
- **Espaço em disco:** Mínimo 10GB livres
- **Internet:** Conexão estável para downloads

#### ✅ Conta no Supabase (gratuita):
- Acesse: https://supabase.com
- Crie uma conta gratuita (pode usar GitHub ou email)
- Você vai precisar disso no Passo 5

#### ✅ Editor de Código (recomendado):
- **VS Code** (Visual Studio Code) — Gratuito
- Download: https://code.visualstudio.com
- Não é obrigatório, mas facilita muito

#### ✅ Git (para clonar o projeto):
- **Windows:** https://git-scm.com/download/win
- **macOS:** https://git-scm.com/download/mac
- **Linux:** `sudo apt install git`

---

## 2. PASSO 1: ABRIR O TERMINAL

### O que é o Terminal?
O terminal (ou "Prompt de Comando" no Windows) é onde você digita comandos para o computador executar. É como um chat com o sistema.

### Como abrir o Terminal:

**Windows:**
1. Pressione `Windows + R`
2. Digite `cmd` ou `powershell`
3. Pressione `Enter`

**macOS:**
1. Pressione `Command + Espaço`
2. Digite `Terminal`
3. Pressione `Enter`

**Linux (Ubuntu):**
1. Pressione `Ctrl + Alt + T`

### ✅ Como saber se funcionou:
Você deve ver uma janela preta (ou branca) com um cursor piscando. Algo como:
```
C:\Users\SeuNome>
```
ou
```
seunome@computer:~$
```

---

## 3. PASSO 2: NAVEGAR ATÉ A PASTA DO PROJETO

### O que vamos fazer:
Mudar para a pasta onde está o código do AI Studio Pro.

### Comando:
```bash
cd caminho/para/ai-studio-pro/server
```

### Exemplos:

**Se o projeto está na Área de Trabalho (Windows):**
```bash
cd C:\Users\SeuNome\Desktop\ai-studio-pro\server
```

**Se o projeto está na pasta Documentos:**
```bash
cd C:\Users\SeuNome\Documents\ai-studio-pro\server
```

**No macOS/Linux:**
```bash
cd ~/Desktop/ai-studio-pro/server
```

### 💡 Dica:
Se você não sabe o caminho exato:
1. Abra a pasta `ai-studio-pro` no explorador de arquivos
2. Navegue até a pasta `server`
3. Copie o caminho da barra de endereço
4. Use `cd` seguido do caminho

### ✅ Como saber se funcionou:
O terminal deve mostrar que você está na pasta `server`:
```
C:\Users\SeuNome\Desktop\ai-studio-pro\server>
```

---

## 4. PASSO 3: INSTALAR NODE.JS

### O que é Node.js?
Node.js é o ambiente que executa JavaScript fora do navegador. Nosso backend é feito em Node.js.

### Verificar se já está instalado:
```bash
node --version
```

### ✅ Se aparecer algo como `v18.17.0` ou superior:
**Ótimo! Node.js já está instalado. Pule para o Passo 4.**

### ❌ Se aparecer erro ou versão antiga (< 18):
**Você precisa instalar o Node.js.**

### Como instalar o Node.js:

**Windows/macOS:**
1. Acesse: https://nodejs.org
2. Baixe a versão **LTS** (Long Term Support) — deve ser 18.x ou superior
3. Execute o instalador
4. Clique em "Next" até o final
5. **FECH E ABRA O TERMINAL** (importante!)

**Linux (Ubuntu):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Verificar instalação:
```bash
node --version
npm --version
```

### ✅ Como saber se funcionou:
Deve aparecer algo como:
```
v18.17.0
9.6.7
```

---

## 5. PASSO 4: INSTALAR DEPENDÊNCIAS DO BACKEND

### O que vamos fazer:
Instalar todas as bibliotecas que o backend precisa para funcionar.

### Comando:
```bash
npm install
```

### O que este comando faz:
- Lê o arquivo `package.json`
- Baixa todas as dependências listadas
- Cria uma pasta `node_modules` com ~500MB de bibliotecas
- Pode demorar 2-5 minutos dependendo da internet

### ✅ Como saber se funcionou:
No final, você deve ver algo como:
```
added 523 packages in 45s
```

### ❌ Se der erro:
Veja a seção [Troubleshooting](#15-troubleshooting--erros-comuns) no final.

---

## 6. PASSO 5: CONFIGURAR SUPABASE

### O que é Supabase?
Supabase é um banco de dados gratuito na nuvem. Vamos usar para armazenar usuários, projetos, etc.

### Passo 5.1: Criar Projeto no Supabase

1. Acesse: https://supabase.com
2. Faça login (ou crie conta)
3. Clique em **"New Project"**
4. Preencha:
   - **Name:** `ai-studio-pro` (ou qualquer nome)
   - **Database Password:** Crie uma senha forte (ANOTE ELA!)
   - **Region:** Escolha a mais próxima (ex: `South America (São Paulo)`)
5. Clique em **"Create new project"**
6. Aguarde 1-2 minutos até o projeto ser criado

### Passo 5.2: Copiar Credenciais

1. No dashboard do Supabase, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Copie e ANOTE:
   - **Project URL:** Algo como `https://abcdefg.supabase.co`
   - **anon public key:** Uma string longa começando com `eyJ...`
   - **service_role key:** Outra string longa (CUIDADO: esta é secreta!)

### ✅ Como saber se funcionou:
Você deve ter 3 coisas anotadas:
1. URL do projeto
2. anon key
3. service_role key

---

## 7. PASSO 6: INSTALAR E CONFIGURAR REDIS

### O que é Redis?
Redis é um banco de dados em memória usado para fila de jobs. Nosso worker usa Redis para saber quais vídeos renderizar.

### Verificar se já está instalado:
```bash
redis-server --version
```

### ✅ Se aparecer algo como `Redis server v=7.0.0`:
**Ótimo! Redis já está instalado. Pule para o Passo 7.2.**

### ❌ Se der erro:
**Você precisa instalar o Redis.**

### Como instalar o Redis:

**Windows:**
Redis não roda nativamente no Windows. Use uma destas opções:

**Opção A: WSL (Windows Subsystem for Linux) — RECOMENDADO**
1. Abra PowerShell como Administrador
2. Execute: `wsl --install`
3. Reinicie o computador
4. Abra "Ubuntu" no menu iniciar
5. Siga as instruções do Linux abaixo

**Opção B: Docker**
1. Instale Docker Desktop: https://www.docker.com/products/docker-desktop
2. Execute: `docker run -d -p 6379:6379 redis:7`

**macOS:**
```bash
brew install redis
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install redis-server
```

### Passo 6.2: Iniciar Redis

**Linux/macOS:**
```bash
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows (WSL):**
```bash
sudo service redis-server start
```

**Docker:**
Já está rodando se você usou o comando acima.

### Verificar se Redis está rodando:
```bash
redis-cli ping
```

### ✅ Como saber se funcionou:
Deve aparecer:
```
PONG
```

---

## 8. PASSO 7: CONFIGURAR VARIÁVEIS DE AMBIENTE

### O que vamos fazer:
Criar um arquivo `.env` com as credenciais do Supabase e outras configurações.

### Comando:
```bash
cp .env.example .env
```

### O que este comando faz:
Copia o arquivo de exemplo para um arquivo real chamado `.env`.

### Agora, edite o arquivo `.env`:

**Opção A: Usando VS Code**
```bash
code .env
```

**Opção B: Usando nano (Linux/macOS)**
```bash
nano .env
```

**Opção C: Usando bloco de notas (Windows)**
```bash
notepad .env
```

### Preencha com suas credenciais:

```env
# Ambiente
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Supabase (USE AS CREDENCIAIS QUE VOCÊ ANOTOU!)
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Email (opcional — pode deixar em branco por enquanto)
EMAIL_PROVIDER=
RESEND_API_KEY=
EMAIL_FROM=

# APIs (opcional — pode deixar em branco por enquanto)
SDXL_API_KEY=
ELEVENLABS_API_KEY=
OPENAI_API_KEY=
```

### Salve o arquivo.

### ✅ Como saber se funcionou:
O arquivo `.env` deve existir na pasta `server` com suas credenciais.

---

## 9. PASSO 8: EXECUTAR SCHEMA SQL NO SUPABASE

### O que vamos fazer:
Criar as tabelas no banco de dados do Supabase.

### Passo 8.1: Abrir o SQL Editor

1. Acesse: https://supabase.com
2. Clique no seu projeto `ai-studio-pro`
3. No menu lateral, clique em **"SQL Editor"** (ícone de código)

### Passo 8.2: Copiar o Schema

1. Abra o arquivo `database/schema.sql` no seu computador
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)

### Passo 8.3: Executar no Supabase

1. No SQL Editor do Supabase, clique em **"New query"**
2. Cole o conteúdo do `schema.sql`
3. Clique em **"Run"** (botão verde no canto superior direito)

### ✅ Como saber se funcionou:
No final da execução, você deve ver:
```
Success. No rows returned
```

### Verificar se as tabelas foram criadas:

1. No menu lateral do Supabase, clique em **"Table Editor"**
2. Você deve ver estas tabelas:
   - `profiles`
   - `projects`
   - `video_segments`
   - `assets`
   - `audio_camouflage_library`
   - `render_logs`
   - `lottie_cache_registry`

---

## 10. PASSO 9: GERAR ASSETS DE EXEMPLO

### O que vamos fazer:
Gerar arquivos de áudio e Lottie para testes.

### Comando:
```bash
node scripts/generate-sample-assets.js
```

### O que este comando faz:
- Cria uma pasta `sample-assets/`
- Gera 6 arquivos WAV (áudios de camuflagem)
- Gera 3 arquivos JSON (Lotties)

### ✅ Como saber se funcionou:
Você deve ver:
```
🎬 AI Studio Pro — Gerador de Assets de Exemplo

═══════════════════════════════════════════════════════════

🎵 Gerando áudios de exemplo...
  ✓ room_tone_studio.wav (60s)
  ✓ birds_morning.wav (120s)
  ...
✅ 6 áudios gerados em /caminho/sample-assets/audio

🎨 Gerando Lotties de exemplo...
  ✓ particles.json
  ✓ vignette.json
  ✓ film_grain.json
✅ 3 Lotties gerados em /caminho/sample-assets/lottie

═══════════════════════════════════════════════════════════
✅ Todos os assets de exemplo foram gerados!
```

### Verificar se os arquivos foram criados:
```bash
ls sample-assets/audio
ls sample-assets/lottie
```

Deve listar os arquivos gerados.

---

## 11. PASSO 10: POPULAR BANCO COM DADOS DE EXEMPLO

### O que vamos fazer:
Criar um usuário admin e alguns projetos de exemplo no banco.

### Comando:
```bash
node scripts/seed.js
```

### O que este comando faz:
- Cria um usuário admin (admin@aistudiopro.com / admin123456)
- Cria 4 projetos de exemplo
- Cria segments para cada projeto
- Cria render logs
- Cria assets de exemplo

### ✅ Como saber se funcionou:
Você deve ver:
```
🌱 Iniciando seed do banco de dados...

1️⃣  Criando usuário admin...
✅ Usuário admin criado: uuid-aqui

2️⃣  Criando perfil do usuário...
✅ Perfil criado

3️⃣  Criando projetos de exemplo...
✅ 4 projetos criados

4️⃣  Criando segmentos de exemplo...
✅ 59 segmentos criados

5️⃣  Criando logs de render...
✅ 3 logs de render criados

6️⃣  Criando assets de exemplo...
✅ 3 assets criados

═══════════════════════════════════════════════════════════
✅ Seed concluído com sucesso!
```

### Verificar no Supabase:

1. Acesse o **Table Editor** no Supabase
2. Clique na tabela `profiles`
3. Você deve ver 1 linha com o usuário admin

---

## 12. PASSO 11: INICIAR API SERVER

### O que vamos fazer:
Iniciar o servidor da API.

### Comando:
```bash
npm run dev
```

### O que este comando faz:
- Inicia o servidor Express na porta 3001
- Carrega todas as rotas da API
- Conecta ao Supabase e Redis
- Fica rodando em modo desenvolvimento (com hot reload)

### ✅ Como saber se funcionou:
Você deve ver:
```
> ai-studio-pro-server@1.0.0 dev
> nodemon src/server.js

[nodemon] starting `node src/server.js`

╔══════════════════════════════════════════════════════════╗
║          AI STUDIO PRO — API Server                      ║
╠══════════════════════════════════════════════════════════╣
║  Port:      3001                                         ║
║  Env:       development                                  ║
║  Redis:     127.0.0.1:6379                               ║
║  Supabase:  ✓ Connected                                 ║
║  WebSocket: ✓ Socket.io ready                           ║
╚══════════════════════════════════════════════════════════╝
```

### ⚠️ IMPORTANTE:
**NÃO FECHE ESTE TERMINAL!** O servidor precisa ficar rodando.

### Testar rapidamente:
Abra o navegador e acesse:
```
http://localhost:3001/health
```

Deve aparecer:
```json
{
  "status": "ok",
  "uptime": 12.345,
  "memory": { ... },
  "version": "1.0.0"
}
```

---

## 13. PASSO 12: INICIAR WORKER

### O que vamos fazer:
Iniciar o worker que processa os renders de vídeo.

### Abrir um NOVO terminal:
**NÃO feche o terminal do Passo 11!** Abra um novo terminal.

### Navegar até a pasta do projeto:
```bash
cd caminho/para/ai-studio-pro/server
```

### Comando:
```bash
npm run worker
```

### O que este comando faz:
- Inicia o BullMQ worker
- Conecta ao Redis
- Fica ouvindo a fila de jobs
- Quando um job chega, processa o render

### ✅ Como saber se funcionou:
Você deve ver:
```
> ai-studio-pro-server@1.0.0 worker
> node src/workers/renderWorker.js

[renderWorker] Worker iniciado — Aguardando jobs...
[renderWorker] Conectado ao Redis: 127.0.0.1:6379
[renderWorker] Pronto para processar renders!
```

### ⚠️ IMPORTANTE:
**NÃO FECHE ESTE TERMINAL TAMBÉM!** O worker precisa ficar rodando.

---

## 14. PASSO 13: TESTAR SE ESTÁ FUNCIONANDO

### Agora você deve ter 2 terminais abertos:
1. **Terminal 1:** API Server rodando
2. **Terminal 2:** Worker rodando

### Teste 1: Health Check

Abra o navegador:
```
http://localhost:3001/health
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "uptime": 45.678,
  "version": "1.0.0"
}
```

### Teste 2: Listar Templates

Abra o navegador:
```
http://localhost:3001/api/templates
```

**Resultado esperado:**
```json
{
  "templates": [
    {
      "id": "canal_dark",
      "name": "Canal Dark — Mistério & Terror",
      "icon": "🌑",
      "category": "dark"
    },
    ...
  ]
}
```

### Teste 3: Status do Cache

Abra o navegador:
```
http://localhost:3001/api/cache/lottie
```

**Resultado esperado:**
```json
{
  "totalEntries": 0,
  "totalSizeMB": "0",
  "totalFrames": 0
}
```

### ✅ Se todos os testes passaram:
**PARABÉNS! O backend está funcionando!** 🎉

---

## 15. TROUBLESHOOTING — ERROS COMUNS

### Erro 1: "npm: command not found"

**Causa:** Node.js não está instalado ou não está no PATH.

**Solução:**
1. Instale o Node.js (Passo 3)
2. **FECH E ABRA O TERMINAL**
3. Tente novamente

---

### Erro 2: "EACCES: permission denied"

**Causa:** Falta permissão para escrever na pasta.

**Solução (Linux/macOS):**
```bash
sudo chown -R $USER:$USER .
```

**Solução (Windows):**
Execute o terminal como Administrador.

---

### Erro 3: "Cannot find module 'xxx'"

**Causa:** Dependências não foram instaladas corretamente.

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Erro 4: "connect ECONNREFUSED 127.0.0.1:6379"

**Causa:** Redis não está rodando.

**Solução:**

**Linux:**
```bash
sudo systemctl start redis
```

**macOS:**
```bash
brew services start redis
```

**Windows (WSL):**
```bash
sudo service redis-server start
```

**Docker:**
```bash
docker start redis
```

---

### Erro 5: "invalid input syntax for type uuid"

**Causa:** Schema SQL não foi executado corretamente no Supabase.

**Solução:**
1. Vá ao Supabase → SQL Editor
2. Execute o `schema.sql` novamente
3. Verifique se todas as tabelas foram criadas

---

### Erro 6: "relation 'profiles' does not exist"

**Causa:** Tabela não existe no banco.

**Solução:**
Mesmo do Erro 5 — execute o schema.sql novamente.

---

### Erro 7: "Port 3001 is already in use"

**Causa:** Outro processo está usando a porta 3001.

**Solução:**

**Linux/macOS:**
```bash
# Encontrar o processo
lsof -i :3001

# Matar o processo (substitua PID pelo número encontrado)
kill -9 PID
```

**Windows:**
```bash
# Encontrar o processo
netstat -ano | findstr :3001

# Matar o processo
taskkill /PID NUMERO /F
```

---

### Erro 8: "Supabase connection failed"

**Causa:** Credenciais do Supabase estão erradas no `.env`.

**Solução:**
1. Abra o arquivo `.env`
2. Verifique se `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_KEY` estão corretos
3. Copie novamente do Supabase Dashboard → Settings → API

---

### Erro 9: "FFmpeg not found"

**Causa:** FFmpeg não está instalado.

**Solução:**

**Windows:**
1. Baixe: https://ffmpeg.org/download.html
2. Extraia o ZIP
3. Adicione a pasta `bin` ao PATH do sistema

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

---

### Erro 10: "Puppeteer failed to launch"

**Causa:** Chromium não está instalado ou faltam dependências.

**Solução:**

**Linux:**
```bash
sudo apt install -y chromium-browser libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

**Windows/macOS:**
O Puppeteer baixa o Chromium automaticamente. Se falhar:
```bash
cd node_modules/puppeteer
npm run install
```

---

## 🎉 PARABÉNS!

Se você chegou até aqui e todos os testes passaram, **o backend está funcionando!**

### Próximos passos:

1. **Iniciar o Frontend:**
   ```bash
   cd ..
   npm run dev
   ```

2. **Acessar o Frontend:**
   ```
   http://localhost:5173
   ```

3. **Fazer Login:**
   - Email: `admin@aistudiopro.com`
   - Senha: `admin123456`

4. **Criar um projeto de teste**

5. **Renderizar um vídeo**

---

## 📞 Precisa de Ajuda?

Se algum passo não funcionou:

1. **Verifique os logs** nos terminais
2. **Consulte a seção de Troubleshooting** acima
3. **Leia a documentação:**
   - `README.md`
   - `server/README.md`
   - `API_DOCS.md`

---

## 📋 CHECKLIST FINAL

Antes de continuar, verifique:

- [ ] Node.js instalado (v18+)
- [ ] Redis instalado e rodando
- [ ] Dependências instaladas (`npm install`)
- [ ] Supabase configurado (projeto criado)
- [ ] Schema SQL executado no Supabase
- [ ] Arquivo `.env` preenchido
- [ ] Assets de exemplo gerados
- [ ] Seed executado (dados de exemplo)
- [ ] API Server rodando (terminal 1)
- [ ] Worker rodando (terminal 2)
- [ ] Testes passaram (health, templates, cache)

---

**Última atualização:** 2026-01-15  
**Versão do guia:** 1.0  
**Tempo estimado:** 30-45 minutos

---

🎬 **AI Studio Pro — Backend Installation Guide** 🎬

*"Do zero ao backend funcionando em 45 minutos"*
