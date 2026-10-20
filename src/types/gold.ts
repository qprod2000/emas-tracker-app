export interface PriceChange {
  buy: number;
  buyChangeNominal: number;
  buyChangePercent: number;
  buyChangeDirection: 'up' | 'down' | 'flat';
  sell: number;
  sellChangeNominal: number;
  sellChangePercent: number;
  sellChangeDirection: 'up' | 'down' | 'flat';
}

export interface HistoryPoint {
  date: string;
  fullDate: string;
  buy: number;
  sell: number;
  official?: boolean; // true = harga Antam resmi, false/undefined = estimasi
}

export interface BullionItem {
  weight: string;
  weightNum: number;
  buy: number;
  sell: number;
}

export interface KompasNewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  category: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: string;
  url: string;
}

export interface AIPrediction {
  summary: string;
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidenceScore: number | null;
  predictedRange: {
    nextDayMin: number;
    nextDayMax: number;
    nextWeekMin: number;
    nextWeekMax: number;
    target1Month: number;
  };
  technicalSignals: {
    trend: string;
    rsi: number;
    supportLevel: number;
    resistanceLevel: number;
  };
  keyDrivers: string[];
  kompasNewsAnalysis: Array<{
    headline: string;
    impact: string;
    detail: string;
  }>;
  investmentStrategy: {
    action: string;
    entryZone: string;
    targetTakeProfit: string;
    riskLevel: string;
    advice: string;
  };
  disclaimer: string;
}

export interface PredictionMeta {
  engine: string;
  engineError: string | null;
  basedOnDays: number | null;
}

export interface GoldData {
  lastUpdated: string;
  source: string;
  sourceUrl: string;
  currentPrice: PriceChange;
  history: {
    '1W': HistoryPoint[];
    '1M': HistoryPoint[];
    '6M': HistoryPoint[];
    '1Y': HistoryPoint[];
  };
  bullionPrices: {
    Antam: BullionItem[];
    Galeri24: BullionItem[];
    UBS: BullionItem[];
  };
  news: KompasNewsItem[];
  // field tambahan dari /api/gold
  priceDate?: string;
  fetchedAt?: string | null;
  isEstimate?: boolean;
  buybackIsEstimate?: boolean;
  officialFresh?: boolean;
  lastOfficialDay?: string | null;
  errors?: Record<string, string>;
  calibration?: { premium: number; premiumDay: string | null; buybackRatio: number };
  spotUsdOz?: number | null;
  usdIdr?: number | null;
}