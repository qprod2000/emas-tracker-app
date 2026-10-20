import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sparkles,
  Maximize2,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { GoldData, AIPrediction } from '../types/gold';
import { formatRupiah } from '../services/exportService';

interface GoldChartProps {
  data: GoldData;
  activePriceType: 'buy' | 'sell';
  setActivePriceType: (type: 'buy' | 'sell') => void;
  prediction: AIPrediction | null;
}

type PeriodType = '1W' | '1M' | '6M' | '1Y';

export const GoldChart: React.FC<GoldChartProps> = ({
  data,
  activePriceType,
  setActivePriceType,
  prediction,
}) => {
  const [period, setPeriod] = useState<PeriodType>('1W');
  const [showPredictionOverlay, setShowPredictionOverlay] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Raw series for active period
  const rawPoints = useMemo(() => {
    return data.history[period] || [];
  }, [data.history, period]);

  // If projection overlay enabled and on 1W view, add projected points
  const pointsWithProjection = useMemo(() => {
    if (!showPredictionOverlay || !prediction || (period !== '1W' && period !== '1M')) {
      return rawPoints.map((p) => ({ ...p, isProjected: false }));
    }

    const lastPoint = rawPoints[rawPoints.length - 1];
    if (!lastPoint) return [];

    const result = rawPoints.map((p) => ({ ...p, isProjected: false }));

    // Generate 3 projected forward dates based on AI prediction
    const targetPrice =
      activePriceType === 'buy'
        ? (prediction.predictedRange.nextDayMax + prediction.predictedRange.nextDayMin) / 2
        : (prediction.predictedRange.nextDayMax + prediction.predictedRange.nextDayMin) / 2 - 152000;

    const targetWeek =
      activePriceType === 'buy'
        ? (prediction.predictedRange.nextWeekMax + prediction.predictedRange.nextWeekMin) / 2
        : (prediction.predictedRange.nextWeekMax + prediction.predictedRange.nextWeekMin) / 2 - 152000;

    result.push({
      date: '18 Okt (P)',
      fullDate: '2026-10-18',
      buy: Math.round(targetPrice),
      sell: Math.round(targetPrice - 152000),
      isProjected: true,
    });

    result.push({
      date: '21 Okt (P)',
      fullDate: '2026-10-21',
      buy: Math.round(targetWeek),
      sell: Math.round(targetWeek - 152000),
      isProjected: true,
    });

    return result;
  }, [rawPoints, showPredictionOverlay, prediction, period, activePriceType]);

  // Determine min and max for chart scale
  const { minVal, maxVal, values } = useMemo(() => {
    const vals = pointsWithProjection.map((p) => (activePriceType === 'buy' ? p.buy : p.sell));
    if (vals.length === 0) return { minVal: 0, maxVal: 1, values: [] };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    // Add 10% breathing room top and bottom
    const margin = (max - min) * 0.15 || 50000;
    return {
      minVal: min - margin,
      maxVal: max + margin,
      values: vals,
    };
  }, [pointsWithProjection, activePriceType]);

  // Chart dimensions in SVG viewBox
  const width = 800;
  const height = 340;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (pointsWithProjection.length <= 1) return paddingLeft;
    return paddingLeft + (index / (pointsWithProjection.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    if (maxVal === minVal) return paddingTop + chartHeight / 2;
    return paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
  };

  // Generate SVG path for line
  const linePath = useMemo(() => {
    if (pointsWithProjection.length === 0) return '';
    return pointsWithProjection.reduce((acc, point, i) => {
      const val = activePriceType === 'buy' ? point.buy : point.sell;
      const x = getX(i);
      const y = getY(val);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [pointsWithProjection, activePriceType, minVal, maxVal]);

  // Generate area fill path
  const areaPath = useMemo(() => {
    if (pointsWithProjection.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(pointsWithProjection.length - 1);
    const baseY = paddingTop + chartHeight;
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [linePath, pointsWithProjection, minVal, maxVal]);

  // Generate Y-axis grid ticks (5 steps)
  const yTicks = useMemo(() => {
    const count = 5;
    const ticks = [];
    const step = (maxVal - minVal) / (count - 1);
    for (let i = 0; i < count; i++) {
      const val = minVal + step * i;
      ticks.push(val);
    }
    return ticks;
  }, [minVal, maxVal]);

  // Current hovered or default point
  const activeHover = hoverIndex !== null ? pointsWithProjection[hoverIndex] : pointsWithProjection[pointsWithProjection.length - 1];
  const activeHoverValue = activeHover ? (activePriceType === 'buy' ? activeHover.buy : activeHover.sell) : 0;

  // Percentage change over the period
  const periodChange = useMemo(() => {
    if (rawPoints.length < 2) return { nominal: 0, pct: 0, isPos: true };
    const startVal = activePriceType === 'buy' ? rawPoints[0].buy : rawPoints[0].sell;
    const endVal = activePriceType === 'buy' ? rawPoints[rawPoints.length - 1].buy : rawPoints[rawPoints.length - 1].sell;
    const nominal = endVal - startVal;
    const pct = ((nominal / startVal) * 100).toFixed(2);
    return { nominal, pct: Number(pct), isPos: nominal >= 0 };
  }, [rawPoints, activePriceType]);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
      {/* Chart Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Pergerakan Grafik Harga Emas
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300">
                {activePriceType === 'buy' ? 'Harga Beli' : 'Harga Buyback'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Perubahan periode: {periodChange.isPos ? '+' : ''}
              {formatRupiah(periodChange.nominal)} ({periodChange.isPos ? '+' : ''}
              {periodChange.pct}%)
            </p>
          </div>
        </div>

        {/* Filters: Range & Buy/Sell Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Buttons (Exact matching to Kompas screenshot: 1 Minggu, 1 Bulan, 6 Bulan, 1 Tahun) */}
          <div className="inline-flex p-1 rounded-lg bg-slate-950 border border-slate-800">
            {[
              { id: '1W', label: '1 Minggu' },
              { id: '1M', label: '1 Bulan' },
              { id: '6M', label: '6 Bulan' },
              { id: '1Y', label: '1 Tahun' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id as PeriodType)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  period === item.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Toggle AI Projection */}
          {prediction && (
            <button
              onClick={() => setShowPredictionOverlay(!showPredictionOverlay)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                showPredictionOverlay
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Aktifkan/nonaktifkan proyeksi harga masa depan hasil prediksi AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Proyeksi AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Tooltip Summary */}
      <div className="flex items-center justify-between text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Titik Terpilih:</span>
          <span className="font-bold text-white">
            {activeHover?.date} ({activeHover?.fullDate})
          </span>
          {activeHover?.isProjected && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              PROYEKSI AI
            </span>
          )}
        </div>
        <div className="font-mono text-sm sm:text-base font-bold text-amber-300">
          {formatRupiah(activeHoverValue)}
          <span className="text-xs text-slate-400 font-normal ml-1">/gram</span>
        </div>
      </div>

      {/* Interactive SVG Chart Container */}
      <div className="relative w-full overflow-hidden select-none bg-slate-950/40 rounded-xl border border-slate-800/50 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Area Gradient */}
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>

            {/* Projected Area Gradient */}
            <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EAB308" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#EAB308" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            // Format to concise jutaan e.g. "Rp 2,60Jt"
            const inMillion = (val / 1000000).toFixed(2);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#94A3B8"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {inMillion}Jt
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#goldGradient)" />

          {/* Main Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Guides & Data Points */}
          {pointsWithProjection.map((point, index) => {
            const val = activePriceType === 'buy' ? point.buy : point.sell;
            const x = getX(index);
            const y = getY(val);
            const isHovered = hoverIndex === index;

            return (
              <g
                key={index}
                className="transition-all duration-150"
                onMouseEnter={() => setHoverIndex(index)}
              >
                {/* Touch/Mouse Hitbox */}
                <rect
                  x={x - 20}
                  y={paddingTop}
                  width="40"
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                />

                {/* Vertical Cursor on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartHeight}
                    stroke="#F59E0B"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Data point circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : point.isProjected ? 4.5 : 3.5}
                  fill={point.isProjected ? '#FDE047' : '#F59E0B'}
                  stroke="#0F172A"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all"
                />

                {/* X-axis date labels */}
                <text
                  x={x}
                  y={paddingTop + chartHeight + 22}
                  fill={isHovered ? '#F59E0B' : '#94A3B8'}
                  fontSize={11}
                  fontWeight={isHovered ? '700' : '500'}
                  textAnchor="middle"
                >
                  {point.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Chart Footer Information */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span>Riwayat harga Antam (Logam Mulia). Periode lebih lama berupa estimasi dari XAU/USD x kurs.</span>
          {showPredictionOverlay && prediction && (
            <span className="flex items-center gap-1.5 ml-2 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 inline-block border border-amber-600" />
              <span>Proyeksi AI Gemini</span>
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          Arahkan kursor pada titik untuk melihat rincian tanggal & harga.
        </div>
      </div>
    </div>
  );
};
