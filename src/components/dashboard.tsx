"use client";

import { useState, useEffect } from "react";
import { MarketAnalysis } from "@/lib/edge-detector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Star, TrendingUp, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface DashboardProps {
  initialMarkets: MarketAnalysis[];
}

export default function DashboardClient({ initialMarkets }: DashboardProps) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "watchlist">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("oddsforge_watchlist");
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse watchlist", e);
      }
    }
  }, []);

  const toggleWatchlist = (id: string) => {
    let newWatchlist;
    if (watchlist.includes(id)) {
      newWatchlist = watchlist.filter(w => w !== id);
    } else {
      newWatchlist = [...watchlist, id];
    }
    setWatchlist(newWatchlist);
    localStorage.setItem("oddsforge_watchlist", JSON.stringify(newWatchlist));
  };

  const displayedMarkets = activeTab === "watchlist" 
    ? initialMarkets.filter(m => watchlist.includes(m.id))
    : initialMarkets;

  const chartData = displayedMarkets.slice(0, 10).map(m => ({
    name: m.title.substring(0, 20) + "...",
    edge: m.edgeScore,
    probYes: m.impliedProbYes * 100,
  }));

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Top Edges Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f8fafc' }} 
                />
                <ReferenceLine y={0} stroke="#52525b" />
                <Bar dataKey="edge" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span>Intelligence Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
              <div className="text-sm text-zinc-400 mb-1">Total Markets Analyzed</div>
              <div className="text-2xl font-bold">{initialMarkets.length}</div>
            </div>
            <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-900/50">
              <div className="text-sm text-emerald-400/80 mb-1">Strong Edges Found</div>
              <div className="text-2xl font-bold text-emerald-400">
                {initialMarkets.filter(m => m.recommendation.includes('Strong')).length}
              </div>
            </div>
            <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-900/50">
              <div className="text-sm text-amber-400/80 mb-1">Markets on Watchlist</div>
              <div className="text-2xl font-bold text-amber-400">{watchlist.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex space-x-2">
          <Button 
            variant={activeTab === "all" ? "secondary" : "ghost"} 
            onClick={() => setActiveTab("all")}
          >
            All Markets
          </Button>
          <Button 
            variant={activeTab === "watchlist" ? "secondary" : "ghost"} 
            onClick={() => setActiveTab("watchlist")}
          >
            Watchlist ({watchlist.length})
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Market</TableHead>
              <TableHead className="w-24 text-right">YES</TableHead>
              <TableHead className="w-24 text-right">NO</TableHead>
              <TableHead className="w-32 text-center">Edge Score</TableHead>
              <TableHead className="w-40">Recommendation</TableHead>
              <TableHead className="w-24 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedMarkets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                  {activeTab === "watchlist" ? "Your watchlist is empty." : "No markets found."}
                </TableCell>
              </TableRow>
            ) : (
              displayedMarkets.map((market) => (
                <TableRow key={market.id}>
                  <TableCell>
                    <button 
                      onClick={() => toggleWatchlist(market.id)}
                      className="text-zinc-500 hover:text-amber-400 transition-colors"
                    >
                      <Star className={`w-5 h-5 ${watchlist.includes(market.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium max-w-md truncate" title={market.title}>
                      {market.title}
                    </div>
                    <div className="flex items-center mt-1 space-x-2">
                      <Badge variant="outline" className="text-[10px] py-0">{market.category}</Badge>
                      <span className="text-xs text-zinc-500">Spread: {market.spread.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{(market.impliedProbYes * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right font-mono text-zinc-400">{(market.impliedProbNo * 100).toFixed(1)}%</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden flex">
                        {/* A very simple visual bar for edge */}
                        <div 
                          className={`h-2.5 rounded-full ${market.edgeScore > 0 ? 'bg-emerald-500 ml-auto' : 'bg-red-500 mr-auto'}`} 
                          style={{ width: `${Math.abs(market.edgeScore)}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      market.recommendation.includes('Strong') ? (market.recommendation.includes('YES') ? 'success' : 'destructive') :
                      market.recommendation.includes('Moderate') ? 'warning' : 'secondary'
                    }>
                      {market.recommendation}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <a 
                      href={market.tradeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        // For demonstration purposes, if the link is a generic mock link, prevent default and alert
                        if (market.tradeUrl.includes('m-') || market.tradeUrl.includes('cond-')) {
                          e.preventDefault();
                          alert('This is a mock market (API fetch failed). In production, this links directly to the Polymarket trading page for ' + market.title);
                        }
                      }}
                    >
                      Trade <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
