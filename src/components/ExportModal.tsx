import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  X,
  Check,
  Download,
  CheckSquare,
  Square,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { GoldData, AIPrediction } from '../types/gold';
import { exportToExcel, exportToPDF, formatRupiah } from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GoldData;
  prediction: AIPrediction | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  data,
  prediction,
}) => {
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeBullion, setIncludeBullion] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(true);
  const [includeAI, setIncludeAI] = useState(true);
  const [exportingType, setExportingType] = useState<'excel' | 'pdf' | null>(null);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    setExportingType('excel');
    try {
      exportToExcel(data, includeAI ? prediction : null);
    } finally {
      setTimeout(() => {
        setExportingType(null);
        onClose();
      }, 600);
    }
  };

  const handleExportPDF = () => {
    setExportingType('pdf');
    try {
      exportToPDF(data, includeAI ? prediction : null);
    } finally {
      setTimeout(() => {
        setExportingType(null);
        onClose();
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ekspor Data & Laporan Harga Emas</h3>
              <p className="text-xs text-slate-400">Pilih format unduhan (Excel .xlsx atau PDF resmi)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Checklist */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Pilihan Konten Dalam Berkas:
          </label>

          <div className="space-y-2">
            {[
              {
                id: 'summary',
                label: 'Ringkasan Harga Hari Ini',
                desc: 'Harga beli acuan, harga buyback, selisih spread, dan perubahan nominal/persen.',
                checked: includeSummary,
                toggle: () => setIncludeSummary(!includeSummary),
              },
              {
                id: 'bullion',
                label: 'Daftar Pecahan Emas Batangan (Antam, Galeri 24, UBS)',
                desc: 'Tabel lengkap pecahan 0.5 gr s/d 1000 gr beserta harga beli, harga jual, dan spread.',
                checked: includeBullion,
                toggle: () => setIncludeBullion(!includeBullion),
              },
              {
                id: 'history',
                label: 'Riwayat Tren Deret Waktu (1 Minggu, 1 Bulan, 6 Bulan, 1 Tahun)',
                desc: 'Histori pergerakan harga kompas untuk analisis teknikal.',
                checked: includeHistory,
                toggle: () => setIncludeHistory(!includeHistory),
              },
              {
                id: 'ai',
                label: 'Hasil Analisis & Prediksi AI Gemini + Sentimen Berita Kompas',
                desc: 'Target harga masa depan, skor keyakinan, dan ringkasan katalis berita.',
                checked: includeAI,
                toggle: () => setIncludeAI(!includeAI),
              },
            ].map((item) => (
              <div
                key={item.id}
                onClick={item.toggle}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 flex items-start gap-3 cursor-pointer transition-all"
              >
                <div className="mt-0.5 text-amber-400">
                  {item.checked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{item.label}</div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExportExcel}
            disabled={exportingType !== null}
            className="p-3.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 font-bold text-xs border border-emerald-600/40 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md disabled:opacity-50"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>{exportingType === 'excel' ? 'Menyiapkan...' : 'Unduh File Excel (.xlsx)'}</span>
            <span className="text-[10px] text-emerald-400/70 font-normal">Multi-sheet siap olah</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exportingType !== null}
            className="p-3.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 font-bold text-xs border border-rose-600/40 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md disabled:opacity-50"
          >
            <FileText className="w-5 h-5 text-rose-400" />
            <span>{exportingType === 'pdf' ? 'Menyiapkan...' : 'Unduh Laporan PDF (.pdf)'}</span>
            <span className="text-[10px] text-rose-400/70 font-normal">Format cetak A4 rapi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
