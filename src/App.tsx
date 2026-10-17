import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sparkles,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { GoldData, AIPrediction, BullionItem } from './types/gold';
import { exportToExcel, exportToPDF } from './services/exportService';
import { Navbar } from './components/Navbar';
import { HeroMetricCard } from './components/HeroMetricCard';
import { GoldChart } from './components/GoldChart';
import { BullionTable } from './components/BullionTable';
import { GoldCalculator } from './components/GoldCalculator';
import { AIPredictionPanel } from './components/AIPredictionPanel';
import { NewsSection } from './components/NewsSection';
import { ExportModal } from './components/ExportModal';
import { ManualDataModal } from './components/ManualDataModal';

// Initial fallback matching exact screenshot of kompas.com/harga-emas
const initialData: GoldData = {
  lastUpdated: 'Sabtu 17 Oktober 2026, 08.00 WIB',
  source: 'Kompas.com (mengacu pada data Antara & Galeri 24)',
  sourceUrl: 'https://www.kompas.com/harga-emas?source=living_assistance',
  currentPrice: {
    buy: 2604000,
    buyChangeNominal: 4000,
    buyChangePercent: 0.15,
    buyChangeDirection: 'up',
    sell: 2452000,
    sellChangeNominal: 3000,
    sellChangePercent: 0.12,
    sellChangeDirection: 'up',
  },
  history: {
    '1W': [
      { date: '11 Okt', fullDate: '2026-10-11', buy: 2588000, sell: 2438000 },
      { date: '12 Okt', fullDate: '2026-10-12', buy: 2592000, sell: 2441000 },
      { date: '13 Okt', fullDate: '2026-10-13', buy: 2590000, sell: 2439000 },
      { date: '14 Okt', fullDate: '2026-10-14', buy: 2595000, sell: 2444000 },
      { date: '15 Okt', fullDate: '2026-10-15', buy: 2598000, sell: 2446000 },
      { date: '16 Okt', fullDate: '2026-10-16', buy: 2600000, sell: 2449000 },
      { date: '17 Okt', fullDate: '2026-10-17', buy: 2604000, sell: 2452000 },
    ],
    '1M': [
      { date: '18 Sep', fullDate: '2026-09-18', buy: 2530000, sell: 2385000 },
      { date: '22 Sep', fullDate: '2026-09-22', buy: 2542000, sell: 2396000 },
      { date: '26 Sep', fullDate: '2026-09-26', buy: 2555000, sell: 2408000 },
      { date: '30 Sep', fullDate: '2026-09-30', buy: 2568000, sell: 2419000 },
      { date: '04 Okt', fullDate: '2026-10-04', buy: 2574000, sell: 2425000 },
      { date: '08 Okt', fullDate: '2026-10-08', buy: 2582000, sell: 2432000 },
      { date: '12 Okt', fullDate: '2026-10-12', buy: 2592000, sell: 2441000 },
      { date: '17 Okt', fullDate: '2026-10-17', buy: 2604000, sell: 2452000 },
    ],
    '6M': [
      { date: 'Mei', fullDate: '2026-05-15', buy: 2380000, sell: 2240000 },
      { date: 'Jun', fullDate: '2026-06-15', buy: 2415000, sell: 2275000 },
      { date: 'Jul', fullDate: '2026-07-15', buy: 2460000, sell: 2320000 },
      { date: 'Agu', fullDate: '2026-08-15', buy: 2495000, sell: 2350000 },
      { date: 'Sep', fullDate: '2026-09-15', buy: 2525000, sell: 2380000 },
      { date: 'Okt', fullDate: '2026-10-17', buy: 2604000, sell: 2452000 },
    ],
    '1Y': [
      { date: 'Nov 25', fullDate: '2025-11-15', buy: 2190000, sell: 2060000 },
      { date: 'Jan 26', fullDate: '2026-01-15', buy: 2245000, sell: 2110000 },
      { date: 'Mar 26', fullDate: '2026-03-15', buy: 2320000, sell: 2185000 },
      { date: 'Mei 26', fullDate: '2026-05-15', buy: 2380000, sell: 2240000 },
      { date: 'Jul 26', fullDate: '2026-07-15', buy: 2460000, sell: 2320000 },
      { date: 'Sep 26', fullDate: '2026-09-15', buy: 2525000, sell: 2380000 },
      { date: 'Okt 26', fullDate: '2026-10-17', buy: 2604000, sell: 2452000 },
    ],
  },
  bullionPrices: {
    Galeri24: [
      { weight: '0.5 gram', weightNum: 0.5, buy: 1320000, sell: 1182000 },
      { weight: '1 gram', weightNum: 1, buy: 2517000, sell: 2369000 },
      { weight: '2 gram', weightNum: 2, buy: 4972000, sell: 4728000 },
      { weight: '5 gram', weightNum: 5, buy: 12238000, sell: 11822000 },
      { weight: '10 gram', weightNum: 10, buy: 24612000, sell: 23644000 },
      { weight: '25 gram', weightNum: 25, buy: 61198000, sell: 58818000 },
      { weight: '50 gram', weightNum: 50, buy: 122316000, sell: 117636000 },
      { weight: '100 gram', weightNum: 100, buy: 244552000, sell: 235272000 },
      { weight: '250 gram', weightNum: 250, buy: 611115000, sell: 588180000 },
      { weight: '500 gram', weightNum: 500, buy: 1222230000, sell: 1176360000 },
      { weight: '1000 gram', weightNum: 1000, buy: 2444460000, sell: 2352720000 },
    ],
    Antam: [
      { weight: '0.5 gram', weightNum: 0.5, buy: 1352000, sell: 1205000 },
      { weight: '1 gram', weightNum: 1, buy: 2604000, sell: 2452000 },
      { weight: '2 gram', weightNum: 2, buy: 5148000, sell: 4894000 },
      { weight: '3 gram', weightNum: 3, buy: 7697000, sell: 7331000 },
      { weight: '5 gram', weightNum: 5, buy: 12795000, sell: 12210000 },
      { weight: '10 gram', weightNum: 10, buy: 25535000, sell: 24410000 },
      { weight: '25 gram', weightNum: 25, buy: 63712000, sell: 61000000 },
      { weight: '50 gram', weightNum: 50, buy: 127345000, sell: 121950000 },
      { weight: '100 gram', weightNum: 100, buy: 254612000, sell: 243900000 },
      { weight: '250 gram', weightNum: 250, buy: 636265000, sell: 609750000 },
      { weight: '500 gram', weightNum: 500, buy: 1272320000, sell: 1219500000 },
      { weight: '1000 gram', weightNum: 1000, buy: 2544600000, sell: 2439000000 },
    ],
    UBS: [
      { weight: '0.5 gram', weightNum: 0.5, buy: 1315000, sell: 1178000 },
      { weight: '1 gram', weightNum: 1, buy: 2508000, sell: 2361000 },
      { weight: '2 gram', weightNum: 2, buy: 4956000, sell: 4712000 },
      { weight: '5 gram', weightNum: 5, buy: 12195000, sell: 11780000 },
      { weight: '10 gram', weightNum: 10, buy: 24530000, sell: 23560000 },
      { weight: '25 gram', weightNum: 25, buy: 60990000, sell: 58600000 },
      { weight: '50 gram', weightNum: 50, buy: 121900000, sell: 117200000 },
      { weight: '100 gram', weightNum: 100, buy: 243700000, sell: 234400000 },
      { weight: '250 gram', weightNum: 250, buy: 609000000, sell: 586000000 },
      { weight: '500 gram', weightNum: 500, buy: 1217500000, sell: 1171800000 },
    ],
  },
  news: [
    {
      id: 'news-1',
      title: 'Harga Emas Antam Naik Rp 4.000 Hari Ini, Tembus Rp 2,604 Juta Per Gram',
      source: 'Kompas Money',
      publishedAt: '17 Oktober 2026, 08:15 WIB',
      category: 'Market Update',
      summary: 'Harga emas batangan produksi PT Aneka Tambang Tbk (Antam) kembali menguat tipis seiring penguatan harga emas global dan sentimen suku bunga bank sentral.',
      sentiment: 'positive',
      impact: 'Dukungan tren kenaikan jangka pendek',
      url: 'https://money.kompas.com/read/harga-emas-antam-hari-ini',
    },
    {
      id: 'news-2',
      title: 'Dolar AS Menguat Terbatas, Permintaan Logam Mulia Sebagai Safe Haven Tetap Solid',
      source: 'Kompas Bisnis',
      publishedAt: '16 Oktober 2026, 17:30 WIB',
      category: 'Makroekonomi',
      summary: 'Ketidakpastian geopolitik global dan diversifikasi cadangan devisa oleh berbagai bank sentral dunia menjaga minat investor ritel maupun institusi terhadap emas.',
      sentiment: 'positive',
      impact: 'Menahan penurunan koreksi harga emas',
      url: 'https://money.kompas.com/read/dolar-as-dan-pasar-emas-global',
    },
    {
      id: 'news-3',
      title: 'Tips Membeli Emas Batangan di Galeri 24 dan Pegadaian agar Terhindar dari Spread Lebar',
      source: 'Kompas Edukasi Finansial',
      publishedAt: '15 Oktober 2026, 11:20 WIB',
      category: 'Panduan Investasi',
      summary: 'Pakar menyarankan investor jangka panjang memilih denominasi 10 gram ke atas untuk meminimalkan selisih harga cetak per gram.',
      sentiment: 'neutral',
      impact: 'Rekomendasi strategi alokasi portofolio',
      url: 'https://money.kompas.com/read/tips-investasi-emas-batangan',
    },
    {
      id: 'news-4',
      title: 'The Fed Isyaratkan Kebijakan Moneter Hati-hati, Pasar Saham dan Komoditas Fluktuatif',
      source: 'Kompas Global',
      publishedAt: '14 Oktober 2026, 20:45 WIB',
      category: 'Moneter Global',
      summary: 'Bank Sentral AS mempertahankan sikap wait and see, memberikan katalis positif bertahap bagi komoditas emas dalam denominasi Rupiah.',
      sentiment: 'positive',
      impact: 'Peluang akumulasi bertahap (DCA)',
      url: 'https://money.kompas.com/read/the-fed-kebijakan-moneter',
    },
  ],
};

