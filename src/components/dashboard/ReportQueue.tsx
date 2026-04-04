import { useState } from 'react'
import type { Report, NeedType, AssignTeam } from '../../types'
import { assignReport, resolveReport, formatTimeAgo } from '../../data/reportStore'

const URGENCY_COLORS = {
  emergency: { border: '#e05252', bg: 'rgba(224,82,82,0.06)', text: '#e05252' },
  today:     { border: '#e6a817', bg: 'rgba(230,168,23,0.06)', text: '#e6a817' },
  safe:      { border: '#3d8b85', bg: 'rgba(61,139,133,0.06)', text: '#3d8b85' },
}

const NEED_ICONS: Record<NeedType, string> = {
  Medical: '🏥', Water: '🚰', Shelter: '⛺', Food: '🍞', Evacuation: '🚗', Safety: '🆘',
}

const ASSIGN_TEAMS: AssignTeam[] = ['Field Team A', 'Field Team B', 'NGO Partner', 'Hospital', 'UNRWA / WFP']

type Tab = 'active' | 'assigned' | 'resolved'

interface Props {
  cityId: string
  active: Report[]
  assigned: Report[]
  resolved: Report[]
  newestId: string | null
  t: (k: string) => string
  rtl: boolean
  fieldMode: boolean
}

