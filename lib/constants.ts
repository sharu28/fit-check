export const SCENE_PRESETS = ['Studio', 'Street', 'Beach', 'Cafe', 'Cyberpunk', 'Garden'];
export const STYLE_PRESETS = ['South Asian', 'TikTok', 'Studio', 'iPhone', 'Cartoon', '80s Movie'];
export const ASPECT_RATIOS = ['4:5', '1:1', '9:16', '16:9', '21:9'];
export const RESOLUTIONS = ['2K', '4K'];

export const MAX_GARMENTS = 4;
export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const DEFAULT_PROMPT = 'Dress the person in the provided garment, maintaining their natural appearance.';

// Monthly credit allocation per plan
export const PLAN_CREDITS = {
  free: 10,
  starter: 20,
  pro: 80,
  studio: 350,
} as const;

// Credit costs per generation type (configurable)
export const CREDIT_COSTS = {
  image_2k: 1,
  image_4k: 2,
  video_5s: 3,
  video_10s: 5,
} as const;

// kie.ai model identifiers (swap these to change models)
export const KIE_MODELS = {
  image: 'nano-banana-pro',
  video_text: 'kling-2.6/text-to-video',
  video_image: 'kling-2.6/image-to-video',
} as const;
