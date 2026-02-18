import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTaskStatus } from '@/lib/kie';

export async function GET(request: NextRequest) {
  try {
    // Verify auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = request.nextUrl.searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId parameter' },
        { status: 400 },
      );
    }

    const status = await getTaskStatus(taskId);

    return NextResponse.json({
      taskId,
      status: status.status,
      progress: status.progress,
      resultUrls: status.resultUrls,
      error: status.error,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Status check failed',
      },
      { status: 500 },
    );
  }
}
