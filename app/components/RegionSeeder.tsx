'use client';

import { Button } from "@/components/ui/button";
import { RegionCard } from "@/components/RegionCard";
import { useState, useMemo } from "react";
import { seedRegion, getRegionRecordCount } from "../actions";
import Image from "next/image";

interface Region {
  name: string;
  code: string;
  location: string;
}

interface TimingMetrics {
  total: number;
  db: number;
  queries: {
    stats: number;
    products: number;
    orders: number;
  };
  clientTotal?: number;
}

interface HistoryEntry extends TimingMetrics {
  timestamp: number;
}

interface RegionSeederProps {
  regions: Region[];
  initialCounts: Record<string, number>;
  deploymentRegion: string;
}

export function RegionSeeder({ regions, initialCounts, deploymentRegion }: RegionSeederProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [batchLoading, setBatchLoading] = useState<Record<string, boolean>>({});
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>(initialCounts);
  const [timings, setTimings] = useState<Record<string, TimingMetrics>>({});
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});

  // Calculate averages for each region
  const averages = useMemo(() => {
    const result: Record<string, TimingMetrics> = {};
    
    Object.entries(history).forEach(([regionCode, entries]) => {
      if (entries.length === 0) return;
      
      const total = entries.reduce((sum, entry) => sum + entry.total, 0) / entries.length;
      const db = entries.reduce((sum, entry) => sum + entry.db, 0) / entries.length;
      const stats = entries.reduce((sum, entry) => sum + entry.queries.stats, 0) / entries.length;
      const products = entries.reduce((sum, entry) => sum + entry.queries.products, 0) / entries.length;
      const orders = entries.reduce((sum, entry) => sum + entry.queries.orders, 0) / entries.length;
      const clientTotal = entries.reduce((sum, entry) => sum + (entry.clientTotal || 0), 0) / entries.length;

      result[regionCode] = {
        total,
        db,
        clientTotal,
        queries: { stats, products, orders }
      };
    });

    return result;
  }, [history]);

  const handleSeed = async () => {
    const newLoading = { ...loading };
    regions.forEach(region => newLoading[region.code] = true);
    setLoading(newLoading);

    try {
      for (const region of regions) {
        await seedRegion(region.code);
      }

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
      setLoading({});
    }
  };

  const handleDatabaseRequest = async (region: Region) => {
    setLoading(prev => ({ ...prev, [region.code]: true }));
    const clientStart = Date.now();
    
    try {
      const response = await fetch(`/api/database?region=${region.code}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const clientTotal = Date.now() - clientStart;
      const newTiming = {
        ...data.timing,
        clientTotal
      };

      setTimings(prev => ({
        ...prev,
        [region.code]: newTiming
      }));

      // Add to history
      setHistory(prev => ({
        ...prev,
        [region.code]: [
          ...(prev[region.code] || []),
          { ...newTiming, timestamp: Date.now() }
        ].slice(-10) // Keep only last 10 entries
      }));

      return newTiming;
    } catch (error) {
      console.error(`Error fetching data for ${region.name}:`, error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [region.code]: false }));
    }
  };

  const handleBatchRequests = async (region: Region) => {
    setBatchLoading(prev => ({ ...prev, [region.code]: true }));
    
    try {
      // Run 10 requests in sequence
      for (let i = 0; i < 10; i++) {
        await handleDatabaseRequest(region);
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      setBatchLoading(prev => ({ ...prev, [region.code]: false }));
    }
  };

  const renderGraph = (regionCode: string) => {
    const entries = history[regionCode] || [];
    if (entries.length === 0) return null;

    const maxTime = Math.max(...entries.map(e => e.clientTotal || 0));
    
    return (
      <div className="h-24 flex items-end gap-1">
        {entries.map((entry, i) => {
          const height = ((entry.clientTotal || 0) / maxTime) * 100;
          return (
            <div 
              key={entry.timestamp}
              className="flex-1 bg-primary/50 hover:bg-primary/70 transition-colors relative group"
              style={{ height: `${height}%` }}
            >
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-background border rounded px-2 py-1 text-xs whitespace-nowrap">
                {entry.clientTotal}ms
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Database Regions</h1>
          <div className="bg-muted/50 rounded-lg px-3 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
            <span>🌍</span>
            <span className="font-mono">{deploymentRegion}</span>
          </div>
        </div>
        <Button 
          onClick={handleSeed} 
          disabled={Object.values(loading).some(Boolean) || Object.values(batchLoading).some(Boolean)}
          size="lg"
        >
          {Object.values(loading).some(Boolean) ? 'Seeding...' : 'Seed All Regions'}
        </Button>
      </div>

      <div className="relative w-full h-[100px] rounded-lg overflow-hidden mx-auto max-w-7xl">
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
          <div key={region.code} className="space-y-4">
            <RegionCard
              name={region.name}
              code={region.code}
              location={region.location}
              recordCount={recordCounts[region.code] || 0}
              isLoading={loading[region.code] || batchLoading[region.code]}
              progress={loading[region.code] || batchLoading[region.code] ? null : 100}
            />
            
            {/* Current Request Timing */}
            {timings[region.code] && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Total Request Time:</span>
                  <span className="font-mono">{timings[region.code].clientTotal}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Function Time:</span>
                  <span className="font-mono">{timings[region.code].total}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Database Time:</span>
                  <span className="font-mono">{timings[region.code].db}ms</span>
                </div>
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-xs">
                    <span>Stats Query:</span>
                    <span className="font-mono">{timings[region.code].queries.stats}ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Products Query:</span>
                    <span className="font-mono">{timings[region.code].queries.products}ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Orders Query:</span>
                    <span className="font-mono">{timings[region.code].queries.orders}ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* History Graph */}
            {history[region.code]?.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Request History</span>
                  <span className="text-xs text-muted-foreground">Last {history[region.code].length} requests</span>
                </div>
                {renderGraph(region.code)}
                <div className="pt-2 border-t border-border/50 space-y-2">
                  <div className="text-xs font-medium">Averages:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Total: <span className="font-mono">{averages[region.code]?.clientTotal?.toFixed(1)}ms</span></div>
                    <div>Function: <span className="font-mono">{averages[region.code]?.total?.toFixed(1)}ms</span></div>
                    <div>Database: <span className="font-mono">{averages[region.code]?.db?.toFixed(1)}ms</span></div>
                    <div>Queries: <span className="font-mono">{(
                      (averages[region.code]?.queries.stats || 0) +
                      (averages[region.code]?.queries.products || 0) +
                      (averages[region.code]?.queries.orders || 0)
                    ).toFixed(1)}ms</span></div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => handleDatabaseRequest(region)}
                disabled={loading[region.code] || batchLoading[region.code]}
                variant="outline"
                className="flex-1"
              >
                {loading[region.code] ? 'Running Query...' : 'Run Query'}
              </Button>
              <Button 
                onClick={() => handleBatchRequests(region)}
                disabled={loading[region.code] || batchLoading[region.code]}
                variant="outline"
                className="flex-1"
              >
                {batchLoading[region.code] ? 'Running Batch...' : 'Run 10x'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
} 