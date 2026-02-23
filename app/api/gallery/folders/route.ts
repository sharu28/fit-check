import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function normalizeFolderName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) return null;
  return name.slice(0, 80);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('gallery_folders')
      .select('id, name, parent_id, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch gallery folders:', error);
      return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
    }

    const folders = (data || []).map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parent_id,
      createdAt: folder.created_at,
      updatedAt: folder.updated_at,
    }));

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Gallery folders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
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
    const name = normalizeFolderName(body?.name);
    const parentId = body?.parentId ?? null;

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    if (parentId) {
      const { data: parent, error: parentError } = await supabase
        .from('gallery_folders')
        .select('id')
        .eq('id', parentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (parentError) {
        console.error('Failed to validate parent folder:', parentError);
        return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
      }

      if (!parent) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }
    }

    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from('gallery_folders')
      .insert({
        id,
        user_id: user.id,
        parent_id: parentId,
        name,
      })
      .select('id, name, parent_id, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A folder with this name already exists here' },
          { status: 409 },
        );
      }
      console.error('Failed to create folder:', error);
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }

    return NextResponse.json({
      folder: {
        id: data.id,
        name: data.name,
        parentId: data.parent_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Gallery folders POST error:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const id = body?.id;
    const name = normalizeFolderName(body?.name);

    if (!id || !name) {
      return NextResponse.json({ error: 'Folder id and name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('gallery_folders')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, parent_id, created_at, updated_at')
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A folder with this name already exists here' },
          { status: 409 },
        );
      }
      console.error('Failed to rename folder:', error);
      return NextResponse.json({ error: 'Failed to rename folder' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json({
      folder: {
        id: data.id,
        name: data.name,
        parentId: data.parent_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Gallery folders PATCH error:', error);
    return NextResponse.json({ error: 'Failed to rename folder' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: 'Folder id is required' }, { status: 400 });
    }

    const { data: folders, error: folderFetchError } = await supabase
      .from('gallery_folders')
      .select('id, parent_id')
      .eq('user_id', user.id);

    if (folderFetchError) {
      console.error('Failed to fetch folders for delete:', folderFetchError);
      return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
    }

    const allFolders = folders || [];
    if (!allFolders.some((folder) => folder.id === id)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const childMap = new Map<string | null, string[]>();
    for (const folder of allFolders) {
      const key = folder.parent_id ?? null;
      const current = childMap.get(key) ?? [];
      current.push(folder.id);
      childMap.set(key, current);
    }

    const toDelete = new Set<string>();
    const stack = [id];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId || toDelete.has(currentId)) continue;
      toDelete.add(currentId);
      const children = childMap.get(currentId) ?? [];
      children.forEach((childId) => stack.push(childId));
    }

    const deleteIds = Array.from(toDelete);

    const { error: unassignError } = await supabase
      .from('gallery_items')
      .update({ folder_id: null })
      .eq('user_id', user.id)
      .in('folder_id', deleteIds);

    if (unassignError) {
      console.error('Failed to unassign items before folder delete:', unassignError);
      return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
    }

    const { error: deleteError } = await supabase
      .from('gallery_folders')
      .delete()
      .eq('user_id', user.id)
      .in('id', deleteIds);

    if (deleteError) {
      console.error('Failed to delete folder:', deleteError);
      return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedIds: deleteIds });
  } catch (error) {
    console.error('Gallery folders DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
