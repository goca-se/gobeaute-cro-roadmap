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
    mergedPhases,
    updateTask,
    addCustomTask, updateCustomTask, deleteCustomTask,
    reorderSection, hideTask, showTask, bulkUpdateTasks,
    addPhaseTask, updatePhaseTask, deletePhaseTask, showPhaseTask, reorderPhaseSection, movePhaseTask,
    updatePhaseTitleOverride, updatePhaseNote,
    updatePhaseMeta, updateSectionMeta, addPhase, deletePhase, addCustomSection, deleteCustomSection, reorderPhases, reorderSections,
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
          <Dashboard data={data} mergedPhases={mergedPhases} onNavigateBrandPhase={handleNavigateBrandPhase} />
        )}
        {view === 'brand' && (
          <BrandView
            data={data}
            mergedPhases={mergedPhases}
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
            mergedPhases={mergedPhases}
            updateTask={updateTask}
            exportCSV={exportCSV}
            addPhaseTask={addPhaseTask}
            updatePhaseTask={updatePhaseTask}
            deletePhaseTask={deletePhaseTask}
            showPhaseTask={showPhaseTask}
            reorderPhaseSection={reorderPhaseSection}
            movePhaseTask={movePhaseTask}
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
            mergedPhases={mergedPhases}
            updateBrandSetting={updateBrandSetting}
            updateAppSetting={updateAppSetting}
            updatePhaseMeta={updatePhaseMeta}
            updateSectionMeta={updateSectionMeta}
            addPhase={addPhase}
            deletePhase={deletePhase}
            addCustomSection={addCustomSection}
            deleteCustomSection={deleteCustomSection}
            reorderPhases={reorderPhases}
            reorderSections={reorderSections}
          />
        )}
      </main>
    </div>
  )
}
