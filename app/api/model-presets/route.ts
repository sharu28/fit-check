import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToR2 } from '@/lib/r2';

type CreateModelPresetBody = {
  label?: string;
  category?: string;
  tags?: string[] | string;
  mimeType?: string;
  base64?: string;
  url?: string;
};

type PostgrestLikeError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function normalizeTags(input?: string[] | string): string[] {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : input.split(',');
  return raw
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index);
}

function isAdminEmail(email: string): boolean {
  const csv = process.env.MODEL_PRESET_ADMIN_EMAILS || '';
  const admins = csv
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

function isMissingModelPresetsTable(error: PostgrestLikeError | null): boolean {
  if (!error) return false;
  if (error.code === 'PGRST205') return true;
  const haystack = [error.message, error.details, error.hint].join(' ');
  return /model_presets/i.test(haystack) && /schema.cache/i.test(haystack);
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();

    const search = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';
    const category = request.nextUrl.searchParams.get('category')?.trim().toLowerCase() || '';
    const limit = Math.min(
      Math.max(Number(request.nextUrl.searchParams.get('limit') || 60), 1),
      200,
    );

    const { data, error } = await supabase
      .from('model_presets')
      .select('id, label, category, tags, image_url, thumbnail_url, mime_type, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingModelPresetsTable(error)) {
        console.warn('model_presets table missing; returning empty presets list');
        return NextResponse.json({ presets: [], categories: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalized = (data || []).map((row) => {
      const tags = Array.isArray(row.tags)
        ? row.tags.map((t: unknown) => String(t).toLowerCase())
        : [];
      return {
        id: row.id,
        label: row.label,
        category: row.category || '',
        tags,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        mimeType: row.mime_type,
        createdAt: row.created_at,
      };
    });

    const filtered = normalized.filter((item) => {
      if (category && item.category.toLowerCase() !== category) return false;
      if (!search) return true;
      const haystack = `${item.label} ${item.category} ${item.tags.join(' ')}`.toLowerCase();
      return haystack.includes(search);
    });

    const categories = Array.from(
      new Set(filtered.map((item) => item.category).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ presets: filtered, categories });
  } catch (error) {
    console.error('Model presets fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch model presets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();

    if (!isAdminEmail(userEmail)) {
      return NextResponse.json(
        { error: 'Forbidden: only preset admins can upload model presets' },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CreateModelPresetBody;
    const label = body.label?.trim();
    const category = body.category?.trim().toLowerCase() || '';
    const mimeType = body.mimeType || 'image/jpeg';
    const tags = normalizeTags(body.tags);

    if (!label) {
      return NextResponse.json({ error: 'label is required' }, { status: 400 });
    }

    if (!body.base64 && !body.url) {
      return NextResponse.json(
        { error: 'Either base64 or url is required' },
        { status: 400 },
      );
    }

    let imageBuffer: Buffer;
    if (body.base64) {
      imageBuffer = Buffer.from(body.base64, 'base64');
    } else {
      const imageRes = await fetch(body.url!);
      if (!imageRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch source image URL' }, { status: 400 });
      }
      const arrayBuffer = await imageRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    const id = crypto.randomUUID();
    const extension = mimeType.includes('png') ? 'png' : 'jpg';
    const imageKey = `shared/model-presets/${id}.${extension}`;
    const imageUrl = await uploadToR2(imageKey, imageBuffer, mimeType);

    let thumbnailUrl: string | null = null;
    try {
      const thumbBuffer = await sharp(imageBuffer)
        .resize(300, 400, { fit: 'cover' })
        .webp({ quality: 82 })
        .toBuffer();
      const thumbKey = `shared/model-presets/thumbs/${id}.webp`;
      thumbnailUrl = await uploadToR2(thumbKey, thumbBuffer, 'image/webp');
    } catch (thumbError) {
      console.error('Model preset thumbnail generation failed:', thumbError);
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('model_presets')
      .insert({
        id,
        label,
        category,
        tags,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        mime_type: mimeType,
        created_by: userId,
        created_at: now,
      })
      .select('id, label, category, tags, image_url, thumbnail_url, mime_type, created_at')
      .single();

    if (error) {
      if (isMissingModelPresetsTable(error)) {
        return NextResponse.json(
          { error: 'Model presets are not configured yet. Ask an admin to run database migrations.' },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      preset: {
        id: data.id,
        label: data.label,
        category: data.category || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        imageUrl: data.image_url,
        thumbnailUrl: data.thumbnail_url,
        mimeType: data.mime_type,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Model preset create error:', error);
    return NextResponse.json({ error: 'Failed to create model preset' }, { status: 500 });
  }
}
