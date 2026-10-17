import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  ArrowUpDown,
  Calculator,
  Percent,
  CheckCircle2,
  Info,
  Building2,
} from 'lucide-react';
import { GoldData, BullionItem } from '../types/gold';
import { formatRupiah } from '../services/exportService';

interface BullionTableProps {
  data: GoldData;
  onSelectForCalculator: (brand: 'Antam' | 'Galeri24' | 'UBS', item: BullionItem) => void;
}

type BrandType = 'Galeri24' | 'Antam' | 'UBS';
type SortField = 'weight' | 'buy' | 'sell' | 'spread';

export const BullionTable: React.FC<BullionTableProps> = ({
  data,
  onSelectForCalculator,
}) => {
  // Matching Kompas screenshot tab order: Galeri24 is often active or Antam
  const [activeBrand, setActiveBrand] = useState<BrandType>('Galeri24');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('weight');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const brandList: BrandType[] = ['Antam', 'Galeri24', 'UBS'];

  const brandDescriptions: Record<BrandType, string> = {
    Antam: 'Produksi PT Aneka Tambang Tbk (Logam Mulia LBMA accredited). Kemasan CertiCard.',
    Galeri24: 'Anak perusahaan PT Pegadaian (Persero). Tersedia di seluruh gerai Pegadaian & Galeri 24.',
    UBS: 'Produksi PT Untung Bersama Sejahtera. Banyak diminati untuk diversifikasi emas murni 99.99%.',
  };

  const rawList = data.bullionPrices[activeBrand] || [];

  const filteredAndSortedList = useMemo(() => {
    let list = [...rawList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.weight.toLowerCase().includes(q) ||
          item.weightNum.toString().includes(q)
      );
    }

    list.sort((a, b) => {
      let diff = 0;
      if (sortField === 'weight') diff = a.weightNum - b.weightNum;
      else if (sortField === 'buy') diff = a.buy - b.buy;
      else if (sortField === 'sell') diff = a.sell - b.sell;
      else if (sortField === 'spread') diff = a.buy - a.sell - (b.buy - b.sell);

      return sortAsc ? diff : -diff;
    });

    return list;
  }, [rawList, searchQuery, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header & Brand Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Harga Emas Batangan
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {brandDescriptions[activeBrand]}
          </p>
        </div>

        {/* Brand Tabs (Antam, Galeri24, UBS) */}
        <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 self-start md:self-auto shadow-inner">
          {brandList.map((brand) => {
            const isActive = activeBrand === brand;
            return (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pecahan (cth: 1 gram, 10, 50)..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Menampilkan {filteredAndSortedList.length} pecahan emas</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline text-amber-400">Klik baris untuk simulasi kalkulator</span>
        </div>
      </div>

      {/* Table Container matching screenshot columns */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th
                onClick={() => handleSort('weight')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Satuan</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('buy')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Harga Beli</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('sell')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Harga Jual (Buyback)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('spread')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors hidden md:table-cell"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Selisih Spread</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 text-right text-slate-400 hidden lg:table-cell">
                Harga/Gram Efektif
              </th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredAndSortedList.map((item, idx) => {
              const spread = item.buy - item.sell;
              const spreadPct = ((spread / item.buy) * 100).toFixed(1);
              const perGram = Math.round(item.buy / item.weightNum);

              return (
                <tr
                  key={idx}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectForCalculator(activeBrand, item)}
                >
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 font-mono text-[10px] flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                      {item.weightNum}
                    </span>
                    <span>{item.weight}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                    {formatRupiah(item.buy)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-medium">
                    {formatRupiah(item.sell)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300 hidden md:table-cell">
                    <div>{formatRupiah(spread)}</div>
                    <div className="text-[10px] text-amber-400 font-sans">
                      ({spreadPct}%)
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400 hidden lg:table-cell">
                    {formatRupiah(perGram)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectForCalculator(activeBrand, item);
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[11px] font-semibold border border-slate-700 hover:border-amber-400 transition-all flex items-center gap-1 mx-auto"
                      title="Hitung nilai di kalkulator emas"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Hitung</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Helpful investment tip */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">Tips Pembelian Emas Batangan: </span>
          Semakin besar pecahan yang Anda beli (misal 10 gram ke atas), biaya cetak per gram semakin murah dan spread selisih jual-kembali menjadi semakin kecil (sekitar 3-4% dibanding pecahan 0.5 gram yang spreadnya dapat mencapai 10%).
        </div>
      </div>
    </div>
  );
};
