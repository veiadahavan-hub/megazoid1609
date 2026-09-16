import { useState } from 'react'

interface Template {
  id: string
  name: string
  description: string
  icon: string
  category: string
  features?: string[]
}

const TEMPLATES: Template[] = [
  {
    id: 'canal_dark',
    name: 'Canal Dark — Mistério & Terror',
    description: 'Template otimizado para canais de mistério, terror e conspiração. Transições cinematográficas, áudio ambiente e overlays de partículas.',
    icon: '🌑',
    category: 'dark',
    features: [
      'Transições: Parallax, Mask Reveal, Ink Bleed, Glitch',
      'Áudio: Room tone + Smart Cut (250ms padding)',
      'Overlays: Partículas, Vinheta, Film Grain',
      'Duração ideal: 8-15 minutos',
      'Estilo: Dark, misterioso, suspense'
    ]
  },
  {
    id: 'edtech',
    name: 'EdTech — Educacional & Tutoriais',
    description: 'Template para conteúdo educacional e tutoriais. Transições suaves, áudio limpo e overlays de código.',
    icon: '📚',
    category: 'edtech',
    features: [
      'Transições: Dissolve, Parallax (suave)',
      'Áudio: White noise + Smart Cut (400ms padding)',
      'Overlays: Code highlights, Setas, Progress bar',
      'Duração ideal: 5-20 minutos',
      'Estilo: Clean, profissional, educacional'
    ]
  },
  {
    id: 'custom',
    name: 'Custom — Personalizado',
    description: 'Template vazio para configuração totalmente personalizada. Você define todas as configurações.',
    icon: '🎯',
    category: 'custom',
    features: [
      'Transições: Você escolhe',
      'Áudio: Configurável',
      'Overlays: Opcionais',
      'Duração: Livre',
      'Estilo: Totalmente customizável'
    ]
  }
]

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void
  selectedId?: string
}

export default function TemplateSelector({ onSelect, selectedId }: TemplateSelectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Escolha um Template</h2>
        <p className="text-sm text-slate-400">
          Selecione um template pré-configurado ou personalize do zero
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => {
          const isSelected = selectedId === template.id
          const isExpanded = expandedId === template.id

          return (
            <div
              key={template.id}
              className={`glass-panel rounded-xl overflow-hidden transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-indigo-500 glow-border'
                  : 'hover:ring-1 hover:ring-slate-600'
              }`}
              onClick={() => onSelect(template.id)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{template.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{template.name}</h3>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-3">{template.description}</p>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedId(isExpanded ? null : template.id)
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {isExpanded ? '▲ Ocultar detalhes' : '▼ Ver detalhes'}
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#1e293b] animate-fade-up">
                    <ul className="space-y-1.5">
                      {template.features?.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedId && (
        <div className="glass-panel rounded-xl p-4 bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-emerald-400">
              Template selecionado: <strong>{TEMPLATES.find(t => t.id === selectedId)?.name}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
