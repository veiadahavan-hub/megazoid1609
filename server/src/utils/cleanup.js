/**
 * ═══════════════════════════════════════════════════════════════════════
 * AI STUDIO PRO — Cleanup Service
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Limpeza automática de arquivos temporários.
 * Roda como cronjob diário (ou pode ser chamado manualmente).
 * 
 * Diretórios monitorados:
 * - /tmp/renders/ — Jobs temporários do renderWorker
 * - /tmp/lottie_cache/ — Cache de Lottie rasterizado
 * - /tmp/audio_pipeline/ — Arquivos intermediários de áudio
 * 
 * Regra: Arquivos com mais de 7 dias são deletados.
 * 
 * @module cleanup
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const CLEANUP_CONFIG = {
  maxAgeDays: 7,
  directories: [
    '/tmp/renders',
    '/tmp/lottie_cache',
    '/tmp/audio_pipeline',
  ],
  // Nunca deletar estes paths (segurança)
  protectedPaths: [
    '/renders/final',  // Output final — NUNCA deletar automaticamente
  ],
};

/**
 * Executa a limpeza completa
 */
function runCleanup(config = {}) {
  const {
    maxAgeDays = CLEANUP_CONFIG.maxAgeDays,
    directories = CLEANUP_CONFIG.directories,
  } = config;

  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  const results = {
    scanned: 0,
    removed: 0,
    freedBytes: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    try {
      const entries = fs.readdirSync(dir);
      
      for (const entry of entries) {
        const entryPath = path.join(dir, entry);
        
        // Verifica se é um path protegido
        if (CLEANUP_CONFIG.protectedPaths.some(p => entryPath.startsWith(p))) {
          continue;
        }

        results.scanned++;
        
        try {
          const stat = fs.statSync(entryPath);
          const age = now - stat.mtimeMs;
          
          if (age > maxAge) {
            const size = stat.isDirectory() ? getDirSize(entryPath) : stat.size;
            
            if (stat.isDirectory()) {
              fs.rmSync(entryPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(entryPath);
            }
            
            results.removed++;
            results.freedBytes += size;
            
            console.log(`[cleanup] Removido: ${entryPath} (${(size / 1024 / 1024).toFixed(1)}MB, ${(age / 86400000).toFixed(0)} dias)`);
          }
        } catch (err) {
          results.errors.push({ path: entryPath, error: err.message });
        }
      }
    } catch (err) {
      results.errors.push({ path: dir, error: err.message });
    }
  }

  results.freedMB = (results.freedBytes / 1024 / 1024).toFixed(2);
  
  console.log(`[cleanup] Concluído: ${results.removed}/${results.scanned} removidos, ${results.freedMB}MB liberados`);
  
  return results;
}

/**
 * Calcula tamanho total de um diretório
 */
function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        size += stat.size;
      } else if (stat.isDirectory()) {
        size += getDirSize(filePath);
      }
    }
  } catch (e) {
    // Ignora erros
  }
  return size;
}

/**
 * Retorna status dos diretórios temporários
 */
function getCleanupStatus() {
  const status = {};
  
  for (const dir of CLEANUP_CONFIG.directories) {
    if (fs.existsSync(dir)) {
      const size = getDirSize(dir);
      const entries = fs.readdirSync(dir).length;
      status[dir] = {
        exists: true,
        entries,
        sizeMB: (size / 1024 / 1024).toFixed(2),
      };
    } else {
      status[dir] = { exists: false, entries: 0, sizeMB: '0' };
    }
  }
  
  return status;
}

// Se executado diretamente (cronjob)
if (require.main === module) {
  console.log('[cleanup] Iniciando limpeza automática...');
  const results = runCleanup();
  console.log('[cleanup] Resultado:', JSON.stringify(results, null, 2));
}

module.exports = {
  runCleanup,
  getCleanupStatus,
  CLEANUP_CONFIG,
};
