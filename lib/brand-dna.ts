export interface BrandDnaProfile {
  brandName?: string;
  audience?: string;
  toneKeywords?: string[];
  colorPalette?: string[];
  compositionHints?: string[];
  negativeKeywords?: string[];
}

const MAX_FIELD_LENGTH = 120;
const MAX_LIST_ITEMS = 8;
const MAX_LIST_ITEM_LENGTH = 40;

function normalizeText(value: unknown, maxLength = MAX_FIELD_LENGTH): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned) return undefined;
  return cleaned.slice(0, maxLength);
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((item) => normalizeText(item, MAX_LIST_ITEM_LENGTH))
    .filter((item): item is string => Boolean(item));

  return Array.from(new Set(normalized)).slice(0, MAX_LIST_ITEMS);
}

export function normalizeBrandDnaInput(input: unknown): BrandDnaProfile {
  if (!input || typeof input !== 'object') return {};

  const source = input as Record<string, unknown>;
  const brandDna: BrandDnaProfile = {};

  const brandName = normalizeText(source.brandName, 80);
  if (brandName) brandDna.brandName = brandName;

  const audience = normalizeText(source.audience, 120);
  if (audience) brandDna.audience = audience;

  const toneKeywords = normalizeStringList(source.toneKeywords);
  if (toneKeywords.length > 0) brandDna.toneKeywords = toneKeywords;

  const colorPalette = normalizeStringList(source.colorPalette);
  if (colorPalette.length > 0) brandDna.colorPalette = colorPalette;

  const compositionHints = normalizeStringList(source.compositionHints);
  if (compositionHints.length > 0) brandDna.compositionHints = compositionHints;

  const negativeKeywords = normalizeStringList(source.negativeKeywords);
  if (negativeKeywords.length > 0) brandDna.negativeKeywords = negativeKeywords;

  return brandDna;
}

export function buildBrandDnaPromptAddendum(brandDna: BrandDnaProfile | null | undefined): string {
  if (!brandDna) return '';

  const parts: string[] = [];

  if (brandDna.brandName) parts.push(`Brand name: ${brandDna.brandName}.`);
  if (brandDna.audience) parts.push(`Target audience: ${brandDna.audience}.`);
  if (brandDna.toneKeywords?.length) {
    parts.push(`Tone: ${brandDna.toneKeywords.join(', ')}.`);
  }
  if (brandDna.colorPalette?.length) {
    parts.push(`Preferred colors: ${brandDna.colorPalette.join(', ')}.`);
  }
  if (brandDna.compositionHints?.length) {
    parts.push(`Composition guidance: ${brandDna.compositionHints.join(', ')}.`);
  }
  if (brandDna.negativeKeywords?.length) {
    parts.push(`Avoid: ${brandDna.negativeKeywords.join(', ')}.`);
  }

  if (parts.length === 0) return '';
  return `Brand DNA guidance: ${parts.join(' ')}`;
}
