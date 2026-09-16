import { useState } from 'react'

interface UserSettings {
  username: string
  email: string
  apiTier: 'free' | 'pro' | 'byok_unlimited'
  notifications: {
    email: boolean
    renderComplete: boolean
    renderFailed: boolean
    limitWarning: boolean
  }
  defaultTemplate: string
  defaultUpscaleMethod: 'lanczos' | 'realesrgan'
}

const MOCK_SETTINGS: UserSettings = {
  username: 'demo_user',
  email: 'demo@aistudiopro.com',
  apiTier: 'free',
  notifications: {
    email: true,
    renderComplete: true,
    renderFailed: true,
    limitWarning: true
  },
  defaultTemplate: 'canal_dark',
  defaultUpscaleMethod: 'lanczos'
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(MOCK_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateNotification = (key: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }))
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie suas preferências e configurações da conta
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-medium transition-colors"
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : '💾 Salvar'}
        </button>
      </div>

      {/* Profile Section */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">👤 Perfil</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Username</label>
            <input
              type="text"
              value={settings.username}
              onChange={(e) => updateSetting('username', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e293b] text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting('email', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e293b] text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Plano</label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                settings.apiTier === 'free'
                  ? 'bg-slate-500/10 text-slate-400'
                  : settings.apiTier === 'pro'
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {settings.apiTier === 'free' ? 'Free' : settings.apiTier === 'pro' ? 'Pro' : 'BYOK Unlimited'}
              </span>
              <button className="text-xs text-indigo-400 hover:text-indigo-300">
                Fazer upgrade →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">⚙️ Preferências</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Template Padrão</label>
            <select
              value={settings.defaultTemplate}
              onChange={(e) => updateSetting('defaultTemplate', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e293b] text-white text-sm focus:outline-none focus:border-indigo-500/50"
            >
              <option value="canal_dark">🌑 Canal Dark</option>
              <option value="edtech">📚 EdTech</option>
              <option value="custom">🎯 Custom</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Método de Upscale Padrão</label>
            <select
              value={settings.defaultUpscaleMethod}
              onChange={(e) => updateSetting('defaultUpscaleMethod', e.target.value as 'lanczos' | 'realesrgan')}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e293b] text-white text-sm focus:outline-none focus:border-indigo-500/50"
            >
              <option value="lanczos">Lanczos (Rápido, recomendado)</option>
              <option value="realesrgan">Real-ESRGAN (Máxima qualidade)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">🔔 Notificações</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d14] border border-[#1e293b] cursor-pointer hover:border-slate-600 transition-colors">
            <div>
              <p className="text-sm text-white">Notificações por Email</p>
              <p className="text-xs text-slate-400">Receber atualizações por email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.email}
              onChange={(e) => updateNotification('email', e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d14] border border-[#1e293b] cursor-pointer hover:border-slate-600 transition-colors">
            <div>
              <p className="text-sm text-white">Render Completo</p>
              <p className="text-xs text-slate-400">Quando um vídeo terminar de renderizar</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.renderComplete}
              onChange={(e) => updateNotification('renderComplete', e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d14] border border-[#1e293b] cursor-pointer hover:border-slate-600 transition-colors">
            <div>
              <p className="text-sm text-white">Render Falhou</p>
              <p className="text-xs text-slate-400">Quando um vídeo falhar na renderização</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.renderFailed}
              onChange={(e) => updateNotification('renderFailed', e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d14] border border-[#1e293b] cursor-pointer hover:border-slate-600 transition-colors">
            <div>
              <p className="text-sm text-white">Aviso de Limite</p>
              <p className="text-xs text-slate-400">Quando atingir 80% do limite mensal</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.limitWarning}
              onChange={(e) => updateNotification('limitWarning', e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-500"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel rounded-xl p-6 border border-red-500/20">
        <h2 className="text-lg font-semibold text-white mb-4">⚠️ Zona de Perigo</h2>
        <div className="space-y-3">
          <button className="w-full px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors border border-red-500/20">
            Exportar Todos os Dados
          </button>
          <button className="w-full px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors border border-red-500/20">
            Deletar Conta
          </button>
        </div>
      </div>
    </div>
  )
}
