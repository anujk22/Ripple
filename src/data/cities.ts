import type { CityConfig, Report, NeedType, Urgency } from '../types'

export const CITIES: CityConfig[] = [
  {
    id: 'gaza',
    name: 'Gaza City',
    fullName: 'Gaza City, Palestine',
    flag: '🇵🇸',
    crisisType: 'Active Conflict',
    lat: 31.5017,
    lng: 34.4668,
    zoom: 13,
    resources: {
      hospitalsOperating: 2,
      hospitalsTotal: 12,
      sheltersAtCapacity: 4,
      sheltersTotal: 4,
      corridorsPassable: 1,
      corridorsTotal: 3,
      supplyDays: 2.1,
    },
  },
  {
    id: 'khartoum',
    name: 'Khartoum',
    fullName: 'Khartoum, Sudan',
    flag: '🇸🇩',
    crisisType: 'Civil Conflict / Displacement',
    lat: 15.5007,
    lng: 32.5599,
    zoom: 12,
    resources: {
      hospitalsOperating: 4,
      hospitalsTotal: 14,
      sheltersAtCapacity: 3,
      sheltersTotal: 6,
      corridorsPassable: 2,
      corridorsTotal: 5,
      supplyDays: 3.4,
    },
  },
  {
    id: 'istanbul',
    name: 'Istanbul',
    fullName: 'Istanbul, Türkiye',
    flag: '🇹🇷',
    crisisType: 'Earthquake Preparedness',
    lat: 41.0082,
    lng: 28.9784,
    zoom: 12,
    resources: {
      hospitalsOperating: 18,
      hospitalsTotal: 22,
      sheltersAtCapacity: 1,
      sheltersTotal: 8,
      corridorsPassable: 5,
      corridorsTotal: 6,
      supplyDays: 9.0,
    },
  },
  {
    id: 'karachi',
    name: 'Karachi',
    fullName: 'Karachi, Pakistan',
    flag: '🇵🇰',
    crisisType: 'Monsoon Flooding',
    lat: 24.8607,
    lng: 67.0011,
    zoom: 12,
    resources: {
      hospitalsOperating: 9,
      hospitalsTotal: 16,
      sheltersAtCapacity: 2,
      sheltersTotal: 5,
      corridorsPassable: 3,
      corridorsTotal: 5,
      supplyDays: 5.2,
    },
  },
  {
    id: 'cairo',
    name: 'Cairo',
    fullName: 'Cairo, Egypt',
    flag: '🇪🇬',
    crisisType: 'Climate Displacement',
    lat: 30.0444,
    lng: 31.2357,
    zoom: 12,
    resources: {
      hospitalsOperating: 14,
      hospitalsTotal: 18,
      sheltersAtCapacity: 0,
      sheltersTotal: 4,
      corridorsPassable: 4,
      corridorsTotal: 4,
      supplyDays: 7.8,
    },
  },
]

export function getCityById(id: string): CityConfig {
  return CITIES.find((c) => c.id === id) || CITIES[0]
}

// ── Seed data ─────────────────────────────────────────────────────────────────
function makeId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function ago(minutes: number): number {
  return Date.now() - minutes * 60 * 1000
}

function jitter(lat: number, lng: number, r: number): [number, number] {
  return [lat + (Math.random() - 0.5) * r, lng + (Math.random() - 0.5) * r]
}

function seed(
  cityId: string,
  type: NeedType,
  urgency: Urgency,
  people: number,
  note: string,
  neighborhood: string,
  minutesAgo: number,
  city: CityConfig,
  status: 'active' | 'assigned' | 'resolved' = 'active',
): Report {
  const [lat, lng] = jitter(city.lat, city.lng, 0.04)
  return {
    id: makeId(),
    type,
    urgency,
    people,
    note,
    neighborhood,
    timestamp: ago(minutesAgo),
    lat,
    lng,
    status,
    cityId,
    assignedTo: status === 'assigned' ? 'Field Team A' : undefined,
    assignedAt: status === 'assigned' ? ago(minutesAgo - 5) : undefined,
  }
}

