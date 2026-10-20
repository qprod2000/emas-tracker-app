import React, { useState } from 'react';
import { Edit3, X, Check } from 'lucide-react';
import { GoldData } from '../types/gold';
import { formatRupiah } from '../services/exportService';

interface ManualDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GoldData;
  onSaved: () => void;
}

const TOKEN_KEY = 'goldAdminToken';

export const ManualDataModal: React.FC<ManualDataModalProps> = ({ isOpen, onClose, data, onSaved }) => {
  const [buy, setBuy] = useState('');
  const [buyback, setBuyback] = useState('');
  const [day, setDay] = useState('');
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const submit = async () => {
    setError(null);
    const buyN = buy.trim() ? Number(buy) : null;
    const sellN = buyback.trim() ? Number(buyback) : null;
    if (buyN == null && sellN == null) {
      setError('Isi harga beli dan/atau harga buyback.');
      return;
    }
    if ((buyN != null && !isFinite(buyN)) || (sellN != null && !isFinite(sellN))) {
      setError('Harga harus berupa angka.');
      return;
    }
    if (!token.trim()) {
      setError('Token admin wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/gold?action=manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token.trim() },
        body: JSON.stringify({ buy: buyN, buyback: sellN, day: day || undefined }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || `HTTP ${res.status}`);
      try {
        sessionStorage.setItem(TOKEN_KEY, token.trim());
      } catch {
        /* abaikan */
      }
      setBuy('');
      setBuyback('');
      setDay('');
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Koreksi Data Manual</h3>
              <p className="text-xs text-slate-400">Disimpan di server dan dipakai untuk kalibrasi estimasi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-400 leading-relaxed">
            Biarkan kolom kosong bila tidak ingin mengubahnya. Harga beli resmi sudah diambil otomatis; isi hanya
            bila ingin menimpanya. <strong className="text-slate-200">Buyback</strong> saat ini{' '}
            {data.buybackIsEstimate ? 'masih estimasi' : 'dari input manual'}: isi angka buyback Antam yang
            sebenarnya agar akurat.
          </p>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Harga Beli Antam (Rp/gram):</label>
            <input
              type="number"
              inputMode="numeric"
              value={buy}
              placeholder={formatRupiah(data.currentPrice.buy)}
              onChange={(e) => setBuy(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Harga Buyback Antam (Rp/gram):</label>
            <input
              type="number"
              inputMode="numeric"
              value={buyback}
              placeholder={formatRupiah(data.currentPrice.sell)}
              onChange={(e) => setBuyback(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Tanggal (kosong = hari ini):</label>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Token admin:</label>
            <input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={inputCls}
            />
            <p className="text-[10px] text-slate-500 mt-1">Hanya diingat selama tab ini terbuka.</p>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Batal
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};