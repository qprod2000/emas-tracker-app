import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShieldAlert,
  Coins,
  Repeat,
  Sparkles,
  Info,
} from 'lucide-react';
import { GoldData, AIPrediction } from '../types/gold';
import { formatRupiah } from '../services/exportService';

interface HeroMetricCardProps {
  data: GoldData;
  activePriceType: 'buy' | 'sell';
  setActivePriceType: (type: 'buy' | 'sell') => void;
  prediction: AIPrediction | null;
  onOpenCalculator: () => void;
}

export const HeroMetricCard: React.FC<HeroMetricCardProps> = ({
  data,
  activePriceType,
  setActivePriceType,
  prediction,
  onOpenCalculator,
}) => {
  const current = data.currentPrice;
  const isBuy = activePriceType === 'buy';
  const price = isBuy ? current.buy : current.sell;
  const changeNominal = isBuy ? current.buyChangeNominal : current.sellChangeNominal;
  const changePercent = isBuy ? current.buyChangePercent : current.sellChangePercent;
  const isPositive = changeNominal >= 0;

  const spread = current.buy - current.sell;
  const spreadPercent = ((spread / current.buy) * 100).toFixed(2);

  // Highest and lowest from 1M history
  const monthData = data.history['1M'] || [];
  const monthPrices = monthData.map((d) => d.buy);
  const highestMonth = Math.max(...monthPrices, current.buy);
  const lowestMonth = Math.min(...monthPrices, current.buy);

  return (
    <div className="space-y-4">
      {/* Header bar matching Kompas screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Harga Emas Hari Ini
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {data.lastUpdated}
          </p>
        </div>

        {/* Price View Type Selector: Harga Beli / Harga Jual */}
        <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setActivePriceType('buy')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activePriceType === 'buy'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Harga Beli
          </button>
          <button
            onClick={() => setActivePriceType('sell')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activePriceType === 'sell'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Harga Jual (Buyback)
          </button>
        </div>
      </div>

      {/* Main Grid: Golden Featured Card + Supporting Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Primary Hero Card (styled faithfully to Kompas.com) */}
        <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden group">
          {/* Background ambient gold glow */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Coins className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <span className="text-xs uppercase font-semibold text-amber-400/90 tracking-wider">
                    {isBuy ? (data.isEstimate ? 'Estimasi Harga Beli Antam' : 'Harga Beli Antam (Logam Mulia)') : (data.buybackIsEstimate ? 'Estimasi Harga Buyback Antam' : 'Harga Buyback Antam')}
                  </span>
                  <div className="text-xs text-slate-400">1 Gram Emas Batangan 24K (99.99%)</div>
                </div>
              </div>

              {prediction && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-300">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Sinyal AI: {prediction.marketSentiment}</span>
                </div>
              )}
            </div>

            {/* Price Display */}
            <div>
              <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-mono">
                  {formatRupiah(price)}
                </span>
                <span className="text-slate-400 text-sm sm:text-base font-medium">/gram</span>
              </div>

              {/* Price Delta Badge */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {isPositive ? '+' : ''}Rp {changeNominal.toLocaleString('id-ID')} ({isPositive ? '+' : ''}
                  {changePercent}%)
                </span>
                <span className="text-xs text-slate-400">dibandingkan hari kemarin</span>
              </div>
            </div>

            {/* Sub-note matching Kompas screenshot */}
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="italic flex items-center gap-1">
                <Info className="w-3 h-3 text-amber-400/80 shrink-0" />
                *Harga dapat berubah sewaktu-waktu. Sumber: Logam Mulia (Antam).
              </span>
              <button
                onClick={onOpenCalculator}
                className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 shrink-0 hidden sm:inline"
              >
                Hitung di Kalkulator
              </button>
            </div>
          </div>
        </div>

        {/* Secondary KPI Cards */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {/* Card 1: Harga Buyback / Selisih */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between shadow-md hover:border-slate-700 transition-all">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{isBuy ? 'Harga Buyback' : 'Harga Beli'}</span>
                <Repeat className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-white mt-1.5 font-mono">
                {formatRupiah(isBuy ? current.sell : current.buy)}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>+Rp {(isBuy ? current.sellChangeNominal : current.buyChangeNominal).toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 mt-2">
              Patokan jual kembali per gram
            </div>
          </div>

          {/* Card 2: Spread Margin */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between shadow-md hover:border-slate-700 transition-all">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Selisih Spread</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono">
                  {spreadPercent}%
                </span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-amber-300 mt-1.5 font-mono">
                {formatRupiah(spread)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Beli vs Buyback
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 mt-2">
              Margin per gram
            </div>
          </div>

          {/* Card 3: Tertinggi 30 Hari */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between shadow-md hover:border-slate-700 transition-all">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tertinggi 30 Hari
              </div>
              <div className="text-base sm:text-lg font-bold text-white mt-1.5 font-mono">
                {formatRupiah(highestMonth)}
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5">Rekor bulan ini</div>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 mt-2">
              Level resistance kuat
            </div>
          </div>

          {/* Card 4: Terendah 30 Hari */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between shadow-md hover:border-slate-700 transition-all">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Terendah 30 Hari
              </div>
              <div className="text-base sm:text-lg font-bold text-white mt-1.5 font-mono">
                {formatRupiah(lowestMonth)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Support acuan</div>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 mt-2">
              Batas bawah pergerakan
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
