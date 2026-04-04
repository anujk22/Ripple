import { useState, useEffect, useCallback } from 'react'
import type { Lang } from '../../types'
import { getCityById, CITIES } from '../../data/cities'
import {
  getReports,
  getByStatus,
  subscribe,
  startSimulation,
  stopSimulation,
  computeReadiness,
} from '../../data/reportStore'
import { useLang, isRTL, LANG_LABELS } from '../../i18n'
import ReportQueue from './ReportQueue'
import LiveMap from './LiveMap'
import OperationalStatus from './OperationalStatus'

interface DashboardProps {
  cityId: string
  onBack: () => void
  lang: Lang
  onLangChange: (l: Lang) => void
}

export default function Dashboard({ cityId, onBack, lang, onLangChange }: DashboardProps) {
  const city = getCityById(cityId)
  const t = useLang(lang)
  const rtl = isRTL(lang)

  const [reports, setReports] = useState(() => getReports(cityId))
  const [newestId, setNewestId] = useState<string | null>(null)
  const [fieldMode, setFieldMode] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [readiness, setReadiness] = useState(() => computeReadiness(cityId))

  // Subscribe to store
  useEffect(() => {
    return subscribe((newReport) => {
      setReports([...getReports(cityId)])
      setReadiness(computeReadiness(cityId))
      setLastUpdated(new Date())
      if (newReport?.cityId === cityId) {
        setNewestId(newReport.id)
        setTimeout(() => setNewestId(null), 3000)
      }
    })
  }, [cityId])

  // Start live simulation for this city
  useEffect(() => {
    startSimulation(cityId)
    return () => stopSimulation()
  }, [cityId])

  const active   = reports.filter((r) => r.status === 'active')
  const assigned = reports.filter((r) => r.status === 'assigned')
  const resolved = reports.filter((r) => r.status === 'resolved')

  const alertLevel = active.some((r) => r.urgency === 'emergency')
    ? 'critical'
    : active.length > 5 ? 'warning' : 'stable'

  const alertColor = alertLevel === 'critical' ? '#e05252'
    : alertLevel === 'warning' ? '#e6a817'
    : '#3d8b85'

  const alertLabel = alertLevel === 'critical' ? 'CRITICAL'
    : alertLevel === 'warning' ? 'WARNING'
    : 'STABLE'

  const updatedStr = `${lastUpdated.getHours()}:${String(lastUpdated.getMinutes()).padStart(2, '0')}`

  return (
    <div
      className="ripple-dashboard"
      dir={rtl ? 'rtl' : 'ltr'}
      style={{ minHeight: '100vh', position: 'relative', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Gradient background (bleed from landing) */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(135deg, #e8f0e4 0%, #f5f0eb 40%, #dff0ed 80%, #f0ebe8 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ── HEADER ────────────────────────────────────────────────── */}
        <header className="glass-card" style={{
          margin: '12px 12px 0 12px',
          borderRadius: 16,
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          {/* Left: back + city */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#1a2734',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t('dash.back')}
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2734', display: 'flex', alignItems: 'center', gap: 8 }}>
                {city.flag} {city.fullName}
                <span style={{
                  fontSize: 11, fontWeight: 600, color: '#3d8b85',
                  background: 'rgba(61,139,133,0.1)', border: '1px solid rgba(61,139,133,0.3)',
                  borderRadius: 20, padding: '2px 10px',
                }}>
                  {city.crisisType}
                </span>
              </div>
            </div>
          </div>

          {/* Right: alert + lang + updated + field mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Alert badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: `${alertColor}18`,
              border: `1px solid ${alertColor}50`,
              borderRadius: 20, padding: '4px 12px',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: alertColor,
                boxShadow: alertLevel === 'critical' ? `0 0 8px ${alertColor}` : undefined,
                animation: alertLevel === 'critical' ? 'criticalPulse 1.5s ease-in-out infinite' : undefined,
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: alertColor }}>{alertLabel}</span>
            </div>

            {/* Language selector */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                <button key={l} onClick={() => onLangChange(l)} style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '3px 8px', borderRadius: 6,
                  background: lang === l ? '#3d8b85' : 'rgba(255,255,255,0.4)',
                  border: lang === l ? '1px solid #3d8b85' : '1px solid rgba(0,0,0,0.1)',
                  color: lang === l ? '#fff' : '#1a2734',
                  cursor: 'pointer',
                }}>
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>

            {/* Field mode toggle */}
            <button
              onClick={() => setFieldMode((v) => !v)}
              style={{
                fontSize: 11, fontWeight: 600,
                padding: '4px 12px', borderRadius: 20,
                background: fieldMode ? '#1a2734' : 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(0,0,0,0.15)',
                color: fieldMode ? '#fff' : '#1a2734',
                cursor: 'pointer',
              }}
              title="Field Mode — optimized for low bandwidth"
            >
              📋 {t('dash.field_mode')}
            </button>

            <span style={{ fontSize: 11, color: '#6b7280' }}>
              {t('dash.last_updated')} {updatedStr}
            </span>
          </div>
        </header>

        {/* Field mode banner */}
        {fieldMode && (
          <div style={{
            margin: '6px 12px 0 12px',
            background: '#1a2734',
            color: '#fff',
            borderRadius: 8,
            padding: '6px 16px',
            fontSize: 12,
            fontWeight: 500,
          }}>
            📋 Field Mode — optimized for low bandwidth · animations disabled
          </div>
        )}

        {/* ── BODY ──────────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: fieldMode ? '1fr' : '28% 1fr 28%',
          gap: 12,
          padding: '12px',
          alignItems: 'start',
        }}>
          {/* Left */}
          <ReportQueue
            cityId={cityId}
            active={active}
            assigned={assigned}
            resolved={resolved}
            newestId={newestId}
            t={t} rtl={rtl} fieldMode={fieldMode}
          />

          {/* Center map — hidden in field mode */}
          {!fieldMode && (
            <LiveMap city={city} reports={active} newestId={newestId} t={t} />
          )}

          {/* Right */}
          <OperationalStatus
            city={city}
            readiness={readiness}
            active={active}
            t={t} rtl={rtl}
          />
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <footer style={{
          margin: '0 12px 12px 12px',
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 11,
          color: '#6b7280',
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span>{t('footer.osm')} <span style={{ color: '#16a34a' }}>{t('footer.live')}</span></span>
            <span>{t('footer.reports')} <span style={{ color: '#e6a817' }}>{t('footer.synth')}</span></span>
            <span>{t('footer.sync')} {updatedStr}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontStyle: 'italic' }}>{t('footer.disclaimer')}</span>
            <a href="#report" target="_blank"
              style={{ color: '#3d8b85', fontWeight: 600, textDecoration: 'none' }}>
              {t('footer.report_link')}
            </a>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes criticalPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
