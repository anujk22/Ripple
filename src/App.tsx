import { useState, useEffect, useMemo } from 'react'
import CobeGlobe from './components/ui/CobeGlobe'
import MeshGradientBg from './components/ui/MeshGradientBg'
import Dashboard from './components/dashboard/Dashboard'
import ReportForm from './components/report/ReportForm'
import { initStore, getCityStatuses, subscribe } from './data/reportStore'
import type { CityStatus, Lang } from './types'

// Init store once
initStore()

type View = 'globe' | 'dashboard' | 'report'

function parseHash(hash: string): { view: View; cityId?: string } {
  if (hash === '#report') return { view: 'report' }
  if (hash.startsWith('#dashboard-')) return { view: 'dashboard', cityId: hash.replace('#dashboard-', '') }
  return { view: 'globe' }
}

export default function App() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  const [cityStatuses, setCityStatuses] = useState<Record<string, CityStatus>>(getCityStatuses)
  const [globalLang, setGlobalLang] = useState<Lang>('en')

  // Listen to hash changes
  useEffect(() => {
    function onHash() { setRoute(parseHash(window.location.hash)) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Keep city statuses fresh
  useEffect(() => {
    return subscribe(() => setCityStatuses(getCityStatuses()))
  }, [])

  function navigateTo(hash: string) {
    window.location.hash = hash
  }

  // Globe view
  if (route.view === 'globe') {
    return (
      <>
        <MeshGradientBg />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center mb-0 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
            <img src="/1ripple.png" alt="1Ripple Logo" className="h-[4.5rem] md:h-[6rem] w-auto mb-2 object-contain" />
            <p className="text-[#132A13] opacity-90 font-semibold tracking-tight text-lg md:text-2xl mt-4 w-full md:max-w-3xl mx-auto">
              Every humanitarian decision creates ripples. See where yours land.
            </p>
            <p className="text-[#36454F] font-medium text-[15px] mt-3 w-full md:max-w-xl mx-auto leading-relaxed px-4">
              Click a city to open its triage dashboard.
            </p>
          </div>
          <div className="animate-in fade-in zoom-in-95 duration-1000 delay-300 w-full max-w-lg -mt-4">
            <CobeGlobe
              onRegionClick={(cityId) => navigateTo(`#dashboard-${cityId}`)}
              cityStatuses={cityStatuses}
              className="mx-auto"
            />
          </div>
          {/* Resident form link */}
          <a
            href="#report"
            className="mt-4 text-[13px] text-[#36454F]/70 hover:text-[#36454F] transition-colors underline underline-offset-2"
          >
            Need help? Submit a report →
          </a>
        </div>
      </>
    )
  }

  // Report form
  if (route.view === 'report') {
    return <ReportForm onBack={() => navigateTo('#')} lang={globalLang} onLangChange={setGlobalLang} />
  }

  // Dashboard
  return (
    <Dashboard
      cityId={route.cityId || 'gaza'}
      onBack={() => navigateTo('#')}
      lang={globalLang}
      onLangChange={setGlobalLang}
    />
  )
}
