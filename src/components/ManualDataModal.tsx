import React, { useState } from 'react';
import {
  Edit3,
  X,
  Check,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react';
import { GoldData } from '../types/gold';
import { formatRupiah } from '../services/exportService';

interface ManualDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GoldData;
  onUpdateData: (newData: GoldData) => void;
}

export const ManualDataModal: React.FC<ManualDataModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateData,
}) => {
  const [buyPrice, setBuyPrice] = useState(data.currentPrice.buy.toString());
  const [sellPrice, setSellPrice] = useState(data.currentPrice.sell.toString());
  const [buyChange, setBuyChange] = useState(data.currentPrice.buyChangeNominal.toString());
  const [lastUpdated, setLastUpdated] = useState(data.lastUpdated);

  if (!isOpen) return null;

  const handleSave = () => {
    const numBuy = parseFloat(buyPrice) || data.currentPrice.buy;
    const numSell = parseFloat(sellPrice) || data.currentPrice.sell;
    const numChange = parseFloat(buyChange) || 0;
    const pctChange = Number(((numChange / (numBuy - numChange)) * 100).toFixed(2));

    const updated: GoldData = {
      ...data,
      lastUpdated: lastUpdated || new Date().toLocaleString('id-ID'),
      currentPrice: {
        ...data.currentPrice,
        buy: numBuy,
        sell: numSell,
        buyChangeNominal: numChange,
        buyChangePercent: pctChange,
        buyChangeDirection: numChange >= 0 ? 'up' : 'down',
      },
    };

    onUpdateData(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sesuaikan / Koreksi Data Manual</h3>
              <p className="text-xs text-slate-400">Ubah harga acuan jika terjadi fluktuasi intraday</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 font-semibold block mb-1">
              Harga Beli Acuan (Rp/gram):
            </label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">
              Harga Jual Kembali / Buyback (Rp/gram):
            </label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">
              Perubahan Nominal Hari Ini (Rp):
            </label>
            <input
              type="number"
              value={buyChange}
              onChange={(e) => setBuyChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">
              Keterangan Waktu Pembaruan:
            </label>
            <input
              type="text"
              value={lastUpdated}
              onChange={(e) => setLastUpdated(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
