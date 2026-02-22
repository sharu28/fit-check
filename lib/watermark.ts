import sharp from 'sharp';

/**
 * Generate an SVG overlay with "Fit Check App" watermark text.
 * Scales font size relative to image width.
 */
function createWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(Math.round(width * 0.04), 16);
  const padding = Math.round(fontSize * 1.2);

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text x="${width - padding}" y="${height - padding}"
      font-family="Arial, Helvetica, sans-serif"
      font-size="${fontSize}"
      font-weight="bold"
      fill="rgba(255,255,255,0.35)"
      text-anchor="end">
      Fit Check App
    </text>
  </svg>`;

  return Buffer.from(svg);
}

/**
 * Composite a semi-transparent "Fit Check App" watermark onto an image buffer.
 * Returns a new buffer with the watermark applied.
 */
export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const w = metadata.width || 800;
  const h = metadata.height || 1000;

  const overlay = createWatermarkSvg(w, h);

  return sharp(imageBuffer)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .toBuffer();
}
