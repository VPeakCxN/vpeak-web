import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    revalidatePath(path);
    return NextResponse.json({ message: 'Path revalidated' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to revalidate: ${error.message}` }, { status: 500 });
  }
}