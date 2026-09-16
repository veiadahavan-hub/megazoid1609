/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Script de Seed (Popular Banco com Dados de Exemplo)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Executar: node scripts/seed.js
 * 
 * Este script popula o banco com:
 * - Usuário admin de teste
 * - Projetos de exemplo
 * - Assets de exemplo
 * - Render logs
 * 
 * @module seed
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  try {
    // ─── 1. Criar Usuário Admin ────────────────────────────────────────
    console.log('1️⃣  Criando usuário admin...');
    
    const {  adminUser, error: userError } = await supabase.auth.admin.createUser({
      email: 'admin@aistudiopro.com',
      password: 'admin123456',
      email_confirm: true,
       {
        full_name: 'Admin User',
      },
    });

    if (userError && !userError.message.includes('already been registered')) {
      throw userError;
    }

    const userId = adminUser?.id || 'existing-admin-id';
    console.log(`✅ Usuário admin criado: ${userId}\n`);

    // ─── 2. Criar Perfil ───────────────────────────────────────────────
    console.log('2️⃣  Criando perfil do usuário...');
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: 'admin',
        full_name: 'Admin User',
        api_usage_tier: 'pro',
        monthly_render_limit: 100,
        renders_used_this_month: 12,
      });

    if (profileError) throw profileError;
    console.log('✅ Perfil criado\n');

    // ─── 3. Criar Projetos de Exemplo ──────────────────────────────────
    console.log('3️⃣  Criando projetos de exemplo...');

    const projects = [
      {
        user_id: userId,
        name: 'Canal Dark #47 — Mistérios do Oceano',
        type: 'dark',
        status: 'completed',
        segments_count: 12,
        output_duration: 612.5,
        render_time_ms: 45000,
        output_url: 'https://storage.supabase.co/renders/proj_8f2a/final.mp4',
        config: {
          template_id: 'canal_dark',
          transitions: ['parallax_pan', 'mask_zoom_reveal', 'ink_bleed'],
        },
      },
      {
        user_id: userId,
        name: 'EdTech — Curso Python: Listas e Tuplas',
        type: 'edtech',
        status: 'completed',
        segments_count: 24,
        output_duration: 947,
        render_time_ms: 38000,
        output_url: 'https://storage.supabase.co/renders/proj_3b1c/final.mp4',
        config: {
          template_id: 'edtech',
          transitions: ['dissolve', 'parallax_pan'],
        },
      },
      {
        user_id: userId,
        name: 'Canal Dark #48 — Sinais no Espaço',
        type: 'dark',
        status: 'rendering',
        segments_count: 8,
        config: {
          template_id: 'canal_dark',
          transitions: ['glitch', 'parallax_pan'],
        },
      },
      {
        user_id: userId,
        name: 'Canal Dark #46 — Civilizações Perdidas',
        type: 'dark',
        status: 'completed',
        segments_count: 15,
        output_duration: 683,
        render_time_ms: 52000,
        output_url: 'https://storage.supabase.co/renders/proj_1a7f/final.mp4',
        config: {
          template_id: 'canal_dark',
          transitions: ['parallax_pan', 'mask_zoom_reveal'],
        },
      },
    ];

    const {  insertedProjects, error: projectsError } = await supabase
      .from('projects')
      .upsert(projects, { onConflict: 'id' })
      .select();

    if (projectsError) throw projectsError;
    console.log(`✅ ${insertedProjects.length} projetos criados\n`);

    // ─── 4. Criar Segments ─────────────────────────────────────────────
    console.log('4️⃣  Criando segmentos de exemplo...');

    const segments = insertedProjects.flatMap((project, pIndex) => {
      const segmentCount = project.segments_count || 10;
      return Array.from({ length: segmentCount }, (_, i) => ({
        project_id: project.id,
        position: i,
        text_content: `Segmento ${i + 1} do projeto ${project.name}`,
        transition_type: ['parallax_pan', 'mask_zoom_reveal', 'dissolve'][i % 3],
        duration: 5 + Math.random() * 3,
        transition_config: {
          zoomStart: 1.0,
          zoomEnd: 1.5,
          path: 'A-B-C-D',
        },
      }));
    });

    const { error: segmentsError } = await supabase
      .from('video_segments')
      .upsert(segments);

    if (segmentsError) throw segmentsError;
    console.log(`✅ ${segments.length} segmentos criados\n`);

    // ─── 5. Criar Render Logs ──────────────────────────────────────────
    console.log('5️⃣  Criando logs de render...');

    const renderLogs = insertedProjects
      .filter(p => p.status === 'completed')
      .map(project => ({
        project_id: project.id,
        user_id: userId,
        status: 'success',
        render_time_ms: project.render_time_ms,
        segments_count: project.segments_count,
        output_duration: project.output_duration,
        output_resolution: '1920x1080',
        transitions_used: project.config?.transitions || [],
        lottie_overlays_count: Math.floor(Math.random() * 3),
        audio_camouflage_used: true,
        smart_cut_used: true,
        upscale_method: 'lanczos',
        api_cost: 0.12,
      }));

    const { error: logsError } = await supabase
      .from('render_logs')
      .insert(renderLogs);

    if (logsError) throw logsError;
    console.log(`✅ ${renderLogs.length} logs de render criados\n`);

    // ─── 6. Criar Assets de Exemplo ────────────────────────────────────
    console.log('6️⃣  Criando assets de exemplo...');

    const assets = [
      {
        project_id: insertedProjects[0]?.id,
        user_id: userId,
        type: 'image',
        file_path: '/assets/images/ocean_mystery.png',
        original_name: 'ocean_mystery.png',
        file_size: 2457600,
        mime_type: 'image/png',
        meta { width: 1920, height: 1080, format: 'png' },
      },
      {
        project_id: insertedProjects[0]?.id,
        user_id: userId,
        type: 'audio',
        file_path: '/assets/audio/narration_part1.mp3',
        original_name: 'narration_part1.mp3',
        file_size: 8703000,
        mime_type: 'audio/mpeg',
        meta { duration: 180, sampleRate: 44100, channels: 1 },
      },
      {
        project_id: insertedProjects[0]?.id,
        user_id: userId,
        type: 'lottie',
        file_path: '/assets/lottie/particles.json',
        original_name: 'particles.json',
        file_size: 45000,
        mime_type: 'application/json',
        lottie_hash: 'abc123def456',
        meta { frameRate: 30, totalFrames: 60, width: 1920, height: 1080, layers: 5 },
      },
    ];

    const { error: assetsError } = await supabase
      .from('assets')
      .insert(assets);

    if (assetsError) throw assetsError;
    console.log(`✅ ${assets.length} assets criados\n`);

    // ─── Resumo ────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Seed concluído com sucesso!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Resumo:`);
    console.log(`   • Usuários: 1`);
    console.log(`   • Projetos: ${insertedProjects.length}`);
    console.log(`   • Segmentos: ${segments.length}`);
    console.log(`   • Render logs: ${renderLogs.length}`);
    console.log(`   • Assets: ${assets.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error.message);
    process.exit(1);
  }
}

// Executar seed
seed();
