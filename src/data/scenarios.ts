// Tile types for the grid visualization
export type TileType = 'road' | 'housing' | 'park' | 'empty' | 'water' | 'commercial';

export interface TileInfo {
  label: string;
  emoji: string;
  color: string;
}

export const TILE_TYPES: Record<TileType, TileInfo> = {
  road:       { label: 'Road',       emoji: '🛣️', color: '#1a1a1a' },
  housing:    { label: 'Housing',    emoji: '🏠', color: '#1f1f1f' },
  park:       { label: 'Park',       emoji: '🌳', color: '#1c2c1c' },
  empty:      { label: 'Empty Lot',  emoji: '⬜', color: '#151515' },
  water:      { label: 'Water',      emoji: '🌊', color: '#0d1b2a' },
  commercial: { label: 'Commercial', emoji: '🏪', color: '#2a2a1a' },
};

export interface Indices {
  heat: number;
  emissions: number;
  evacuation: number;
  healthAccess: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  region: string; // label shown on globe
  coordinates: [number, number]; // [lng, lat] for globe marker
  baseGrid: TileType[][];
  baseIndices: Indices;
  availableInterventions: string[];
  impactRules: Record<string, Indices>;
  interventionTiles: Record<string, [number, number][]>;
}

const scenarios: Scenario[] = [
  {
    id: 'heat-island',
    name: 'Heat-Island Neighborhood',
    description: 'A dense urban block dominated by concrete and asphalt. Summer temperatures spike 5–8 °F above surrounding areas.',
    region: 'Phoenix, AZ',
    coordinates: [-112.07, 33.45],
    baseGrid: [
      ['commercial', 'road', 'housing', 'road', 'commercial'],
      ['housing', 'road', 'commercial', 'road', 'housing'],
      ['road', 'road', 'road', 'road', 'road'],
      ['housing', 'road', 'empty', 'road', 'housing'],
      ['commercial', 'road', 'housing', 'road', 'commercial'],
    ],
    baseIndices: { heat: 78, emissions: 65, evacuation: 30, healthAccess: 35 },
    availableInterventions: ['plant-trees-main', 'pedestrianize-market', 'add-clinic', 'green-roofs'],
    impactRules: {
      'plant-trees-main':      { heat: -18, emissions: -5,  evacuation: 0,  healthAccess: 0 },
      'pedestrianize-market':  { heat: -6,  emissions: -20, evacuation: 15, healthAccess: -5 },
      'add-clinic':            { heat: 0,   emissions: 3,   evacuation: 2,  healthAccess: 30 },
      'green-roofs':           { heat: -12, emissions: -3,  evacuation: 0,  healthAccess: 0 },
    },
    interventionTiles: {
      'plant-trees-main':     [[2,0],[2,1],[2,2],[2,3],[2,4]],
      'pedestrianize-market': [[0,1],[1,1],[2,1],[3,1],[4,1]],
      'add-clinic':           [[3,2]],
      'green-roofs':          [[0,0],[0,4],[1,0],[1,4],[4,0],[4,4]],
    },
  },
  {
    id: 'coastal-flood',
    name: 'Coastal Flood-Risk Block',
    description: 'A waterfront neighborhood facing rising tides and storm surges. Evacuation routes are limited and low-lying areas flood regularly.',
    region: 'Dhaka, Bangladesh',
    coordinates: [90.41, 23.81],
    baseGrid: [
      ['water', 'water', 'water', 'water', 'water'],
      ['empty', 'road', 'housing', 'road', 'park'],
      ['housing', 'road', 'commercial', 'road', 'housing'],
      ['housing', 'road', 'road', 'road', 'housing'],
      ['road', 'road', 'housing', 'road', 'commercial'],
    ],
    baseIndices: { heat: 45, emissions: 50, evacuation: 72, healthAccess: 40 },
    availableInterventions: ['elevate-roads', 'add-clinic', 'plant-mangroves', 'emergency-shelters'],
    impactRules: {
      'elevate-roads':      { heat: 0,  emissions: 5,  evacuation: -25, healthAccess: 5 },
      'add-clinic':         { heat: 0,  emissions: 3,  evacuation: 2,   healthAccess: 28 },
      'plant-mangroves':    { heat: -8, emissions: -6, evacuation: -5,  healthAccess: 0 },
      'emergency-shelters': { heat: 0,  emissions: 2,  evacuation: -18, healthAccess: 10 },
    },
    interventionTiles: {
      'elevate-roads':      [[3,1],[3,2],[3,3],[4,0],[4,1],[4,3]],
      'add-clinic':         [[1,0]],
      'plant-mangroves':    [[0,0],[0,1],[0,2],[0,3],[0,4]],
      'emergency-shelters': [[2,2]],
    },
  },
  {
    id: 'car-suburb',
    name: 'Car-Dependent Suburb',
    description: 'A sprawling suburban block with wide roads and no walkable amenities. Residents drive for everything.',
    region: 'Houston, TX',
    coordinates: [-95.37, 29.76],
    baseGrid: [
      ['housing', 'housing', 'road', 'housing', 'housing'],
      ['housing', 'empty', 'road', 'empty', 'housing'],
      ['road', 'road', 'road', 'road', 'road'],
      ['commercial', 'road', 'empty', 'road', 'commercial'],
      ['housing', 'housing', 'road', 'housing', 'housing'],
    ],
    baseIndices: { heat: 55, emissions: 82, evacuation: 20, healthAccess: 25 },
    availableInterventions: ['bike-lanes', 'add-clinic', 'plant-trees-main', 'mixed-use-conversion'],
    impactRules: {
      'bike-lanes':            { heat: -2,  emissions: -15, evacuation: 8,  healthAccess: 5 },
      'add-clinic':            { heat: 0,   emissions: 3,   evacuation: 2,  healthAccess: 32 },
      'plant-trees-main':      { heat: -14, emissions: -4,  evacuation: 0,  healthAccess: 0 },
      'mixed-use-conversion':  { heat: -3,  emissions: -12, evacuation: 3,  healthAccess: 15 },
    },
    interventionTiles: {
      'bike-lanes':           [[2,0],[2,1],[2,2],[2,3],[2,4]],
      'add-clinic':           [[2,2]],
      'plant-trees-main':     [[0,2],[1,2],[2,2],[3,1],[4,2]],
      'mixed-use-conversion': [[1,1],[1,3],[3,0],[3,4]],
    },
  },
];

export default scenarios;
