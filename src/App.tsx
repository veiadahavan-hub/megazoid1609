import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import PipelineView from './components/PipelineView'
import TransitionsEngine from './components/TransitionsEngine'
import AudioHumanizer from './components/AudioHumanizer'
import TextEditor from './components/TextEditor'
import ProjectList from './components/ProjectList'
import BackendStatus from './components/BackendStatus'
import TimelineEditor from './components/TimelineEditor'
import BYOKConfig from './components/BYOKConfig'
import Analytics from './components/Analytics'
import TemplateSelector from './components/TemplateSelector'
import AssetManager from './components/AssetManager'
import Settings from './components/Settings'
import Notifications from './components/Notifications'

export type ViewType = 'dashboard' | 'pipeline' | 'transitions' | 'audio' | 'editor' | 'projects' | 'backend' | 'timeline' | 'byok' | 'analytics' | 'templates' | 'assets' | 'settings' | 'notifications'

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentView} />
      case 'pipeline': return <PipelineView />
      case 'transitions': return <TransitionsEngine />
      case 'audio': return <AudioHumanizer />
      case 'editor': return <TextEditor />
      case 'projects': return <ProjectList />
      case 'backend': return <BackendStatus />
      case 'timeline': return <TimelineEditor />
      case 'byok': return <BYOKConfig />
      case 'analytics': return <Analytics useMockData={true} />
      case 'templates': return <TemplateSelector onSelect={(id) => console.log('Template selecionado:', id)} />
      case 'assets': return <AssetManager projectId="demo-project" />
      case 'settings': return <Settings />
      case 'notifications': return <Notifications />
      default: return <Dashboard onNavigate={setCurrentView} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  )
}

export default App
