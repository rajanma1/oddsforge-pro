import { CryptoPriceContext } from './api/coingecko';
import { PolymarketMarket } from './api/polymarket';

export type Recommendation = 'Strong Edge YES' | 'Moderate Edge YES' | 'Avoid' | 'Moderate Edge NO' | 'Strong Edge NO';

export interface MarketAnalysis {
  id: string;
  title: string;
  impliedProbYes: number;
  impliedProbNo: number;
  trueProbYes: number; // The "Fair" probability calculated by our agent
  edgeScore: number;
  spread: number;
  expectedValue: number; // % EV
  kellySize: number; // Recommended % of bankroll
  mispricing: number; // Difference between implied and fair
  recommendation: Recommendation;
  confidence: number;
  tradeUrl: string;
  category: string;
}

export function analyzeMarkets(markets: PolymarketMarket[], cryptoContext: CryptoPriceContext | null): MarketAnalysis[] {
  return markets.map(market => {
    // 1. Extract YES/NO prices (Implied Probabilities)
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

    // 2. Calculate Fair "True" Probability (Our Secret Sauce)
    // We adjust the fair probability based on external signals (Crypto prices, etc.)
    let trueProb = probYes;
    const q = market.question.toLowerCase();
    
    if (q.includes('bitcoin') || q.includes('btc')) {
      if (cryptoContext?.bitcoin) {
        const trend = cryptoContext.bitcoin.usd_24h_change;
        // If BTC is pumping, fair prob of "Yes" for milestones should be higher than market implies
        trueProb = probYes + (trend / 100) * 0.2; 
      }
    } else if (q.includes('ethereum') || q.includes('eth')) {
      if (cryptoContext?.ethereum) {
        const trend = cryptoContext.ethereum.usd_24h_change;
        trueProb = probYes + (trend / 100) * 0.2;
      }
    } else {
      // Baseline adjustment for market bias (favorite-longshot bias)
      trueProb = probYes > 0.7 ? probYes + 0.02 : probYes - 0.02;
    }
    
    // Clamp trueProb
    trueProb = Math.max(0.01, Math.min(0.99, trueProb));

    // 3. MISPRICING
    const mispricing = (trueProb - probYes) * 100;

    // 4. EXPECTED VALUE (EV)
    // EV = (Win Probability * Profit) - (Loss Probability * Stake)
    // Profit per $1 stake = (1 / Price) - 1
    const profitIfWin = (1 / probYes) - 1;
    const ev = (trueProb * profitIfWin) - (1 - trueProb);
    
    // 5. KELLY SIZING (Full Kelly)
    // f* = p - (q / b) = (bp - q) / b
    // where b is the decimal odds - 1 (profitIfWin), p is trueProb, q is (1 - p)
    let kelly = 0;
    if (ev > 0) {
      kelly = (trueProb * (profitIfWin + 1) - 1) / profitIfWin;
    }
    
    // Spread calculation
    const spread = Math.abs((probYes + probNo) - 1.0) * 100;
    
    // 6. Final Scoring & Recommendation
    const edgeScore = ev * 100;
    let recommendation: Recommendation = 'Avoid';
    const confidence = Math.abs(edgeScore);
    
    if (edgeScore > 15) recommendation = 'Strong Edge YES';
    else if (edgeScore > 5) recommendation = 'Moderate Edge YES';
    else if (edgeScore < -15) recommendation = 'Strong Edge NO';
    else if (edgeScore < -5) recommendation = 'Moderate Edge NO';
    
    return {
      id: market.id || market.conditionId,
      title: market.question,
      impliedProbYes: probYes,
      impliedProbNo: probNo,
      trueProbYes: Math.round(trueProb * 100) / 100,
      edgeScore: Math.round(edgeScore),
      spread: Math.round(spread * 100) / 100,
      expectedValue: Math.round(ev * 1000) / 10,
      kellySize: Math.max(0, Math.round(kelly * 1000) / 10), // Fractional Kelly (0.1x) is safer but we'll show full and user can adjust
      mispricing: Math.round(mispricing * 10) / 10,
      recommendation,
      confidence: Math.round(confidence),
      tradeUrl: `https://polymarket.com/market/${market.slug}`,
      category: q.includes('btc') || q.includes('eth') ? 'Crypto' : q.includes('fed') ? 'Fed' : 'General'
    };
  }).sort((a, b) => b.expectedValue - a.expectedValue); // Sort by highest EV
}
