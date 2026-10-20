import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Gauge,
  Compass,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Lightbulb,
  Newspaper,
  Target,
} from 'lucide-react';
import { AIPrediction, GoldData } from '../types/gold';
import { formatRupiah } from '../services/exportService';

interface AIPredictionPanelProps {
  prediction: AIPrediction | null;
  data: GoldData;
  onRefreshPrediction: (horizon: '7d' | '30d') => void;
  isPredicting: boolean;
}

export const AIPredictionPanel: React.FC<AIPredictionPanelProps> = ({
  prediction,
  data,
  onRefreshPrediction,
  isPredicting,
}) => {
  const [horizon, setHorizon] = useState<'7d' | '30d'>('7d');
  const currentPrice = data.currentPrice.buy;

  if (!prediction) {
    return (
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-bold text-white">Aktifkan Analisis & Prediksi Harga AI</h3>
          <p className="text-xs text-slate-400 mt-1">
            Sistem menghitung indikator teknikal dari riwayat harga Antam, lalu AI menulis ringkasan narasinya.
          </p>
        </div>
        <button
          onClick={() => onRefreshPrediction('7d')}
          disabled={isPredicting}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 mx-auto active:scale-95 transition-all disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isPredicting ? 'animate-spin' : ''}`} />
          <span>{isPredicting ? 'Menganalisis Berita & Tren...' : 'Mulai Analisis AI Sekarang'}</span>
        </button>
      </div>
    );
  }

  const isBullish = prediction.marketSentiment === 'BULLISH';
  const isBearish = prediction.marketSentiment === 'BEARISH';

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header with Title and Control Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Proyeksi Harga & Analisis Teknikal
            </h2>
            <p className="text-xs text-slate-400">
              Indikator dihitung dari data harga nyata (SMA, RSI, volatilitas); narasi ditulis AI
            </p>
          </div>
        </div>

        {/* Horizon selector + Re-run button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex p-1 rounded-lg bg-slate-950 border border-slate-800">
            <button
              onClick={() => {
                setHorizon('7d');
                onRefreshPrediction('7d');
              }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                horizon === '7d'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => {
                setHorizon('30d');
                onRefreshPrediction('30d');
              }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                horizon === '30d'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30 Hari
            </button>
          </div>

          <button
            onClick={() => onRefreshPrediction(horizon)}
            disabled={isPredicting}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
            title="Muat ulang analisis AI terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPredicting ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Market Sentiment Banner */}
      <div
        className={`rounded-xl p-5 border relative overflow-hidden ${
          isBullish
            ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 border-emerald-500/30'
            : isBearish
            ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/30'
            : 'bg-gradient-to-r from-slate-900 to-amber-950/30 border-amber-500/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border ${
                  isBullish
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isBearish
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {isBullish ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                SENTIMEN PASAR: {prediction.marketSentiment}
              </span>

              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                Keyakinan Model: <strong className="text-white">{prediction.confidenceScore}%</strong>
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              "{prediction.summary}"
            </p>
          </div>

          {/* Quick Signal Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 text-right">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Rekomendasi Tindakan
            </div>
            <div className="text-base font-extrabold text-amber-400 mt-1">
              {prediction.investmentStrategy.action}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Area Masuk: <span className="text-slate-200 font-mono">{prediction.investmentStrategy.entryZone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Price Ranges (Next Day, Next Week, 1 Month) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Next Day Target */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Estimasi Rentang Esok Hari</span>
            <Target className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {formatRupiah(prediction.predictedRange.nextDayMin)} - {formatRupiah(prediction.predictedRange.nextDayMax)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Saat ini:</span>
            <span className="font-mono text-slate-300">{formatRupiah(currentPrice)}</span>
          </div>
        </div>

        {/* 1 Week Target */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Estimasi Rentang 1 Pekan</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-amber-300 font-mono">
            {formatRupiah(prediction.predictedRange.nextWeekMin)} - {formatRupiah(prediction.predictedRange.nextWeekMax)}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Target Profit:</span>
            <span className="font-mono">{prediction.investmentStrategy.targetTakeProfit}</span>
          </div>
        </div>

        {/* 1 Month Target */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Target Puncak 1 Bulan</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {formatRupiah(prediction.predictedRange.target1Month)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Tingkat Risiko:</span>
            <span className="text-amber-400 font-semibold">{prediction.investmentStrategy.riskLevel}</span>
          </div>
        </div>
      </div>

      {/* Technical Indicators & Drivers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Technical Signals (4 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Indikator Teknikal Kunci
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Pola Tren:</span>
              <span className="font-bold text-emerald-400">{prediction.technicalSignals.trend}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">RSI (Relative Strength 14D):</span>
              <span className="font-mono font-bold text-amber-300">
                {prediction.technicalSignals.rsi} <span className="font-sans text-[11px] text-slate-400">(Zona Sehat)</span>
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Level Support (Batas Bawah):</span>
              <span className="font-mono font-bold text-slate-200">
                {formatRupiah(prediction.technicalSignals.supportLevel)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Level Resistance (Batas Atas):</span>
              <span className="font-mono font-bold text-amber-300">
                {formatRupiah(prediction.technicalSignals.resistanceLevel)}
              </span>
            </div>
          </div>
        </div>

        {/* Key Drivers from Kompas News & Economy (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Faktor Pendorong (Indikator Teknikal)
          </h3>

          <div className="space-y-2">
            {prediction.keyDrivers.map((driver, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs text-slate-300 p-2 rounded-lg bg-slate-900/60 border border-slate-800/50"
              >
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{driver}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-400 leading-normal border-t border-slate-800/60">
            <strong className="text-amber-400">Saran Investor Ritel: </strong>
            {prediction.investmentStrategy.advice}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-[11px] text-slate-500 italic p-3 rounded-lg bg-slate-950/50 border border-slate-800/40">
        * {prediction.disclaimer}
      </div>
    </div>
  );
};
