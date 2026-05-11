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

// Cache simples em memória
let setsCache: { data: any[]; at: number } | null = null;
let trendingCache: { data: any; at: number } | null = null;
const SETS_TTL   = 6 * 60 * 60 * 1000;  // 6h
const TREND_TTL  = 30 * 60 * 1000;      // 30min

// GET /api/public/sets — todos os sets ordenados por lançamento (sem auth)
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
      id:          s.id,
      name:        s.name,
      series:      s.series,
      releaseDate: s.releaseDate,
      total:       s.total,
      printedTotal: s.printedTotal,
      logo:        s.images?.logo ?? null,
      symbol:      s.images?.symbol ?? null,
    }));

    setsCache = { data: sets, at: Date.now() };
    res.json(sets);
  } catch (err) {
    console.error('[public/sets] erro:', err);
    res.status(502).json({ error: 'Não foi possível carregar os sets.' });
  }
});

// GET /api/public/trending — cartas que mais valorizaram/desvalorizaram (sem auth)
router.get('/trending', async (req: Request, res: Response) => {
  try {
    if (trendingCache && Date.now() - trendingCache.at < TREND_TTL) {
      res.json(trendingCache.data);
      return;
    }

    const period = (req.query.period as string) ?? 'week';
    const periodMs: Record<string, number> = {
      day:   24 * 60 * 60 * 1000,
      week:  7  * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const ms = periodMs[period] ?? periodMs.week;
    const since = new Date(Date.now() - ms);

    // Pega todos os registros de preço do período
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
          tcgId:     '$_id',
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
      { $match: { count: { $gte: 2 } } }, // precisa de ao menos 2 registros para delta real
    ]);

    // Top 10 valorizando e top 10 desvalorizando
    const sorted = history.sort((a, b) => b.changePct - a.changePct);
    const topGainers = sorted.slice(0, 10);
    const topLosers  = sorted.slice(-10).reverse();

    const allIds = [...new Set([...topGainers, ...topLosers].map((h) => h.tcgId))];
    const cards  = await Card.find({ tcgId: { $in: allIds } })
      .select('tcgId name setName setCode number rarity imageUrl marketPriceBrl types lang');

    const cardMap = new Map(cards.map((c) => [c.tcgId, c]));

    const enriched = (list: any[]) =>
      list
        .map((h) => {
          const card = cardMap.get(h.tcgId);
          if (!card) return null;
          return {
            tcgId:      card.tcgId,
            name:       card.name,
            setName:    card.setName,
            number:     card.number,
            rarity:     card.rarity,
            imageUrl:   card.imageUrl,
            priceBrl:   h.lastPrice,
            changePct:  Math.round(h.changePct * 10) / 10,
            types:      (card as any).types ?? [],
          };
        })
        .filter(Boolean);

    // Cards mais populares (mais em coleções) — sem historico de preço necessário
    const popularCards = await Card.find({ marketPriceBrl: { $gt: 0 } })
      .sort({ marketPriceBrl: -1 })
      .limit(10)
      .select('tcgId name setName number rarity imageUrl marketPriceBrl types');

    const result = {
      gainers: enriched(topGainers),
      losers:  enriched(topLosers),
      popular: popularCards.map((c) => ({
        tcgId:    c.tcgId,
        name:     c.name,
        setName:  c.setName,
        number:   c.number,
        rarity:   c.rarity,
        imageUrl: c.imageUrl,
        priceBrl: c.marketPriceBrl,
        types:    (c as any).types ?? [],
        changePct: (c as any).priceChangePct ?? null,
      })),
      period,
    };

    trendingCache = { data: result, at: Date.now() };
    res.json(result);
  } catch (err) {
    console.error('[public/trending] erro:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
