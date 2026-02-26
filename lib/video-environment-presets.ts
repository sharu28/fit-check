export interface VideoEnvironmentPreset {
  id: string;
  label: string;
  description: string;
  promptHint: string;
  gradient: [string, string, string];
}

export const VIDEO_ENVIRONMENT_PRESETS: VideoEnvironmentPreset[] = [
  {
    id: 'studio-daylight',
    label: 'Studio Daylight',
    description: 'Soft daylight studio backdrop with clean highlights.',
    promptHint: 'Set in a bright professional studio with soft daylight.',
    gradient: ['#f8fbff', '#dbeafe', '#e2e8f0'],
  },
  {
    id: 'luxury-boutique',
    label: 'Luxury Boutique',
    description: 'Warm boutique ambiance with premium retail feel.',
    promptHint: 'Place the scene in a premium luxury boutique setting.',
    gradient: ['#fef3c7', '#f5d0a3', '#d6b48a'],
  },
  {
    id: 'marble-counter',
    label: 'Marble Counter',
    description: 'Elegant marble tabletop with polished shadows.',
    promptHint: 'Use an elegant marble tabletop product setup.',
    gradient: ['#f8fafc', '#e2e8f0', '#cbd5e1'],
  },
  {
    id: 'minimal-home',
    label: 'Minimal Home',
    description: 'Neutral lifestyle room with modern soft textures.',
    promptHint: 'Set in a minimal modern home interior.',
    gradient: ['#f9fafb', '#e5e7eb', '#d1d5db'],
  },
  {
    id: 'urban-night',
    label: 'Urban Night',
    description: 'Moody city-night atmosphere with cinematic contrast.',
    promptHint: 'Set in a cinematic urban night environment.',
    gradient: ['#0f172a', '#1e293b', '#334155'],
  },
  {
    id: 'cafe-lifestyle',
    label: 'Cafe Lifestyle',
    description: 'Warm everyday cafe tone with social vibe.',
    promptHint: 'Use a cozy lifestyle cafe environment.',
    gradient: ['#fef9c3', '#fde68a', '#f59e0b'],
  },
  {
    id: 'runway-backstage',
    label: 'Runway Backstage',
    description: 'Fashion backstage mood with cool spotlight depth.',
    promptHint: 'Frame it in a fashion runway backstage setting.',
    gradient: ['#111827', '#374151', '#9ca3af'],
  },
  {
    id: 'festive-celebration',
    label: 'Festive Celebration',
    description: 'Festive ambient glow suitable for campaign drops.',
    promptHint: 'Use a festive celebration campaign environment.',
    gradient: ['#7c2d12', '#b45309', '#f59e0b'],
  },
];

export function getVideoEnvironmentPreset(presetId: string) {
  return VIDEO_ENVIRONMENT_PRESETS.find((preset) => preset.id === presetId) ?? null;
}
