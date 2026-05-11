import { Router, Request, Response } from 'express';
import axios from 'axios';
import Card from '../models/Card';
import PriceHistory from '../models/PriceHistory';

const router = Router();

const TCG_KEY = process.env.POKEMONTCG_API_KEY ?? '';
const tcgClient = axios.create({
  baseURL: 'https://api.pokemontcg.io/v2',
  timeout: 12000,
  headers: TCG_KEY ? { 'X-Api-Key': TCG_KEY } : {},
});

// ─── Caches em memória ─────────────────────────────────────────────────────────

let setsCache: { data: any[]; at: number } | null = null;
let trendingCache: { data: any; at: number; period: string } | null = null;
let topCardsCache: { data: any[]; at: number } | null = null;
const setCardsCache: Record<string, { data: any; at: number }> = {};

const SETS_TTL      = 6 * 60 * 60 * 1000;   // 6h
const TREND_TTL     = 30 * 60 * 1000;        // 30min
const TOP_TTL       = 15 * 60 * 1000;        // 15min
const SET_CARDS_TTL = 12 * 60 * 60 * 1000;   // 12h (raramente muda)

// ─── GET /api/public/sets — todos os sets ─────────────────────────────────────

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

// ─── GET /api/public/sets/:setId/cards — cartas de um set específico ──────────

router.get('/sets/:setId/cards', async (req: Request, res: Response) => {
  const { setId } = req.params;

  // Valida setId — apenas letras, números e hífen
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

// ─── GET /api/public/top — top cartas por valor (sem auth) ───────────────────

router.get('/top', async (_req: Request, res: Response) => {
  try {
    if (topCardsCache && Date.now() - topCardsCache.at < TOP_TTL) {
      res.json(topCardsCache.data);
      return;
    }

    const cards = await Card.find({ marketPriceBrl: { $gt: 0 } })
      .sort({ marketPriceBrl: -1 })
      .limit(10)
      .select('tcgId name setName setCode number rarity imageUrl marketPriceBrl marketPriceUsd types lang priceChangePct');

    const result = cards.map((c) => ({
      tcgId:       c.tcgId,
      name:        c.name,
      setName:     c.setName,
      number:      c.number,
      rarity:      c.rarity,
      imageUrl:    c.imageUrl,
      priceBrl:    c.marketPriceBrl,
      priceUsd:    c.marketPriceUsd,
      changePct:   (c as any).priceChangePct ?? null,
      types:       (c as any).types ?? [],
    }));

    topCardsCache = { data: result, at: Date.now() };
    res.json(result);
  } catch (err) {
    console.error('[public/top] erro:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ─── GET /api/public/trending — gainers/losers/popular ───────────────────────

router.get('/trending', async (req: Request, res: Response) => {
  const period = (req.query.period as string) ?? 'week';

  try {
    if (trendingCache && trendingCache.period === period && Date.now() - trendingCache.at < TREND_TTL) {
      res.json(trendingCache.data);
      return;
    }

    const periodMs: Record<string, number> = {
      day:   24 * 60 * 60 * 1000,
      week:  7  * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const ms    = periodMs[period] ?? periodMs.week;
    const since = new Date(Date.now() - ms);

    // Tenta calcular delta via PriceHistory
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
      { $match: { count: { $gte: 2 } } },
    ]);

    let gainers: any[] = [];
    let losers:  any[] = [];

    if (history.length >= 4) {
      // Dados reais do PriceHistory
      const sorted   = history.sort((a, b) => b.changePct - a.changePct);
      const gainerH  = sorted.filter((h) => h.changePct > 0).slice(0, 10);
      const loserH   = sorted.filter((h) => h.changePct < 0).slice(-10).reverse();
      const allIds   = [...new Set([...gainerH, ...loserH].map((h) => h.tcgId))];
      const cards    = await Card.find({ tcgId: { $in: allIds } })
        .select('tcgId name setName number rarity imageUrl marketPriceBrl types');
      const cardMap  = new Map(cards.map((c) => [c.tcgId, c]));

      const enrich = (list: any[]) =>
        list.map((h) => {
          const card = cardMap.get(h.tcgId);
          if (!card) return null;
          return {
            tcgId:    card.tcgId,
            name:     card.name,
            setName:  card.setName,
            number:   card.number,
            rarity:   card.rarity,
            imageUrl: card.imageUrl,
            priceBrl: h.lastPrice,
            changePct: Math.round(h.changePct * 10) / 10,
            types:    (card as any).types ?? [],
          };
        }).filter(Boolean);

      gainers = enrich(gainerH);
      losers  = enrich(loserH);
    } else {
      // Fallback: usa priceChangePct do campo do Card
      const [gCards, lCards] = await Promise.all([
        Card.find({ priceChangePct: { $gt: 0 }, marketPriceBrl: { $gt: 0 } })
          .sort({ priceChangePct: -1 }).limit(10)
          .select('tcgId name setName number rarity imageUrl marketPriceBrl types priceChangePct'),
        Card.find({ priceChangePct: { $lt: 0 }, marketPriceBrl: { $gt: 0 } })
          .sort({ priceChangePct: 1 }).limit(10)
          .select('tcgId name setName number rarity imageUrl marketPriceBrl types priceChangePct'),
      ]);

      const toItem = (c: any) => ({
        tcgId:    c.tcgId,
        name:     c.name,
        setName:  c.setName,
        number:   c.number,
        rarity:   c.rarity,
        imageUrl: c.imageUrl,
        priceBrl: c.marketPriceBrl,
        changePct: c.priceChangePct ? Math.round(c.priceChangePct * 10) / 10 : null,
        types:    c.types ?? [],
      });

      gainers = gCards.map(toItem);
      losers  = lCards.map(toItem);
    }

    // Popular = mais valiosas
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
