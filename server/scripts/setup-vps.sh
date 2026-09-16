#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# AI STUDIO PRO — Script de Setup Automático para VPS Oracle
# ═══════════════════════════════════════════════════════════════════════
# 
# Uso:
#   chmod +x setup-vps.sh
#   ./setup-vps.sh
#
# Este script instala e configura todas as dependências necessárias
# para rodar o AI Studio Pro na VPS Oracle (Ubuntu 22.04+).
#
# ═══════════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções helper
print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verifica se está rodando como root
if [ "$EUID" -ne 0 ]; then
    print_error "Este script deve ser executado como root (sudo)"
    exit 1
fi

print_header "🚀 AI Studio Pro — Setup Automático"

# ─── 1. Atualizar Sistema ────────────────────────────────────────────────
print_header "1/10 — Atualizando sistema..."
apt update -y
apt upgrade -y
print_step "Sistema atualizado"

# ─── 2. Instalar Node.js 18+ ─────────────────────────────────────────────
print_header "2/10 — Instalando Node.js..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_step "Node.js já instalado: $NODE_VERSION"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    print_step "Node.js instalado: $(node -v)"
fi

# ─── 3. Instalar Redis ───────────────────────────────────────────────────
print_header "3/10 — Instalando Redis..."

if command -v redis-server &> /dev/null; then
    print_step "Redis já instalado"
else
    apt install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
    print_step "Redis instalado e iniciado"
fi

# Verifica se Redis está rodando
if redis-cli ping | grep -q "PONG"; then
    print_step "Redis respondendo corretamente"
else
    print_error "Redis não está respondendo"
    exit 1
fi

# ─── 4. Instalar FFmpeg ──────────────────────────────────────────────────
print_header "4/10 — Instalando FFmpeg..."

if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n1)
    print_step "FFmpeg já instalado: $FFMPEG_VERSION"
else
    apt install -y ffmpeg
    print_step "FFmpeg instalado: $(ffmpeg -version | head -n1)"
fi

# ─── 5. Instalar Chromium (para Puppeteer) ───────────────────────────────
print_header "5/10 — Instalando Chromium..."

if command -v chromium-browser &> /dev/null; then
    print_step "Chromium já instalado"
else
    apt install -y chromium-browser
    print_step "Chromium instalado"
fi

# Instala dependências do Chromium
apt install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2

print_step "Dependências do Chromium instaladas"

# ─── 6. Instalar PM2 ─────────────────────────────────────────────────────
print_header "6/10 — Instalando PM2..."

if command -v pm2 &> /dev/null; then
    print_step "PM2 já instalado: $(pm2 -v)"
else
    npm install -g pm2
    print_step "PM2 instalado: $(pm2 -v)"
fi

# Configura auto-start
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
print_step "PM2 auto-start configurado"

# ─── 7. Instalar Nginx ───────────────────────────────────────────────────
print_header "7/10 — Instalando Nginx..."

if command -v nginx &> /dev/null; then
    print_step "Nginx já instalado"
else
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    print_step "Nginx instalado e iniciado"
fi

# ─── 8. Criar Diretórios ─────────────────────────────────────────────────
print_header "8/10 — Criando diretórios..."

mkdir -p /renders/final
mkdir -p /tmp/renders
mkdir -p /tmp/lottie_cache
mkdir -p /tmp/uploads
mkdir -p /var/log/ai-studio
mkdir -p /opt/ai-studio-pro

# Permissões
chown -R $SUDO_USER:$SUDO_USER /renders /tmp/renders /tmp/lottie_cache /tmp/uploads /var/log/ai-studio /opt/ai-studio-pro

print_step "Diretórios criados com permissões corretas"

# ─── 9. Configurar Nginx ─────────────────────────────────────────────────
print_header "9/10 — Configurando Nginx..."

read -p "Digite o domínio da API (ex: api.seudominio.com): " API_DOMAIN
read -p "Digite o domínio do Frontend (ex: app.seudominio.com): " FRONTEND_DOMAIN

