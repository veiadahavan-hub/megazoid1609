import { useState } from 'react'

interface Asset {
  id: string
  name: string
  type: 'image' | 'audio' | 'lottie'
  size: string
  uploadedAt: string
  thumbnail?: string
  status: 'ready' | 'processing' | 'error'
}

const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'intro_scene.png',
    type: 'image',
    size: '2.4 MB',
    uploadedAt: '2026-01-15 14:23',
    status: 'ready'
  },
  {
    id: '2',
    name: 'narration_part1.mp3',
    type: 'audio',
    size: '8.7 MB',
    uploadedAt: '2026-01-15 14:25',
    status: 'ready'
  },
  {
    id: '3',
    name: 'particles_overlay.json',
    type: 'lottie',
    size: '45 KB',
    uploadedAt: '2026-01-15 14:27',
    status: 'ready'
  },
  {
    id: '4',
    name: 'transition_mask.png',
    type: 'image',
    size: '1.2 MB',
    uploadedAt: '2026-01-15 14:30',
    status: 'processing'
  }
]

interface AssetManagerProps {
  projectId: string
  onAssetSelect?: (asset: Asset) => void
}

export default function AssetManager({ projectId, onAssetSelect }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS)
  const [filter, setFilter] = useState<'all' | 'image' | 'audio' | 'lottie'>('all')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const filteredAssets = filter === 'all' 
    ? assets 
    : assets.filter(a => a.type === filter)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleUpload(files)
  }

  const handleUpload = (files: File[]) => {
    setUploadProgress(0)
    
    // Simular upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval)
          return null
        }
        return prev + 10
      })
    }, 200)

    // Simular adição de assets após "upload"
    setTimeout(() => {
      const newAssets: Asset[] = files.map((file, i) => ({
        id: `new-${Date.now()}-${i}`,
        name: file.name,
        type: getFileType(file.type),
        size: formatFileSize(file.size),
        uploadedAt: new Date().toLocaleString('pt-BR'),
        status: 'ready'
      }))
      
      setAssets(prev => [...prev, ...newAssets])
      setUploadProgress(null)
    }, 2000)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(Array.from(e.target.files))
    }
  }

  const handleDelete = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId))
  }

  const getFileType = (mimeType: string): 'image' | 'audio' | 'lottie' => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType === 'application/json') return 'lottie'
    return 'image'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️'
      case 'audio': return '🎵'
      case 'lottie': return '🎨'
      default: return '📄'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Assets do Projeto</h2>
          <p className="text-sm text-slate-400">
            Gerencie imagens, áudios e animações Lottie
          </p>
        </div>
        <label className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*,audio/*,.json"
            onChange={handleFileInput}
            className="hidden"
          />
          + Upload
        </label>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-[#1e293b] hover:border-slate-600'
        }`}
      >
        {uploadProgress !== null ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-sm text-white">Enviando arquivos...</p>
            <div className="w-full max-w-xs mx-auto h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-slate-300">
              Arraste arquivos aqui ou <span className="text-indigo-400">clique para selecionar</span>
            </p>
            <p className="text-xs text-slate-500">
              PNG, JPG, MP3, WAV, JSON (Lottie) — Máx 50MB
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Todos ({assets.length})
        </button>
        <button
          onClick={() => setFilter('image')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'image'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🖼️ Imagens ({assets.filter(a => a.type === 'image').length})
        </button>
        <button
          onClick={() => setFilter('audio')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'audio'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🎵 Áudios ({assets.filter(a => a.type === 'audio').length})
        </button>
        <button
          onClick={() => setFilter('lottie')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'lottie'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🎨 Lottie ({assets.filter(a => a.type === 'lottie').length})
        </button>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onAssetSelect?.(asset)}
              className="glass-panel rounded-lg p-3 hover:ring-1 hover:ring-indigo-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{getAssetIcon(asset.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
                    {asset.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500">{asset.size}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">{asset.uploadedAt}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      asset.status === 'ready'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : asset.status === 'processing'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {asset.status === 'ready' ? '✓ Pronto' : asset.status === 'processing' ? '⏳ Processando' : '✗ Erro'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(asset.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-xl p-8 text-center">
          <p className="text-sm text-slate-400">Nenhum asset encontrado</p>
          <p className="text-xs text-slate-500 mt-1">Faça upload de imagens, áudios ou arquivos Lottie</p>
        </div>
      )}
    </div>
  )
}
