export interface InterventionDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  overlayEmoji: string;
}

const interventions: Record<string, InterventionDef> = {
  'plant-trees-main': {
    id: 'plant-trees-main',
    label: 'Plant Street Trees',
    icon: '🌳',
    description: 'Add shade trees along the main road to cool surfaces and filter air.',
    overlayEmoji: '🌲',
  },
  'pedestrianize-market': {
    id: 'pedestrianize-market',
    label: 'Pedestrianize Market Road',
    icon: '🚶',
    description: 'Close Market Road to vehicles, creating a walkable corridor.',
    overlayEmoji: '🚶',
  },
  'add-clinic': {
    id: 'add-clinic',
    label: 'Add Community Clinic',
    icon: '🏥',
    description: 'Build a small clinic so residents can access healthcare on foot.',
    overlayEmoji: '🏥',
  },
  'green-roofs': {
    id: 'green-roofs',
    label: 'Install Green Roofs',
    icon: '🌿',
    description: 'Add living rooftops to commercial buildings to absorb heat and rainwater.',
    overlayEmoji: '🌿',
  },
  'elevate-roads': {
    id: 'elevate-roads',
    label: 'Elevate Evacuation Roads',
    icon: '⬆️',
    description: 'Raise key roads above flood level to keep evacuation routes passable.',
    overlayEmoji: '⬆️',
  },
  'plant-mangroves': {
    id: 'plant-mangroves',
    label: 'Plant Coastal Mangroves',
    icon: '🌴',
    description: 'Restore mangrove buffers along the waterfront to absorb storm surges.',
    overlayEmoji: '🌴',
  },
  'emergency-shelters': {
    id: 'emergency-shelters',
    label: 'Build Emergency Shelters',
    icon: '🏛️',
    description: 'Convert a building into a fortified shelter with emergency supplies.',
    overlayEmoji: '🏛️',
  },
  'bike-lanes': {
    id: 'bike-lanes',
    label: 'Add Bike Lanes',
    icon: '🚲',
    description: 'Stripe protected bike lanes on the main road to reduce car trips.',
    overlayEmoji: '🚲',
  },
  'mixed-use-conversion': {
    id: 'mixed-use-conversion',
    label: 'Convert to Mixed-Use',
    icon: '🏗️',
    description: 'Redevelop empty lots as mixed-use (shops + housing) to reduce driving.',
    overlayEmoji: '🏗️',
  },
};

export default interventions;
