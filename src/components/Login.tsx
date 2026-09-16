import { useState } from 'react'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Simulação — em produção, conectaria ao Supabase Auth
    setTimeout(() => {
      setLoading(false)
      if (isSignUp) {
        setSuccess('Conta criada com sucesso! Verifique seu email para confirmar.')
      } else {
        setSuccess('Login realizado com sucesso! Redirecionando...')
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">AI Studio Pro</h1>
          <p className="text-sm text-slate-400 mt-1">Video Engineering Platform</p>
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-xl p-6 glow-border">
          <h2 className="text-lg font-semibold text-white mb-1">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            {isSignUp
              ? 'Comece a criar vídeos com IA em minutos'
              : 'Acesse sua conta para continuar'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nome completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0d0d14] border border-[#1e293b] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3 py-2.5 rounded-lg bg-[#0d0d14] border border-[#1e293b] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0d0d14] border border-[#1e293b] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {error && (
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-400">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                isSignUp ? 'Criar Conta' : 'Entrar'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {isSignUp
                ? 'Já tem conta? Faça login'
                : 'Não tem conta? Crie agora'}
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: '🎬', label: 'Vídeos Longos' },
            { icon: '💰', label: 'R$0.12/vídeo' },
            { icon: '⚡', label: 'FFmpeg Power' },
          ].map((feature, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-[#12121a] border border-[#1e293b]">
              <span className="text-lg">{feature.icon}</span>
              <p className="text-[9px] text-slate-400 mt-1">{feature.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
