import React from 'react';
import {
  TrendingUp,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calculator,
  BarChart3,
  Layers,
  Newspaper,
} from 'lucide-react';
import { GoldData, AIPrediction } from '../types/gold';

interface NavbarProps {
  data: GoldData;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onTriggerPrediction: () => void;
  isPredicting: boolean;
  prediction: AIPrediction | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  data,
  activeTab,
  setActiveTab,
  onRefresh,
  isLoading,
  onExportExcel,
  onExportPDF,
  onTriggerPrediction,
  isPredicting,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Source */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-amber-400 font-extrabold text-lg tracking-tight font-mono">AU</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
                  KOMPAS<span className="text-amber-400">.com</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Harga Emas
                  </span>
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Diperbarui: {data.lastUpdated}</span>
                <a
                  href={data.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-amber-300 inline-flex items-center gap-0.5 transition-colors"
                  title="Buka halaman resmi kompas.com/harga-emas"
                >
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Perbarui data harga emas terbaru"
              className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            {/* AI Prediction Button */}
            <button
              onClick={onTriggerPrediction}
              disabled={isPredicting}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isPredicting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Prediksi AI</span>
              <span className="md:hidden">AI</span>
            </button>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
              <button
                onClick={onExportExcel}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold border border-emerald-700/40 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                title="Ekspor tabel dan histori lengkap ke format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Excel</span>
              </button>

              <button
                onClick={onExportPDF}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-semibold border border-rose-700/40 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                title="Unduh laporan resmi format PDF siap cetak"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden lg:inline">PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60 text-xs">
          {[
            { id: 'overview', label: 'Dasbor Utama', icon: TrendingUp },
            { id: 'chart', label: 'Grafik & Tren', icon: BarChart3 },
            { id: 'bullion', label: 'Harga Batangan', icon: Layers },
            { id: 'calculator', label: 'Kalkulator & Pajak', icon: Calculator },
            { id: 'ai-prediction', label: 'Prediksi & Sentimen AI', icon: Sparkles },
            { id: 'news', label: 'Berita Kompas', icon: Newspaper },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
