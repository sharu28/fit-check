import { KIE_MODELS } from './constants';

const KIE_BASE_URL = 'https://api.kie.ai/api/v1';
const KIE_UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-base64-upload';

interface KieApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  message?: string;
  error?: string;
  data?: T;
}

/** Recursively search an object for string values that look like URLs */
function extractUrls(obj: unknown): string[] {
  const urls: string[] = [];
  if (typeof obj === 'string' && obj.startsWith('https://')) {
    urls.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) urls.push(...extractUrls(item));
  } else if (obj && typeof obj === 'object') {
    for (const val of Object.values(obj)) urls.push(...extractUrls(val));
  }
  return urls;
}

function getHeaders(): Record<string, string> {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) throw new Error('KIE_API_KEY is not configured');

  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Upload a base64 image to kie.ai and get a URL back.
 * Files are temporary and auto-deleted after 3 days.
 */
export async function uploadImageToKie(
  base64: string,
  mimeType: string,
): Promise<string> {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) throw new Error('KIE_API_KEY is not configured');

  // kie.ai accepts data URL or pure base64 — send as data URL for automatic MIME detection
  const base64Data = base64.startsWith('data:')
    ? base64
    : `data:${mimeType};base64,${base64}`;

  const res = await fetch(KIE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Data,
      uploadPath: 'fitcheck/uploads',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`kie.ai file upload failed: ${err}`);
  }

  const json = (await res.json()) as KieApiResponse<{ downloadUrl?: string }>;
  if (json.code && json.code !== 200) {
    throw new Error(
      json.msg || json.message || json.error || 'kie.ai file upload failed',
    );
  }

  const downloadUrl = json.data?.downloadUrl;
  if (!downloadUrl) {
    throw new Error('kie.ai upload response did not include downloadUrl');
  }

  return downloadUrl;
}

/**
 * Create an image generation task using Nano Banana Pro.
 */
export async function createImageGeneration(params: {
  prompt: string;
  imageInputs: { url: string; type: 'person' | 'garment' }[];
  aspectRatio: string;
  resolution: string;
}): Promise<string> {
  const res = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: KIE_MODELS.image,
      input: {
        prompt: params.prompt,
        image_input: params.imageInputs.map((img) => img.url),
        aspect_ratio: params.aspectRatio,
        resolution: params.resolution,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`kie.ai task creation failed: ${err}`);
  }

  const json = (await res.json()) as KieApiResponse<{ taskId?: string }>;
  if (json.code && json.code !== 200) {
    throw new Error(
      json.msg ||
      json.message ||
      json.error ||
      'kie.ai image task creation failed',
    );
  }

  const taskId = json.data?.taskId;
  if (!taskId) {
    throw new Error('kie.ai image task response did not include taskId');
  }

  return taskId;
}

/**
 * Create a video generation task using Kling 2.6.
 */
export async function createVideoGeneration(params: {
  prompt: string;
  imageInput?: string; // URL of reference image
  aspectRatio: string;
  duration: 5 | 10;
  sound: boolean;
}): Promise<string> {
  const model = params.imageInput
    ? KIE_MODELS.video_image
    : KIE_MODELS.video_text;

  const input: Record<string, unknown> = {
    prompt: params.prompt,
    duration: String(params.duration),
    sound: params.sound,
  };

  if (params.imageInput) {
    // Per KIE Kling docs, image-to-video expects "image_urls".
    input.image_urls = [params.imageInput];
  } else {
    input.aspect_ratio = params.aspectRatio;
  }

  const res = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ model, input }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`kie.ai video task creation failed: ${err}`);
  }

  const json = (await res.json()) as KieApiResponse<{ taskId?: string }>;
  if (json.code && json.code !== 200) {
    throw new Error(
      json.msg ||
      json.message ||
      json.error ||
      'kie.ai video task creation failed',
    );
  }

  const taskId = json.data?.taskId;
  if (!taskId) {
    const message =
      json?.msg ||
      json?.message ||
      json?.error ||
      'kie.ai returned an invalid response for video task creation.';
    throw new Error(message);
  }
  return taskId as string;
}

/**
 * Get the status of a kie.ai task.
 */
export async function getTaskStatus(taskId: string): Promise<{
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrls?: string[];
  error?: string;
}> {
  const res = await fetch(
    `${KIE_BASE_URL}/jobs/recordInfo?taskId=${taskId}`,
    { method: 'GET', headers: getHeaders() },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`kie.ai status check failed: ${err}`);
  }

  const json = (await res.json()) as KieApiResponse<{
    state?: string;
    resultJson?: unknown;
    progress?: number;
    failMsg?: string;
    failCode?: string;
  }>;
  if (json.code && json.code !== 200) {
    throw new Error(
      json.msg ||
      json.message ||
      json.error ||
      'kie.ai status check failed',
    );
  }

  const data = json.data;
  if (!data) {
    throw new Error('kie.ai status response did not include task data');
  }

  // Log full response for debugging
  console.log('[kie.ai status]', JSON.stringify({ state: data.state, resultJson: data.resultJson, progress: data.progress }, null, 2));

  // Map kie.ai states to our internal states
  const stateMap: Record<string, 'processing' | 'completed' | 'failed'> = {
    waiting: 'processing',
    queuing: 'processing',
    generating: 'processing',
    success: 'completed',
    fail: 'failed',
  };

  // Parse resultJson to extract image/video URLs
  let resultUrls: string[] | undefined;
  if (data.state === 'success' && data.resultJson) {
    try {
      const result =
        typeof data.resultJson === 'string'
          ? JSON.parse(data.resultJson)
          : data.resultJson;

      // Try known field names
      if (result.image_url) resultUrls = [result.image_url];
      else if (result.video_url) resultUrls = [result.video_url];
      else if (result.url) resultUrls = [result.url];
      else if (result.images) resultUrls = result.images;
      else if (result.output) resultUrls = Array.isArray(result.output) ? result.output : [result.output];
      else if (Array.isArray(result)) resultUrls = result;
      else {
        // Deep search: find any string value that looks like a URL
        const urls = extractUrls(result);
        if (urls.length) resultUrls = urls;
      }
    } catch {
      console.error('Failed to parse resultJson:', data.resultJson);
    }
  }

  return {
    status:
      stateMap[(data.state ?? 'waiting') as keyof typeof stateMap] ||
      'processing',
    progress: data.progress ?? 0,
    resultUrls,
    error: data.failMsg,
  };
}
