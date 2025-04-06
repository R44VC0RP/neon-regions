'use client';

import { Button } from "@/components/ui/button";
import { RegionCard } from "@/components/RegionCard";
import { useEffect, useState } from "react";
import { seedRegion, getRegionRecordCount } from "../actions";
import Image from "next/image";

interface Region {
  name: string;
  code: string;
  location: string;
}

interface RegionSeederProps {
  regions: Region[];
  initialCounts: Record<string, number>;
  deploymentRegion: string;
}

export function RegionSeeder({ regions, initialCounts, deploymentRegion }: RegionSeederProps) {
  const [loading, setLoading] = useState(false);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>(initialCounts);
  const [functionRegion, setFunctionRegion] = useState<string>('');

  useEffect(() => {
    const fetchFunctionRegion = async () => {
      const region = await getFunctionRegion();
      setFunctionRegion(region);
    };
    fetchFunctionRegion();
  }, []);
  
  const handleSeed = async () => {
    setLoading(true);

    try {
      // Process each region sequentially to avoid overwhelming the databases
      for (const region of regions) {
        await seedRegion(region.code);
      }

      // Get record counts after seeding
      const counts = await Promise.all(
        regions.map(async (region) => {
          const count = await getRegionRecordCount(region.code);
          return [region.code, count];
        })
      );

      setRecordCounts(Object.fromEntries(counts));
    } catch (error) {
      console.error('Error seeding databases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFunctionRegion = async () => {
    const response = await fetch('/api/region', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.region;
  };

  

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Database Regions</h1>
          <div className="bg-muted/50 rounded-lg px-3 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
            <span>🌍</span>
            <span className="font-mono">Deployment Region: {deploymentRegion} </span>
            <span className="font-mono">Function Region: {functionRegion} </span>
          </div>
        </div>
        <Button 
          onClick={handleSeed} 
          disabled={loading}
          size="lg"
        >
          {loading ? 'Seeding...' : 'Seed All Regions'}
        </Button>
      </div>

      <div className="relative w-full h-[600px] rounded-lg overflow-hidden mx-auto max-w-7xl">
        <Image
          src="/hero.png"
          alt="Database Regions Hero"
          fill
          className="object-cover align-top"
          priority
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto max-w-7xl">
        {regions.map((region) => (
          <RegionCard
            key={region.code}
            name={region.name}
            code={region.code}
            location={region.location}
            recordCount={recordCounts[region.code] || 0}
            isLoading={loading}
            progress={loading ? null : 100}
          />
        ))}
      </div>
    </>
  );
} 