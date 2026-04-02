import { useState, useEffect } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import BrandView from './components/BrandView'
import MatrixView from './components/MatrixView'
import ActivityLog from './components/ActivityLog'
import SettingsView from './components/SettingsView'
import AnalyticsView from './components/AnalyticsView'
import LoginScreen from './components/LoginScreen'
import { useCROData } from './hooks/useCROData'
import { useAuth } from './hooks/useAuth'
import { isConfigured } from './lib/supabase'

const PATH_TO_VIEW = {
  '/overview': 'dashboard',
  '/marcas': 'brand',
  '/matriz-progresso': 'matrix',
  '/analytics': 'analytics',
  '/historico': 'log',
  '/config': 'settings',
}
const VIEW_TO_PATH = Object.fromEntries(
  Object.entries(PATH_TO_VIEW).map(([k, v]) => [v, k])
)

function AppInner({ user, signOut }) {
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

  const [view, setView] = useState(() => PATH_TO_VIEW[window.location.pathname] ?? 'dashboard')
  const [selectedBrand, setSelectedBrand] = useState('apice')
  const [selectedPhase, setSelectedPhase] = useState(null)

  useEffect(() => {
    window.history.replaceState({}, '', VIEW_TO_PATH[view] ?? '/overview')
  }, [])

  useEffect(() => {
    function onPopState() {
      setView(PATH_TO_VIEW[window.location.pathname] ?? 'dashboard')
      setSelectedPhase(null)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function navigate(v) {
    window.history.pushState({}, '', VIEW_TO_PATH[v] ?? '/overview')
    setView(v)
    setSelectedPhase(null)
  }

  function handleNavigateBrandPhase(brandId, phaseId) {
    setSelectedBrand(brandId)
    setSelectedPhase(phaseId)
    window.history.pushState({}, '', VIEW_TO_PATH['brand'])
    setView('brand')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <div className="grain-overlay" />
      <Header
        view={view}
        onNavigate={navigate}
        lastUpdated={data.lastUpdated}
        syncState={syncState}
        lastSynced={lastSynced}
        appSettings={data.appSettings}
        user={user}
        onSignOut={signOut}
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

function getStoredAppSettings() {
  try {
    const raw = localStorage.getItem('gobeaute_cro_data')
    return raw ? JSON.parse(raw)?.appSettings ?? null : null
  } catch {
    return null
  }
}

export default function App() {
  const { user, loading: authLoading, error: authError, signInWithGoogle, signOut } = useAuth()

  if (isConfigured && authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="grain-overlay" />
        <div style={{ width: '28px', height: '28px', border: '2.5px solid #E7E2DA', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (isConfigured && !user) {
    return <LoginScreen onLogin={signInWithGoogle} error={authError} appSettings={getStoredAppSettings()} />
  }

  return <AppInner user={user} signOut={signOut} />
}
