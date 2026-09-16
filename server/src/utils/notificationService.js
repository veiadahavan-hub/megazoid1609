/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Sistema de Notificações
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Envia emails quando:
 * - Render é concluído com sucesso
 * - Render falha
 * - Limite mensal está próximo (80%)
 * - Limite mensal foi atingido (100%)
 * 
 * Providers suportados:
 * - Resend (recomendado — simples, barato)
 * - SendGrid (alternativa)
 * - Nodemailer (SMTP genérico)
 * 
 * @module notificationService
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Config ──────────────────────────────────────────────────────────────
const NOTIFICATION_CONFIG = {
  provider: process.env.EMAIL_PROVIDER || 'resend', // resend | sendgrid | nodemailer
  fromEmail: process.env.EMAIL_FROM || 'noreply@aistudiopro.com',
  fromName: 'AI Studio Pro',
  // Thresholds para alertas de limite
  limitWarningThreshold: 0.8, // 80%
  limitReachedThreshold: 1.0, // 100%
};

// ─── Templates de Email ──────────────────────────────────────────────────

const EMAIL_TEMPLATES = {
  renderComplete: (data) => ({
    subject: `✅ Render concluído: ${data.projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #f1f5f9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 32px; }
          .logo { width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
          .card { background: #12121a; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
          .stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; }
          .stat:last-child { border-bottom: none; }
          .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
          .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎬</div>
            <h1 style="margin: 0; font-size: 24px;">Render Concluído!</h1>
            <p style="color: #94a3b8; margin-top: 8px;">Seu vídeo está pronto para download</p>
          </div>
          
          <div class="card">
            <h2 style="margin: 0 0 16px 0; font-size: 18px;">${data.projectName}</h2>
            <div class="stat">
              <span style="color: #94a3b8;">Duração</span>
              <span style="font-weight: 600;">${data.duration || '—'}</span>
            </div>
            <div class="stat">
              <span style="color: #94a3b8;">Tempo de render</span>
              <span style="font-weight: 600;">${data.renderTime || '—'}</span>
            </div>
            <div class="stat">
              <span style="color: #94a3b8;">Resolução</span>
              <span style="font-weight: 600;">${data.resolution || '1920x1080'}</span>
            </div>
            <div class="stat">
              <span style="color: #94a3b8;">Custo de API</span>
              <span style="font-weight: 600; color: #10b981;">R$ ${data.apiCost || '0.12'}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${data.downloadUrl || '#'}" class="btn">📥 Baixar Vídeo</a>
          </div>
          
          <div class="footer">
            <p>AI Studio Pro — Video Engineering Platform</p>
            <p>Você recebeu este email porque uma renderização foi concluída na sua conta.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  renderFailed: (data) => ({
    subject: `❌ Render falhou: ${data.projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #f1f5f9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background: #12121a; border: 1px solid #ef4444; border-radius: 12px; padding: 24px; }
          .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: #ef4444;">❌ Render Falhou</h1>
          <p>Ocorreu um erro ao processar seu vídeo.</p>
          <div class="card">
            <h2>${data.projectName}</h2>
            <p style="color: #ef4444;"><strong>Erro:</strong> ${data.errorMessage || 'Erro desconhecido'}</p>
            <p style="color: #94a3b8;">Job ID: ${data.jobId || '—'}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${data.projectUrl || '#'}" class="btn">Ver Projeto</a>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  limitWarning: (data) => ({
    subject: `⚠️ Você usou ${data.percentage}% do limite mensal`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #f1f5f9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background: #12121a; border: 1px solid #f59e0b; border-radius: 12px; padding: 24px; }
          .progress { background: #1e293b; border-radius: 8px; height: 8px; overflow: hidden; margin: 16px 0; }
          .progress-bar { background: linear-gradient(90deg, #f59e0b, #ef4444); height: 100%; border-radius: 8px; }
          .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Limite Mensal</h1>
          <p>Você já usou <strong>${data.used}/${data.limit}</strong> renders este mês.</p>
          <div class="card">
            <div class="progress">
              <div class="progress-bar" style="width: ${data.percentage}%"></div>
            </div>
            <p style="color: #94a3b8;">Faltam apenas <strong>${data.limit - data.used}</strong> renders até o limite.</p>
            <p style="color: #94a3b8;">Considere fazer upgrade para o plano <strong>Pro</strong> ou <strong>BYOK Unlimited</strong>.</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${data.upgradeUrl || '#'}" class="btn">Fazer Upgrade</a>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * ENVIAR EMAIL
 * ═══════════════════════════════════════════════════════════════════════
 */
async function sendEmail(to, template, templateData) {
  const email = EMAIL_TEMPLATES[template]?.(templateData);
  
  if (!email) {
    console.error(`[Notification] Template desconhecido: ${template}`);
    return { success: false, error: 'Template not found' };
  }

  try {
    switch (NOTIFICATION_CONFIG.provider) {
      case 'resend':
        return await sendViaResend(to, email);
      case 'sendgrid':
        return await sendViaSendGrid(to, email);
      case 'nodemailer':
        return await sendViaNodemailer(to, email);
      default:
        console.log(`[Notification] Email simulado para ${to}: ${email.subject}`);
        return { success: true, simulated: true };
    }
  } catch (error) {
    console.error(`[Notification] Erro ao enviar email:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Resend (https://resend.com)
 */
async function sendViaResend(to, email) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY não configurada');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${NOTIFICATION_CONFIG.fromName} <${NOTIFICATION_CONFIG.fromEmail}>`,
      to: [to],
      subject: email.subject,
      html: email.html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Resend API error');
  }

  return { success: true, provider: 'resend' };
}

/**
 * SendGrid
 */
async function sendViaSendGrid(to, email) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY não configurada');

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: NOTIFICATION_CONFIG.fromEmail, name: NOTIFICATION_CONFIG.fromName },
      subject: email.subject,
      content: [{ type: 'text/html', value: email.html }],
    }),
  });

  if (!response.ok) {
    throw new Error('SendGrid API error');
  }

  return { success: true, provider: 'sendgrid' };
}

/**
 * Nodemailer (SMTP genérico)
 */
async function sendViaNodemailer(to, email) {
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `${NOTIFICATION_CONFIG.fromName} <${NOTIFICATION_CONFIG.fromEmail}>`,
    to,
    subject: email.subject,
    html: email.html,
  });

  return { success: true, provider: 'nodemailer' };
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * NOTIFICAR RENDER COMPLETO
 * ═══════════════════════════════════════════════════════════════════════
 */
async function notifyRenderComplete(userId, projectData) {
  try {
    // Busca email do usuário
    const {  profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    // Busca email via auth (Supabase Auth)
    const {  { user } } = await supabase.auth.admin.getUserById(userId);
    
    if (!user?.email) {
      console.warn(`[Notification] Usuário ${userId} não tem email`);
      return { success: false, error: 'User has no email' };
    }

    const result = await sendEmail(user.email, 'renderComplete', {
      projectName: projectData.name,
      duration: projectData.output_duration ? `${Math.floor(projectData.output_duration / 60)}:${String(Math.floor(projectData.output_duration % 60)).padStart(2, '0')}` : '—',
      renderTime: projectData.render_time_ms ? `${(projectData.render_time_ms / 1000).toFixed(0)}s` : '—',
      resolution: '1920x1080',
      apiCost: '0.12',
      downloadUrl: projectData.output_url || '#',
    });

    // Log da notificação
    await supabase.from('notification_logs').insert({
      user_id: userId,
      type: 'render_complete',
      project_id: projectData.id,
      sent_at: new Date().toISOString(),
      status: result.success ? 'sent' : 'failed',
      provider: NOTIFICATION_CONFIG.provider,
    });

    return result;
  } catch (error) {
    console.error('[Notification] Erro ao notificar render complete:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * NOTIFICAR RENDER FALHOU
 * ═══════════════════════════════════════════════════════════════════════
 */
async function notifyRenderFailed(userId, projectData, errorMessage) {
  try {
    const {  { user } } = await supabase.auth.admin.getUserById(userId);
    
    if (!user?.email) {
      return { success: false, error: 'User has no email' };
    }

    return await sendEmail(user.email, 'renderFailed', {
      projectName: projectData.name,
      errorMessage,
      jobId: projectData.bullmq_job_id,
      projectUrl: `${process.env.FRONTEND_URL}/projects/${projectData.id}`,
    });
  } catch (error) {
    console.error('[Notification] Erro ao notificar render failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * VERIFICAR E NOTIFICAR LIMITE
 * ═══════════════════════════════════════════════════════════════════════
 */
async function checkAndNotifyLimit(userId) {
  try {
    const {  profile } = await supabase
      .from('profiles')
      .select('renders_used_this_month, monthly_render_limit, api_usage_tier')
      .eq('id', userId)
      .single();

    if (!profile || profile.api_usage_tier === 'byok_unlimited') {
      return { notified: false, reason: 'BYOK unlimited' };
    }

    const percentage = profile.renders_used_this_month / profile.monthly_render_limit;

    if (percentage >= NOTIFICATION_CONFIG.limitReachedThreshold) {
      // Limite atingido
      const {  { user } } = await supabase.auth.admin.getUserById(userId);
      if (user?.email) {
        await sendEmail(user.email, 'limitWarning', {
          percentage: '100',
          used: profile.renders_used_this_month,
          limit: profile.monthly_render_limit,
          upgradeUrl: `${process.env.FRONTEND_URL}/pricing`,
        });
      }
      return { notified: true, type: 'limit_reached' };
    }

    if (percentage >= NOTIFICATION_CONFIG.limitWarningThreshold) {
      // Aviso de limite próximo
      const {  { user } } = await supabase.auth.admin.getUserById(userId);
      if (user?.email) {
        await sendEmail(user.email, 'limitWarning', {
          percentage: (percentage * 100).toFixed(0),
          used: profile.renders_used_this_month,
          limit: profile.monthly_render_limit,
          upgradeUrl: `${process.env.FRONTEND_URL}/pricing`,
        });
      }
      return { notified: true, type: 'limit_warning' };
    }

    return { notified: false };
  } catch (error) {
    console.error('[Notification] Erro ao verificar limite:', error.message);
    return { notified: false, error: error.message };
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────
module.exports = {
  sendEmail,
  notifyRenderComplete,
  notifyRenderFailed,
  checkAndNotifyLimit,
  EMAIL_TEMPLATES,
  NOTIFICATION_CONFIG,
};
