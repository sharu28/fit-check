/**
 * Curated prompts for generating template preview images/videos.
 * Image templates use seedream-5 text-to-image (no garment input needed).
 * Video templates use the assigned model's text-to-video with South Asian subjects.
 * bg-remover uses a multi-step flow (see admin endpoint).
 */
export const TEMPLATE_PREVIEW_PROMPTS: Record<string, string> = {
  'single-swap':
    'A Sri Lankan woman with warm brown skin wearing a trendy cream linen blazer and tailored trousers, clean studio, professional fashion photography, full body portrait, soft lighting',
  'multi-shot':
    'A 2x2 fashion lookbook panel showing a South Asian woman in four distinct stylish outfits, studio lighting, consistent framing, high-quality fashion photography',
  'website-shoot':
    'Professional e-commerce hero image, Sri Lankan woman in elegant silk midi dress, pure white background, luxury brand aesthetic, full body, sharp detail',
  'social-campaign':
    'Bold fashion campaign visual, confident South Asian woman with warm brown skin in a striking red structured jacket and wide-leg white trousers, street-style composition, high-energy social media aesthetic',
  'product-ads':
    'Premium fashion advertisement, Sri Lankan woman wearing a luxurious camel cashmere knit sweater, minimalist studio backdrop, conversion-ready framing, clean and polished',
  'lookbook-editorial':
    'High-fashion editorial photograph, South Asian woman in an oversized black trench coat, moody artistic lighting, magazine-grade composition, Vogue editorial style, film grain',
  'seasonal-drop':
    'Festive holiday fashion campaign, Sri Lankan woman in a rich burgundy velvet dress with gold accessories, warm bokeh lights in the background, seasonal luxury aesthetic',
  'marketplace-listings':
    'Clean marketplace product listing, white background, South Asian woman wearing a neat navy blue polo shirt, accurate colors, catalog-standard framing, e-commerce ready',
  'launch-campaign-video':
    'Cinematic fashion launch video, confident Sri Lankan woman revealing a new collection drop, bold slow-motion reveals, dramatic camera movement, premium brand energy, cinematic quality',
  'rotation-360':
    'Smooth 360-degree product showcase of a garment on a South Asian model, consistent rotation speed, stable framing, clean studio lighting, professional turntable style',
  'ugc-reels':
    'UGC-style fashion reel, Sri Lankan woman trying on a stylish outfit in natural indoor light, authentic creator-style handheld framing, natural movement and expressions',
  'remove-background-batch':
    'A Sri Lankan woman with warm brown skin wearing a white t-shirt and blue jeans, standing against a busy colorful outdoor street background, natural light, full body portrait, sharp detail',
};

/**
 * Prompt specifically for the kling video step of the bg-remover preview.
 * Uses the before/after composite image as the image input.
 */
export const BG_REMOVER_VIDEO_PROMPT =
  'Smooth cinematic reveal transition from the original photo on the left to a clean transparent background cutout on the right, professional before-and-after comparison, gentle horizontal reveal wipe effect';
