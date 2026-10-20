import React, { useState, useEffect } from 'react';
import {
  Calculator,
  ArrowRightLeft,
  Copy,
  Check,
  Share2,
  Sparkles,
  Info,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { GoldData, BullionItem } from '../types/gold';
import { formatRupiah } from '../services/exportService';

interface GoldCalculatorProps {
  data: GoldData;
  preselectedBrand?: 'Antam' | 'Galeri24' | 'UBS';
  preselectedItem?: BullionItem | null;
}

type Direction = 'gramToRp' | 'rpToGram';
type PriceType = 'buy' | 'sell';
type TaxOption = 'npwp' | 'nonNpwp' | 'none';

export const GoldCalculator: React.FC<GoldCalculatorProps> = ({
  data,
  preselectedBrand = 'Galeri24',
  preselectedItem = null,
}) => {
  const [direction, setDirection] = useState<Direction>('gramToRp');
  const [priceType, setPriceType] = useState<PriceType>('buy');
  const [selectedBrand, setSelectedBrand] = useState<'Kompas' | 'Antam' | 'Galeri24' | 'UBS'>('Kompas');
  const [gramInput, setGramInput] = useState<string>('1');
  const [rpInput, setRpInput] = useState<string>('2604000');
  const [taxOption, setTaxOption] = useState<TaxOption>('npwp');
  const [copied, setCopied] = useState<boolean>(false);

  // Sync when preselectedItem arrives from table
  useEffect(() => {
    if (preselectedItem && preselectedBrand) {
      setSelectedBrand(preselectedBrand);
      setGramInput(preselectedItem.weightNum.toString());
      setDirection('gramToRp');
    }
  }, [preselectedItem, preselectedBrand]);

  // Determine effective per gram rate based on selected brand & priceType
  const ratePerGram = React.useMemo(() => {
    if (selectedBrand === 'Kompas') {
      return priceType === 'buy' ? data.currentPrice.buy : data.currentPrice.sell;
    }
    const list = data.bullionPrices[selectedBrand] || [];
    // If exact weight matches an item in bullion list, use that item's price / weight
    const numGrams = parseFloat(gramInput) || 1;
    const exactMatch = list.find((item) => item.weightNum === numGrams);
    if (exactMatch) {
      return priceType === 'buy' ? exactMatch.buy / exactMatch.weightNum : exactMatch.sell / exactMatch.weightNum;
    }
    // Otherwise fallback to 1 gram price of that brand
    const oneGram = list.find((item) => item.weightNum === 1);
    if (oneGram) {
      return priceType === 'buy' ? oneGram.buy : oneGram.sell;
    }
    return data.currentPrice.buy;
  }, [selectedBrand, priceType, data, gramInput]);

  // Tax rates: PPh 22 untuk emas batangan
  // Memiliki NPWP: 0.45% (atau 0.25% untuk buyback di atas Rp10jt)
  // Tanpa NPWP: 0.90%
  const taxRate = taxOption === 'npwp' ? 0.0045 : taxOption === 'nonNpwp' ? 0.009 : 0;

  // Calculate results
  const calculation = React.useMemo(() => {
    if (direction === 'gramToRp') {
      const grams = parseFloat(gramInput) || 0;
      const subtotal = grams * ratePerGram;
      const taxAmount = subtotal * taxRate;
      const total = priceType === 'buy' ? subtotal + taxAmount : subtotal - taxAmount;
      return {
        grams,
        subtotal,
        taxAmount,
        total,
      };
    } else {
      const rp = parseFloat(rpInput) || 0;
      // If buy with tax: total = subtotal * (1 + taxRate) -> subtotal = total / (1 + taxRate)
      const divider = priceType === 'buy' ? ratePerGram * (1 + taxRate) : ratePerGram * (1 - taxRate);
      const grams = divider > 0 ? rp / divider : 0;
      const subtotal = grams * ratePerGram;
      const taxAmount = subtotal * taxRate;
      return {
        grams,
        subtotal,
        taxAmount,
        total: rp,
      };
    }
  }, [direction, gramInput, rpInput, ratePerGram, taxRate, priceType]);

  const handleCopySummary = () => {
    const text = `Simulasi Nilai Emas (Antam):
- Jumlah: ${calculation.grams.toFixed(2)} gram
- Acuan: ${selectedBrand} (${priceType === 'buy' ? 'Beli' : 'Jual/Buyback'})
- Harga Satuan: ${formatRupiah(ratePerGram)}/gr
- Estimasi Pajak PPh 22: ${formatRupiah(calculation.taxAmount)} (${(taxRate * 100).toFixed(2)}%)
- Total Estimasi: ${formatRupiah(calculation.total)}
Diperbarui: ${data.lastUpdated}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calculator className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Kalkulator Emas & Pajak
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Konversi instan nilai emas ke Rupiah dan sebaliknya, dilengkapi kalkulasi pajak PPh 22 resmi.
          </p>
        </div>

        {/* Direction Switcher (Emas <-> Rupiah) matching Kompas screenshot */}
        <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setDirection('gramToRp')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              direction === 'gramToRp'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Emas</span>
            <ArrowRightLeft className="w-3 h-3 text-slate-900" />
            <span>Rupiah</span>
          </button>
          <button
            onClick={() => setDirection('rpToGram')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              direction === 'rpToGram'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Rupiah</span>
            <ArrowRightLeft className="w-3 h-3 text-slate-900" />
            <span>Emas</span>
          </button>
        </div>
      </div>

      {/* Configuration Controls (Brand & Buy/Sell & Tax) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Brand Selector */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Merek / Acuan Harga
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
          >
            <option value="Kompas">Harga Antam (Rp {data.currentPrice.buy.toLocaleString('id-ID')})</option>
            <option value="Antam">Antam (CertiCard)</option>
            <option value="Galeri24">Galeri 24 (Pegadaian)</option>
            <option value="UBS">UBS Gold</option>
          </select>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Tipe Transaksi
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPriceType('buy')}
              className={`py-1.5 rounded text-xs font-bold transition-all ${
                priceType === 'buy'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Beli Emas
            </button>
            <button
              onClick={() => setPriceType('sell')}
              className={`py-1.5 rounded text-xs font-bold transition-all ${
                priceType === 'sell'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Jual / Buyback
            </button>
          </div>
        </div>

        {/* Tax Option */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Pajak PPh 22
          </label>
          <select
            value={taxOption}
            onChange={(e) => setTaxOption(e.target.value as TaxOption)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
          >
            <option value="npwp">Dengan NPWP (PPh 0.45%)</option>
            <option value="nonNpwp">Tanpa NPWP (PPh 0.90%)</option>
            <option value="none">Bebas Pajak (0%)</option>
          </select>
        </div>
      </div>

      {/* Input & Output Fields (Faithful to Kompas UI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/70 p-4 sm:p-5 rounded-xl border border-slate-800">
        {/* Left: Input */}
        <div className="space-y-3">
          {direction === 'gramToRp' ? (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
                <span>Jumlah Emas (gram)</span>
                <span className="text-[11px] text-amber-400">Pecahan Cepat:</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={gramInput}
                  onChange={(e) => setGramInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  gram
                </span>
              </div>

              {/* Quick weight chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['0.5', '1', '2', '5', '10', '25', '50', '100'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setGramInput(preset)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                      gramInput === preset
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {preset}g
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
                <span>Jumlah Uang (Rupiah)</span>
                <span className="text-[11px] text-amber-400">Budget Cepat:</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="100000"
                  step="500000"
                  value={rpInput}
                  onChange={(e) => setRpInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="2604000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  IDR
                </span>
              </div>

              {/* Quick Rp chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: '5 Jt', val: '5000000' },
                  { label: '10 Jt', val: '10000000' },
                  { label: '25 Jt', val: '25000000' },
                  { label: '50 Jt', val: '50000000' },
                  { label: '100 Jt', val: '100000000' },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    onClick={() => setRpInput(preset.val)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                      rpInput === preset.val
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Detailed Breakdown & Output */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              {direction === 'gramToRp' ? 'Total Estimasi Rupiah' : 'Estimasi Bobot Emas Yang Didapat'}
            </div>

            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1">
              {direction === 'gramToRp'
                ? formatRupiah(calculation.total)
                : `${calculation.grams.toFixed(4)} gram`}
            </div>

            {/* Sub details */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Harga Acuan Dasar:</span>
                <span className="text-slate-200 font-mono">{formatRupiah(ratePerGram)}/gr</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Nilai Murni (Sebelum Pajak):</span>
                <span className="text-slate-200 font-mono">{formatRupiah(calculation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimasi Pajak PPh 22 ({(taxRate * 100).toFixed(2)}%):</span>
                <span className="text-amber-400 font-mono">
                  {priceType === 'buy' ? '+' : '-'} {formatRupiah(calculation.taxAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopySummary}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Tersalin!' : 'Salin Ringkasan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Note faithful to Kompas screenshot */}
      <div className="text-[11px] text-slate-400 italic">
        * Catatan: Harga emas dapat bervariasi tergantung outlet, biaya cetak, dan waktu transaksi. Kalkulator ini memberikan perkiraan transparan sesuai acuan harga Antam (Logam Mulia).
      </div>
    </div>
  );
};
