// engine.js — pure functions that compute indices and generate narrative text.

/**
 * Compute current index values given a scenario and active interventions.
 * @param {object} scenario - a scenario config object
 * @param {string[]} activeInterventions - array of active intervention ids
 * @returns {{ heat: number, emissions: number, evacuation: number, healthAccess: number }}
 */
export function computeIndices(scenario, activeInterventions) {
  const base = { ...scenario.baseIndices };
  const result = { ...base };

  for (const id of activeInterventions) {
    const deltas = scenario.impactRules[id];
    if (!deltas) continue;
    result.heat += deltas.heat;
    result.emissions += deltas.emissions;
    result.evacuation += deltas.evacuation;
    result.healthAccess += deltas.healthAccess;
  }

  // Clamp all values to [0, 100]
  for (const key of Object.keys(result)) {
    result[key] = Math.max(0, Math.min(100, result[key]));
  }

  return result;
}

/**
 * Compute a weighted alignment/satisfaction score based on priority slider.
 * priority: 0 = full Safety focus, 100 = full Quality-of-Life focus
 */
export function computeAlignmentScore(indices, priority) {
  const safetyFactor = (1 - priority / 100);
  const qolFactor = priority / 100;

  // Safety cares about low evacuation difficulty
  const safetyScore = 100 - indices.evacuation;

  // QoL cares about low heat, low emissions, high health access
  const qolScore = ((100 - indices.heat) + (100 - indices.emissions) + indices.healthAccess) / 3;

  return Math.round(safetyFactor * safetyScore + qolFactor * qolScore);
}

/**
 * Generate a plain-language narrative for the current state.
 */
export function generateNarrative(scenario, activeInterventions, indices, baseIndices, priority) {
  if (activeInterventions.length === 0) {
    return `In this ${scenario.name.toLowerCase()}, no interventions have been applied yet. Toggle some changes above to see how the indices shift and explore the trade-offs.`;
  }

  const parts = [];

  // Opening
  parts.push(`In this ${scenario.name.toLowerCase()}`);

  // Describe what's been done
  const interventionLabels = activeInterventions.map((id) => {
    const map = {
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
    return map[id] || id;
  });

  if (interventionLabels.length === 1) {
    parts.push(`, ${interventionLabels[0]}`);
  } else if (interventionLabels.length === 2) {
    parts.push(`, ${interventionLabels[0]} and ${interventionLabels[1]}`);
  } else {
    const last = interventionLabels.pop();
    parts.push(`, ${interventionLabels.join(', ')}, and ${last}`);
  }

  // Deltas
  const heatDelta = indices.heat - baseIndices.heat;
  const emissionsDelta = indices.emissions - baseIndices.emissions;
  const evacDelta = indices.evacuation - baseIndices.evacuation;
  const healthDelta = indices.healthAccess - baseIndices.healthAccess;

  const improvements = [];
  const tradeoffs = [];

  if (heatDelta < -10) improvements.push('significantly reduces heat exposure');
  else if (heatDelta < -3) improvements.push('lowers heat exposure');

  if (emissionsDelta < -10) improvements.push('cuts car emissions substantially');
  else if (emissionsDelta < -3) improvements.push('reduces car emissions');

  if (healthDelta > 15) improvements.push('greatly improves health access');
  else if (healthDelta > 5) improvements.push('improves health access');

  if (evacDelta > 10) tradeoffs.push('noticeably increases evacuation difficulty');
  else if (evacDelta > 3) tradeoffs.push('slightly increases evacuation complexity');

  if (emissionsDelta > 3) tradeoffs.push('adds some vehicle traffic');
  if (heatDelta > 3) tradeoffs.push('slightly increases heat');

  if (improvements.length > 0) {
    parts.push(` ${improvements.join(' and ')}`);
  }

  parts.push('.');

  if (tradeoffs.length > 0) {
    parts.push(` However, this ${tradeoffs.join(' and ')}.`);
  }

  // Priority-based commentary
  const priorityLabel = priority > 65 ? 'quality-of-life' : priority < 35 ? 'safety and evacuation' : 'balanced';
  if (priority > 65 && evacDelta > 5) {
    parts.push(` With a ${priorityLabel} focus, the community may accept higher evacuation complexity for daily livability gains—but should plan alternative emergency routes.`);
  } else if (priority < 35 && heatDelta < -5) {
    parts.push(` With a ${priorityLabel} priority, the reduced heat and improved access are welcome bonuses alongside the primary goal of keeping evacuation routes clear.`);
  } else {
    parts.push(` A ${priorityLabel} priority suggests these trade-offs are worth discussing openly with the community.`);
  }

  return parts.join('');
}

/**
 * Get the grid with intervention overlays applied.
 */
export function getDisplayGrid(scenario, activeInterventions) {
  // Deep copy the base grid
  const grid = scenario.baseGrid.map((row) => row.map((tile) => ({ type: tile, overlay: null })));

  for (const id of activeInterventions) {
    const tiles = scenario.interventionTiles[id];
    if (!tiles) continue;

    const overlayMap = {
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

    for (const [row, col] of tiles) {
      if (grid[row] && grid[row][col]) {
        grid[row][col].overlay = overlayMap[id] || id;
      }
    }
  }

  return grid;
}
