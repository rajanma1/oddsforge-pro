const COINGECKO_API_URL = process.env.NEXT_PUBLIC_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

export interface CryptoPriceContext {
  bitcoin: { usd: number; usd_24h_change: number };
  ethereum: { usd: number; usd_24h_change: number };
}

export async function fetchCryptoContext(): Promise<CryptoPriceContext | null> {
  try {
    const res = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 300 } } // 5 minutes cache
    );
    
    if (!res.ok) {
      throw new Error('Failed to fetch crypto prices');
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching CoinGecko data:', error);
    // Remove fallback to ensure only real data is shown
    return null;
  }
}