export function buildSeedReports(): Record<string, Report[]> {
  const g = CITIES[0], k = CITIES[1], i = CITIES[2], p = CITIES[3], c = CITIES[4]

  return {
    gaza: [
      seed('gaza', 'Medical',    'emergency', 4,  'Injured child, no hospital access',             'Al-Rimal',       2,  g),
      seed('gaza', 'Evacuation', 'emergency', 2,  'Elderly couple, cannot self-evacuate',          'Beit Lahiya',    22, g),
      seed('gaza', 'Safety',     'emergency', 8,  'Building collapse, people trapped',             'Jabalia',        41, g),
      seed('gaza', 'Shelter',    'today',     12, 'Family displaced, need temporary shelter',      'Sheikh Radwan',  8,  g),
      seed('gaza', 'Water',      'today',     6,  'No clean water for 3 days',                     'Jabalia',        15, g),
      seed('gaza', 'Food',       'today',     20, 'Distribution point closed, large group',        'Deir al-Balah',  31, g),
      seed('gaza', 'Medical',    'today',     3,  'Chronic medication running out',                'Shuja\'iyya',    55, g),
      seed('gaza', 'Water',      'today',     9,  'Water tank empty, 3 families',                  'Beit Lahiya',    70, g),
      seed('gaza', 'Shelter',    'today',     5,  'Need blankets and tarp, sleeping outside',      'Al-Rimal',       88, g),
      seed('gaza', 'Food',       'safe',      30, 'Running low, 2 days supply remaining',          'Deir al-Balah',  105, g),
      seed('gaza', 'Medical',    'safe',      1,  'Minor injuries, able to walk',                  'Sheikh Radwan',  130, g),
      seed('gaza', 'Medical',    'assigned',  6,  'Burns from fire, need dressing changes',        'Jabalia',        160, g, 'assigned'),
      seed('gaza', 'Shelter',    'assigned',  14, 'School shelter overcrowded',                    'Al-Rimal',       190, g, 'assigned'),
      seed('gaza', 'Water',      'resolved',  4,  'Water access restored',                         'Sheikh Radwan',  220, g, 'resolved'),
      seed('gaza', 'Food',       'resolved',  11, 'Aid convoy arrived',                            'Deir al-Balah',  300, g, 'resolved'),
    ],
    khartoum: [
      seed('khartoum', 'Safety',     'emergency', 5,  'Armed group near IDP camp, need escort',      'Bahri',           5,  k),
      seed('khartoum', 'Shelter',    'today',     30, 'Over 30 people sleeping in mosque',           'Omdurman',        12, k),
      seed('khartoum', 'Water',      'today',     15, 'Pump broken for 5 days',                      'Al-Thawra',       28, k),
      seed('khartoum', 'Medical',    'today',     4,  'Diarrhea outbreak in camp',                   'Soba',            45, k),
      seed('khartoum', 'Food',       'today',     80, 'Warehouse empty, distribution halted',        'Riyadh',          60, k),
      seed('khartoum', 'Evacuation', 'today',     12, 'Road from north blocked by fighters',         'Bahri',           90, k),
      seed('khartoum', 'Water',      'safe',      8,  'Water from well may be contaminated',         'Omdurman',        120, k),
      seed('khartoum', 'Food',       'assigned',  50, 'Community kitchen supplies running low',      'Al-Thawra',       150, k, 'assigned'),
      seed('khartoum', 'Shelter',    'resolved',  22, 'Tent allocation complete',                    'Soba',            240, k, 'resolved'),
    ],
    istanbul: [
      seed('istanbul', 'Safety',  'today', 3,  'Structural crack in apartment block after tremor', 'Gaziosmanpaşa', 10, i),
      seed('istanbul', 'Medical', 'today', 2,  'Elderly resident, needs check after building evac','Fatih',         25, i),
      seed('istanbul', 'Shelter', 'today', 8,  'Tenants left building, no arrangements made',      'Kadıköy',       55, i),
      seed('istanbul', 'Water',   'safe',  1,  'Pipe rattling, concerned about breakage',          'Üsküdar',       110, i),
      seed('istanbul', 'Food',    'resolved', 40, 'Community canteen set up by municipality',       'Bağcılar',      300, i, 'resolved'),
    ],
    karachi: [
      seed('karachi', 'Water',      'today', 20, 'Street flooded, ground floor submerged',        'Korangi',  8,  p),
      seed('karachi', 'Evacuation', 'today', 6,  'Family stranded due to flooding',               'Lyari',    35, p),
      seed('karachi', 'Medical',    'assigned', 3,'Child with fever after flood exposure',         'Orangi',   70, p, 'assigned'),
      seed('karachi', 'Shelter',    'resolved', 15,'Temporary shelter allocated at school',        'Baldia',   180, p, 'resolved'),
    ],
    cairo: [
      seed('cairo', 'Water',   'safe',     4,  'Seasonal well drying up earlier than expected',  'Rod al-Farag', 40,  c),
      seed('cairo', 'Shelter', 'resolved', 8,  'Displaced by Nile flooding, temporary housing',  'Imbaba',       200, c, 'resolved'),
    ],
  }
}

