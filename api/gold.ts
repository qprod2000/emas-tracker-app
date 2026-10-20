import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { GoogleGenAI } from '@google/genai';

// ---------- konstanta ----------
const OZ_TO_GRAM = 31.1034768;
const ANTAM_API = 'https://logam-mulia-api.iamutaki.workers.dev'; // tidak resmi, men-scrape situs penjual emas
const DEFAULT_PREMIUM = 1.065; // hanya dipakai sebelum ada data Antam resmi
const DEFAULT_BUYBACK_RATIO = 0.9416; // estimasi; kalibrasi lewat input manual
const OFFICIAL_FRESH_DAYS = 3;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

type Sql = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;
type Row = {
  day: string;
  spot_usd_oz: number | null;
  usd_idr: number | null;
  base_idr_gram: number | null;
  antam_buy: number | null;
  antam_buyback: number | null;
  origin: string | null;
  fetched_at: string | null;
};
type Cal = { premium: number; premiumDay: string | null; buybackRatio: number };
type Pt = { day: string; buy: number; sell: number; official: boolean; buybackManual: boolean; fetchedAt: string | null };
type BItem = { w: number; buy: number; sell: number | null };
type BTable = { day: string; items: BItem[] };
type BullionSnap = { fetchedAt: string; antam: BTable | null; galeri24: BTable | null; ubs: BTable | null };

// ---------- util ----------
const r1000 = (n: number) => Math.round(n / 1000) * 1000;
const r2 = (n: number) => Math.round(n * 100) / 100;
const rp = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const errMsg = (e: any) => (e?.message ? String(e.message) : String(e));

function todayWIB(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
function dayShift(day: string, days: number): string {
  return new Date(new Date(day + 'T00:00:00Z').getTime() - days * 86400000).toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86400000);
}

function getSql(): Sql {
  const url = (process.env.DATABASE_URL || '').trim();
  if (!url) throw new Error('DATABASE_URL belum diatur di Vercel (hubungkan Neon ke project).');
  return neon(url) as unknown as Sql;
}

