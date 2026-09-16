import { ViewType } from '../App'

interface SidebarProps {
  currentView: ViewType
  onNavigate: (view: ViewType) => void
  collapsed: boolean
  onToggle: () => void
}

const navItems: { id: ViewType; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'pipeline', label: 'Pipeline', icon: 'flow' },
  { id: 'transitions', label: 'Transições', icon: 'film' },
  { id: 'audio', label: 'Humanizer', icon: 'waveform' },
  { id: 'editor', label: 'Editor Texto', icon: 'edit' },
  { id: 'projects', label: 'Projetos', icon: 'folder' },
  { id: 'backend', label: 'Backend', icon: 'server' },
]

function getIcon(icon: string) {
  switch (icon) {
    case 'grid': return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
    case 'flow': return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
    case 'film': return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    )
    case 'waveform': return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    )
    case 'edit': return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
    case 'folder': return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    )
    case 'server': return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    )
    default: return null
  }
}

export default function Sidebar({ currentView, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex flex-col border-r border-[#1e293b] bg-[#0d0d14]`}>
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-[#1e293b]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        {!collapsed && (
          <div className="animate-slide-in">
            <h1 className="text-sm font-bold text-white tracking-tight">AI Studio Pro</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Video Engineering</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${currentView === item.id
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
          >
            <span className={`flex-shrink-0 ${currentView === item.id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
              {getIcon(item.icon)}
            </span>
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Server Status */}
      <div className="p-3 border-t border-[#1e293b]">
        <div className={`glass-panel rounded-lg p-3 ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot flex-shrink-0"></div>
            {!collapsed && (
              <div className="animate-slide-in">
                <p className="text-xs text-slate-300 font-medium">VPS Oracle</p>
                <p className="text-[10px] text-slate-500">24GB RAM • 200GB+</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">RAM</span>
                <span className="text-emerald-400">42%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '42%' }}></div>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Storage</span>
                <span className="text-amber-400">67%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="p-3 border-t border-[#1e293b] text-slate-500 hover:text-slate-300 transition-colors"
      >
        <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  )
}