// ── Synthetic new report generator ───────────────────────────────────────────
const NEW_REPORT_POOL: Record<string, Array<Omit<Report, 'id' | 'timestamp' | 'lat' | 'lng' | 'status' | 'cityId'>>> = {
  gaza: [
    { type: 'Medical',    urgency: 'emergency', people: 2,  note: 'Person unresponsive, need paramedic',        neighborhood: 'Al-Rimal' },
    { type: 'Water',      urgency: 'today',     people: 7,  note: 'Water pipe destroyed by strike',            neighborhood: 'Jabalia' },
    { type: 'Shelter',    urgency: 'today',     people: 11, note: 'Need plastic sheeting for roof',            neighborhood: 'Sheikh Radwan' },
    { type: 'Food',       urgency: 'today',     people: 25, note: 'Children not eaten in 2 days',             neighborhood: 'Beit Lahiya' },
    { type: 'Evacuation', urgency: 'emergency', people: 3,  note: 'Trapped, need immediate extraction',        neighborhood: 'Shuja\'iyya' },
  ],
  khartoum: [
    { type: 'Shelter',    urgency: 'today',     people: 18, note: 'New arrivals from north, no shelter',       neighborhood: 'Bahri' },
    { type: 'Water',      urgency: 'today',     people: 12, note: 'Water truck did not arrive today',         neighborhood: 'Al-Thawra' },
    { type: 'Medical',    urgency: 'today',     people: 2,  note: 'Wound infection, needs antibiotics',       neighborhood: 'Omdurman' },
  ],
  istanbul: [
    { type: 'Safety',     urgency: 'today',     people: 4,  note: 'Post-drill: residents unable to return to home', neighborhood: 'Fatih' },
    { type: 'Medical',    urgency: 'safe',       people: 1,  note: 'Sprained ankle during drill evacuation',   neighborhood: 'Kadıköy' },
  ],
  karachi: [
    { type: 'Water',      urgency: 'today',     people: 10, note: 'Flood water entering homes on main street', neighborhood: 'Korangi' },
    { type: 'Evacuation', urgency: 'today',     people: 5,  note: 'Road submerged, need transport',            neighborhood: 'Orangi' },
  ],
  cairo: [
    { type: 'Water',      urgency: 'safe',      people: 3,  note: 'Seasonal access issues; water scarce',      neighborhood: 'Shubra' },
    { type: 'Shelter',    urgency: 'today',     people: 6,  note: 'Displaced by flooding, temporary shelter',  neighborhood: 'Maadi' },
  ],
}

export function getNewReportPool(cityId: string) {
  return NEW_REPORT_POOL[cityId] || NEW_REPORT_POOL['cairo']
}

export function createSyntheticReport(cityId: string, city: CityConfig): Report {
  const pool = getNewReportPool(cityId)
  const template = pool[Math.floor(Math.random() * pool.length)]
  const [lat, lng] = jitter(city.lat, city.lng, 0.04)
  return {
    ...template,
    id: makeId(),
    timestamp: Date.now(),
    lat,
    lng,
    status: 'active',
    cityId,
    isNew: true,
  }
}
