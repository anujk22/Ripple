import { useState, useEffect } from 'react'
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

  // The global layout shell
  return (
    <div className="min-h-screen bg-[#f0f4f1] text-[#1a2734] font-sans selection:bg-[#3d8b85]/20 overflow-x-hidden relative flex flex-col items-center justify-center w-full">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-[0] pointer-events-none" style={{ overflow: 'hidden' }}>
        <MeshGradientBg />
        <div className="absolute top-0 left-1/4 w-[80vw] h-[80vh] bg-gradient-to-br from-[#e0f0e3] to-[#d4e4d8] rounded-full mix-blend-multiply filter blur-[120px] opacity-80 animate-blob" />
        <div className="absolute top-1/4 right-1/4 w-[70vw] h-[70vh] bg-gradient-to-br from-[#f2e6d8] to-[#e6dac7] rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-1/4 left-1/3 w-[90vw] h-[90vh] bg-gradient-to-tr from-[#cfe2e5] to-[#c2d6d9] rounded-full mix-blend-multiply filter blur-[140px] opacity-80 animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-[1] w-full min-h-screen">
        {route.view === 'report' ? (
          <ReportForm onBack={() => navigateTo('#')} lang={globalLang} onLangChange={setGlobalLang} />
        ) : route.view === 'dashboard' && route.cityId ? (
          <Dashboard
            cityId={route.cityId}
            onBack={() => navigateTo('#')}
            lang={globalLang}
            onLangChange={setGlobalLang}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="text-center z-10 flex flex-col items-center px-4 -mt-16">
              <img src="/1ripple.png" alt="Ripple Logo" className="h-[4.5rem] md:h-[6rem] w-auto mb-3 object-contain" />
              <p className="text-[#132A13] opacity-90 font-semibold tracking-tight text-[17px] md:text-[20px] mt-4 w-full md:max-w-3xl mx-auto">
                Every humanitarian decision creates ripples. See where yours land.
              </p>
              <p className="text-[#36454F] font-medium text-[15px] mt-3 mb-8 w-full md:max-w-xl mx-auto leading-relaxed px-4">
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
            
            <a
              href="#report"
              className="mt-6 flex items-center gap-2 group transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              style={{
                background: '#e05252',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: '100px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '15px',
                letterSpacing: '0.02em',
              }}
            >
              Need help? Submit a report <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
