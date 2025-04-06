import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const vercelId = headersList.get('x-vercel-id');
    
    if (!vercelId) {
      return NextResponse.json({ region: 'local' });
    }
    
    // x-vercel-id format is: {region}::{identifier}
    // e.g., iad1::cwtlb-1743699480801-778d98ff31ce
    const region = vercelId.split('::')[0];
    
    return NextResponse.json({ region });
  } catch (error) {
    console.error('Error getting deployment region:', error);
    return NextResponse.json({ region: 'local', error: 'Failed to determine region' }, { status: 500 });
  }
}


