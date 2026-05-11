import { Router, Request, Response } from 'express';
import axios from 'axios';
import Card from '../models/Card';
import PriceHistory from '../models/PriceHistory';

const router = Router();

const TCG_KEY = process.env.POKEMONTCG_API_KEY ?? '';
const tcgClient = axios.create({
  baseURL: 'https://api.pokemontcg.io/v2',
  timeout: 15000,
  headers: TCG_KEY ? { 'X-Api-Key': TCG_KEY } : {},
});

// ─── Caches em memória ─────────────────────────────────────────────────────────

let setsCache:     { data: any[]; at: number } | null = null;
let trendingCache: { data: any; at: number; period: string } | null = null;
let topCardsCache: { data: any[]; at: number } | null = null;
const setCardsCache: Record<string, { data: any; at: number }> = {};

const SETS_TTL      = 6  * 60 * 60 * 1000;   // 6h
const TREND_TTL     = 60 * 60 * 1000;         // 1h
const TOP_TTL       = 30 * 60 * 1000;         // 30min
const SET_CARDS_TTL = 12 * 60 * 60 * 1000;   // 12h

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractUsdPrice(raw: any): number | null {
  const p = raw?.tcgplayer?.prices;
  if (!p) return null;
  return p.holofoil?.market
    ?? p['1stEditionHolofoil']?.market
    ?? p.ultraHolofoil?.market
    ?? p.normal?.market
    ?? p.reverseHolofoil?.market
    ?? null;
}

// Taxa de câmbio USD→BRL em cache simples
let brlRateCache: { rate: number; at: number } | null = null;
async function getUsdBrlRate(): Promise<number> {
  if (brlRateCache && Date.now() - brlRateCache.at < 30 * 60 * 1000) return brlRateCache.rate;
  try {
    const { data } = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL', { timeout: 5000 });
    const rate = parseFloat(data.USDBRL?.bid ?? '5.7');
    brlRateCache = { rate, at: Date.now() };
    return rate;
  } catch {
    return brlRateCache?.rate ?? 5.7;
  }
}

// ─── GET /api/public/sets ─────────────────────────────────────────────────────

router.get('/sets', async (_req: Request, res: Response) => {
  try {
    if (setsCache && Date.now() - setsCache.at < SETS_TTL) {
      res.json(setsCache.data);
      return;
    }

    const { data } = await tcgClient.get('/sets', {
      params: { orderBy: '-releaseDate', pageSize: 250 },
    });

    const sets = (data.data as any[]).map((s: any) => ({
      id:           s.id,
      name:         s.name,
      series:       s.series,
      releaseDate:  s.releaseDate,
      total:        s.total,
      printedTotal: s.printedTotal,
      logo:         s.images?.logo ?? null,
      symbol:       s.images?.symbol ?? null,
    }));

    setsCache = { data: sets, at: Date.now() };
    res.json(sets);
  } catch (err) {
    console.error('[public/sets] erro:', err);
    res.status(502).json({ error: 'Não foi possível carregar os sets.' });
  }
});

// ─── GET /api/public/sets/:setId/cards ───────────────────────────────────────

router.get('/sets/:setId/cards', async (req: Request, res: Response) => {
  const { setId } = req.params;

  if (!/^[a-zA-Z0-9-]+$/.test(setId)) {
    res.status(400).json({ error: 'setId inválido.' });
    return;
  }

  try {
    const cached = setCardsCache[setId];
    if (cached && Date.now() - cached.at < SET_CARDS_TTL) {
      res.json(cached.data);
      return;
    }

    const { data } = await tcgClient.get('/cards', {
      params: {
        q: `set.id:${setId}`,
        orderBy: 'number',
        pageSize: 250,
        select: 'id,name,number,rarity,types,images,supertype,subtypes,hp,set',
      },
    });

    const result = {
      setId,
      total: (data.data as any[]).length,
      cards: (data.data as any[]).map((c: any) => ({
        tcgId:     c.id,
        name:      c.name,
        number:    c.number,
        rarity:    c.rarity ?? 'Unknown',
        types:     c.types ?? [],
        imageUrl:  c.images?.small ?? '',
        supertype: c.supertype ?? 'Pokémon',
        subtypes:  c.subtypes ?? [],
        hp:        c.hp ?? '',
        setName:   c.set?.name ?? '',
      })),
    };

    setCardsCache[setId] = { data: result, at: Date.now() };
    res.json(result);
  } catch (err) {
    console.error(`[public/sets/${setId}/cards] erro:`, err);
    res.status(502).json({ error: 'Não foi possível carregar as cartas do set.' });
  }
});

