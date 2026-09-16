import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import PipelineView from './components/PipelineView'
import TransitionsEngine from './components/TransitionsEngine'
import AudioHumanizer from './components/AudioHumanizer'
import TextEditor from './components/TextEditor'
import ProjectList from './components/ProjectList'
import BackendStatus from './components/BackendStatus'

export type ViewType = 'dashboard' | 'pipeline' | 'transitions' | 'audio' | 'editor' | 'projects' | 'backend'

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
