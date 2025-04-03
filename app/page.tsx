import { getRegionRecordCount } from "./actions";
import { RegionSeeder } from "./components/RegionSeeder";
import { headers } from 'next/headers';

const regions = [
  {
    name: "Cleveland, USA (East)",
    code: "us-east-2",
    location: "AWS US East 2 (Ohio)"
  },
  {
    name: "San Francisco, USA (West)",
    code: "us-west-1",
    location: "AWS US West 2 (Oregon)"
  },
  {
    name: "Singapore (Southeast)",
    code: "ap-southeast-1",
    location: "AWS Asia Pacific 1 (Singapore)"
  }
];

// Map of Vercel region codes to friendly names
const regionNames: Record<string, string> = {
  iad1: "Washington DC (iad1)",
  sfo1: "San Francisco (sfo1)",
  sin1: "Singapore (sin1)",
  hnd1: "Tokyo (hnd1)",
  cdg1: "Paris (cdg1)",
  cle1: "Cleveland (cle1)",
  dub1: "Dublin (dub1)",
  gru1: "São Paulo (gru1)",
  hkg1: "Hong Kong (hkg1)",
  pdx1: "Portland (pdx1)",
  lhr1: "London (lhr1)",
  bom1: "Mumbai (bom1)",
  fra1: "Frankfurt (fra1)",
  syd1: "Sydney (syd1)",
  kix1: "Osaka (kix1)",
  icn1: "Seoul (icn1)",
  arn1: "Stockholm (arn1)",
  cpt1: "Cape Town (cpt1)"
};

async function getInitialCounts() {
  const counts = await Promise.all(
    regions.map(async (region) => {
      const count = await getRegionRecordCount(region.code);
      return [region.code, count];
    })
  );
  return Object.fromEntries(counts);
}

async function getDeploymentRegion(): Promise<string> {
  try {
    const headersList = await headers();
    const vercelId = headersList.get('x-vercel-id');
    
    if (!vercelId) return 'local';
    
    // x-vercel-id format is: {region}::{identifier}
    // e.g., iad1::cwtlb-1743699480801-778d98ff31ce
    const region = vercelId.split('::')[0];
    return region;
  } catch (error) {
    console.error('Error getting deployment region:', error);
    return 'local';
  }
}

export default async function Home() {
  const initialCounts = await getInitialCounts();
  const deploymentRegion = await getDeploymentRegion();
  const regionDisplayName = regionNames[deploymentRegion] || `${deploymentRegion} (Unknown Region)`;
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground flex items-center justify-center space-x-2">
          <span>🌍 Deployed in:</span>
          <span className="font-mono">{regionDisplayName}</span>
        </div> */}
        <RegionSeeder 
          regions={regions} 
          initialCounts={initialCounts}
          deploymentRegion={regionDisplayName}
        />
      </div>
    </div>
  );
}
