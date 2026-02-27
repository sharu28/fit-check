import { KIE_MODELS } from '@/lib/constants';

export type SupportedResolution = '2K' | '4K';

type VideoModelPolicy = {
  textToVideoModel: string;
  imageToVideoModel?: string;
};

type TemplateModelPolicy = {
  imageModel?: string;
  videoModel?: VideoModelPolicy;
  forcedResolution?: SupportedResolution;
  label?: string;
  notes?: string;
};

export const TEMPLATE_MODEL_MAP: Record<string, TemplateModelPolicy> = {
  'single-swap': {
    imageModel: 'nano-banana-pro',
    label: 'Single Swap',
  },
  'multi-shot': {
    imageModel: 'nano-banana-pro',
    label: 'Multi Shot',
  },
  'website-shoot': {
    imageModel: 'nano-banana-pro',
    forcedResolution: '2K',
    label: 'Website Shoot',
  },
  'social-campaign': {
    imageModel: 'nano-banana-pro',
    forcedResolution: '4K',
    label: 'Social Campaign',
  },
  'product-ads': {
    imageModel: 'nano-banana-pro',
    label: 'Product Ads',
  },
  'lookbook-editorial': {
    imageModel: 'nano-banana-pro',
    label: 'Lookbook Editorial',
  },
  'seasonal-drop': {
    imageModel: 'seedream-5',
    videoModel: {
      textToVideoModel: 'kling-3.0/text-to-video',
      imageToVideoModel: 'kling-3.0/image-to-video',
    },
    label: 'Seasonal Drop',
  },
  'marketplace-listings': {
    imageModel: 'nano-banana-pro',
    label: 'Marketplace Listings',
  },
  'launch-campaign-video': {
    videoModel: {
      textToVideoModel: 'kling-3.0/text-to-video',
      imageToVideoModel: 'kling-3.0/image-to-video',
    },
    label: 'Launch Campaign Video',
  },
  'rotation-360': {
    videoModel: {
      textToVideoModel: KIE_MODELS.video_text,
      imageToVideoModel: KIE_MODELS.video_image,
    },
    label: '360 Rotation',
  },
  'ugc-reels': {
    videoModel: {
      textToVideoModel: 'sora-2-pro/text-to-video',
      imageToVideoModel: 'sora-2-pro/image-to-video',
    },
    label: 'UGC / Reels',
  },
};

export const MODEL_FALLBACK_WARNING =
  'Preferred model unavailable, used default model for this run.';

const NORMALIZED_RESOLUTIONS: ReadonlyArray<SupportedResolution> = ['2K', '4K'];

function normalizeResolution(
  resolution: string | undefined,
): SupportedResolution {
  if (resolution && NORMALIZED_RESOLUTIONS.includes(resolution as SupportedResolution)) {
    return resolution as SupportedResolution;
  }
  return '2K';
}

export function resolveImageModel(
  templateId: string | null | undefined,
  requestedResolution: string | undefined,
) {
  const policy = templateId ? TEMPLATE_MODEL_MAP[templateId] : undefined;
  const modelId = policy?.imageModel ?? KIE_MODELS.image;
  const resolution = policy?.forcedResolution ?? normalizeResolution(requestedResolution);

  return {
    modelId,
    resolution,
    requestedModelId: modelId,
    defaultModelId: KIE_MODELS.image,
    forcedResolution: policy?.forcedResolution,
  };
}

export function resolveVideoModel(
  templateId: string | null | undefined,
  hasImageInput: boolean,
) {
  const policy = templateId ? TEMPLATE_MODEL_MAP[templateId] : undefined;
  const configuredVideoPolicy = policy?.videoModel;
  const defaultModelId = hasImageInput ? KIE_MODELS.video_image : KIE_MODELS.video_text;
  const modelId = configuredVideoPolicy
    ? hasImageInput
      ? configuredVideoPolicy.imageToVideoModel ?? configuredVideoPolicy.textToVideoModel
      : configuredVideoPolicy.textToVideoModel
    : defaultModelId;

  return {
    modelId,
    requestedModelId: modelId,
    defaultModelId,
  };
}
