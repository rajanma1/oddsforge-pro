import { fetchTopMarkets } from "@/lib/api/polymarket";
import { fetchCryptoContext } from "@/lib/api/coingecko";
import { analyzeMarkets } from "@/lib/edge-detector";
import DashboardClient from "@/components/dashboard";
import { Activity } from "lucide-react";

export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  const markets = await fetchTopMarkets();
  const cryptoContext = await fetchCryptoContext();
  
  const analyzedMarkets = analyzeMarkets(markets, cryptoContext);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-900/30">
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              OddsForge Pro
            </h1>
          </div>
          <div className="flex items-center space-x-4 text-sm text-zinc-400">
            {cryptoContext?.bitcoin && (
              <div className="flex items-center space-x-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
                <span className="font-medium text-zinc-300">BTC</span>
                <span className="text-zinc-100">${cryptoContext.bitcoin.usd.toLocaleString()}</span>
                <span className={cryptoContext.bitcoin.usd_24h_change >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {cryptoContext.bitcoin.usd_24h_change >= 0 ? '+' : ''}{cryptoContext.bitcoin.usd_24h_change.toFixed(2)}%
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Market Intelligence</h2>
          <p className="text-zinc-400">AI-powered edge detection across top Polymarket events. Not financial advice.</p>
        </div>
        
        <DashboardClient initialMarkets={analyzedMarkets} />
      </main>
      
      <footer className="border-t border-zinc-800 py-8 mt-12 text-center text-zinc-500 text-sm">
        <p>OddsForge Pro © 2026. Data sourced from Polymarket and CoinGecko.</p>
        <p className="mt-2 text-xs">Trading involves significant risk. This tool is for informational purposes only and does not constitute financial advice.</p>
      </footer>
    </div>
  );
}
