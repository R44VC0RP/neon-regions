import { getRegionRecordCount } from "./actions";
import { RegionSeeder } from "./components/RegionSeeder";
import { headers } from 'next/headers';
import { FaDatabase, FaChartLine, FaBoxes, FaShoppingCart, FaUsers, FaClock, FaArrowRight } from 'react-icons/fa';

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
      <div className="max-w-7xl mx-auto space-y-12">
        <RegionSeeder 
          regions={regions} 
          initialCounts={initialCounts}
          deploymentRegion={regionDisplayName}
        />

        {/* Query Flow Diagram */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Database Query Flow</h2>
          <p className="text-muted-foreground">
            Visual representation of complex database queries and their relationships
          </p>

          <div className="grid grid-cols-1 gap-8">
            {/* Main Statistics Flow */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaChartLine className="text-primary" />
                Main Statistics Pipeline
              </h3>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px] bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaDatabase className="text-primary" />
                    Base Tables Join
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Orders + OrderItems + Products
                  </div>
                </div>
                <FaArrowRight className="text-muted-foreground" />
                <div className="flex-1 min-w-[200px] bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaChartLine className="text-primary" />
                    Aggregate Metrics
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Revenue, Orders, Customers
                  </div>
                </div>
                <FaArrowRight className="text-muted-foreground" />
                <div className="flex-1 min-w-[200px] bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaClock className="text-primary" />
                    Time-Based Analysis
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    24h Trends, Status Distribution
                  </div>
                </div>
              </div>
            </div>

            {/* Product Analysis Flow */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaBoxes className="text-primary" />
                Product Analysis Pipeline
              </h3>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px] bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaDatabase className="text-primary" />
                    Product Data
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Products + OrderItems Join
                  </div>
                </div>
                <FaArrowRight className="text-muted-foreground" />
                <div className="flex-1 min-w-[200px] bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaShoppingCart className="text-primary" />
                    Sales Analysis
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Revenue, Units Sold, Orders
                  </div>
                </div>
                <FaArrowRight className="text-muted-foreground" />
                <div className="flex-1 min-w-[200px] bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaBoxes className="text-primary" />
                    Inventory Status
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Stock Levels, Value Analysis
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details Flow */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaShoppingCart className="text-primary" />
                Order Analysis Pipeline
              </h3>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px] bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaDatabase className="text-primary" />
                    Order Details
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Orders + Users + Items Join
                  </div>
                </div>
                <FaArrowRight className="text-muted-foreground" />
                <div className="flex-1 min-w-[200px] bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaUsers className="text-primary" />
                    Customer Metrics
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    History, Value, Frequency
                  </div>
                </div>
                <FaArrowRight className="text-muted-foreground" />
                <div className="flex-1 min-w-[200px] bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaChartLine className="text-primary" />
                    Performance Stats
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Pricing, Items, Totals
                  </div>
                </div>
              </div>
            </div>

            {/* Query Load Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background rounded-lg p-4 shadow-sm">
                <div className="text-sm font-medium mb-2">Query Complexity</div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < 4 ? 'bg-primary' : 'bg-primary/30'}`}
                    />
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Multiple JOINs & Aggregations
                </div>
              </div>
              
              <div className="bg-background rounded-lg p-4 shadow-sm">
                <div className="text-sm font-medium mb-2">Data Volume</div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < 5 ? 'bg-primary' : 'bg-primary/30'}`}
                    />
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  100k+ Records Per Table
                </div>
              </div>

              <div className="bg-background rounded-lg p-4 shadow-sm">
                <div className="text-sm font-medium mb-2">Query Frequency</div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < 3 ? 'bg-primary' : 'bg-primary/30'}`}
                    />
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  On-Demand with Caching
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
