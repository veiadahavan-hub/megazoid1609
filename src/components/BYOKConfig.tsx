import { useState } from 'react'

interface ApiKey {
  provider: string
  name: string
  key: string
  status: 'valid' | 'invalid' | 'pending' | 'empty'
  lastValidated?: string
}

const PROVIDERS = [
  {
    id: 'stability',
    name: 'Stability AI (SDXL)',
    description: 'Geração de imagens com Stable Diffusion XL',
    keyPrefix: 'sk-',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.stability.ai/account/keys',
    icon: '🎨',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs (TTS)',
    description: 'Narração com voz realista em português',
    keyPrefix: null,
    placeholder: 'Sua API key do ElevenLabs',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    icon: '🎵',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'openai',
    name: 'OpenAI (Whisper)',
    description: 'Transcrição de áudio para timestamps',
    keyPrefix: 'sk-',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    icon: '🎤',
    color: 'from-sky-500 to-blue-500',
  },
]

export default function BYOKConfig() {
  const [keys, setKeys] = useState<ApiKey[]>(
    PROVIDERS.map(p => ({
      provider: p.id,
      name: p.name,
      key: '',
      status: 'empty' as const,
    }))
  )
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const updateKey = (providerId: string, value: string) => {
    setKeys(prev => prev.map(k =>
      k.provider === providerId
        ? { ...k, key: value, status: value ? 'pending' : 'empty' }
        : k
    ))
  }

  const validateKey = async (providerId: string) => {
    const key = keys.find(k => k.provider === providerId)
    if (!key || !key.key) return

    setKeys(prev => prev.map(k =>
      k.provider === providerId ? { ...k, status: 'pending' } : k
    ))

    // Simula validação (em produção, chamaria a API do backend)
    setTimeout(() => {
      const isValid = key.key.length > 10
      setKeys(prev => prev.map(k =>
        k.provider === providerId
          ? { ...k, status: isValid ? 'valid' : 'invalid', lastValidated: new Date().toLocaleTimeString() }
          : k
      ))
    }, 1500)
  }

  const saveAll = async () => {
    setSaving(true)
    // Simula save
    setTimeout(() => {
      setSaving(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }, 1000)
  }

  const validKeys = keys.filter(k => k.status === 'valid').length
  const isBYOK = validKeys > 0

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuração BYOK</h1>
          <p className="text-sm text-slate-400 mt-1">
            Bring Your Own Key — Use suas próprias API keys para controle total de custos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            isBYOK
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}>
            {isBYOK ? '✓ BYOK Ativo' : 'Modo Coletivo'}
          </div>
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-medium transition-colors"
          >
            {saving ? 'Salvando...' : '💾 Salvar Keys'}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="glass-panel rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <p className="text-sm text-emerald-400">API keys salvas com sucesso! Modo BYOK ativado.</p>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="glass-panel rounded-xl p-5 border border-indigo-500/10">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="text-sm font-semibold text-white">Como funciona o BYOK?</h3>
            <ul className="text-xs text-slate-400 mt-2 space-y-1">
              <li>• Você traz suas próprias API keys dos serviços (Stability, ElevenLabs, OpenAI)</li>
              <li>• A plataforma usa <strong className="text-white">suas</strong> keys — você paga diretamente aos providers</li>
              <li>• Renders ilimitados — sem limite mensal da plataforma</li>
              <li>• Você pode usar contas enterprise/premium com mais créditos</li>
              <li>• Keys são criptografadas e nunca expostas no frontend</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Keys Form */}
      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const keyData = keys.find(k => k.provider === provider.id)
          
          return (
            <div key={provider.id} className="glass-panel rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xl">{provider.icon}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-white">{provider.name}</h3>
                    {keyData?.status === 'valid' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✓ Válida
                      </span>
                    )}
                    {keyData?.status === 'invalid' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        ✗ Inválida
                      </span>
                    )}
                    {keyData?.status === 'pending' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ⏳ Validando...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{provider.description}</p>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={keyData?.key || ''}
                      onChange={(e) => updateKey(provider.id, e.target.value)}
                      placeholder={provider.placeholder}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e293b] text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                    <button
                      onClick={() => validateKey(provider.id)}
                      disabled={!keyData?.key || keyData?.status === 'pending'}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
                    >
                      Validar
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      🔗 Obter API Key →
                    </a>
                    {keyData?.lastValidated && (
                      <span className="text-[9px] text-slate-500">
                        Validado: {keyData.lastValidated}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Usage Stats */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">📊 Uso de API (BYOK)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { provider: 'Stability AI', used: '127', limit: '∞', unit: 'créditos', color: 'from-purple-500 to-pink-500' },
            { provider: 'ElevenLabs', used: '45,230', limit: '100,000', unit: 'caracteres', color: 'from-emerald-500 to-teal-500' },
            { provider: 'OpenAI', used: '34', limit: '∞', unit: 'minutes', color: 'from-sky-500 to-blue-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0d0d14] rounded-lg p-3 border border-[#1e293b]">
              <p className="text-[10px] text-slate-400 mb-1">{stat.provider}</p>
              <p className="text-lg font-bold text-white">
                {stat.used} <span className="text-xs text-slate-500">/ {stat.limit}</span>
              </p>
              <p className="text-[9px] text-slate-500">{stat.unit} usados este mês</p>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                  style={{ width: stat.limit === '∞' ? '30%' : `${(parseInt(stat.used.replace(',', '')) / parseInt(stat.limit.replace(',', ''))) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Note */}
      <div className="glass-panel rounded-xl p-4 border border-amber-500/10 bg-amber-500/5">
        <div className="flex items-start gap-2">
          <span className="text-lg">🔒</span>
          <div>
            <p className="text-xs text-amber-400 font-medium">Segurança das Keys</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Suas API keys são criptografadas com AES-256 antes de serem salvas no banco de dados.
              Elas nunca são expostas no frontend — apenas o backend tem acesso para fazer as chamadas de API.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
