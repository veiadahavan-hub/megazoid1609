import { useState } from 'react'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  projectId?: string
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Render Concluído',
    message: 'Canal Dark #47 — Mistérios do Oceano foi renderizado com sucesso',
    timestamp: '2026-01-15 14:30',
    read: false,
    projectId: 'proj_8f2a'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Limite Mensal Próximo',
    message: 'Você usou 80% do seu limite mensal de renders (8/10)',
    timestamp: '2026-01-15 12:00',
    read: false
  },
  {
    id: '3',
    type: 'error',
    title: 'Render Falhou',
    message: 'Canal Dark #45 — O Experimento Filadélia falhou: FFmpeg error',
    timestamp: '2026-01-14 22:15',
    read: true,
    projectId: 'proj_7e3d'
  },
  {
    id: '4',
    type: 'info',
    title: 'Novo Template Disponível',
    message: 'Template "EdTech — Tutoriais de Programação" agora está disponível',
    timestamp: '2026-01-14 10:00',
    read: true
  },
  {
    id: '5',
    type: 'success',
    title: 'Upload Concluído',
    message: '3 assets foram enviados com sucesso para o projeto',
    timestamp: '2026-01-13 16:45',
    read: true
  }
]

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'read') return n.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📌'
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-emerald-500/20 bg-emerald-500/5'
      case 'error': return 'border-red-500/20 bg-red-500/5'
      case 'warning': return 'border-amber-500/20 bg-amber-500/5'
      case 'info': return 'border-blue-500/20 bg-blue-500/5'
      default: return 'border-[#1e293b]'
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificações</h1>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            ✓ Marcar todas como lidas
          </button>
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
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Não lidas ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'read'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Lidas ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`glass-panel rounded-xl p-4 border transition-all ${
                notification.read ? 'opacity-60' : ''
              } ${getColor(notification.type)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{getIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white">
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-2 w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                      <p className="text-[10px] text-slate-500 mt-2">{notification.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Marcar como lida"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                        title="Deletar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {notification.projectId && (
                    <button className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      Ver projeto →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-xl p-12 text-center">
          <span className="text-4xl mb-4 block">📭</span>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma notificação</h3>
          <p className="text-sm text-slate-400">
            {filter === 'unread' ? 'Você não tem notificações não lidas' : 'Você não tem notificações'}
          </p>
        </div>
      )}
    </div>
  )
}
