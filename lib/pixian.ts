/**
 * Pixian.AI background removal API client.
 * Docs: https://pixian.ai/api
 */
export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const apiId = process.env.PIXIAN_API_ID;
  const apiSecret = process.env.PIXIAN_API_SECRET;

  if (!apiId || !apiSecret) {
    throw new Error('PIXIAN_API_ID and PIXIAN_API_SECRET must be configured');
  }

  const formData = new FormData();
  formData.append('image', new Blob([imageBuffer]), 'image.png');

  const res = await fetch('https://api.pixian.ai/api/v2/remove-background', {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' + Buffer.from(`${apiId}:${apiSecret}`).toString('base64'),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pixian API error (${res.status}): ${err}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