let schemaReady = false;
async function ensureSchema(sql: Sql) {
  if (schemaReady) return;
  await sql`CREATE TABLE IF NOT EXISTS gold_prices (
    day date PRIMARY KEY,
    spot_usd_oz double precision NOT NULL,
    usd_idr double precision NOT NULL,
    base_idr_gram double precision NOT NULL,
    source text NOT NULL,
    fetched_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS antam_prices (
    day date PRIMARY KEY,
    buy integer,
    buyback integer,
    origin text NOT NULL DEFAULT 'logammulia',
    fetched_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS gold_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  // migrasi dari versi 1 (kolom antam_buy/antam_buyback di gold_prices), aman bila kolom tidak ada
  try {
    await sql`INSERT INTO antam_prices (day, buy, buyback, origin)
      SELECT day, antam_buy, antam_buyback, 'manual' FROM gold_prices WHERE antam_buy IS NOT NULL
      ON CONFLICT (day) DO NOTHING`;
  } catch {
    /* kolom lama tidak ada: abaikan */
  }
  schemaReady = true;
}

async function fetchJson(url: string, timeoutMs = 6000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'emas-tracker-app' } });
    if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

function isAdmin(req: VercelRequest): boolean {
  const expected = (process.env.ADMIN_TOKEN || '').trim();
  const got = String(req.headers['x-admin-token'] || '').trim();
  return expected.length >= 12 && got === expected;
}

// ---------- sumber 1: Antam resmi (via API komunitas) ----------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const okAntam = (r: any) =>
  r &&
  r.material === 'gold' &&
  r.materialType === 'Emas Batangan' &&
  Number(r.weight) === 1 &&
  Number(r.sellPrice) >= 500000 &&
  Number(r.sellPrice) <= 20000000 &&
  DATE_RE.test(String(r.recordedDate));

// ---------- tabel gramasi (snapshot terbaru) ----------
function pickAntamTable(rows: any[]): BTable | null {
  const m = new Map<number, { day: string; buy: number }>();
  for (const r of rows) {
    if (!r || r.material !== 'gold' || r.materialType !== 'Emas Batangan') continue;
    const w = Number(r.weight), buy = Math.round(Number(r.sellPrice)), day = String(r.recordedDate);
    if (!(w > 0) || !(buy > 0) || !DATE_RE.test(day)) continue;
    const prev = m.get(w);
    if (!prev || day > prev.day) m.set(w, { day, buy });
  }
  if (!m.size) return null;
  const items: BItem[] = [...m.entries()].sort((a, b) => a[0] - b[0]).map(([w, v]) => ({ w, buy: v.buy, sell: null }));
  const day = [...m.values()].map((v) => v.day).sort().pop()!;
  return { day, items };
}

function pickBrandTable(rows: any[], type: string): BTable | null {
  const m = new Map<number, { day: string; buy: number; sell: number }>();
  for (const r of rows) {
    if (!r || r.material !== 'gold' || r.materialType !== type) continue;
    const w = Number(r.weight), buy = Math.round(Number(r.sellPrice)), sell = Math.round(Number(r.buybackPrice));
    const day = String(r.recordedDate);
    if (!(w > 0) || !(buy > 0) || !(sell > 0) || !DATE_RE.test(day)) continue;
    const prev = m.get(w);
    if (!prev || day > prev.day) m.set(w, { day, buy, sell });
  }
  if (!m.size) return null;
  const items: BItem[] = [...m.entries()].sort((a, b) => a[0] - b[0]).map(([w, v]) => ({ w, buy: v.buy, sell: v.sell }));
  const day = [...m.values()].map((v) => v.day).sort().pop()!;
  return { day, items };
}

async function readBullion(sql: Sql): Promise<BullionSnap | null> {
  const r = await sql`SELECT value FROM gold_settings WHERE key = 'bullion'`;
  return (r[0]?.value as BullionSnap) ?? null;
}

async function refreshBullion(sql: Sql, antamRows: any[]) {
  const prev = await readBullion(sql);
  const snap: BullionSnap = {
    fetchedAt: new Date().toISOString(),
    antam: prev?.antam ?? null,
    galeri24: prev?.galeri24 ?? null,
    ubs: prev?.ubs ?? null,
  };
  const errors: string[] = [];
  const a = pickAntamTable(antamRows);
  if (a) snap.antam = a;
  try {
    const j = await fetchJson(`${ANTAM_API}/api/prices/galeri24`, 7000);
    const rows: any[] = j?.data || [];
    const g = pickBrandTable(rows, 'GALERI 24');
    if (g) snap.galeri24 = g;
    const u = pickBrandTable(rows, 'UBS');
    if (u) snap.ubs = u;
  } catch (e) {
    errors.push(errMsg(e));
  }
  await sql`INSERT INTO gold_settings (key, value) VALUES ('bullion', ${JSON.stringify(snap)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  return { errors };
}

async function refreshAntam(sql: Sql, force: boolean) {
  if (!force) {
    const a = await sql`SELECT extract(epoch from (now() - max(fetched_at))) AS age FROM antam_prices WHERE origin = 'logammulia'`;
    if (a[0]?.age != null && Number(a[0].age) < 2 * 3600) return { skipped: true as const };
  }
  const j = await fetchJson(`${ANTAM_API}/api/prices/logammulia`, 7000);
  const all: any[] = j?.data || [];
  const rows = all.filter(okAntam);
  if (!rows.length) throw new Error('Data Antam kosong/tidak valid dari API komunitas');
  rows.sort((a: any, b: any) => String(a.recordedDate).localeCompare(String(b.recordedDate)));
  const p = rows[rows.length - 1];
  const buy = Math.round(Number(p.sellPrice));
  await sql`INSERT INTO antam_prices (day, buy, origin) VALUES (${p.recordedDate}, ${buy}, 'logammulia')
    ON CONFLICT (day) DO UPDATE SET buy = EXCLUDED.buy, fetched_at = now()
    WHERE antam_prices.origin <> 'manual'`;
  const bullion = await refreshBullion(sql, all);
  return { skipped: false as const, day: p.recordedDate as string, buy, bullionErrors: bullion.errors };
}

async function backfillAntam(sql: Sql) {
  const byDay = new Map<string, { buy: number; created: string }>();
  let page = 1, totalPages = 1;
  do {
    const j = await fetchJson(`${ANTAM_API}/api/prices/logammulia/history?weight=1&length=500&page=${page}`, 20000);
    for (const r of j?.data || []) {
      if (!okAntam(r)) continue;
      const created = String(r.createdAt || '');
      const prev = byDay.get(r.recordedDate);
      if (!prev || created > prev.created) byDay.set(r.recordedDate, { buy: Math.round(Number(r.sellPrice)), created });
    }
    totalPages = Number(j?.pagination?.totalPages) || 1;
    page++;
  } while (page <= totalPages && page <= 8);
  if (!byDay.size) throw new Error('Riwayat Antam kosong');
  const days = [...byDay.keys()].sort();
  const buys = days.map((d) => byDay.get(d)!.buy);
  await sql`INSERT INTO antam_prices (day, buy, origin)
    SELECT t.d, t.b, 'logammulia' FROM unnest(${days}::date[], ${buys}::int[]) AS t(d, b)
    ON CONFLICT (day) DO UPDATE SET buy = EXCLUDED.buy, fetched_at = now()
    WHERE antam_prices.origin <> 'manual'`;
  return { inserted: days.length, from: days[0], to: days[days.length - 1] };
}

// ---------- sumber 2 (cadangan): XAU/USD x USD/IDR ----------
async function refreshGold(sql: Sql, force: boolean) {
  const day = todayWIB();
  if (!force) {
    const last = await sql`SELECT extract(epoch from (now() - fetched_at)) AS age FROM gold_prices WHERE day = ${day}`;
    if (last.length && Number(last[0].age) < 10 * 60) return { skipped: true };
  }
  const [spot, fx] = await Promise.all([
    fetchJson('https://xaus.com/api/v1/spot', 5000),
    fetchJson('https://open.er-api.com/v6/latest/USD', 5000),
  ]);
  const oz = Number(spot?.spot_usd_oz);
  const idr = Number(fx?.rates?.IDR);
  if (!isFinite(oz) || oz <= 0 || !isFinite(idr) || idr <= 0) throw new Error('Respons sumber XAU/kurs tidak valid');
  const base = (oz / OZ_TO_GRAM) * idr;
  await sql`INSERT INTO gold_prices (day, spot_usd_oz, usd_idr, base_idr_gram, source, fetched_at)
    VALUES (${day}, ${oz}, ${idr}, ${base}, 'xaus.com + open.er-api.com', now())
    ON CONFLICT (day) DO UPDATE SET
      spot_usd_oz = EXCLUDED.spot_usd_oz, usd_idr = EXCLUDED.usd_idr,
      base_idr_gram = EXCLUDED.base_idr_gram, source = EXCLUDED.source, fetched_at = now()`;
  return { skipped: false, day, oz, idr, base };
}

async function backfillGold(sql: Sql, days: number) {
  const hist = await fetchJson('https://xaus.com/api/v1/history', 20000);
  const all: { d: string; c: number }[] = (hist?.points || []).filter((p: any) => p?.d && Number(p?.c) > 0);
  if (!all.length) throw new Error('Riwayat XAU kosong');
  const startDay = dayShift(all[all.length - 1].d, days);
  const pts = all.filter((p) => p.d >= startDay);

  const fx = new Map<string, number>();
  let cursor = pts[0].d;
  const end = pts[pts.length - 1].d;
  while (cursor <= end) {
    const chunkEnd = new Date(
      Math.min(new Date(cursor + 'T00:00:00Z').getTime() + 80 * 86400000, new Date(end + 'T00:00:00Z').getTime()),
    ).toISOString().slice(0, 10);
    const j = await fetchJson(`https://api.frankfurter.dev/v1/${cursor}..${chunkEnd}?base=USD&symbols=IDR`, 15000);
    for (const [d, v] of Object.entries<any>(j?.rates || {})) if (v?.IDR) fx.set(d, Number(v.IDR));
    cursor = new Date(new Date(chunkEnd + 'T00:00:00Z').getTime() + 86400000).toISOString().slice(0, 10);
  }
  if (!fx.size) throw new Error('Riwayat kurs kosong');
  const fxDates = [...fx.keys()].sort();

  const D: string[] = [], O: number[] = [], I: number[] = [], B: number[] = [];
  for (const p of pts) {
    let rate = fx.get(p.d);
    if (rate == null) {
      const prevDates = fxDates.filter((d) => d <= p.d);
      rate = fx.get(prevDates.length ? prevDates[prevDates.length - 1] : fxDates[0])!;
    }
    D.push(p.d); O.push(p.c); I.push(rate); B.push((p.c / OZ_TO_GRAM) * rate);
  }
  await sql`INSERT INTO gold_prices (day, spot_usd_oz, usd_idr, base_idr_gram, source)
    SELECT t.d, t.o, t.i, t.b, 'backfill: xaus history (GC=F) + frankfurter'
    FROM unnest(${D}::date[], ${O}::float8[], ${I}::float8[], ${B}::float8[]) AS t(d, o, i, b)
    ON CONFLICT (day) DO NOTHING`;
  return { inserted: D.length, from: D[0], to: D[D.length - 1] };
}

async function refreshAll(sql: Sql, force = false, forceAntam = false) {
  const errors: Record<string, string> = {};
  const [gold, antam] = await Promise.all([
    refreshGold(sql, force).catch((e) => { errors.xau = errMsg(e); return null; }),
    refreshAntam(sql, force || forceAntam).catch((e) => { errors.antam = errMsg(e); return null; }),
  ]);
  const be = (antam as any)?.bullionErrors as string[] | undefined;
  if (be && be.length) errors.galeri24 = be.join('; ');
  return { gold, antam, errors };
}

// ---------- baca data & kalibrasi ----------
async function loadRows(sql: Sql, limit: number): Promise<Row[]> {
  const rows = await sql`
    SELECT * FROM (
      SELECT to_char(COALESCE(g.day, a.day), 'YYYY-MM-DD') AS day,
             g.spot_usd_oz, g.usd_idr, g.base_idr_gram,
             a.buy AS antam_buy, a.buyback AS antam_buyback, a.origin,
             to_char(COALESCE(a.fetched_at, g.fetched_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS fetched_at
      FROM gold_prices g
      FULL OUTER JOIN antam_prices a ON a.day = g.day
      ORDER BY COALESCE(g.day, a.day) DESC
      LIMIT ${limit}
    ) t ORDER BY day ASC`;
  return rows as unknown as Row[];
}

function calibrate(rows: Row[]): Cal {
  let premium = DEFAULT_PREMIUM, premiumDay: string | null = null, buybackRatio = DEFAULT_BUYBACK_RATIO;
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r.antam_buy && r.base_idr_gram) { premium = r.antam_buy / r.base_idr_gram; premiumDay = r.day; break; }
  }
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r.antam_buy && r.antam_buyback) { buybackRatio = r.antam_buyback / r.antam_buy; break; }
  }
  return { premium, premiumDay, buybackRatio };
}

