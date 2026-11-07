import { SNAP } from "@/lib/snap";

export const SNAP_MARKET_REVALIDATE = 30;

type DexPeriod = {
  buys?: number;
  sells?: number;
};

type DexPair = {
  url?: string;
  priceNative?: string;
  priceUsd?: string;
  fdv?: number;
  marketCap?: number;
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  volume?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
  priceChange?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
  txns?: {
    h24?: DexPeriod;
    h6?: DexPeriod;
    h1?: DexPeriod;
    m5?: DexPeriod;
  };
  pairCreatedAt?: number;
};

type DexResponse = {
  pair?: DexPair;
  pairs?: DexPair[];
};

export type SnapMarketResponse = {
  ok: boolean;
  sourceUrl?: string;
  updatedAt?: string;
  error?: string;
  attribution?: { provider: "Dexscreener"; scope: "External Ethereum listing"; protocolAdoption: "unverified"; supply: "unverified" };
  market?: {
    priceUsd: number | null;
    priceNative: number | null;
    trueFdv?: number | null;
    correctedFdv: number | null;
    dexscreenerFdv: number | null;
    fdvMultiple?: number | null;
    liquidityUsd: number | null;
    liquiditySnap: number | null;
    liquidityEth: number | null;
    volume24h: number | null;
    priceChange24h: number | null;
    priceChange6h: number | null;
    txns24h: { buys: number; sells: number; total: number } | null;
  };
};

function numberOrNull(value: unknown) {
  const number = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(number) ? number : null;
}

async function fetchDexscreener(): Promise<Response> {
  const request = () =>
    fetch(SNAP.dexscreenerApiUrl, {
      headers: {
        accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });

  let response = await request();
  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    response = await request();
  }
  return response;
}

export async function getSnapMarketData(): Promise<SnapMarketResponse> {
  try {
    const response = await fetchDexscreener();

    if (!response.ok) {
      throw new Error(`Dexscreener returned ${response.status}`);
    }

    const data = (await response.json()) as DexResponse;
    const pair = data.pair ?? data.pairs?.[0];

    if (!pair) {
      throw new Error("Dexscreener response did not include a pair");
    }

    const priceUsd = numberOrNull(pair.priceUsd);
    if (priceUsd === null || priceUsd <= 0) throw new Error("Dexscreener response did not include a valid positive price");
    // Preserve the response shape; never derive a valuation from unverified supply.
    const correctedFdv: number | null = null;
    const dexscreenerFdv = numberOrNull(pair.fdv);
    const fdvMultiple = null;
    const h24Txns = pair.txns?.h24;

    return {
      ok: true,
      sourceUrl: SNAP.dexscreenerUrl,
      attribution: { provider: "Dexscreener", scope: "External Ethereum listing", protocolAdoption: "unverified", supply: "unverified" },
      updatedAt: new Date().toISOString(),
      market: {
        priceUsd,
        priceNative: numberOrNull(pair.priceNative),
        trueFdv: correctedFdv,
        correctedFdv,
        dexscreenerFdv,
        fdvMultiple,
        liquidityUsd: numberOrNull(pair.liquidity?.usd),
        liquiditySnap: numberOrNull(pair.liquidity?.base),
        liquidityEth: numberOrNull(pair.liquidity?.quote),
        volume24h: numberOrNull(pair.volume?.h24),
        priceChange24h: numberOrNull(pair.priceChange?.h24),
        priceChange6h: numberOrNull(pair.priceChange?.h6),
        txns24h:
          typeof h24Txns?.buys === "number" || typeof h24Txns?.sells === "number"
            ? {
                buys: h24Txns?.buys ?? 0,
                sells: h24Txns?.sells ?? 0,
                total: (h24Txns?.buys ?? 0) + (h24Txns?.sells ?? 0),
              }
            : null,
      },
    };
  } catch (error) {
    return {
      ok: false,
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown market data error",
    };
  }
}
