export type Urgency = 'emergency' | 'today' | 'safe'
export type NeedType = 'Medical' | 'Water' | 'Shelter' | 'Food' | 'Evacuation' | 'Safety'
export type Lang = 'en' | 'ar' | 'ur' | 'tr'
export type ReportStatus = 'active' | 'assigned' | 'resolved'
export type AlertLevel = 'critical' | 'warning' | 'stable'

export interface Report {
  id: string
  type: NeedType
  urgency: Urgency
  people: number
  note: string
  neighborhood: string
  timestamp: number
  lat: number
  lng: number
  status: ReportStatus
  assignedTo?: string
  assignedAt?: number
  resolvedAt?: number
  aiSummary?: string
  cityId: string
  isNew?: boolean
}

export interface ResourceStatus {
  hospitalsOperating: number
  hospitalsTotal: number
  sheltersAtCapacity: number
  sheltersTotal: number
  corridorsPassable: number
  corridorsTotal: number
  supplyDays: number
}

export interface CityConfig {
  id: string
  name: string
  fullName: string
  flag: string
  crisisType: string
  lat: number
  lng: number
  zoom: number
  resources: ResourceStatus
}

export interface CityStatus {
  active: number
  critical: number
  alertLevel: AlertLevel
}

export interface FacilityPin {
  id: string
  name: string
  type: 'hospital' | 'clinic' | 'school' | 'mosque'
  lat: number
  lng: number
}

export type AssignTeam =
  | 'Field Team A'
  | 'Field Team B'
  | 'NGO Partner'
  | 'Hospital'
  | 'UNRWA / WFP'
