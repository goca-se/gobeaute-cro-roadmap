import { useState } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import BrandView from './components/BrandView'
import MatrixView from './components/MatrixView'
import ActivityLog from './components/ActivityLog'
import SettingsView from './components/SettingsView'
import AnalyticsView from './components/AnalyticsView'
import { useCROData } from './hooks/useCROData'

export default function App() {
  const {
    data, activityLog,
    syncState, lastSynced,
    updateTask,
    addCustomTask, updateCustomTask, deleteCustomTask,
    reorderSection, hideTask, showTask, bulkUpdateTasks,
    addPhaseTask, updatePhaseTask, deletePhaseTask, showPhaseTask, reorderPhaseSection,
    updatePhaseTitleOverride, updatePhaseNote,
    updateBrandSetting, updateAppSetting, saveBrandMetrics,
    exportJSON, exportCSV,
  } = useCROData()

  const [view, setView] = useState('dashboard')
  const [selectedBrand, setSelectedBrand] = useState('apice')
  const [selectedPhase, setSelectedPhase] = useState(null)

  function handleNavigateBrandPhase(brandId, phaseId) {
    setSelectedBrand(brandId)
    setSelectedPhase(phaseId)
    setView('brand')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <div className="grain-overlay" />
      <Header
        view={view}
        onNavigate={v => { setView(v); setSelectedPhase(null) }}
        lastUpdated={data.lastUpdated}
        syncState={syncState}
        lastSynced={lastSynced}
        appSettings={data.appSettings}
      />
      <main>
        {view === 'dashboard' && (
          <Dashboard data={data} onNavigateBrandPhase={handleNavigateBrandPhase} />
        )}
        {view === 'brand' && (
          <BrandView
            data={data}
            updateTask={updateTask}
            addCustomTask={addCustomTask}
            updateCustomTask={updateCustomTask}
            deleteCustomTask={deleteCustomTask}
            reorderSection={reorderSection}
            hideTask={hideTask}
            showTask={showTask}
            bulkUpdateTasks={bulkUpdateTasks}
            updateBrandSetting={updateBrandSetting}
            saveBrandMetrics={saveBrandMetrics}
            selectedBrand={selectedBrand}
            selectedPhase={selectedPhase}
            onSelectBrand={brandId => { setSelectedBrand(brandId); setSelectedPhase(null) }}
          />
        )}
        {view === 'matrix' && (
          <MatrixView
            data={data}
            updateTask={updateTask}
            exportCSV={exportCSV}
            addPhaseTask={addPhaseTask}
            updatePhaseTask={updatePhaseTask}
            deletePhaseTask={deletePhaseTask}
            showPhaseTask={showPhaseTask}
            reorderPhaseSection={reorderPhaseSection}
            updatePhaseTitleOverride={updatePhaseTitleOverride}
            updatePhaseNote={updatePhaseNote}
          />
        )}
        {view === 'log' && (
          <ActivityLog activityLog={activityLog} />
        )}
        {view === 'analytics' && (
          <AnalyticsView appSettings={data.appSettings} />
        )}
        {view === 'settings' && (
          <SettingsView
            data={data}
            updateBrandSetting={updateBrandSetting}
            updateAppSetting={updateAppSetting}
          />
        )}
      </main>
    </div>
  )
}
