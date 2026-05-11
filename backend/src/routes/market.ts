import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth';
import { PortfolioItem } from '../models/Portfolio';
import Card from '../models/Card';

const router = Router();

// GET /api/market/top — cartas mais valiosas e mais populares na plataforma
router.get('/top', requireAuth, async (_req: Request, res: Response) => {
  try {
    // Mais valiosas: cartas no BD com maior preço BRL
    const topValued = await Card.find({ marketPriceBrl: { $ne: null, $gt: 0 } })
      .sort({ marketPriceBrl: -1 })
      .limit(10)
      .select('tcgId name setName setCode rarity imageUrl imageUrlHiRes marketPriceBrl marketPriceUsd types');

    // Mais populares: cartas com mais ocorrências em portfolios (soma de quantity)
    const popularAgg = await PortfolioItem.aggregate([
      { $group: { _id: '$tcgId', totalQty: { $sum: '$quantity' }, holders: { $sum: 1 } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
    ]);

    const popularTcgIds = popularAgg.map((a) => a._id as string);
    const popularCards = await Card.find({ tcgId: { $in: popularTcgIds } })
      .select('tcgId name setName setCode rarity imageUrl imageUrlHiRes marketPriceBrl marketPriceUsd types');

    const popularWithStats = popularTcgIds.map((id) => {
      const card = popularCards.find((c) => c.tcgId === id);
      const agg  = popularAgg.find((a) => a._id === id);
      if (!card) return null;
      return { ...card.toObject(), totalQty: agg?.totalQty ?? 0, holders: agg?.holders ?? 0 };
    }).filter(Boolean);

    // Mais recentes: últimas cartas adicionadas à plataforma (BD)
    const recentCards = await Card.find({ marketPriceBrl: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('tcgId name setName setCode rarity imageUrl marketPriceBrl types createdAt');

    res.json({ topValued, popular: popularWithStats, recent: recentCards });
  } catch (err) {
    console.error('[market] top error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