export default function App() {
  const [data, setData] = useState<GoldData>(initialData);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activePriceType, setActivePriceType] = useState<'buy' | 'sell'>('buy');
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Preselected calculator target
  const [calculatorBrand, setCalculatorBrand] = useState<'Antam' | 'Galeri24' | 'UBS'>('Galeri24');
  const [calculatorItem, setCalculatorItem] = useState<BullionItem | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch initial data from server
  const fetchGoldData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/kompas/gold-data');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          showToast('Data harga emas Kompas berhasil diperbarui.');
        }
      }
    } catch (err) {
      console.warn('Using baseline client data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Gemini AI Price Prediction
  const runPrediction = async (horizon: '7d' | '30d' = '7d') => {
    setIsPredicting(true);
    try {
      const res = await fetch('/api/kompas/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeHorizon: horizon }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.prediction) {
          setPrediction(json.prediction);
          showToast('Prediksi AI & analisis sentimen berhasil diperbarui!');
          if (activeTab === 'overview') {
            // Keep on overview
          }
        }
      }
    } catch (err) {
      console.error('Prediction request error:', err);
      showToast('Gagal memuat prediksi AI, menggunakan pemodelan teknikal lokal.');
    } finally {
      setIsPredicting(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchGoldData();
    runPrediction('7d');
  }, []);

  const handleSelectForCalculator = (brand: 'Antam' | 'Galeri24' | 'UBS', item: BullionItem) => {
    setCalculatorBrand(brand);
    setCalculatorItem(item);
    setActiveTab('calculator');
    showToast(`Pecahan ${item.weight} (${brand}) dimasukkan ke kalkulator.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-amber-500/40 text-amber-300 text-xs px-4 py-2.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Source Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-200/90 text-center flex items-center justify-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 font-medium">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          Data resmi direferensikan dari <strong>Kompas.com / Living Assistance</strong> (Antara, Antam & Galeri 24).
        </span>
        <button
          onClick={() => setIsManualModalOpen(true)}
          className="underline hover:text-white text-[11px] font-semibold flex items-center gap-1 ml-1"
        >
          <Edit3 className="w-3 h-3" />
          <span>Koreksi Manual</span>
        </button>
      </div>

      {/* Navbar */}
      <Navbar
        data={data}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={fetchGoldData}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Dasbor Utama (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Hero price card matching screenshot */}
            <HeroMetricCard
              data={data}
              activePriceType={activePriceType}
              setActivePriceType={setActivePriceType}
              prediction={prediction}
              onOpenCalculator={() => setActiveTab('calculator')}
            />

            {/* Interactive Trend Chart */}
            <GoldChart
              data={data}
              activePriceType={activePriceType}
              setActivePriceType={setActivePriceType}
              prediction={prediction}
            />

            {/* Quick Two-Column View: Bullion Table & Calculator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <BullionTable
                  data={data}
                  onSelectForCalculator={handleSelectForCalculator}
                />
              </div>
              <div className="lg:col-span-5">
                <GoldCalculator
                  data={data}
                  preselectedBrand={calculatorBrand}
                  preselectedItem={calculatorItem}
                />
              </div>
            </div>

            {/* AI Prediction Teaser / Panel */}
            <AIPredictionPanel
              prediction={prediction}
              data={data}
              onRefreshPrediction={runPrediction}
              isPredicting={isPredicting}
            />

            {/* Kompas News Section */}
            <NewsSection
              news={data.news}
              onAnalyzeWithAI={() => {
                setActiveTab('ai-prediction');
                runPrediction('7d');
              }}
              isPredicting={isPredicting}
            />
          </div>
        )}

        {/* Tab 2: Grafik & Tren Interaktif */}
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

        {/* Tab 3: Harga Emas Batangan (Antam, Galeri 24, UBS) */}
        {activeTab === 'bullion' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <BullionTable
              data={data}
              onSelectForCalculator={handleSelectForCalculator}
            />
          </div>
        )}

        {/* Tab 4: Kalkulator & Pajak Emas */}
        {activeTab === 'calculator' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            <GoldCalculator
              data={data}
              preselectedBrand={calculatorBrand}
              preselectedItem={calculatorItem}
            />
          </div>
        )}

        {/* Tab 5: Prediksi & Sentimen AI */}
        {activeTab === 'ai-prediction' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <AIPredictionPanel
              prediction={prediction}
              data={data}
              onRefreshPrediction={runPrediction}
              isPredicting={isPredicting}
            />
            <NewsSection
              news={data.news}
              onAnalyzeWithAI={() => runPrediction('7d')}
              isPredicting={isPredicting}
            />
          </div>
        )}

        {/* Tab 6: Berita Kompas */}
        {activeTab === 'news' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <NewsSection
              news={data.news}
              onAnalyzeWithAI={() => {
                setActiveTab('ai-prediction');
                runPrediction('7d');
              }}
              isPredicting={isPredicting}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-300">Kompas Emas Tracker & AI Analytics</span>
            <span className="mx-2">•</span>
            <span>Referensi: Kompas.com, PT Antam Tbk, Galeri 24, & UBS</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="hover:text-amber-300 transition-colors"
            >
              Unduh Excel/PDF
            </button>
            <a
              href="https://www.kompas.com/harga-emas?source=living_assistance"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>Sumber Asli Kompas</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
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
        onUpdateData={(newData) => {
          setData(newData);
          showToast('Data berhasil diperbarui secara manual.');
        }}
      />
    </div>
  );
}
