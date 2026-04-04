// Tile types for the grid visualization
export type TileType =
  | 'road'
  | 'housing'
  | 'park'
  | 'empty'
  | 'water'
  | 'commercial'
  | 'rubble'
  | 'shelter'
  | 'medical'
  | 'abandoned'
  | 'idp_camp'
  | 'aid_point'
  | 'old_building'
  | 'lowlying'
  | 'mosque'
  | 'farmland';

export interface TileInfo {
  label: string;
  emoji: string;
  color: string;
}

export const TILE_TYPES: Record<TileType, TileInfo> = {
  road: { label: 'Road', emoji: '🛣️', color: 'rgba(0,0,0,0.04)' },
  housing: { label: 'Housing', emoji: '🏠', color: 'rgba(0,0,0,0.06)' },
  park: { label: 'Assembly Point', emoji: '🌳', color: 'rgba(16, 185, 129, 0.12)' },
  empty: { label: 'Empty Lot', emoji: '⬜', color: 'rgba(0,0,0,0.02)' },
  water: { label: 'Water / Canal', emoji: '🌊', color: 'rgba(59, 130, 246, 0.12)' },
  commercial: { label: 'Market', emoji: '🏪', color: 'rgba(0,0,0,0.08)' },
  rubble: { label: 'Destroyed / Rubble', emoji: '🧱', color: 'rgba(180, 60, 20, 0.15)' },
  shelter: { label: 'UNRWA Shelter', emoji: '🏫', color: 'rgba(59, 130, 246, 0.08)' },
  medical: { label: 'Medical Facility', emoji: '🏥', color: 'rgba(239, 68, 68, 0.08)' },
  abandoned: { label: 'Abandoned Building', emoji: '🏚️', color: 'rgba(100, 100, 100, 0.12)' },
  idp_camp: { label: 'IDP Camp', emoji: '⛺', color: 'rgba(234, 179, 8, 0.12)' },
  aid_point: { label: 'Aid Distribution', emoji: '🏕️', color: 'rgba(16, 185, 129, 0.10)' },
  old_building: { label: 'Vulnerable Building', emoji: '🏚️', color: 'rgba(120, 80, 40, 0.12)' },
  lowlying: { label: 'Low-lying Housing', emoji: '🏚️', color: 'rgba(59, 130, 246, 0.06)' },
  mosque: { label: 'Mosque / Community', emoji: '🕌', color: 'rgba(16, 185, 129, 0.08)' },
  farmland: { label: 'Farmland (at risk)', emoji: '🌾', color: 'rgba(134, 198, 10, 0.12)' },
};

// ── New index framework ──────────────────────────────────────────────────────
// shelterCoverage  : % of population within reach of reinforced shelter (0–100)
// evacuationViab   : % of evacuation corridors passable or monitored (0–100)
// medicalAccess    : functioning facilities per 100k (stored ×10 so 0.3→3, 1.0→10, max 35)
// supplyChainDays  : estimated days of food/water access (stored ×10 so 4.2→42)

export interface Indices {
  shelterCoverage: number;   // 0–100 (percentage points)
  evacuationViab: number;   // 0–100 (percentage points)
  medicalAccess: number;   // ×10 internal (e.g. 3 = 0.3/100k)
  supplyChainDays: number;   // ×10 internal (e.g. 35 = 3.5 days)
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  region: string;
  coordinates: [number, number]; // [lng, lat]
  baseGrid: TileType[][];
  baseIndices: Indices;
  availableInterventions: string[];
  impactRules: Record<string, Indices>;
  interventionTiles: Record<string, [number, number][]>;
  sliderLeft: string;
  sliderRight: string;
}

