import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const vercelId = headersList.get('x-vercel-id');
    
    return NextResponse.json({
      message: "This endpoint runs at the edge, closest to the user",
      region: vercelId ? vercelId.split('::')[0] : 'local',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 