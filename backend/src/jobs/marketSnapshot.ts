import cron from 'node-cron';
import axios from 'axios';
import PriceHistory from '../models/PriceHistory';

const tcgClient = axios.create({
  baseURL: 'https://api.pokemontcg.io/v2',
  timeout: 10000,
  headers: process.env.POKEMONTCG_API_KEY
    ? { 'X-Api-Key': process.env.POKEMONTCG_API_KEY }
    : {},
});

let brlRate = 5.7;
async function refreshRate() {
  try {
    const { data } = await axios.get(
      'https://economia.awesomeapi.com.br/json/last/USD-BRL',
      { timeout: 5000 }
    );
    brlRate = parseFloat(data.USDBRL?.bid ?? '5.7');
  } catch { /* mantém taxa anterior */ }
}

function extractUsd(raw: any): number | null {
  const p = raw?.tcgplayer?.prices;
  if (!p) return null;
  return (
    p.holofoil?.market ??
    p['1stEditionHolofoil']?.market ??
    p.ultraHolofoil?.market ??
    p.reverseHolofoil?.market ??
    p.normal?.market ??
    null
  );
}

async function fetchTopCards(): Promise<{ tcgId: string; priceUsd: number }[]> {
  const queries = [
    'tcgplayer.prices.holofoil.market:[100 TO *]',
    'tcgplayer.prices.holofoil.market:[20 TO 100]',
    'tcgplayer.prices.holofoil.market:[5 TO 20]',
  ];

  const results: { tcgId: string; priceUsd: number }[] = [];
  const seen = new Set<string>();

  await Promise.allSettled(
    queries.map(async (q) => {
      const { data } = await tcgClient.get('/cards', {
        params: { q, orderBy: '-tcgplayer.prices.holofoil.market', pageSize: 36, select: 'id,tcgplayer' },
      });
      for (const c of data.data as any[]) {
        if (seen.has(c.id)) continue;
        const usd = extractUsd(c);
        if (usd && usd > 0) {
          seen.add(c.id);
          results.push({ tcgId: c.id, priceUsd: usd });
        }
      }
    })
  );

  return results;
}

export async function runMarketSnapshot() {
  console.log('[MarketSnapshot] Iniciando snapshot de mercado…');
  try {
    await refreshRate();
    const cards = await fetchTopCards();
    if (!cards.length) {
      console.warn('[MarketSnapshot] Nenhuma carta retornada da TCG API.');
      return;
    }

    const now = new Date();
    const docs = cards.map(({ tcgId, priceUsd }) => ({
      tcgId,
      priceUsd,
      priceBrl: Math.round(priceUsd * brlRate * 100) / 100,
      source: 'tcgplayer',
      recordedAt: now,
    }));

    await PriceHistory.insertMany(docs, { ordered: false });
    console.log(`[MarketSnapshot] ${docs.length} snapshots salvos.`);
  } catch (err: any) {
    console.error('[MarketSnapshot] Erro:', err?.message ?? err);
  }
}

export function scheduleMarketSnapshot() {
  // Roda imediatamente na subida, depois a cada 30min
  runMarketSnapshot().catch(() => {});
  cron.schedule('*/30 * * * *', () => {
    runMarketSnapshot().catch((err) => {
      console.error('[MarketSnapshot] Erro no cron:', err);
    });
  });
  console.log('[MarketSnapshot] Job agendado (a cada 30min).');
}
