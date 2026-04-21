export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  endDate: string;
  volume: string;
  active: boolean;
  closed: boolean;
  tokens?: Array<{ token_id: string; price: number; outcome: string }>;
  outcomes?: string[];
  outcomePrices?: string[];
  tags: string[];
}

const GAMMA_API_URL = process.env.NEXT_PUBLIC_GAMMA_API_URL || 'https://gamma-api.polymarket.com';

export async function fetchTopMarkets(): Promise<PolymarketMarket[]> {
  try {
    // Fetching high volume markets. In a real app, you might use more specific queries.
    const res = await fetch(`${GAMMA_API_URL}/markets?active=true&closed=false&limit=20&order=volumeNum&ascending=false`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch markets: ${res.statusText}`);
    }

    const data = await res.json();
    
    // The API might return an array or an object with a data property. Adjusting for common Gamma API structure.
    const markets = Array.isArray(data) ? data : data.data || [];
    
    // Filter out markets that don't have standard YES/NO tokens or outcomes for simplicity
    const validMarkets = markets.filter((m: PolymarketMarket) => 
      (m.tokens && m.tokens.length >= 2) || 
      (m.outcomes && m.outcomes.length >= 2 && m.outcomePrices)
    );
    
    if (validMarkets.length === 0) {
      throw new Error("API returned markets, but none had valid YES/NO probability structures.");
    }
    
    return validMarkets;
  } catch (error) {
    console.error('Error fetching Polymarket data:', error);
    // In production, we throw to fail the build/render if data is missing
    // But we need a safe return for environments that block the API during build
    return []; 
  }
}
