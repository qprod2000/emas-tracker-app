import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GoldData, AIPrediction } from '../types/gold';

export const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const exportToExcel = (data: GoldData, prediction?: AIPrediction | null) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Pasar
  const summaryRows: (string | number)[][] = [
    ['LAPORAN HARGA EMAS HARIAN - SUMBER: KOMPAS.COM'],
    ['Waktu Pembaruan:', data.lastUpdated],
    ['Sumber Data:', data.source],
    ['Tautan Sumber:', data.sourceUrl],
    ['Waktu Ekspor:', new Date().toLocaleString('id-ID')],
    [],
    ['INDIKATOR UTAMA', 'NILAI (RP)', 'PERUBAHAN NOMINAL', 'PERUBAHAN PERSEN'],
    [
      'Harga Beli Emas (1 gr acuan)',
      data.currentPrice.buy,
      data.currentPrice.buyChangeNominal,
      `${data.currentPrice.buyChangePercent}%`,
    ],
    [
      'Harga Jual / Buyback (1 gr)',
      data.currentPrice.sell,
      data.currentPrice.sellChangeNominal,
      `${data.currentPrice.sellChangePercent}%`,
    ],
    [
      'Spread Selisih Beli - Buyback',
      data.currentPrice.buy - data.currentPrice.sell,
      '-',
      `${(((data.currentPrice.buy - data.currentPrice.sell) / data.currentPrice.buy) * 100).toFixed(2)}%`,
    ],
  ];

  if (prediction) {
    summaryRows.push(
      [],
      ['PREDIKSI & SENTIMEN AI (BERBASIS BERITA KOMPAS)', ''],
      ['Sentimen Pasar:', prediction.marketSentiment],
      ['Skor Keyakinan:', `${prediction.confidenceScore}%`],
      ['Prediksi Rentang Besok (Min):', prediction.predictedRange.nextDayMin],
      ['Prediksi Rentang Besok (Max):', prediction.predictedRange.nextDayMax],
      ['Prediksi 1 Minggu (Min):', prediction.predictedRange.nextWeekMin],
      ['Prediksi 1 Minggu (Max):', prediction.predictedRange.nextWeekMax],
      ['Target 1 Bulan:', prediction.predictedRange.target1Month],
      ['Saran Strategi:', prediction.investmentStrategy.action],
      ['Rekomendasi Area Masuk:', prediction.investmentStrategy.entryZone],
      ['Target Profit:', prediction.investmentStrategy.targetTakeProfit]
    );
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Pasar');

  // Sheet 2: Tabel Emas Batangan (Antam, Galeri 24, UBS)
  const bullionRows: (string | number)[][] = [
    ['Merek', 'Satuan', 'Berat (gr)', 'Harga Beli (Rp)', 'Harga Jual (Rp)', 'Spread (Rp)', 'Spread (%)', 'Harga Beli/gr (Rp)'],
  ];

  const brands: Array<keyof typeof data.bullionPrices> = ['Antam', 'Galeri24', 'UBS'];
  brands.forEach((brand) => {
    const list = data.bullionPrices[brand] || [];
    list.forEach((item) => {
      const spread = item.buy - item.sell;
      const spreadPct = Number(((spread / item.buy) * 100).toFixed(2));
      const perGram = Math.round(item.buy / item.weightNum);
      bullionRows.push([
        brand,
        item.weight,
        item.weightNum,
        item.buy,
        item.sell,
        spread,
        `${spreadPct}%`,
        perGram,
      ]);
    });
  });

  const wsBullion = XLSX.utils.aoa_to_sheet(bullionRows);
  XLSX.utils.book_append_sheet(wb, wsBullion, 'Emas Batangan');

  // Sheet 3: Riwayat Tren
  const historyRows: (string | number)[][] = [['Periode', 'Tanggal', 'Format Tanggal', 'Harga Beli (Rp)', 'Harga Jual (Rp)']];
  (['1W', '1M', '6M', '1Y'] as const).forEach((period) => {
    const items = data.history[period] || [];
    items.forEach((item) => {
      historyRows.push([period, item.date, item.fullDate, item.buy, item.sell]);
    });
  });
  const wsHistory = XLSX.utils.aoa_to_sheet(historyRows);
  XLSX.utils.book_append_sheet(wb, wsHistory, 'Riwayat Tren');

  // Sheet 4: Berita & Analisis Kompas
  const newsRows = [['Judul Berita', 'Sumber', 'Tanggal Tayang', 'Kategori', 'Sentimen', 'Dampak Terhadap Emas', 'Ringkasan']];
  (data.news || []).forEach((n) => {
    newsRows.push([n.title, n.source, n.publishedAt, n.category, n.sentiment.toUpperCase(), n.impact, n.summary]);
  });
  const wsNews = XLSX.utils.aoa_to_sheet(newsRows);
  XLSX.utils.book_append_sheet(wb, wsNews, 'Berita & Sentimen');

  const filename = `Data_Harga_Emas_Kompas_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const exportToPDF = (data: GoldData, prediction?: AIPrediction | null) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Background and header accent
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  // Gold accent bar
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 34, 210, 2, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('LAPORAN HARGA EMAS HARIAN & ANALISIS TREN', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Sumber: ${data.source} (${data.sourceUrl})`, 14, 22);
  doc.text(`Pembaruan: ${data.lastUpdated} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 28);

  // Key metrics cards
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 58, 26, 2, 2, 'FD');
  doc.roundedRect(76, 42, 58, 26, 2, 2, 'FD');
  doc.roundedRect(138, 42, 58, 26, 2, 2, 'FD');

  // Metric 1: Harga Beli
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('HARGA BELI (1 GRAM)', 18, 48);
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(data.currentPrice.buy), 18, 56);
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // green
  doc.text(`+Rp ${data.currentPrice.buyChangeNominal.toLocaleString('id-ID')} (+${data.currentPrice.buyChangePercent}%)`, 18, 62);

  // Metric 2: Buyback
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('HARGA JUAL / BUYBACK', 80, 48);
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(data.currentPrice.sell), 80, 56);
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text(`+Rp ${data.currentPrice.sellChangeNominal.toLocaleString('id-ID')} (+${data.currentPrice.sellChangePercent}%)`, 80, 62);

  // Metric 3: Spread
  const spread = data.currentPrice.buy - data.currentPrice.sell;
  const spreadPercent = ((spread / data.currentPrice.buy) * 100).toFixed(2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('SELISIH SPREAD (BELI - JUAL)', 142, 48);
  doc.setFontSize(13);
  doc.setTextColor(217, 119, 6);
  doc.text(formatRupiah(spread), 142, 56);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Margin: ${spreadPercent}%`, 142, 62);

  // AI Prediction Box (if present)
  let currentY = 74;
  if (prediction) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, currentY, 182, 32, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9);
    doc.text(`PREDIKSI HARGA AI & SENTIMEN BERITA: ${prediction.marketSentiment} (Keyakinan: ${prediction.confidenceScore}%)`, 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitSummary = doc.splitTextToSize(prediction.summary, 174);
    doc.text(splitSummary, 18, currentY + 12);

    doc.setFont('helvetica', 'bold');
    doc.text(`Target Besok: ${formatRupiah(prediction.predictedRange.nextDayMin)} - ${formatRupiah(prediction.predictedRange.nextDayMax)}  |  Target 1 Pekan: ${formatRupiah(prediction.predictedRange.nextWeekMin)} - ${formatRupiah(prediction.predictedRange.nextWeekMax)}`, 18, currentY + 24);
    doc.setFont('helvetica', 'italic');
    doc.text(`Strategi: ${prediction.investmentStrategy.action} (Zona Masuk: ${prediction.investmentStrategy.entryZone})`, 18, currentY + 29);

    currentY += 38;
  }

  // Bullion Table Section Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TABEL HARGA EMAS BATANGAN HARI INI', 14, currentY);

  const tableBody: any[] = [];
  const brands: Array<keyof typeof data.bullionPrices> = ['Antam', 'Galeri24', 'UBS'];
  brands.forEach((brand) => {
    (data.bullionPrices[brand] || []).slice(0, 8).forEach((item) => {
      const spreadVal = item.buy - item.sell;
      const spreadPct = ((spreadVal / item.buy) * 100).toFixed(1) + '%';
      tableBody.push([
        brand,
        item.weight,
        formatRupiah(item.buy),
        formatRupiah(item.sell),
        formatRupiah(spreadVal),
        spreadPct,
      ]);
    });
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Merek', 'Pecahan', 'Harga Beli (Rp)', 'Harga Jual (Rp)', 'Selisih / Spread', 'Spread %']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    '* Catatan: Harga emas dapat berubah sewaktu-waktu sesuai pembaruan pasar resmi Antara, Antam, Galeri 24, dan UBS.',
    14,
    pageHeight - 10
  );
  doc.text(`Dicetak via Kompas Emas Tracker & AI Analytics`, 140, pageHeight - 10);

  const filename = `Laporan_Harga_Emas_Kompas_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