# Config da API
cat > /etc/nginx/sites-available/ai-studio-api <<EOF
server {
    listen 80;
    server_name $API_DOMAIN;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
EOF

# Config do Frontend
cat > /etc/nginx/sites-available/ai-studio-frontend <<EOF
server {
    listen 80;
    server_name $FRONTEND_DOMAIN;

    root /var/www/ai-studio-pro;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Habilita sites
ln -sf /etc/nginx/sites-available/ai-studio-api /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/ai-studio-frontend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testa config
nginx -t
systemctl reload nginx

print_step "Nginx configurado para $API_DOMAIN e $FRONTEND_DOMAIN"

# ─── 10. Instalar Certbot (SSL) ──────────────────────────────────────────
print_header "10/10 — Instalando Certbot (SSL)..."

if command -v certbot &> /dev/null; then
    print_step "Certbot já instalado"
else
    apt install -y certbot python3-certbot-nginx
    print_step "Certbot instalado"
fi

read -p "Deseja configurar SSL agora? (s/n): " SETUP_SSL
if [ "$SETUP_SSL" = "s" ]; then
    read -p "Digite seu email para o Let's Encrypt: " EMAIL
    
    certbot --nginx -d $API_DOMAIN -d $FRONTEND_DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    print_step "SSL configurado e auto-renewal ativado"
else
    print_warning "SSL não configurado. Configure manualmente depois com: certbot --nginx"
fi

# ─── Configurar .env ─────────────────────────────────────────────────────
print_header "Configurando variáveis de ambiente..."

cd /opt/ai-studio-pro/server

if [ ! -f .env ]; then
    cat > .env <<EOF
# AI Studio Pro — Environment Variables
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://$FRONTEND_DOMAIN

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Supabase (PREENCHA COM SUAS CREDENCIAIS)
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_KEY=sua-service-key-aqui

# Email (Resend — recomendado)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_SUA_KEY_AQUI
EMAIL_FROM=noreply@$API_DOMAIN

# APIs (Opcional — para uso da plataforma)
SDXL_API_URL=https://api.stability.ai
SDXL_API_KEY=
ELEVENLABS_API_KEY=
OPENAI_API_KEY=

# Paths
RENDERS_DIR=/renders/final
TEMP_DIR=/tmp/renders
LOTTIE_CACHE_DIR=/tmp/lottie_cache

# Limites
MAX_CONCURRENT_RENDERS=2
MAX_UPLOAD_SIZE_MB=50
CLEANUP_MAX_AGE_DAYS=7
EOF

    print_warning ".env criado em /opt/ai-studio-pro/server/.env"
    print_warning "EDITE O ARQUIVO E PREENCHA AS CREDENCIAIS DO SUPABASE!"
else
    print_step ".env já existe"
fi

# ─── Instalar Dependências do Backend ────────────────────────────────────
print_header "Instalando dependências do backend..."

cd /opt/ai-studio-pro/server
npm install --production

print_step "Dependências instaladas"

# ─── Resumo Final ────────────────────────────────────────────────────────
print_header "✅ Setup Concluído!"

echo -e "${GREEN}Próximos passos:${NC}"
echo ""
echo "1. Edite o arquivo .env com suas credenciais:"
echo "   ${BLUE}nano /opt/ai-studio-pro/server/.env${NC}"
echo ""
echo "2. Execute o schema.sql no Supabase:"
echo "   ${BLUE}Copie o conteúdo de /opt/ai-studio-pro/server/database/schema.sql${NC}"
echo "   ${BLUE}Cole no SQL Editor do Supabase Dashboard${NC}"
echo ""
echo "3. Inicie os serviços:"
echo "   ${BLUE}cd /opt/ai-studio-pro/server${NC}"
echo "   ${BLUE}pm2 start ecosystem.config.js${NC}"
echo "   ${BLUE}pm2 save${NC}"
echo ""
echo "4. Build do frontend:"
echo "   ${BLUE}cd /opt/ai-studio-pro${NC}"
echo "   ${BLUE}npm run build${NC}"
echo "   ${BLUE}cp -r dist/* /var/www/ai-studio-pro/${NC}"
echo ""
echo "5. Verifique os logs:"
echo "   ${BLUE}pm2 logs${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  API:      https://$API_DOMAIN${NC}"
echo -e "${GREEN}  Frontend: https://$FRONTEND_DOMAIN${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
