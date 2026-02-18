export interface UploadedImage {
  file?: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  ANALYZING = 'ANALYZING',
}

export type GenerationMode = 'single' | 'panel';
export type ToolMode = 'style-studio' | 'video-generator';

export interface GenerationConfig {
  personImage: UploadedImage | null;
  garments: UploadedImage[];
  prompt: string;
  mode: GenerationMode;
  scene: string;
  visualStyle: string;
  aspectRatio: string;
  resolution: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  base64: string;
  mimeType: string;
  timestamp: number;
  type: 'upload' | 'generation';
}

export interface UserProfile {
  id: string;
  polar_customer_id: string | null;
  plan: 'free' | 'pro' | 'premium';
  created_at: string;
  updated_at: string;
}

export interface GenerationRecord {
  id: string;
  user_id: string;
  type: 'image' | 'video';
  model: string;
  task_id: string | null;
  status: 'processing' | 'completed' | 'failed';
  credits_used: number;
  result_url: string | null;
  thumbnail_url: string | null;
  prompt: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export interface KieTaskStatus {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrls?: string[];
  error?: string;
}
