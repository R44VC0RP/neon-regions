import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const vercelId = headersList.get('x-vercel-id');
    
    return NextResponse.json({
      message: "This endpoint always runs in San Francisco region",
      region: vercelId ? vercelId.split('::')[0] : 'local',
      // This should always return 'sfo1' in production
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 