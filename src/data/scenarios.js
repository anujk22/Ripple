// Tile types: road, housing, park, empty, water, commercial, clinic
// Each scenario has a unique 5x5 grid, interventions, and impact rules

export const TILE_TYPES = {
  road: { label: 'Road', emoji: '🛣️', color: '#4a4a5a' },
  housing: { label: 'Housing', emoji: '🏠', color: '#6b5b7b' },
  park: { label: 'Park', emoji: '🌳', color: '#2d6a4f' },
  empty: { label: 'Empty Lot', emoji: '⬜', color: '#3a3a4a' },
  water: { label: 'Water', emoji: '🌊', color: '#1d4e89' },
  commercial: { label: 'Commercial', emoji: '🏪', color: '#8b6914' },
  clinic: { label: 'Clinic', emoji: '🏥', color: '#c0392b' },
};

const scenarios = [
  {
    id: 'heat-island',
    name: 'Heat-Island Neighborhood',
    description:
      'A dense urban block dominated by concrete, asphalt, and commercial buildings. Summer temperatures regularly spike 5–8 °F above the surrounding area.',
    baseGrid: [
      ['commercial', 'road', 'housing', 'road', 'commercial'],
      ['housing', 'road', 'commercial', 'road', 'housing'],
      ['road', 'road', 'road', 'road', 'road'],
      ['housing', 'road', 'empty', 'road', 'housing'],
      ['commercial', 'road', 'housing', 'road', 'commercial'],
    ],
    baseIndices: {
      heat: 78,
      emissions: 65,
      evacuation: 30,
      healthAccess: 35,
    },
    availableInterventions: [
      'plant-trees-main',
      'pedestrianize-market',
      'add-clinic',
      'green-roofs',
    ],
    impactRules: {
      'plant-trees-main': { heat: -18, emissions: -5, evacuation: 0, healthAccess: 0 },
      'pedestrianize-market': { heat: -6, emissions: -20, evacuation: 15, healthAccess: -5 },
      'add-clinic': { heat: 0, emissions: 3, evacuation: 2, healthAccess: 30 },
      'green-roofs': { heat: -12, emissions: -3, evacuation: 0, healthAccess: 0 },
    },
    // Which tiles are visually affected by an intervention
    interventionTiles: {
      'plant-trees-main': [
        [2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
      ],
      'pedestrianize-market': [
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
      ],
      'add-clinic': [[3, 2]],
      'green-roofs': [
        [0, 0], [0, 4], [1, 0], [1, 4], [4, 0], [4, 4],
      ],
    },
  },
  {
    id: 'coastal-flood',
    name: 'Coastal Flood-Risk Block',
    description:
      'A waterfront neighborhood facing rising tides and storm surges. Evacuation routes are limited, and low-lying areas flood regularly.',
    baseGrid: [
      ['water', 'water', 'water', 'water', 'water'],
      ['empty', 'road', 'housing', 'road', 'park'],
      ['housing', 'road', 'commercial', 'road', 'housing'],
      ['housing', 'road', 'road', 'road', 'housing'],
      ['road', 'road', 'housing', 'road', 'commercial'],
    ],
    baseIndices: {
      heat: 45,
      emissions: 50,
      evacuation: 72,
      healthAccess: 40,
    },
    availableInterventions: [
      'elevate-roads',
      'add-clinic',
      'plant-mangroves',
      'emergency-shelters',
    ],
    impactRules: {
      'elevate-roads': { heat: 0, emissions: 5, evacuation: -25, healthAccess: 5 },
      'add-clinic': { heat: 0, emissions: 3, evacuation: 2, healthAccess: 28 },
      'plant-mangroves': { heat: -8, emissions: -6, evacuation: -5, healthAccess: 0 },
      'emergency-shelters': { heat: 0, emissions: 2, evacuation: -18, healthAccess: 10 },
    },
    interventionTiles: {
      'elevate-roads': [
        [3, 1], [3, 2], [3, 3], [4, 0], [4, 1], [4, 3],
      ],
      'add-clinic': [[1, 0]],
      'plant-mangroves': [
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
      ],
      'emergency-shelters': [[2, 2]],
    },
  },
  {
    id: 'car-suburb',
    name: 'Car-Dependent Suburb',
    description:
      'A sprawling suburban block with wide roads, strip malls, and almost no walkable amenities. Residents drive for everything—school, groceries, healthcare.',
    baseGrid: [
      ['housing', 'housing', 'road', 'housing', 'housing'],
      ['housing', 'empty', 'road', 'empty', 'housing'],
      ['road', 'road', 'road', 'road', 'road'],
      ['commercial', 'road', 'empty', 'road', 'commercial'],
      ['housing', 'housing', 'road', 'housing', 'housing'],
    ],
    baseIndices: {
      heat: 55,
      emissions: 82,
      evacuation: 20,
      healthAccess: 25,
    },
    availableInterventions: [
      'bike-lanes',
      'add-clinic',
      'plant-trees-main',
      'mixed-use-conversion',
    ],
    impactRules: {
      'bike-lanes': { heat: -2, emissions: -15, evacuation: 8, healthAccess: 5 },
      'add-clinic': { heat: 0, emissions: 3, evacuation: 2, healthAccess: 32 },
      'plant-trees-main': { heat: -14, emissions: -4, evacuation: 0, healthAccess: 0 },
      'mixed-use-conversion': { heat: -3, emissions: -12, evacuation: 3, healthAccess: 15 },
    },
    interventionTiles: {
      'bike-lanes': [
        [2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
      ],
      'add-clinic': [[2, 2]],  // overrides the road center
      'plant-trees-main': [
        [0, 2], [1, 2], [2, 2], [3, 1], [4, 2],
      ],
      'mixed-use-conversion': [
        [1, 1], [1, 3], [3, 0], [3, 4],
      ],
    },
  },
];

export default scenarios;
