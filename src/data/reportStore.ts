import type { Report, ReportStatus, CityStatus, AlertLevel } from '../types'
import { CITIES, buildSeedReports, createSyntheticReport } from './cities'

// ── In-memory store ───────────────────────────────────────────────────────────
let store: Record<string, Report[]> = {}
let simulationTimer: ReturnType<typeof setTimeout> | null = null
let currentSimulatingCity: string | null = null

type StoreListener = (newReport?: Report) => void
const listeners: StoreListener[] = []

function emit(newReport?: Report) {
  listeners.forEach((l) => l(newReport))
}

export function subscribe(fn: StoreListener): () => void {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx >= 0) listeners.splice(idx, 1)
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
export function initStore() {
  store = buildSeedReports()
}

// ── Getters ───────────────────────────────────────────────────────────────────
export function getReports(cityId: string): Report[] {
  return store[cityId] || []
}

export function getByStatus(cityId: string, status: ReportStatus): Report[] {
  return getReports(cityId).filter((r) => r.status === status)
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function assignReport(reportId: string, cityId: string, team: string) {
  const reports = store[cityId]
  if (!reports) return
  const idx = reports.findIndex((r) => r.id === reportId)
  if (idx < 0) return
  reports[idx] = {
    ...reports[idx],
    status: 'assigned',
    assignedTo: team,
    assignedAt: Date.now(),
  }
  emit()
}

export function resolveReport(reportId: string, cityId: string) {
  const reports = store[cityId]
  if (!reports) return
  const idx = reports.findIndex((r) => r.id === reportId)
  if (idx < 0) return
  reports[idx] = { ...reports[idx], status: 'resolved', resolvedAt: Date.now() }
  emit()
}

export function addReport(report: Report) {
  if (!store[report.cityId]) store[report.cityId] = []
  store[report.cityId].unshift(report)
  emit(report)
}

// Clear "isNew" flag after animation
export function clearNewFlag(reportId: string, cityId: string) {
  const reports = store[cityId]
  if (!reports) return
  const idx = reports.findIndex((r) => r.id === reportId)
  if (idx >= 0) reports[idx] = { ...reports[idx], isNew: false }
}

// ── Live simulation ───────────────────────────────────────────────────────────
export function startSimulation(cityId: string) {
  if (currentSimulatingCity === cityId) return
  stopSimulation()
  currentSimulatingCity = cityId

  function scheduleNext() {
    const delay = 60000 + Math.random() * 30000  // 60–90 seconds
    simulationTimer = setTimeout(() => {
      if (currentSimulatingCity !== cityId) return
      const city = CITIES.find((c) => c.id === cityId)!
      const report = createSyntheticReport(cityId, city)
      addReport(report)
      // Clear isNew flag after animation
      setTimeout(() => clearNewFlag(report.id, cityId), 3000)
      scheduleNext()
    }, delay)
  }

  scheduleNext()
}

export function stopSimulation() {
  if (simulationTimer) {
    clearTimeout(simulationTimer)
    simulationTimer = null
  }
  currentSimulatingCity = null
}

// ── City status for globe badges ──────────────────────────────────────────────
export function getCityStatuses(): Record<string, CityStatus> {
  const result: Record<string, CityStatus> = {}
  for (const city of CITIES) {
    const active = getByStatus(city.id, 'active')
    const critical = active.filter((r) => r.urgency === 'emergency').length
    let alertLevel: AlertLevel = 'stable'
    if (critical > 0) alertLevel = 'critical'
    else if (active.length > 0) alertLevel = 'warning'
    result[city.id] = { active: active.length, critical, alertLevel }
  }
  return result
}

// ── Humanitarian Readiness Score ──────────────────────────────────────────────
export function computeReadiness(cityId: string): number {
  const city = CITIES.find((c) => c.id === cityId)
  if (!city) return 0
  const r = city.resources
  const activeReports = getByStatus(cityId, 'active')

  let penalty = 0
  for (const rep of activeReports) {
    if (rep.urgency === 'emergency') penalty += 6
    else if (rep.urgency === 'today') penalty += 2
    else penalty += 0.5 // minor penalty for safe/general reports
  }

  const hospitalScore = (r.hospitalsOperating / Math.max(r.hospitalsTotal, 1)) * 100
  const corridorScore = (r.corridorsPassable / Math.max(r.corridorsTotal, 1)) * 100
  const supplyScore = Math.min(r.supplyDays / 14, 1) * 100
  const combinedPenalty = Math.min(penalty, 40) // cap maximum drag at 40 points

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        0.35 * hospitalScore + 0.35 * corridorScore + 0.30 * supplyScore - combinedPenalty,
      ),
    ),
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatTimeAgo(timestamp: number): string {
  const mins = Math.floor((Date.now() - timestamp) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

export function readinessLabel(score: number): string {
  if (score >= 80) return 'RESILIENT'
  if (score >= 60) return 'ADEQUATE'
  if (score >= 35) return 'AT RISK'
  return 'CRITICAL'
}

export function readinessColor(score: number): string {
  if (score >= 80) return '#4caf7d'
  if (score >= 60) return '#3d8b85'
  if (score >= 35) return '#e6a817'
  return '#e05252'
}
