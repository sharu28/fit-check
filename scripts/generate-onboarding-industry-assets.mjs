#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'public', 'onboarding', 'industries');
const KIE_BASE_URL = 'https://api.kie.ai/api/v1';

const INDUSTRY_PROMPTS = {
  garments:
    'Photorealistic ecommerce scene of stylish garments in a boutique wholesale setting, folded clothing and hanging outfits, clean composition, premium studio lighting, high detail, no logos, no text.',
  fabrics:
    'Photorealistic close-up of colorful fabric and textile rolls in a wholesale market display, rich textures, natural folds, clean composition, premium lighting, no logos, no text.',
  jewelry:
    'Photorealistic luxury jewelry product arrangement with rings, necklaces, and bracelets on elegant props, premium studio lighting, shallow depth of field, no logos, no text.',
  footwear:
    'Photorealistic footwear merchandising display with sneakers and formal shoes on modern shelves, balanced composition, crisp details, premium retail lighting, no logos, no text.',
  bags:
    'Photorealistic assortment of handbags and leather goods displayed in a modern showroom, rich material texture, clean composition, premium soft lighting, no logos, no text.',
  beauty:
    'Photorealistic beauty and cosmetic products arranged for ecommerce, skincare bottles and makeup items on minimal set, soft premium lighting, clean composition, no logos, no text.',
  electronics:
    'Photorealistic consumer electronics showcase with smartphones, earbuds, and accessories arranged neatly for catalog photography, premium lighting, clean composition, no logos, no text.',
  'home-goods':
    'Photorealistic home goods assortment with decor, kitchenware, and household products styled for ecommerce, warm premium lighting, tidy composition, no logos, no text.',
  other:
    'Photorealistic mixed wholesale product assortment in a market-style display, varied categories with clean organization, premium lighting, modern ecommerce look, no logos, no text.',
};

function getArg(flag) {
  const withValue = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (!withValue) return null;
  return withValue.slice(flag.length + 1);
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function loadEnvFile() {
  const envPath = path.join(ROOT, '.env.local');
  try {
    const raw = await fs.readFile(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // Optional local env file.
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw text context below.
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText} from ${url}: ${
        parsed ? JSON.stringify(parsed) : text
      }`,
    );
  }

  return parsed;
}

function extractUrls(value, urls = []) {
  if (typeof value === 'string' && value.startsWith('http')) {
    urls.push(value);
    return urls;
  }
  if (Array.isArray(value)) {
    for (const item of value) extractUrls(item, urls);
    return urls;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) extractUrls(nested, urls);
  }
  return urls;
}

async function createTaskNanoBananaPro(apiKey, prompt) {
  const payload = {
    model: 'nano-banana-pro',
    input: {
      prompt,
      image_input: [],
      aspect_ratio: '1:1',
      resolution: '2K',
      output_format: 'png',
    },
  };

  const json = await fetchJson(`${KIE_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (json?.code !== 200 || !json?.data?.taskId) {
    throw new Error(`Failed to create nano-banana-pro task: ${JSON.stringify(json)}`);
  }

  return json.data.taskId;
}

async function createTaskNanoBanana(apiKey, prompt) {
  const payload = {
    model: 'google/nano-banana',
    input: {
      prompt,
      image_size: '1:1',
      output_format: 'png',
    },
  };

  const json = await fetchJson(`${KIE_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (json?.code !== 200 || !json?.data?.taskId) {
    throw new Error(`Failed to create google/nano-banana task: ${JSON.stringify(json)}`);
  }

  return json.data.taskId;
}

async function waitForImageUrl(apiKey, taskId) {
  const maxAttempts = 80;
  const delayMs = 3000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const status = await fetchJson(
      `${KIE_BASE_URL}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const state = status?.data?.state ?? 'unknown';
    if (state === 'success') {
      const resultJson = status?.data?.resultJson;
      const parsed =
        typeof resultJson === 'string'
          ? JSON.parse(resultJson)
          : resultJson;
      const urls = extractUrls(parsed);
      const firstImage = urls.find((url) => /\.(png|jpe?g|webp)(\?|$)/i.test(url)) ?? urls[0];
      if (!firstImage) {
        throw new Error(`Task ${taskId} completed but returned no image URL.`);
      }
      return firstImage;
    }

    if (state === 'fail') {
      throw new Error(`Task ${taskId} failed: ${status?.data?.failMsg ?? 'Unknown error'}`);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`Task ${taskId} timed out after polling.`);
}

async function downloadAndSaveWebp(url, outputFile) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status} ${response.statusText}`);
  }

  const inputBuffer = Buffer.from(await response.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer)
    .resize(1200, 960, { fit: 'cover' })
    .webp({ quality: 84 })
    .toBuffer();

  await fs.writeFile(outputFile, outputBuffer);
}

async function generateIndustryAsset(apiKey, industry, prompt) {
  const outputFile = path.join(OUTPUT_DIR, `${industry}.webp`);
  const shouldForce = hasFlag('--force');

  if (!shouldForce) {
    try {
      await fs.access(outputFile);
      console.log(`skip ${industry}: already exists`);
      return;
    } catch {
      // continue
    }
  }

  console.log(`create ${industry}: starting generation`);

  let taskId;
  try {
    taskId = await createTaskNanoBananaPro(apiKey, prompt);
  } catch (error) {
    console.log(`create ${industry}: nano-banana-pro failed, falling back to google/nano-banana`);
    taskId = await createTaskNanoBanana(apiKey, prompt);
    if (error instanceof Error) {
      console.log(`fallback reason: ${error.message}`);
    }
  }

  console.log(`create ${industry}: task ${taskId}`);
  const imageUrl = await waitForImageUrl(apiKey, taskId);
  await downloadAndSaveWebp(imageUrl, outputFile);
  console.log(`create ${industry}: saved ${path.relative(ROOT, outputFile)}`);
}

async function main() {
  await loadEnvFile();

  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    throw new Error('KIE_API_KEY is required in environment (.env.local).');
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const onlyIndustry = getArg('--only');
  const entries = Object.entries(INDUSTRY_PROMPTS).filter(([industry]) => {
    if (!onlyIndustry) return true;
    return industry === onlyIndustry;
  });

  if (entries.length === 0) {
    throw new Error(
      `No industries matched. Valid --only values: ${Object.keys(INDUSTRY_PROMPTS).join(', ')}`,
    );
  }

  for (const [industry, prompt] of entries) {
    await generateIndustryAsset(apiKey, industry, prompt);
  }

  console.log('done: onboarding industry assets generated');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