const scenarios: Scenario[] = [
  // ── 1: Gaza City ──────────────────────────────────────────────────────────
  {
    id: 'gaza-bombardment',
    name: 'Residential Block Under Aerial Bombardment',
    description:
      'A densely populated neighborhood facing active aerial strikes. Evacuation orders have been issued but corridors are contested. Shelters are at 4× intended capacity.',
    region: 'Gaza City, Palestine',
    coordinates: [34.4668, 31.5017],
    baseGrid: [
      ['housing', 'housing', 'road', 'housing', 'housing'],
      ['housing', 'shelter', 'housing', 'rubble', 'housing'],
      ['road', 'road', 'medical', 'road', 'road'],
      ['housing', 'rubble', 'housing', 'shelter', 'housing'],
      ['commercial', 'road', 'rubble', 'road', 'commercial'],
    ],
    baseIndices: {
      shelterCoverage: 23,
      evacuationViab: 31,
      medicalAccess: 3,   // 0.3 / 100k
      supplyChainDays: 35,  // 3.5 days
    },
    availableInterventions: [
      'reinforce-underground',
      'field-hospital',
      'safe-corridor',
      'food-water-dist',
    ],
    impactRules: {
      'reinforce-underground': { shelterCoverage: +18, evacuationViab: -4, medicalAccess: 0, supplyChainDays: +8 },
      'field-hospital': { shelterCoverage: +3, evacuationViab: 0, medicalAccess: +9, supplyChainDays: +5 },
      'safe-corridor': { shelterCoverage: -5, evacuationViab: +24, medicalAccess: 0, supplyChainDays: +12 },
      'food-water-dist': { shelterCoverage: +4, evacuationViab: 0, medicalAccess: 0, supplyChainDays: +38 },
    },
    interventionTiles: {
      'reinforce-underground': [[1, 1], [1, 3], [3, 1], [3, 3]],
      'field-hospital': [[2, 2]],
      'safe-corridor': [[2, 0], [2, 1], [2, 3], [2, 4]],
      'food-water-dist': [[4, 0], [4, 4]],
    },
    sliderLeft: 'Immediate Safety (Shelter-in-Place)',
    sliderRight: 'Evacuation & Movement',
  },

  // ── 2: Khartoum ───────────────────────────────────────────────────────────
  {
    id: 'khartoum-displacement',
    name: 'Urban Displacement Crisis',
    description:
      'Active civil conflict has reduced Khartoum\'s population from 6 million to under 1 million. Roads are contested, aid convoys face obstruction, and over 64% of Sudan\'s 11.5 million IDPs originated here.',
    region: 'Khartoum, Sudan',
    coordinates: [32.5599, 15.5007],
    baseGrid: [
      ['housing', 'abandoned', 'road', 'abandoned', 'abandoned'],
      ['housing', 'housing', 'road', 'idp_camp', 'abandoned'],
      ['road', 'road', 'road', 'road', 'road'],
      ['housing', 'idp_camp', 'abandoned', 'housing', 'aid_point'],
      ['commercial', 'road', 'abandoned', 'road', 'housing'],
    ],
    baseIndices: {
      shelterCoverage: 18,
      evacuationViab: 42,
      medicalAccess: 4,   // 0.4 / 100k
      supplyChainDays: 21,  // 2.1 days
    },
    availableInterventions: [
      'evac-corridor',
      'idp-reception',
      'water-purif',
      'comms-network',
    ],
    impactRules: {
      'evac-corridor': { shelterCoverage: -3, evacuationViab: +28, medicalAccess: 0, supplyChainDays: +11 },
      'idp-reception': { shelterCoverage: +20, evacuationViab: +5, medicalAccess: +3, supplyChainDays: +18 },
      'water-purif': { shelterCoverage: +5, evacuationViab: 0, medicalAccess: 0, supplyChainDays: +24 },
      'comms-network': { shelterCoverage: +4, evacuationViab: +12, medicalAccess: +2, supplyChainDays: +6 },
    },
    interventionTiles: {
      'evac-corridor': [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
      'idp-reception': [[3, 1], [1, 3]],
      'water-purif': [[0, 2], [2, 2], [4, 2]],
      'comms-network': [[0, 4], [4, 4]],
    },
    sliderLeft: 'Secure Shelter (Stay)',
    sliderRight: 'Enable Movement (Go)',
  },

  // ── 3: Istanbul ───────────────────────────────────────────────────────────
  {
    id: 'istanbul-earthquake',
    name: 'Dense Urban Earthquake Zone',
    description:
      'A neighborhood in Istanbul\'s high-risk seismic corridor. Only 31% of buildings meet modern codes. The anticipated Mw 7.5 earthquake scenario activates this simulation.',
    region: 'Istanbul, Türkiye',
    coordinates: [28.9784, 41.0082],
    baseGrid: [
      ['housing', 'old_building', 'road', 'old_building', 'housing'],
      ['housing', 'housing', 'shelter', 'housing', 'old_building'],
      ['road', 'road', 'road', 'road', 'road'],
      ['old_building', 'housing', 'park', 'housing', 'housing'],
      ['housing', 'road', 'medical', 'road', 'housing'],
    ],
    baseIndices: {
      shelterCoverage: 41,
      evacuationViab: 58,
      medicalAccess: 11,  // 1.1 / 100k
      supplyChainDays: 52,  // 5.2 days
    },
    availableInterventions: [
      'retrofit-buildings',
      'preposition-shelters',
      'hospital-surge',
      'sar-teams',
    ],
    impactRules: {
      'retrofit-buildings': { shelterCoverage: +22, evacuationViab: +6, medicalAccess: 0, supplyChainDays: +5 },
      'preposition-shelters': { shelterCoverage: +14, evacuationViab: +4, medicalAccess: 0, supplyChainDays: +22 },
      'hospital-surge': { shelterCoverage: 0, evacuationViab: 0, medicalAccess: +8, supplyChainDays: +3 },
      'sar-teams': { shelterCoverage: +8, evacuationViab: +9, medicalAccess: +4, supplyChainDays: 0 },
    },
    interventionTiles: {
      'retrofit-buildings': [[0, 1], [0, 3], [1, 4], [3, 0]],
      'preposition-shelters': [[3, 2], [1, 2]],
      'hospital-surge': [[4, 2]],
      'sar-teams': [[0, 0], [0, 4], [4, 0], [4, 4]],
    },
    sliderLeft: 'Structural Protection',
    sliderRight: 'Emergency Response Speed',
  },

  // ── 4: Karachi ────────────────────────────────────────────────────────────
  {
    id: 'karachi-compound-risk',
    name: 'Compound Flood & Earthquake Risk Zone',
    description:
      'A low-income residential zone facing simultaneous flood risk from monsoon surges and earthquake vulnerability. Adobe and brick masonry structures score 7.1/10 on Pakistan\'s National Risk Atlas.',
    region: 'Karachi, Pakistan',
    coordinates: [67.0011, 24.8607],
    baseGrid: [
      ['housing', 'water', 'housing', 'water', 'housing'],
      ['housing', 'lowlying', 'road', 'lowlying', 'housing'],
      ['road', 'road', 'mosque', 'road', 'road'],
      ['lowlying', 'housing', 'road', 'commercial', 'housing'],
      ['water', 'housing', 'housing', 'housing', 'water'],
    ],
    baseIndices: {
      shelterCoverage: 29,
      evacuationViab: 48,
      medicalAccess: 7,   // 0.7 / 100k
      supplyChainDays: 41,  // 4.1 days
    },
    availableInterventions: [
      'flood-barrier',
      'mosque-shelter',
      'elevate-road',
      'mobile-medical',
    ],
    impactRules: {
      'flood-barrier': { shelterCoverage: +15, evacuationViab: +10, medicalAccess: 0, supplyChainDays: +15 },
      'mosque-shelter': { shelterCoverage: +18, evacuationViab: +2, medicalAccess: +1, supplyChainDays: +20 },
      'elevate-road': { shelterCoverage: -3, evacuationViab: +22, medicalAccess: 0, supplyChainDays: +8 },
      'mobile-medical': { shelterCoverage: 0, evacuationViab: 0, medicalAccess: +6, supplyChainDays: +4 },
    },
    interventionTiles: {
      'flood-barrier': [[0, 0], [0, 2], [0, 4], [4, 0], [4, 4]],
      'mosque-shelter': [[2, 2]],
      'elevate-road': [[2, 0], [2, 1], [2, 3], [2, 4]],
      'mobile-medical': [[3, 3]],
    },
    sliderLeft: 'Flood Protection',
    sliderRight: 'Earthquake Preparedness',
  },

  // ── 5: Cairo ──────────────────────────────────────────────────────────────
  {
    id: 'cairo-climate-displacement',
    name: 'Nile Delta Climate Displacement Zone',
    description:
      'A peri-urban neighborhood in the Nile Delta facing rising flood tides, extreme heat events, and infrastructure stress as climate displacement increases population density.',
    region: 'Cairo, Egypt',
    coordinates: [31.2357, 30.0444],
    baseGrid: [
      ['housing', 'farmland', 'road', 'farmland', 'housing'],
      ['housing', 'housing', 'water', 'housing', 'commercial'],
      ['road', 'road', 'road', 'road', 'road'],
      ['water', 'housing', 'medical', 'housing', 'farmland'],
      ['housing', 'road', 'housing', 'road', 'housing'],
    ],
    baseIndices: {
      shelterCoverage: 47,
      evacuationViab: 61,
      medicalAccess: 9,   // 0.9 / 100k
      supplyChainDays: 68,  // 6.8 days
    },
    availableInterventions: [
      'tree-canopy',
      'elevated-shelter',
      'flood-water-infra',
      'early-warning',
    ],
    impactRules: {
      'tree-canopy': { shelterCoverage: +10, evacuationViab: +4, medicalAccess: 0, supplyChainDays: +5 },
      'elevated-shelter': { shelterCoverage: +20, evacuationViab: 0, medicalAccess: +1, supplyChainDays: +12 },
      'flood-water-infra': { shelterCoverage: +5, evacuationViab: +3, medicalAccess: +2, supplyChainDays: +31 },
      'early-warning': { shelterCoverage: +4, evacuationViab: +18, medicalAccess: 0, supplyChainDays: +5 },
    },
    interventionTiles: {
      'tree-canopy': [[2, 0], [2, 1], [2, 3], [2, 4], [0, 2], [4, 2]],
      'elevated-shelter': [[1, 2], [3, 2]],
      'flood-water-infra': [[3, 0], [1, 2], [3, 4]],
      'early-warning': [[0, 0], [0, 4], [4, 0], [4, 4]],
    },
    sliderLeft: 'Climate Resilience (Long-term)',
    sliderRight: 'Immediate Evacuation Capacity',
  },
];

export default scenarios;
