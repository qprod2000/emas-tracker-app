import React from 'react';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Tag,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { KompasNewsItem } from '../types/gold';

interface NewsSectionProps {
  news: KompasNewsItem[];
  onAnalyzeWithAI: () => void;
  isPredicting: boolean;
}

export const NewsSection: React.FC<NewsSectionProps> = ({
  news,
  onAnalyzeWithAI,
  isPredicting,
}) => {
  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Newspaper className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Berita & Sentimen Harian
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Liputan ekonomi, moneter, dan pasar logam mulia terkini
          </p>
        </div>

        <button
          onClick={onAnalyzeWithAI}
          disabled={isPredicting}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sintesis Sentimen dengan AI</span>
        </button>
      </div>

      {/* News Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item) => {
          const isPos = item.sentiment === 'positive';
          const isNeg = item.sentiment === 'negative';

          return (
            <div
              key={item.id}
              className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div className="space-y-2.5">
                {/* Meta row: Category, Published time, Sentiment Pill */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                    {item.category}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isPos
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : isNeg
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : null}
                    <span>{isPos ? 'BULLISH / POSITIF' : isNeg ? 'BEARISH / TEKANAN' : 'NETRAL'}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                  {item.title}
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.summary}
                </p>

                {/* Impact badge */}
                <div className="text-[11px] p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="text-amber-400 font-semibold">Dampak Terhadap Emas: </span>
                  {item.impact}
                </div>
              </div>

              {/* Bottom footer: source, date, external link */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {item.publishedAt}
                </span>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                >
                  <span>Baca selengkapnya</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
