import { CryptoPriceContext } from './api/coingecko';
import { PolymarketMarket } from './api/polymarket';

export type Recommendation = 'Strong Edge YES' | 'Moderate Edge YES' | 'Avoid' | 'Moderate Edge NO' | 'Strong Edge NO';

export interface MarketAnalysis {
  id: string;
  title: string;
  impliedProbYes: number;
  impliedProbNo: number;
  edgeScore: number;
  spread: number;
  recommendation: Recommendation;
  confidence: number;
  tradeUrl: string;
  category: string;
}

export function analyzeMarkets(markets: PolymarketMarket[], cryptoContext: CryptoPriceContext | null): MarketAnalysis[] {
  return markets.map(market => {
    // Extract YES/NO prices (Implied Probabilities)
    let probYes = 0.5;
    let probNo = 0.5;

    if (market.tokens && market.tokens.length >= 2) {
      const yesToken = market.tokens.find(t => t.outcome === 'Yes');
      const noToken = market.tokens.find(t => t.outcome === 'No');
      probYes = yesToken?.price || 0.5;
      probNo = noToken?.price || 0.5;
    } else if (market.outcomes && market.outcomePrices) {
      const yesIdx = market.outcomes.indexOf('Yes');
      const noIdx = market.outcomes.indexOf('No');
      
      if (yesIdx !== -1) probYes = parseFloat(market.outcomePrices[yesIdx]) || 0.5;
      if (noIdx !== -1) probNo = parseFloat(market.outcomePrices[noIdx]) || 0.5;
    }
    
    // Spread calculation
    const spread = Math.abs((probYes + probNo) - 1.0) * 100;
    
    // Simple heuristic for edge score calculation:
    // If it's a crypto market, compare with BTC 24h change as a proxy signal
    let edgeScore = 0; // -100 to +100 (Negative means edge on NO, Positive means edge on YES)
    let category = 'Other';
    
    const q = market.question.toLowerCase();
    
    if (q.includes('bitcoin') || q.includes('btc')) {
      category = 'Crypto';
      if (cryptoContext?.bitcoin) {
        // Example logic: if BTC is up 5% today, but market implies low probability for a BTC milestone, strong edge on YES
        const trend = cryptoContext.bitcoin.usd_24h_change;
        // Naive proxy calculation
        edgeScore = trend * 5 - (probYes * 100 - 50); 
      }
    } else if (q.includes('ai') || q.includes('openai')) {
      category = 'AI';
      // Assume positive sentiment proxy for AI
      edgeScore = 20 - (probYes * 100 - 50);
    } else if (q.includes('election') || q.includes('trump') || q.includes('biden')) {
      category = 'Politics';
      // Arbitrary edge for demo
      edgeScore = (probNo - probYes) * 20; 
    } else {
      // Random baseline edge for demo
      edgeScore = (Math.random() - 0.5) * 50;
    }
    
    // Clamp score
    edgeScore = Math.max(-100, Math.min(100, edgeScore));
    
    let recommendation: Recommendation = 'Avoid';
    const confidence = Math.abs(edgeScore);
    
    if (edgeScore > 30) recommendation = 'Strong Edge YES';
    else if (edgeScore > 10) recommendation = 'Moderate Edge YES';
    else if (edgeScore < -30) recommendation = 'Strong Edge NO';
    else if (edgeScore < -10) recommendation = 'Moderate Edge NO';
    
    return {
      id: market.id || market.conditionId,
      title: market.question,
      impliedProbYes: probYes,
      impliedProbNo: probNo,
      edgeScore: Math.round(edgeScore),
      spread: Math.round(spread * 100) / 100,
      recommendation,
      confidence: Math.round(confidence),
      tradeUrl: `https://polymarket.com/event/${market.slug}`,
      category
    };
  }).sort((a, b) => Math.abs(b.edgeScore) - Math.abs(a.edgeScore)); // Sort by biggest edge
}