export default function ReportQueue({ cityId, active, assigned, resolved, newestId, t, rtl }: Props) {
  const [tab, setTab] = useState<Tab>('active')
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<AssignTeam>('Field Team A')

  const lists: Record<Tab, Report[]> = {
    active:   [...active].sort((a, b) => {
      const urgencyOrder = { emergency: 0, today: 1, safe: 2 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || b.timestamp - a.timestamp
    }),
    assigned,
    resolved,
  }

  const current = lists[tab]

  // Cluster detection: 3+ same type in same neighborhood
  const clusters: Map<string, Report[]> = new Map()
  if (tab === 'active') {
    for (const r of active) {
      const key = `${r.type}-${r.neighborhood}`
      if (!clusters.has(key)) clusters.set(key, [])
      clusters.get(key)!.push(r)
    }
  }
  const clusterKeys = new Set(
    [...clusters.entries()]
      .filter(([, v]) => v.length >= 3)
      .map(([k]) => k)
  )

  function handleAssign(reportId: string) {
    assignReport(reportId, cityId, selectedTeam)
    setAssigningId(null)
  }

  function handleResolve(reportId: string) {
    resolveReport(reportId, cityId)
  }

  const tabs: Tab[] = ['active', 'assigned', 'resolved']
  const tabLabels: Record<Tab, string> = {
    active: t('dash.active'),
    assigned: t('dash.assigned'),
    resolved: t('dash.resolved'),
  }
  const tabCounts: Record<Tab, number> = {
    active: active.length,
    assigned: assigned.length,
    resolved: resolved.length,
  }

  return (
    <div className="glass-card" style={{ borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} dir={rtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div style={{ padding: '14px 16px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#6b7280', textTransform: 'uppercase' }}>
            {t('dash.incoming')}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#fff',
            background: active.some(r => r.urgency === 'emergency') ? '#e05252' : '#3d8b85',
            borderRadius: 20, padding: '2px 10px',
          }}>
            {active.length}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 0 }}>
          {tabs.map((tb) => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              fontSize: 12, fontWeight: 600,
              padding: '6px 12px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === tb ? '#3d8b85' : '#6b7280',
              borderBottom: tab === tb ? '2px solid #3d8b85' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {tabLabels[tb]}
              <span style={{
                marginLeft: 5,
                fontSize: 10, fontWeight: 700,
                background: tab === tb ? '#3d8b85' : '#e5e7eb',
                color: tab === tb ? '#fff' : '#6b7280',
                borderRadius: 10, padding: '1px 6px',
              }}>
                {tabCounts[tb]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Report list */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', padding: '8px 10px' }}>
        {/* Clusters (active tab only) */}
        {tab === 'active' && [...clusters.entries()]
          .filter(([, v]) => v.length >= 3)
          .map(([key, reps]) => {
            const r = reps[0]
            return (
              <div key={key} style={{
                background: 'rgba(61,139,133,0.08)',
                border: '1px solid rgba(61,139,133,0.2)',
                borderRadius: 12, padding: '10px 14px', marginBottom: 6,
                fontSize: 12, cursor: 'pointer', color: '#1a2734', fontWeight: 500,
              }}>
                📍 {reps.length} {t('dash.clustered')} — {r.type} — {r.neighborhood}
                <span style={{ marginLeft: 8, color: '#3d8b85', fontWeight: 700 }}>
                  [{t('dash.view_cluster')}]
                </span>
              </div>
            )
          })
        }

        {current.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 24 }}>
            {tab === 'active' ? 'No active reports' : `No ${tab} reports`}
          </div>
        )}

        {current
          .filter((r) => {
            if (tab !== 'active') return true
            const key = `${r.type}-${r.neighborhood}`
            // If clustered, only show the first one of the cluster as the cluster header above handles the rest
            if (clusterKeys.has(key)) {
              const group = clusters.get(key)!
              return group[0].id === r.id
            }
            return true
          })
          .map((r) => {
            const col = URGENCY_COLORS[r.urgency]
            const isNew = r.id === newestId
            return (
              <div key={r.id} style={{
                background: isNew ? 'rgba(61,139,133,0.12)' : col.bg,
                border: `1px solid ${col.border}`,
                borderLeft: `4px solid ${col.border}`,
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 6,
                animation: isNew ? 'slideInCard 0.4s ease-out' : undefined,
                transition: 'background 0.3s',
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{NEED_ICONS[r.type]}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: col.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {r.urgency === 'emergency' ? `🆘 ${t('urgency.emergency')}`
                        : r.urgency === 'today' ? t('urgency.today')
                        : t('urgency.safe')}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{formatTimeAgo(r.timestamp)}</span>
                </div>

                {/* Type + people */}
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4, fontWeight: 500 }}>
                  {t(`need.${r.type}`)} · {r.people} {r.people === 1 ? 'person' : 'people'}
                </div>

                {/* Note */}
                {r.note && (
                  <div style={{ fontSize: 12, color: '#1a2734', marginTop: 4, fontStyle: 'italic', lineHeight: 1.4 }}>
                    "{r.note}"
                  </div>
                )}

                {/* Neighborhood */}
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                  📍 {r.neighborhood}
                </div>

                {/* AI summary */}
                {r.aiSummary && (
                  <div style={{ fontSize: 11, color: '#3d8b85', marginTop: 4, fontWeight: 500 }}>
                    ✨ AI: {r.aiSummary}
                  </div>
                )}

                {/* Assignment info */}
                {r.status === 'assigned' && r.assignedTo && (
                  <div style={{ fontSize: 11, color: '#e6a817', marginTop: 4, fontWeight: 600 }}>
                    ✓ {t('status.assigned')} {r.assignedTo}
                    {r.assignedAt && ` · ${formatTimeAgo(r.assignedAt)}`}
                  </div>
                )}
                {r.status === 'resolved' && (
                  <div style={{ fontSize: 11, color: '#3d8b85', marginTop: 4, fontWeight: 600 }}>
                    ✓ {t('status.resolved')}{r.resolvedAt ? ` · ${formatTimeAgo(r.resolvedAt)}` : ''}
                  </div>
                )}

                {/* Action buttons */}
                {r.status === 'active' && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
                    <button
                      onClick={() => setAssigningId(r.id)}
                      style={{
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        background: '#3d8b85', color: '#fff',
                        border: 'none', borderRadius: 8, padding: '5px 12px',
                      }}
                    >
                      {t('dash.assign')}
                    </button>
                    <button
                      onClick={() => handleResolve(r.id)}
                      style={{
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: 8, padding: '5px 12px', color: '#4b5563',
                      }}
                    >
                      ✓ Resolve
                    </button>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {/* Assign modal */}
      {assigningId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="glass-card" style={{ borderRadius: 20, padding: 24, width: 320, maxWidth: '90vw' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2734', marginBottom: 14 }}>
              {t('dash.assign_to')}
            </div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value as AssignTeam)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13,
                border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.8)',
                color: '#1a2734', outline: 'none', marginBottom: 14,
              }}
            >
              {ASSIGN_TEAMS.map((team) => <option key={team}>{team}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleAssign(assigningId)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 10,
                  background: '#3d8b85', color: '#fff',
                  border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                {t('dash.confirm')}
              </button>
              <button
                onClick={() => setAssigningId(null)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 10,
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#4b5563',
                }}
              >
                {t('dash.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInCard {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
