/**
 * PM2 Ecosystem Configuration
 * 
 * Gerencia os processos do AI Studio Pro na VPS Oracle.
 * 
 * Processos:
 * 1. api-server — Express API + Socket.io
 * 2. render-worker — BullMQ worker (FFmpeg)
 * 3. cleanup-cron — Limpeza diária de /tmp
 * 
 * Deploy: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'ai-studio-api',
      script: './src/server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      // Logs
      error_file: '/var/log/ai-studio/api-error.log',
      out_file: '/var/log/ai-studio/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Auto-restart
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 4000,
    },
    {
      name: 'ai-studio-worker',
      script: './src/workers/renderWorker.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '8G', // FFmpeg pode usar muita RAM
      env: {
        NODE_ENV: 'production',
      },
      // Logs
      error_file: '/var/log/ai-studio/worker-error.log',
      out_file: '/var/log/ai-studio/worker-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Auto-restart
      autorestart: true,
      watch: false,
      max_restarts: 5,
      restart_delay: 10000, // Espera 10s antes de restartar (FFmpeg pode estar no meio)
      // Kill timeout — dá tempo pro FFmpeg terminar
      kill_timeout: 30000,
      listen_timeout: 10000,
    },
    {
      name: 'ai-studio-cleanup',
      script: './src/utils/cleanup.js',
      instances: 1,
      exec_mode: 'fork',
      // Roda uma vez por dia (cron)
      cron_restart: '0 3 * * *', // 3:00 AM diariamente
      autorestart: true,
      watch: false,
      // Logs
      error_file: '/var/log/ai-studio/cleanup-error.log',
      out_file: '/var/log/ai-studio/cleanup-out.log',
      merge_logs: true,
    },
  ],
};
