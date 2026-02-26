'use client';

import type { UploadedImage, VideoEnvironmentSelection } from '@/types';
import { getVideoEnvironmentPreset } from '@/lib/video-environment-presets';

const DEFAULT_BACKGROUND_GRADIENT: [string, string] = ['#f8fafc', '#e2e8f0'];
const MAX_PRODUCTS = 4;

type SupportedAspectRatio = '16:9' | '1:1' | '9:16';

const CANVAS_SIZE_BY_RATIO: Record<SupportedAspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '1:1': { width: 1024, height: 1024 },
  '9:16': { width: 720, height: 1280 },
};

interface ComposeVideoReferenceInputParams {
  productImages: UploadedImage[];
  subjectImage: UploadedImage | null;
  environment: VideoEnvironmentSelection | null;
  aspectRatio: string;
}

function normalizeBase64(value: string) {
  if (!value) return '';
  if (value.startsWith('data:')) {
    const [, base64 = ''] = value.split(',');
    return base64;
  }
  return value;
}

function uploadedImageToDataUrl(image: UploadedImage) {
  const normalized = normalizeBase64(image.base64);
  if (normalized) {
    return `data:${image.mimeType || 'image/jpeg'};base64,${normalized}`;
  }
  return image.previewUrl;
}

function loadImage(source: UploadedImage): Promise<HTMLImageElement> {
  const src = uploadedImageToDataUrl(source);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image for video composition.'));
    image.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imgRatio = img.width / img.height;
  const targetRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;
  let offsetX = x;
  let offsetY = y;

  if (imgRatio > targetRatio) {
    drawWidth = height * imgRatio;
    offsetX = x - (drawWidth - width) / 2;
  } else {
    drawHeight = width / imgRatio;
    offsetY = y - (drawHeight - height) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imgRatio = img.width / img.height;
  const targetRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;
  let drawX = x;
  let drawY = y;

  if (imgRatio > targetRatio) {
    drawHeight = width / imgRatio;
    drawY = y + (height - drawHeight) / 2;
  } else {
    drawWidth = height * imgRatio;
    drawX = x + (width - drawWidth) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.save();
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.clip();
  drawCover(ctx, img, x, y, width, height);
  ctx.restore();
}

function pickCanvasSize(aspectRatio: string) {
  if (aspectRatio in CANVAS_SIZE_BY_RATIO) {
    return CANVAS_SIZE_BY_RATIO[aspectRatio as SupportedAspectRatio];
  }
  return CANVAS_SIZE_BY_RATIO['16:9'];
}

function drawEnvironmentBackground(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  environment: VideoEnvironmentSelection | null,
) {
  if (environment?.type === 'preset') {
    const preset = getVideoEnvironmentPreset(environment.presetId);
    const [start, mid, end] = preset?.gradient ?? ['#eef2ff', '#dbeafe', '#e2e8f0'];
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, start);
    gradient.addColorStop(0.52, mid);
    gradient.addColorStop(1, end);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  gradient.addColorStop(0, DEFAULT_BACKGROUND_GRADIENT[0]);
  gradient.addColorStop(1, DEFAULT_BACKGROUND_GRADIENT[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function drawProductGrid(
  ctx: CanvasRenderingContext2D,
  productBitmaps: HTMLImageElement[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (productBitmaps.length === 0) return;

  const products = productBitmaps.slice(0, MAX_PRODUCTS);
  const columns = products.length === 1 ? 1 : 2;
  const rows = Math.ceil(products.length / columns);
  const gap = Math.max(12, Math.round(Math.min(width, height) * 0.02));
  const tileWidth = (width - gap * (columns - 1)) / columns;
  const tileHeight = (height - gap * (rows - 1)) / rows;
  const radius = Math.max(14, Math.round(Math.min(tileWidth, tileHeight) * 0.06));

  products.forEach((image, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const tileX = x + col * (tileWidth + gap);
    const tileY = y + row * (tileHeight + gap);
    drawRoundedImage(ctx, image, tileX, tileY, tileWidth, tileHeight, radius);
  });
}

function dataUrlToUploadedImage(dataUrl: string): UploadedImage | null {
  if (!dataUrl.startsWith('data:')) return null;
  const [prefix, base64 = ''] = dataUrl.split(',');
  const mimeMatch = prefix.match(/^data:(.*?);base64$/);
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
  return {
    previewUrl: dataUrl,
    base64,
    mimeType,
  };
}

export function getEnvironmentPromptHint(
  environment: VideoEnvironmentSelection | null,
) {
  if (!environment || environment.type !== 'preset') return '';
  return getVideoEnvironmentPreset(environment.presetId)?.promptHint ?? '';
}

export async function composeVideoReferenceInput({
  productImages,
  subjectImage,
  environment,
  aspectRatio,
}: ComposeVideoReferenceInputParams): Promise<UploadedImage | null> {
  const normalizedProducts = productImages.filter(Boolean).slice(0, MAX_PRODUCTS);

  if (
    normalizedProducts.length === 1 &&
    !subjectImage &&
    !environment
  ) {
    return normalizedProducts[0];
  }

  if (!subjectImage && normalizedProducts.length === 0) {
    if (environment?.type === 'image') return environment.image;
    if (!environment || environment.type !== 'preset') return null;
  }

  const canvasSize = pickCanvasSize(aspectRatio);
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (environment?.type === 'image') {
    const envBitmap = await loadImage(environment.image);
    drawCover(ctx, envBitmap, 0, 0, canvasSize.width, canvasSize.height);
  } else {
    drawEnvironmentBackground(ctx, canvasSize.width, canvasSize.height, environment);
  }

  const cardPadding = Math.round(Math.min(canvasSize.width, canvasSize.height) * 0.055);
  const contentX = cardPadding;
  const contentY = cardPadding;
  const contentW = canvasSize.width - cardPadding * 2;
  const contentH = canvasSize.height - cardPadding * 2;

  if (environment?.type !== 'image') {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundedRectPath(ctx, contentX, contentY, contentW, contentH, Math.round(contentW * 0.03));
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(15,23,42,0.08)';
    roundedRectPath(ctx, contentX, contentY, contentW, contentH, Math.round(contentW * 0.03));
    ctx.fill();
  }

  const [subjectBitmap, ...productBitmaps] = await Promise.all([
    subjectImage ? loadImage(subjectImage) : Promise.resolve(null),
    ...normalizedProducts.map((product) => loadImage(product)),
  ]);

  const gap = Math.max(14, Math.round(Math.min(contentW, contentH) * 0.02));

  if (subjectBitmap && productBitmaps.length > 0) {
    const subjectW = Math.round(contentW * 0.35);
    const subjectX = contentX;
    const subjectY = contentY;
    const subjectH = contentH;

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    roundedRectPath(ctx, subjectX, subjectY, subjectW, subjectH, 28);
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundedRectPath(ctx, subjectX, subjectY, subjectW, subjectH, 28);
    ctx.clip();
    drawContain(ctx, subjectBitmap, subjectX, subjectY, subjectW, subjectH);
    ctx.restore();

    drawProductGrid(
      ctx,
      productBitmaps,
      subjectX + subjectW + gap,
      contentY,
      contentW - subjectW - gap,
      contentH,
    );
  } else if (subjectBitmap) {
    const subjectW = Math.round(contentW * 0.58);
    const subjectX = contentX + (contentW - subjectW) / 2;
    const subjectY = contentY;

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    roundedRectPath(ctx, subjectX, subjectY, subjectW, contentH, 30);
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundedRectPath(ctx, subjectX, subjectY, subjectW, contentH, 30);
    ctx.clip();
    drawContain(ctx, subjectBitmap, subjectX, subjectY, subjectW, contentH);
    ctx.restore();
  } else {
    drawProductGrid(ctx, productBitmaps, contentX, contentY, contentW, contentH);
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  return dataUrlToUploadedImage(dataUrl);
}
