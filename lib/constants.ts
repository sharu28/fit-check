// Preset models for the subject selection modal
export const PRESET_MODELS = [
  { url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&q=80', label: 'South Asian Female' },
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80', label: 'Mixed Descent Female' },
  { url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80', label: 'Black Female' },
  { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', label: 'Latino Male' },
  { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80', label: 'White Male' },
  { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80', label: 'White Female' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', label: 'Bearded Male' },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80', label: 'Expressive Female' },
];

export const SCENE_PRESETS = ['Studio', 'Street', 'Beach', 'Cafe', 'Cyberpunk', 'Garden'];
export const STYLE_PRESETS = ['South Asian', 'TikTok', 'Studio', 'iPhone', 'Cartoon', '80s Movie'];
export const ASPECT_RATIOS = ['4:5', '1:1', '9:16', '16:9', '21:9'];
export const RESOLUTIONS = ['1K', '2K', '4K'];

export const MAX_GARMENTS = 4;
export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const DEFAULT_PROMPT = 'Change her frock to the new garment. Ensure the model has a South Asian complexion and descent.';

// Monthly credit allocation per plan
export const PLAN_CREDITS = {
  free: 10,
  pro: 100,
  premium: 500,
} as const;

// Credit costs per generation type (configurable)
export const CREDIT_COSTS = {
  image_1k: 6,
  image_2k: 10,
  image_4k: 16,
  video_5s: 30,
  video_10s: 60,
} as const;

// kie.ai model identifiers (swap these to change models)
export const KIE_MODELS = {
  image: 'nano-banana-pro',
  video_text: 'kling-2.6/text-to-video',
  video_image: 'kling-2.6/image-to-video',
} as const;
