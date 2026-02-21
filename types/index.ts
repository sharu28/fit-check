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
}

export type GenerationMode = 'single' | 'panel';
export type ToolMode = 'style-studio' | 'video-generator' | 'bg-remover';

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
  type: 'upload' | 'generation' | 'video';
}

export interface UserProfile {
  id: string;
  polar_customer_id: string | null;
  plan: 'free' | 'pro' | 'premium';
  credits_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface KieTaskStatus {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrls?: string[];
  error?: string;
}

export interface ModelPreset {
  id: string;
  label: string;
  category: string;
  tags: string[];
  imageUrl: string;
  thumbnailUrl?: string | null;
  mimeType: string;
  createdAt: string;
}