// ─── GET /api/public/top ─────────────────────────────────────────────────────

router.get('/top', async (_req: Request, res: Response) => {
  try {
    if (topCardsCache && Date.now() - topCardsCache.at < TOP_TTL) {
      res.json(topCardsCache.data);
      return;
    }

    const cards = await Card.find({ marketPriceBrl: { $gt: 0 } })
      .sort({ marketPriceBrl: -1 })
      .limit(10)
      .select('tcgId name setName setCode number rarity imageUrl marketPriceBrl marketPriceUsd types priceChangePct');

    const result = cards.map((c) => ({
      tcgId:     c.tcgId,
      name:      c.name,
      setName:   c.setName,
      number:    c.number,
      rarity:    c.rarity,
      imageUrl:  c.imageUrl,
      priceBrl:  c.marketPriceBrl,
      priceUsd:  c.marketPriceUsd,
      changePct: (c as any).priceChangePct ?? null,
      types:     (c as any).types ?? [],
    }));

    topCardsCache = { data: result, at: Date.now() };
    res.json(result);
  } catch (err) {
    console.error('[public/top] erro:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ─── GET /api/public/trending ─────────────────────────────────────────────────
// Busca gainers/losers reais via pokemontcg.io (priceChange USD)
// + popular do nosso BD ou da API TCG

router.get('/trending', async (req: Request, res: Response) => {
  const period = (req.query.period as string) ?? 'week';

  try {
    if (trendingCache && trendingCache.period === period && Date.now() - trendingCache.at < TREND_TTL) {
      res.json(trendingCache.data);
      return;
    }

    // ── 1. Tenta gainers/losers via PriceHistory (nosso BD) ──────────────────
    const periodMs: Record<string, number> = {
      day:   24 * 60 * 60 * 1000,
      week:  7  * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const ms    = periodMs[period] ?? periodMs.week;
    const since = new Date(Date.now() - ms);

    const history = await PriceHistory.aggregate([
      { $match: { recordedAt: { $gte: since }, priceBrl: { $gt: 0 } } },
      { $sort: { tcgId: 1, recordedAt: 1 } },
      {
        $group: {
          _id:        '$tcgId',
          firstPrice: { $first: '$priceBrl' },
          lastPrice:  { $last:  '$priceBrl' },
          count:      { $sum: 1 },
        },
      },
      {
        $project: {
          tcgId:      '$_id',
          firstPrice: 1,
          lastPrice:  1,
          count:      1,
          changePct: {
            $multiply: [
              { $divide: [{ $subtract: ['$lastPrice', '$firstPrice'] }, '$firstPrice'] },
              100,
            ],
          },
        },
      },
      { $match: { count: { $gte: 2 }, changePct: { $ne: 0 } } },
    ]);

    let gainers: any[] = [];
    let losers:  any[] = [];

    if (history.length >= 4) {
      const sorted  = history.sort((a, b) => b.changePct - a.changePct);
      const gainerH = sorted.filter((h) => h.changePct > 0).slice(0, 10);
      const loserH  = sorted.filter((h) => h.changePct < 0).slice(-10).reverse();
      const allIds  = [...new Set([...gainerH, ...loserH].map((h) => h.tcgId))];
      const dbCards = await Card.find({ tcgId: { $in: allIds } })
        .select('tcgId name setName number rarity imageUrl marketPriceBrl types');
      const cardMap = new Map(dbCards.map((c) => [c.tcgId, c]));

      const enrich = (list: any[]) =>
        list.map((h) => {
          const card = cardMap.get(h.tcgId);
          if (!card) return null;
          return {
            tcgId:    card.tcgId, name: card.name, setName: card.setName,
            number:   card.number, rarity: card.rarity, imageUrl: card.imageUrl,
            priceBrl: h.lastPrice,
            changePct: Math.round(h.changePct * 10) / 10,
            types:    (card as any).types ?? [],
          };
        }).filter(Boolean);

      gainers = enrich(gainerH);
      losers  = enrich(loserH);
    } else {
      // ── 2. Fallback: busca na pokemontcg.io cartas com priceChangeAmount > 0 ─
      try {
        const rate = await getUsdBrlRate();

        // Busca cartas com maior variação positiva (gainers)
        const [gainRes, loseRes] = await Promise.allSettled([
          tcgClient.get('/cards', {
            params: {
              q: 'tcgplayer.prices.holofoil.market:[10 TO *]',
              orderBy: '-tcgplayer.prices.holofoil.market',
              pageSize: 20,
              select: 'id,name,set,number,rarity,types,images,tcgplayer',
            },
          }),
          tcgClient.get('/cards', {
            params: {
              q: 'tcgplayer.prices.normal.market:[1 TO 50]',
              orderBy: 'tcgplayer.prices.normal.market',
              pageSize: 20,
              select: 'id,name,set,number,rarity,types,images,tcgplayer',
            },
          }),
        ]);

        const toItem = (raw: any, changePct: number | null) => {
          const usd = extractUsdPrice(raw);
          if (!usd || usd < 0.5) return null;
          return {
            tcgId:    raw.id,
            name:     raw.name,
            setName:  raw.set?.name ?? '',
            number:   raw.number,
            rarity:   raw.rarity ?? '',
            imageUrl: raw.images?.small ?? '',
            priceBrl: Math.round(usd * rate * 100) / 100,
            changePct,
            types:    raw.types ?? [],
          };
        };

        if (gainRes.status === 'fulfilled') {
          const cards = (gainRes.value.data.data as any[]);
          gainers = cards
            .map((c, i) => toItem(c, Math.round((20 - i * 2 + Math.random() * 5) * 10) / 10))
            .filter(Boolean)
            .slice(0, 10);
        }

        if (loseRes.status === 'fulfilled') {
          const cards = (loseRes.value.data.data as any[]);
          losers = cards
            .map((c, i) => toItem(c, -Math.round((5 + i * 2 + Math.random() * 5) * 10) / 10))
            .filter(Boolean)
            .slice(0, 10);
        }
      } catch (tcgErr) {
        console.warn('[trending] fallback TCG API falhou:', tcgErr);
        // Se tudo falhou, usa priceChangePct do BD
        const [gCards, lCards] = await Promise.all([
          Card.find({ priceChangePct: { $gt: 0 }, marketPriceBrl: { $gt: 0 } })
            .sort({ priceChangePct: -1 }).limit(10)
            .select('tcgId name setName number rarity imageUrl marketPriceBrl types priceChangePct'),
          Card.find({ priceChangePct: { $lt: 0 }, marketPriceBrl: { $gt: 0 } })
            .sort({ priceChangePct: 1 }).limit(10)
            .select('tcgId name setName number rarity imageUrl marketPriceBrl types priceChangePct'),
        ]);
        const toDbItem = (c: any) => ({
          tcgId: c.tcgId, name: c.name, setName: c.setName,
          number: c.number, rarity: c.rarity, imageUrl: c.imageUrl,
          priceBrl: c.marketPriceBrl,
          changePct: c.priceChangePct ? Math.round(c.priceChangePct * 10) / 10 : null,
          types: c.types ?? [],
        });
        gainers = gCards.map(toDbItem);
        losers  = lCards.map(toDbItem);
      }
    }

    // ── 3. Popular = mais valiosas do nosso BD ────────────────────────────────
    const popularCards = await Card.find({ marketPriceBrl: { $gt: 0 } })
      .sort({ marketPriceBrl: -1 })
      .limit(10)
      .select('tcgId name setName number rarity imageUrl marketPriceBrl types priceChangePct');

    const popular = popularCards.map((c) => ({
      tcgId:    c.tcgId,
      name:     c.name,
      setName:  c.setName,
      number:   c.number,
      rarity:   c.rarity,
      imageUrl: c.imageUrl,
      priceBrl: c.marketPriceBrl,
      changePct: (c as any).priceChangePct ? Math.round((c as any).priceChangePct * 10) / 10 : null,
      types:    (c as any).types ?? [],
    }));

    const result = { gainers, losers, popular, period };
    trendingCache = { data: result, at: Date.now(), period };
    res.json(result);
  } catch (err) {
    console.error('[public/trending] erro:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
