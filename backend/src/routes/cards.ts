import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth';
import { searchCards, getOrCreateCard, refreshCardPrice } from '../services/tcg';
import { PortfolioItem } from '../models/Portfolio';
import Card from '../models/Card';
import PriceHistory from '../models/PriceHistory';
import { runDailyPriceSnapshot } from '../jobs/dailyPriceSnapshot';

const router = Router();

const PRICE_TTL_MS = 60 * 60 * 1000; // 1h

// GET /api/cards/search?q=pikachu&page=1&pageSize=24
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  const q = (req.query.q as string ?? '').trim();
  if (!q || q.length < 2) {
    res.status(400).json({ error: 'Busca deve ter pelo menos 2 caracteres.' });
    return;
  }
  const page     = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(250, Math.max(1, parseInt(req.query.pageSize as string) || 48));

  try {
    const result = await searchCards(q, page, pageSize);
    res.json(result);
  } catch (err) {
    console.error('[TCG] searchCards error:', err);
    res.status(502).json({ error: 'Falha ao buscar cartas na API TCG.' });
  }
});

// POST /api/cards/snapshot — dispara snapshot diário manualmente (admin only)
router.post('/snapshot', requireAuth, async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito.' });
    return;
  }
  // Roda em background — não aguarda conclusão
  runDailyPriceSnapshot().catch((err) => console.error('[snapshot] erro:', err));
  res.json({ message: 'Snapshot iniciado em background.' });
});

// POST /api/cards/refresh-prices — força atualização de preços das cartas do usuário (chamado pelo polling)
router.post('/refresh-prices', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    // Pega todos os tcgIds únicos nos portfolios do usuário
    const items = await PortfolioItem.find({ userId }).distinct('tcgId');
    if (!items.length) { res.json({ updated: 0 }); return; }

    // Filtra cartas com preço stale: nunca atualizado, >1h, ou com source inválido
    const staleCards = await Card.find({
      tcgId: { $in: items },
      $or: [
        { priceUpdatedAt: null },
        { priceUpdatedAt: { $lt: new Date(Date.now() - PRICE_TTL_MS) } },
        { priceSource: 'unavailable' }, // cartas com preço inválido pelo bug anterior
      ],
    }).select('tcgId');

    // Atualiza em paralelo (máx 5 simultâneos para não sobrecarregar MYP Cards)
    let updated = 0;
    const CHUNK = 5;
    for (let i = 0; i < staleCards.length; i += CHUNK) {
      const chunk = staleCards.slice(i, i + CHUNK);
      await Promise.all(chunk.map(async (c) => {
        try {
          await refreshCardPrice(c.tcgId);
          updated++;
        } catch {}
      }));
    }

    res.json({ updated, total: staleCards.length });
  } catch (err) {
    console.error('[TCG] refresh-prices error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /api/cards/:tcgId/price-history?days=90 — histórico de preços BRL de uma carta
router.get('/:tcgId/price-history', requireAuth, async (req: Request, res: Response) => {
  const { tcgId } = req.params;
  const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || parseInt(req.query.limit as string) || 90));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  try {
    const history = await PriceHistory.find({ tcgId, recordedAt: { $gte: since } })
      .sort({ recordedAt: 1 })
      .select('priceBrl priceUsd source recordedAt -_id');
    res.json(history);
  } catch (err) {
    console.error('[TCG] price-history error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /api/cards/:tcgId — detalhes + preço de uma carta (cria no BD se não existir)
router.get('/:tcgId', requireAuth, async (req: Request, res: Response) => {
  const { tcgId } = req.params;
  try {
    let card = await Card.findOne({ tcgId });

    if (!card) {
      card = await getOrCreateCard(tcgId);
      if (!card) {
        res.status(404).json({ error: 'Carta não encontrada.' });
        return;
      }
    }

    const isStale = !card.priceUpdatedAt || (Date.now() - card.priceUpdatedAt.getTime() > PRICE_TTL_MS);
    if (isStale) {
      const prices = await refreshCardPrice(tcgId);
      card = await Card.findOne({ tcgId }) ?? card;
      res.json({ card, prices, fresh: true });
    } else {
      res.json({ card, prices: { usd: card.marketPriceUsd, brl: card.marketPriceBrl }, fresh: false });
    }
  } catch (err) {
    console.error('[TCG] getCard error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
