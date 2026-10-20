import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Coins, Edit3, ExternalLink, RefreshCw } from 'lucide-react';
import { GoldData, AIPrediction, BullionItem, PredictionMeta } from './types/gold';
import { Navbar } from './components/Navbar';
import { HeroMetricCard } from './components/HeroMetricCard';
import { GoldChart } from './components/GoldChart';
import { BullionTable } from './components/BullionTable';
import { GoldCalculator } from './components/GoldCalculator';
import { AIPredictionPanel } from './components/AIPredictionPanel';
import { NewsSection } from './components/NewsSection';
import { ExportModal } from './components/ExportModal';
import { ManualDataModal } from './components/ManualDataModal';

const API = '/api/gold';

function EmptyNotice({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{text}</p>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<GoldData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activePriceType, setActivePriceType] = useState<'buy' | 'sell'>('buy');
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [predictionMeta, setPredictionMeta] = useState<PredictionMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [calculatorBrand, setCalculatorBrand] = useState<'Antam' | 'Galeri24' | 'UBS'>('Antam');
  const [calculatorItem, setCalculatorItem] = useState<BullionItem | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchGoldData = async (silent = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}?action=data`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json.data) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setData(json.data as GoldData);
      setLoadError(null);
      if (!silent) showToast('Data harga diperbarui.');
    } catch (err: any) {
      setLoadError(err?.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const runPrediction = async (horizon: '7d' | '30d' = '7d') => {
    const h = horizon === '30d' ? '30d' : '7d';
    setIsPredicting(true);
    try {
      const res = await fetch(`${API}?action=predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeHorizon: h }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json.prediction) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      const p = json.prediction;
      // sementara: komponen lama mengharapkan angka; skor keyakinan memang tidak disediakan
      setPrediction({ ...p, confidenceScore: p.confidenceScore ?? 0 } as AIPrediction);
      setPredictionMeta({
        engine: json.engine ?? 'rule-based',
        engineError: json.engineError ?? null,
        basedOnDays: json.basedOnDays ?? null,
      });
      showToast('Proyeksi harga diperbarui.');
    } catch (err: any) {
      showToast('Gagal memuat proyeksi: ' + (err?.message || 'tidak diketahui'));
    } finally {
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    fetchGoldData(true);
    runPrediction('7d');
    const t = setInterval(() => fetchGoldData(true), 10 * 60 * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- layar muat / error (setelah semua hook) ----------
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        {loadError ? (
          <div className="max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold">Data harga emas belum bisa dimuat</p>
            <p className="text-xs text-slate-400 break-words">{loadError}</p>
            <button
              onClick={() => fetchGoldData(false)}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            Memuat harga emas...
          </div>
        )}
      </div>
    );
  }

  const hasBullion =
    data.bullionPrices.Antam.length + data.bullionPrices.Galeri24.length + data.bullionPrices.UBS.length > 0;
  const hasNews = data.news.length > 0;
  const errorKeys = data.errors ? Object.keys(data.errors) : [];

  const handleSelectForCalculator = (brand: 'Antam' | 'Galeri24' | 'UBS', item: BullionItem) => {
    setCalculatorBrand(brand);
    setCalculatorItem(item);
    setActiveTab('calculator');
    showToast(`Pecahan ${item.weight} (${brand}) dimasukkan ke kalkulator.`);
  };

  const refreshPrediction = (h?: any) => runPrediction(h === '30d' ? '30d' : '7d');

  const predictionNote =
    predictionMeta?.engineError ? (
      <p className="text-[11px] text-amber-300/90 px-1">
        Narasi AI tidak aktif: {predictionMeta.engineError}. Angka proyeksi tetap dihitung dari data harga.
      </p>
    ) : null;

  const calculatorBlock = hasBullion ? (
    <GoldCalculator data={data} preselectedBrand={calculatorBrand} preselectedItem={calculatorItem} />
  ) : (
    <EmptyNotice
      title="Kalkulator belum tersedia"
      text="Kalkulator membutuhkan tabel harga batangan per gramasi, yang belum ada sumber datanya."
    />
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-amber-500/40 text-amber-300 text-xs px-4 py-2.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Banner sumber data */}
      <div
        className={`border-b px-4 py-2 text-xs text-center flex items-center justify-center gap-x-3 gap-y-1 flex-wrap ${
          data.isEstimate
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-200/90'
        }`}
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <strong>{data.isEstimate ? 'ESTIMASI' : 'Harga resmi'}</strong>
          <span>· {data.source}</span>
        </span>
        <span className="text-[11px] opacity-80">{data.lastUpdated}</span>
        {data.officialFresh === false && (
          <span className="text-[11px] font-semibold">
            ⚠ Data resmi terakhir: {data.lastOfficialDay ?? '-'}
          </span>
        )}
        {data.buybackIsEstimate && <span className="text-[11px] opacity-80">Buyback: estimasi</span>}
        {errorKeys.length > 0 && (
          <span className="text-[11px] text-rose-300">
            Gangguan sumber: {errorKeys.map((k) => `${k} (${data.errors![k]})`).join('; ')}
          </span>
        )}
        {loadError && <span className="text-[11px] text-rose-300">Gagal memperbarui: {loadError}</span>}
        <button
          onClick={() => setIsManualModalOpen(true)}
          className="underline hover:text-white text-[11px] font-semibold flex items-center gap-1 ml-1"
        >
          <Edit3 className="w-3 h-3" />
          <span>Koreksi Manual</span>
        </button>
      </div>

      <Navbar
        data={data}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => fetchGoldData(false)}
        isLoading={isLoading}
        onExportExcel={() => setIsExportModalOpen(true)}
        onExportPDF={() => setIsExportModalOpen(true)}
        onTriggerPrediction={() => {
          setActiveTab('ai-prediction');
          runPrediction('7d');
        }}
        isPredicting={isPredicting}
        prediction={prediction}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <HeroMetricCard
              data={data}
              activePriceType={activePriceType}
              setActivePriceType={setActivePriceType}
              prediction={prediction}
              onOpenCalculator={() => setActiveTab('calculator')}
            />
            <GoldChart
              data={data}
              activePriceType={activePriceType}
              setActivePriceType={setActivePriceType}
              prediction={prediction}
            />
            {hasBullion && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <BullionTable data={data} onSelectForCalculator={handleSelectForCalculator} />
                </div>
                <div className="lg:col-span-5">{calculatorBlock}</div>
              </div>
            )}
            {predictionNote}
            <AIPredictionPanel
              prediction={prediction}
              data={data}
              onRefreshPrediction={refreshPrediction}
              isPredicting={isPredicting}
            />
            {hasNews && (
              <NewsSection
                news={data.news}
                onAnalyzeWithAI={() => {
                  setActiveTab('ai-prediction');
                  runPrediction('7d');
                }}
                isPredicting={isPredicting}
              />
            )}
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <HeroMetricCard
              data={data}
              activePriceType={activePriceType}
              setActivePriceType={setActivePriceType}
              prediction={prediction}
              onOpenCalculator={() => setActiveTab('calculator')}
            />
            <GoldChart
              data={data}
              activePriceType={activePriceType}
              setActivePriceType={setActivePriceType}
              prediction={prediction}
            />
          </div>
        )}

        {activeTab === 'bullion' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {hasBullion ? (
              <BullionTable data={data} onSelectForCalculator={handleSelectForCalculator} />
            ) : (
              <EmptyNotice
                title="Tabel harga batangan belum tersedia"
                text="Saat ini hanya harga Antam 1 gram yang tersedia dari sumber resmi. Tabel per gramasi menyusul."
              />
            )}
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">{calculatorBlock}</div>
        )}

        {activeTab === 'ai-prediction' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {predictionNote}
            <AIPredictionPanel
              prediction={prediction}
              data={data}
              onRefreshPrediction={refreshPrediction}
              isPredicting={isPredicting}
            />
            {hasNews && (
              <NewsSection
                news={data.news}
                onAnalyzeWithAI={() => runPrediction('7d')}
                isPredicting={isPredicting}
              />
            )}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {hasNews ? (
              <NewsSection
                news={data.news}
                onAnalyzeWithAI={() => {
                  setActiveTab('ai-prediction');
                  runPrediction('7d');
                }}
                isPredicting={isPredicting}
              />
            ) : (
              <EmptyNotice
                title="Berita belum tersedia"
                text="Belum ada sumber berita yang terverifikasi untuk aplikasi ini."
              />
            )}
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-300">Emas Tracker & Analitik</span>
            <span className="mx-2">•</span>
            <span>Harga Antam: Logam Mulia · Estimasi: XAU/USD (xaus.com) × kurs (exchangerate-api.com)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setIsExportModalOpen(true)} className="hover:text-amber-300 transition-colors">
              Unduh Excel/PDF
            </button>
            <a
              href="https://www.logammulia.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>Situs Logam Mulia</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.exchangerate-api.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>Kurs oleh ExchangeRate-API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={data}
        prediction={prediction}
      />

      <ManualDataModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        data={data}
        onSaved={() => {
          showToast('Data manual tersimpan.');
          fetchGoldData(true);
          runPrediction('7d');
        }}
      />
    </div>
  );
}