import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeBrandDnaInput } from '@/lib/brand-dna';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('brand_dna')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch brand DNA:', error);
      return NextResponse.json({ error: 'Failed to fetch brand DNA' }, { status: 500 });
    }

    return NextResponse.json({
      brandDna: normalizeBrandDnaInput(profile?.brand_dna),
    });
  } catch (error) {
    console.error('Brand DNA GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch brand DNA' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const brandDna = normalizeBrandDnaInput(body?.brandDna ?? body);

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({
        brand_dna: brandDna,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('brand_dna')
      .single();

    if (error) {
      console.error('Failed to update brand DNA:', error);
      return NextResponse.json({ error: 'Failed to update brand DNA' }, { status: 500 });
    }

    return NextResponse.json({
      brandDna: normalizeBrandDnaInput(profile?.brand_dna),
    });
  } catch (error) {
    console.error('Brand DNA POST error:', error);
    return NextResponse.json({ error: 'Failed to update brand DNA' }, { status: 500 });
  }
}
