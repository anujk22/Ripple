import type { Indices, Scenario } from './scenarios';

export interface DisplayCell {
  type: string;
  overlay: string | null;
}

export function computeIndices(scenario: Scenario, activeInterventions: string[]): Indices {
  const result: Indices = { ...scenario.baseIndices };

  for (const id of activeInterventions) {
    const deltas = scenario.impactRules[id];
    if (!deltas) continue;
    result.heat += deltas.heat;
    result.emissions += deltas.emissions;
    result.evacuation += deltas.evacuation;
    result.healthAccess += deltas.healthAccess;
  }

  result.heat = clamp(result.heat);
  result.emissions = clamp(result.emissions);
  result.evacuation = clamp(result.evacuation);
  result.healthAccess = clamp(result.healthAccess);

  return result;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

export function computeAlignmentScore(indices: Indices, priority: number): number {
  const safetyFactor = 1 - priority / 100;
  const qolFactor = priority / 100;
  const safetyScore = 100 - indices.evacuation;
  const qolScore = ((100 - indices.heat) + (100 - indices.emissions) + indices.healthAccess) / 3;
  return Math.round(safetyFactor * safetyScore + qolFactor * qolScore);
}

export function generateNarrative(
  scenario: Scenario,
  activeInterventions: string[],
  indices: Indices,
  baseIndices: Indices,
  priority: number,
): string {
  if (activeInterventions.length === 0) {
    return `In this ${scenario.name.toLowerCase()}, no interventions have been applied yet. Toggle some changes to see how the indices shift and explore the trade-offs.`;
  }

  const parts: string[] = [];
  parts.push(`In this ${scenario.name.toLowerCase()}`);

  const labelMap: Record<string, string> = {
    'plant-trees-main': 'planting street trees',
    'pedestrianize-market': 'pedestrianizing Market Road',
    'add-clinic': 'adding a community clinic',
    'green-roofs': 'installing green roofs',
    'elevate-roads': 'elevating evacuation roads',
    'plant-mangroves': 'planting coastal mangroves',
    'emergency-shelters': 'building emergency shelters',
    'bike-lanes': 'adding bike lanes',
    'mixed-use-conversion': 'converting empty lots to mixed-use',
  };

  const labels = activeInterventions.map((id) => labelMap[id] || id);
  if (labels.length === 1) parts.push(`, ${labels[0]}`);
  else if (labels.length === 2) parts.push(`, ${labels[0]} and ${labels[1]}`);
  else { const last = labels.pop(); parts.push(`, ${labels.join(', ')}, and ${last}`); }

  const hD = indices.heat - baseIndices.heat;
  const eD = indices.emissions - baseIndices.emissions;
  const evD = indices.evacuation - baseIndices.evacuation;
  const hcD = indices.healthAccess - baseIndices.healthAccess;

  const goods: string[] = [];
  const bads: string[] = [];

  if (hD < -10) goods.push('significantly reduces heat exposure');
  else if (hD < -3) goods.push('lowers heat exposure');
  if (eD < -10) goods.push('cuts car emissions substantially');
  else if (eD < -3) goods.push('reduces car emissions');
  if (hcD > 15) goods.push('greatly improves health access');
  else if (hcD > 5) goods.push('improves health access');
  if (evD > 10) bads.push('noticeably increases evacuation difficulty');
  else if (evD > 3) bads.push('slightly increases evacuation complexity');
  if (eD > 3) bads.push('adds some vehicle traffic');

  if (goods.length > 0) parts.push(` ${goods.join(' and ')}`);
  parts.push('.');
  if (bads.length > 0) parts.push(` However, this ${bads.join(' and ')}.`);

  const pLabel = priority > 65 ? 'quality-of-life' : priority < 35 ? 'safety and evacuation' : 'balanced';
  if (priority > 65 && evD > 5) {
    parts.push(` With a ${pLabel} focus, the community may accept higher evacuation complexity for daily livability gains—but should plan alternative emergency routes.`);
  } else if (priority < 35 && hD < -5) {
    parts.push(` With a ${pLabel} priority, the reduced heat is a welcome bonus alongside the primary goal of keeping evacuation routes clear.`);
  } else {
    parts.push(` A ${pLabel} priority suggests these trade-offs are worth discussing with the community.`);
  }

  return parts.join('');
}

const OVERLAY_MAP: Record<string, string> = {
  'plant-trees-main': 'trees',
  'pedestrianize-market': 'pedestrian',
  'add-clinic': 'clinic',
  'green-roofs': 'greenroof',
  'elevate-roads': 'elevated',
  'plant-mangroves': 'mangrove',
  'emergency-shelters': 'shelter',
  'bike-lanes': 'bike',
  'mixed-use-conversion': 'mixeduse',
};

export function getDisplayGrid(scenario: Scenario, activeInterventions: string[]): DisplayCell[][] {
  const grid: DisplayCell[][] = scenario.baseGrid.map((row) =>
    row.map((tile) => ({ type: tile, overlay: null }))
  );

  for (const id of activeInterventions) {
    const tiles = scenario.interventionTiles[id];
    if (!tiles) continue;
    for (const [row, col] of tiles) {
      if (grid[row]?.[col]) {
        grid[row][col].overlay = OVERLAY_MAP[id] || id;
      }
    }
  }

  return grid;
}
