import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listR2Objects } from '@/lib/r2';
import { createImageGeneration, createVideoGeneration } from '@/lib/kie';
import { TEMPLATE_OPTIONS } from '@/components/TemplatesExplorer';
import { TEMPLATE_MODEL_MAP } from '@/lib/template-model-map';
import { TEMPLATE_PREVIEW_PROMPTS } from '@/lib/template-preview-prompts';

function isAdminEmail(email: string): boolean {
  const csv = process.env.MODEL_PRESET_ADMIN_EMAILS ?? '';
  return csv
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

/** GET /api/admin/template-previews — list existing preview URLs from R2 */
export async function GET() {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (!publicDomain) {
    return NextResponse.json({ error: 'R2_PUBLIC_DOMAIN not configured' }, { status: 500 });
  }

  const objects = await listR2Objects('template-previews/');
  const previewMap: Record<string, string> = {};

  for (const obj of objects) {
    // Extract template ID from key like "template-previews/single-swap.jpg"
    const filename = obj.key.replace('template-previews/', '');
    const templateId = filename.replace(/\.(jpg|mp4)$/, '');
    // Prefer .mp4 over .jpg (videos override static)
    if (!previewMap[templateId] || filename.endsWith('.mp4')) {
      previewMap[templateId] = `${publicDomain}/${obj.key}`;
    }
  }

  return NextResponse.json({ previews: previewMap });
}

/** POST /api/admin/template-previews — start a generation task for a template */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { templateId } = (await request.json()) as { templateId: string };
  if (!templateId) {
    return NextResponse.json({ error: 'templateId required' }, { status: 400 });
  }

  const template = TEMPLATE_OPTIONS.find((t) => t.id === templateId);
  if (!template) {
    return NextResponse.json({ error: 'Unknown templateId' }, { status: 404 });
  }

  const prompt = TEMPLATE_PREVIEW_PROMPTS[templateId];
  if (!prompt) {
    return NextResponse.json({ error: 'No preview prompt configured for this template' }, { status: 422 });
  }

  try {
    // bg-remover: step 1 — generate source image via seedream-5 (Pixian step happens on save)
    if (template.targetTool === 'bg-remover') {
      const taskId = await createImageGeneration({
        prompt,
        imageInputs: [],
        aspectRatio: '2:3',
        resolution: '2K',
        modelOverride: 'seedream-5',
      });
      return NextResponse.json({ taskId, type: 'image', step: 'bg-source' });
    }

    // Image / mixed templates — seedream-5 text-to-image
    if (template.format === 'image' || template.format === 'mixed') {
      const taskId = await createImageGeneration({
        prompt,
        imageInputs: [],
        aspectRatio: '3:4',
        resolution: '2K',
        modelOverride: 'seedream-5',
      });
      return NextResponse.json({ taskId, type: 'image' });
    }

    // Video templates — use assigned textToVideoModel
    const policy = TEMPLATE_MODEL_MAP[templateId];
    const videoModel = policy?.videoModel?.textToVideoModel;
    if (!videoModel) {
      return NextResponse.json({ error: 'No video model configured for this template' }, { status: 422 });
    }

    const taskId = await createVideoGeneration({
      prompt,
      aspectRatio: '9:16',
      duration: 5,
      sound: false,
      modelOverride: videoModel,
    });
    return NextResponse.json({ taskId, type: 'video' });
  } catch (err) {
    console.error('[template-previews] generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