function buildSeries(rows: Row[], cal: Cal) {
  const today = todayWIB();
  const lastOfficial = [...rows].reverse().find((r) => r.antam_buy != null)?.day ?? null;
  const fresh = lastOfficial != null && daysBetween(lastOfficial, today) <= OFFICIAL_FRESH_DAYS;
  const pts: Pt[] = [];
  for (const r of rows) {
    if (fresh && lastOfficial && r.day > lastOfficial) continue; // jangan campur estimasi saat data resmi masih segar
    const official = r.antam_buy != null;
    const buy = official ? r.antam_buy! : r.base_idr_gram != null ? r1000(r.base_idr_gram * cal.premium) : null;
    if (buy == null) continue;
    const sell = r.antam_buyback != null ? r.antam_buyback : r1000(buy * cal.buybackRatio);
    pts.push({ day: r.day, buy, sell, official, buybackManual: r.antam_buyback != null, fetchedAt: r.fetched_at });
  }
  return { pts, lastOfficial, fresh };
}

// ---------- bentuk respons GoldData ----------
function pick<T>(arr: T[], maxPts: number): T[] {
  if (arr.length <= maxPts) return arr;
  const out: T[] = [];
  for (let i = 0; i < maxPts; i++) out.push(arr[Math.round((i * (arr.length - 1)) / (maxPts - 1))]);
  return out;
}
function histPoints(pts: Pt[], days: number, maxPts: number, fmt: 'd' | 'm') {
  const from = dayShift(pts[pts.length - 1].day, days);
  return pick(pts.filter((p) => p.day >= from), maxPts).map((p) => {
    const [y, m, d] = p.day.split('-');
    return {
      date: fmt === 'd' ? `${d} ${MONTHS[+m - 1]}` : `${MONTHS[+m - 1]} ${y.slice(2)}`,
      fullDate: p.day,
      buy: p.buy,
      sell: p.sell,
      official: p.official,
    };
  });
}
function formatWIB(iso: string | null): string {
  if (!iso) return '-';
  const s = new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  return s.replace(/\./g, ':') + ' WIB';
}
function formatDay(day: string): string {
  return new Date(day + 'T12:00:00Z').toLocaleDateString('id-ID', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function buildBullion(snap: BullionSnap | null, perGramBuyback: number, antamBuybackEstimate: boolean) {
  const label = (w: number) => `${w} gram`;
  const antam = (snap?.antam?.items ?? []).map((i) => ({
    weight: label(i.w), weightNum: i.w, buy: i.buy, sell: r1000(perGramBuyback * i.w),
  }));
  const brand = (t: BTable | null | undefined) =>
    (t?.items ?? []).filter((i) => i.sell != null).map((i) => ({
      weight: label(i.w), weightNum: i.w, buy: i.buy, sell: i.sell as number,
    }));
  const today = todayWIB();
  const days = [snap?.antam?.day, snap?.galeri24?.day, snap?.ubs?.day].filter(Boolean) as string[];
  const stale = days.length > 0 && days.some((d) => daysBetween(d, today) > OFFICIAL_FRESH_DAYS);
  return {
    bullionPrices: { Antam: antam, Galeri24: brand(snap?.galeri24), UBS: brand(snap?.ubs) },
    bullionMeta: {
      antamDay: snap?.antam?.day ?? null,
      galeri24Day: snap?.galeri24?.day ?? null,
      ubsDay: snap?.ubs?.day ?? null,
      antamBuybackEstimate,
      stale,
    },
  };
}

async function actionData(sql: Sql) {
  const snap0 = await readBullion(sql);
  const refresh = await refreshAll(sql, false, !snap0); // paksa ambil tabel gramasi bila belum ada
  const rows = await loadRows(sql, 450);
  if (!rows.length) {
    throw new Error('Belum ada data. Jalankan backfill dulu. ' + Object.values(refresh.errors).join(' | '));
  }
  const cal = calibrate(rows);
  const { pts, lastOfficial, fresh } = buildSeries(rows, cal);
  if (!pts.length) throw new Error('Data harga kosong');

  const latest = pts[pts.length - 1];
  const prev = pts.length > 1 ? pts[pts.length - 2] : latest;
  const dBuy = latest.buy - prev.buy;
  const dSell = latest.sell - prev.sell;
  const dir = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat');
  const pct = (d: number, base: number) => (base ? r2((d / base) * 100) : 0);
  const baseRow = [...rows].reverse().find((r) => r.base_idr_gram != null);
  const snap = await readBullion(sql);
  const bullion = buildBullion(snap, latest.sell, !latest.buybackManual);

  return {
    lastUpdated: latest.official ? `Harga per ${formatDay(latest.day)}` : formatWIB(latest.fetchedAt),
    priceDate: latest.day,
    fetchedAt: latest.fetchedAt,
    source: latest.official
      ? 'Logam Mulia (situs resmi Antam), diambil lewat API komunitas tidak resmi'
      : 'Estimasi dari XAU/USD (xaus.com) × USD/IDR (exchangerate-api.com), dikalibrasi ke harga Antam terakhir',
    sourceUrl: latest.official ? 'https://www.logammulia.com' : 'https://xaus.com/api',
    isEstimate: !latest.official,
    buybackIsEstimate: !latest.buybackManual,
    officialFresh: fresh,
    lastOfficialDay: lastOfficial,
    errors: refresh.errors,
    calibration: cal,
    spotUsdOz: baseRow?.spot_usd_oz ?? null,
    usdIdr: baseRow?.usd_idr ?? null,
    currentPrice: {
      buy: latest.buy,
      buyChangeNominal: Math.abs(dBuy),
      buyChangePercent: Math.abs(pct(dBuy, latest.buy - dBuy)),
      buyChangeDirection: dir(dBuy),
      sell: latest.sell,
      sellChangeNominal: Math.abs(dSell),
      sellChangePercent: Math.abs(pct(dSell, latest.sell - dSell)),
      sellChangeDirection: dir(dSell),
    },
    history: {
      '1W': histPoints(pts, 7, 8, 'd'),
      '1M': histPoints(pts, 30, 12, 'd'),
      '6M': histPoints(pts, 183, 26, 'd'),
      '1Y': histPoints(pts, 365, 26, 'm'),
    },
    bullionPrices: bullion.bullionPrices,
    bullionMeta: bullion.bullionMeta,
    news: [],
  };
}

// ---------- input manual ----------
async function actionManual(sql: Sql, req: VercelRequest) {
  const body: any = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const has = (v: any) => v !== undefined && v !== null && v !== '';
  const buy = has(body.buy) ? Math.round(Number(body.buy)) : null;
  const sell = has(body.buyback) ? Math.round(Number(body.buyback)) : null;
  if (buy == null && sell == null) throw new Error('Isi harga beli dan/atau buyback');
  if (buy != null && (!isFinite(buy) || buy < 500000 || buy > 20000000)) throw new Error('Harga beli tidak masuk akal');
  if (sell != null && (!isFinite(sell) || sell < 400000 || sell > 20000000)) throw new Error('Harga buyback tidak valid');
  if (buy != null && sell != null && sell > buy) throw new Error('Buyback tidak boleh lebih tinggi dari harga beli');
  const day = String(body.day || todayWIB());
  if (!DATE_RE.test(day)) throw new Error('Format tanggal harus YYYY-MM-DD');
  await sql`INSERT INTO antam_prices (day, buy, buyback, origin)
    VALUES (${day}, ${buy}, ${sell}, ${buy != null ? 'manual' : 'logammulia'})
    ON CONFLICT (day) DO UPDATE SET
      buy = COALESCE(EXCLUDED.buy, antam_prices.buy),
      buyback = COALESCE(EXCLUDED.buyback, antam_prices.buyback),
      origin = CASE WHEN EXCLUDED.buy IS NOT NULL THEN 'manual' ELSE antam_prices.origin END,
      fetched_at = now()`;
  await sql`DELETE FROM gold_settings WHERE key LIKE 'prediction:%'`;
  return { day, buy, buyback: sell };
}

// ---------- prediksi (angka dari data nyata; AI hanya menulis narasi) ----------
const sma = (a: number[], n: number) => { const s = a.slice(-n); return s.reduce((x, y) => x + y, 0) / s.length; };
function rsi14(a: number[]): number | null {
  if (a.length < 15) return null;
  let g = 0, l = 0;
  for (let i = a.length - 14; i < a.length; i++) { const d = a[i] - a[i - 1]; if (d >= 0) g += d; else l -= d; }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
function slopeOf(a: number[]) {
  const n = a.length, xm = (n - 1) / 2, ym = a.reduce((x, y) => x + y, 0) / n;
  let num = 0, den = 0;
  a.forEach((y, i) => { num += (i - xm) * (y - ym); den += (i - xm) ** 2; });
  return den ? num / den : 0;
}
function stdev(a: number[]) {
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
}

async function actionPredict(sql: Sql, req: VercelRequest) {
  const horizon = String((req.body && (req.body as any).timeHorizon) || req.query.timeHorizon || '7d') === '30d' ? '30d' : '7d';
  const key = `prediction:${horizon}`;
  const cached = await sql`SELECT value, extract(epoch from (now() - updated_at)) AS age FROM gold_settings WHERE key = ${key}`;
  if (cached.length && Number(cached[0].age) < 6 * 3600 && !req.query.fresh) return cached[0].value;

  const rows = await loadRows(sql, 200);
  const cal = calibrate(rows);
  const { pts } = buildSeries(rows, cal);
  const closes = pts.slice(-90).map((p) => p.buy);
  if (closes.length < 15) throw new Error('Riwayat belum cukup (minimal 15 hari). Jalankan backfill dulu.');

  const price = closes[closes.length - 1];
  const s20 = sma(closes, 20);
  const rs = rsi14(closes);
  const sl = slopeOf(closes.slice(-14));
  const rets = closes.slice(1).map((c, i) => c / closes[i] - 1).slice(-30);
  const vol = stdev(rets);
  const last20 = closes.slice(-20);
  const support = Math.min(...last20), resistance = Math.max(...last20);
  const bull = sl > 0 && price > s20, bear = sl < 0 && price < s20;
  const sentiment = bull ? 'BULLISH' : bear ? 'BEARISH' : 'NEUTRAL';
  const trend = bull ? 'Uptrend (di atas SMA20, kemiringan positif)' : bear ? 'Downtrend (di bawah SMA20, kemiringan negatif)' : 'Sideways / tidak searah';
  const clamp = (v: number, c: number, w: number) => Math.min(Math.max(v, c - w), c + w);
  const wk = vol * Math.sqrt(5) * price, mo = vol * Math.sqrt(21) * price;

  let summary = `Harga Antam ${rp(price)}/gram, ${trend.toLowerCase()}. Volatilitas harian ±${r2(vol * 100)}%.`;
  let keyDrivers = [
    `Posisi harga terhadap SMA20 (${rp(s20)})`,
    `RSI(14) ${rs != null ? r2(rs) : '-'}`,
    `Rentang 20 hari: ${rp(support)} – ${rp(resistance)}`,
  ];
  let advice = 'Pertimbangkan pembelian bertahap (DCA) alih-alih sekaligus, dan sesuaikan dengan horizon investasi Anda.';
  let engine = 'rule-based';
  let engineError: string | null = null;

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Anda analis logam mulia. Tulis narasi singkat berbahasa Indonesia berdasarkan DATA berikut saja (jangan mengarang berita atau angka lain).
Harga emas batangan Antam: ${rp(price)}/gram. SMA20: ${rp(s20)}. RSI14: ${rs != null ? r2(rs) : 'n/a'}. Support 20 hari: ${rp(support)}. Resistance 20 hari: ${rp(resistance)}. Volatilitas harian: ${r2(vol * 100)}%. Arah tren: ${sentiment}. Horizon: ${horizon === '30d' ? '30 hari' : '3-7 hari'}.
Penutupan 15 hari terakhir: ${closes.slice(-15).join(', ')}.
Balas JSON murni: {"summary": "2-3 kalimat", "keyDrivers": ["3 poin berbasis data di atas"], "advice": "1-2 kalimat saran praktis untuk investor ritel"}`;
      const resp = await ai.models.generateContent({
        model: (process.env.GEMINI_MODEL || 'gemini-flash-latest').trim(),
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.3 },
      });
      const j = JSON.parse((resp.text || '').replace(/^```json/i, '').replace(/```$/, '').trim());
      if (j.summary) summary = String(j.summary);
      if (Array.isArray(j.keyDrivers) && j.keyDrivers.length) keyDrivers = j.keyDrivers.map(String).slice(0, 5);
      if (j.advice) advice = String(j.advice);
      engine = 'gemini+rule-based';
    } catch (e: any) {
      engineError = errMsg(e);
    }
  }

  const result = {
    success: true,
    prediction: {
      summary,
      marketSentiment: sentiment,
      confidenceScore: null, // sengaja tidak ada skor "keyakinan" palsu
      predictedRange: {
        nextDayMin: r1000(price * (1 - vol)),
        nextDayMax: r1000(price * (1 + vol)),
        nextWeekMin: r1000(clamp(price + sl * 5, price, wk) - wk),
        nextWeekMax: r1000(clamp(price + sl * 5, price, wk) + wk),
        target1Month: r1000(clamp(price + sl * 21, price, mo)),
      },
      technicalSignals: { trend, rsi: rs != null ? r2(rs) : 0, supportLevel: support, resistanceLevel: resistance },
      keyDrivers,
      kompasNewsAnalysis: [],
      investmentStrategy: {
        action: 'Akumulasi bertahap (DCA)',
        entryZone: `${rp(support)} - ${rp(price)} /gram`,
        targetTakeProfit: `${rp(resistance)} /gram (resistance 20 hari)`,
        riskLevel: vol < 0.007 ? 'Rendah' : vol < 0.015 ? 'Sedang' : 'Tinggi',
        advice,
      },
      disclaimer:
        'Proyeksi dihitung dari data harga historis dengan ekstrapolasi tren sederhana; bukan rekomendasi finansial dan tidak menjamin hasil.',
    },
    engine,
    engineError,
    basedOnDays: closes.length,
    generatedAt: new Date().toISOString(),
  };
  await sql`INSERT INTO gold_settings (key, value) VALUES (${key}, ${JSON.stringify(result)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  return result;
}

// ---------- handler ----------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action || 'data');
  try {
    const sql = getSql();
    await ensureSchema(sql);

    if (action === 'data') {
      const data = await actionData(sql);
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.status(200).json({ success: true, data });
    }
    if (action === 'refresh') {
      return res.status(200).json({ success: true, result: await refreshAll(sql) });
    }
    if (action === 'predict') {
      return res.status(200).json(await actionPredict(sql, req));
    }
    if (action === 'manual' || action === 'backfill') {
      if (!isAdmin(req)) return res.status(401).json({ success: false, error: 'Token admin salah/tidak ada' });
      if (action === 'manual') {
        if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Gunakan POST' });
        return res.status(200).json({ success: true, result: await actionManual(sql, req) });
      }
      const days = Math.min(Math.max(parseInt(String(req.query.days || '370'), 10) || 370, 30), 1250);
      const result: Record<string, unknown> = {};
      try { result.antam = await backfillAntam(sql); } catch (e) { result.antamError = errMsg(e); }
      try { result.xau = await backfillGold(sql, days); } catch (e) { result.xauError = errMsg(e); }
      try { result.tabel = await refreshAntam(sql, true); } catch (e) { result.tabelError = errMsg(e); }
      return res.status(200).json({ success: true, result });
    }
    return res.status(400).json({ success: false, error: 'action tidak dikenal' });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: errMsg(e) });
  }
}