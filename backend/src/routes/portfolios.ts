import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../middlewares/auth';
import { Portfolio, PortfolioItem } from '../models/Portfolio';
import { getOrCreateCard, refreshCardPrice } from '../services/tcg';
import Card, { ICard } from '../models/Card';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureDefaultPortfolio(userId: string): Promise<InstanceType<typeof Portfolio>> {
  let def = await Portfolio.findOne({ userId, isDefault: true });
  if (!def) {
    def = await Portfolio.create({ userId, name: 'Minha coleção', isDefault: true });
  }
  return def;
}

// ─── Portfolios CRUD ──────────────────────────────────────────────────────────

// GET /api/portfolios — lista todos os portfolios do usuário
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await ensureDefaultPortfolio(userId);

  const portfolios = await Portfolio.find({ userId }).sort({ isDefault: -1, createdAt: 1 });

  // Para cada portfolio, conta cartas e valor total
  const withStats = await Promise.all(
    portfolios.map(async (p) => {
      const items = await PortfolioItem.find({ portfolioId: p._id }).populate('cardId');
      const totalCards = items.reduce((s, i) => s + i.quantity, 0);
      const totalValueBrl = items.reduce((s, i) => {
        const card = i.cardId as unknown as ICard;
        return s + (card?.marketPriceBrl ?? 0) * i.quantity;
      }, 0);
      return {
        _id:          p._id,
        name:         p.name,
        description:  p.description,
        isDefault:    p.isDefault,
        createdAt:    p.createdAt,
        totalCards,
        totalValueBrl: Math.round(totalValueBrl * 100) / 100,
      };
    })
  );

  res.json(withStats);
});

// POST /api/portfolios — cria novo portfolio
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, description } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: 'Nome é obrigatório.' });
    return;
  }
  const count = await Portfolio.countDocuments({ userId });
  if (count >= 20) {
    res.status(400).json({ error: 'Limite de 20 portfolios atingido.' });
    return;
  }
  const portfolio = await Portfolio.create({ userId, name: name.trim(), description: description?.trim() ?? '' });
  res.status(201).json(portfolio);
});

// PATCH /api/portfolios/:id — renomeia/descreve portfolio
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, description } = req.body;
  const portfolio = await Portfolio.findOne({ _id: req.params.id, userId });
  if (!portfolio) {
    res.status(404).json({ error: 'Portfolio não encontrado.' });
    return;
  }
  if (name?.trim()) portfolio.name = name.trim();
  if (description !== undefined) portfolio.description = description.trim();
  await portfolio.save();
  res.json(portfolio);
});

// DELETE /api/portfolios/:id — remove portfolio e todos os seus itens
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const portfolio = await Portfolio.findOne({ _id: req.params.id, userId });
  if (!portfolio) {
    res.status(404).json({ error: 'Portfolio não encontrado.' });
    return;
  }
  if (portfolio.isDefault) {
    res.status(400).json({ error: 'O portfolio padrão não pode ser removido.' });
    return;
  }
  await PortfolioItem.deleteMany({ portfolioId: portfolio._id });
  await portfolio.deleteOne();
  res.json({ ok: true });
});

// ─── Itens de um portfolio ────────────────────────────────────────────────────

// GET /api/portfolios/:id/items — lista cartas do portfolio
router.get('/:id/items', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const portfolio = await Portfolio.findOne({ _id: req.params.id, userId });
  if (!portfolio) {
    res.status(404).json({ error: 'Portfolio não encontrado.' });
    return;
  }

  const items = await PortfolioItem.find({ portfolioId: portfolio._id })
    .populate('cardId')
    .sort({ addedAt: -1 });

  res.json(items);
});

// POST /api/portfolios/:id/items — adiciona carta ao portfolio
router.post('/:id/items', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { tcgId, quantity = 1, condition = 'NM', foil = false, notes = '', purchasePrice = null, cardData } = req.body;

  if (!tcgId) {
    res.status(400).json({ error: 'tcgId é obrigatório.' });
    return;
  }

  const portfolio = await Portfolio.findOne({ _id: req.params.id, userId });
  if (!portfolio) {
    res.status(404).json({ error: 'Portfolio não encontrado.' });
    return;
  }

  // Garante que a carta existe no BD e busca preço se ainda não tem
  let card = await getOrCreateCard(tcgId);

  // Cards MYP-only (myp__xxx__PT/JP): getOrCreateCard retorna null, criamos com os dados do frontend
  if (!card && tcgId.startsWith('myp__') && cardData) {
    const existing = await Card.findOne({ tcgId });
    card = existing ?? await Card.create({
      tcgId,
      name:            cardData.name        ?? 'Unknown',
      setName:         cardData.setName      ?? '',
      setCode:         cardData.setCode      ?? '',
      number:          cardData.number       ?? '',
      rarity:          cardData.rarity       ?? 'Unknown',
      types:           cardData.types        ?? [],
      artist:          cardData.artist       ?? '',
      imageUrl:        cardData.imageUrl     ?? '',
      imageUrlHiRes:   cardData.imageUrlHiRes ?? cardData.imageUrl ?? '',
      supertype:       cardData.supertype    ?? 'Pokémon',
      subtypes:        cardData.subtypes     ?? [],
      hp:              cardData.hp           ?? '',
      lang:            cardData.lang         ?? 'EN',
      marketPriceBrl:    cardData.marketPriceBrl    ?? null,
      marketPriceBrlMin: cardData.marketPriceBrlMin ?? null,
      marketPriceBrlMax: cardData.marketPriceBrlMax ?? null,
      marketPriceUsd:    cardData.marketPriceUsd    ?? null,
      priceSource:       cardData.priceSource       ?? 'mypcards',
      priceUpdatedAt:    new Date(),
    });
  }

  if (!card) {
    res.status(404).json({ error: 'Carta não encontrada na API TCG.' });
    return;
  }
  if (!card.priceUpdatedAt && !tcgId.startsWith('myp__')) {
    await refreshCardPrice(tcgId);
  }

  // Se já existe item com mesmo card+condição no mesmo portfolio, incrementa quantidade
  const existing = await PortfolioItem.findOne({
    portfolioId: portfolio._id,
    cardId: card._id,
    condition,
  });

  if (existing) {
    existing.quantity += quantity;
    existing.foil = foil;
    existing.notes = notes;
    await existing.save();
    const populated = await existing.populate('cardId');
    res.json(populated);
    return;
  }

  const item = await PortfolioItem.create({
    portfolioId: portfolio._id,
    userId: new Types.ObjectId(userId),
    cardId: card._id,
    tcgId,
    quantity,
    condition,
    foil,
    notes,
    purchasePrice: purchasePrice ?? null,
    purchasedAt:   purchasePrice ? new Date() : null,
  });

  const populated = await item.populate('cardId');
  res.status(201).json(populated);
});

// PATCH /api/portfolios/:id/items/:itemId — atualiza quantidade/condição
router.patch('/:id/items/:itemId', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { quantity, condition, foil, notes, purchasePrice } = req.body;

  const item = await PortfolioItem.findOne({ _id: req.params.itemId, userId });
  if (!item) {
    res.status(404).json({ error: 'Item não encontrado.' });
    return;
  }

  if (quantity !== undefined) item.quantity = Math.max(1, quantity);
  if (condition !== undefined) item.condition = condition;
  if (foil !== undefined) item.foil = foil;
  if (notes !== undefined) item.notes = notes;
  if (purchasePrice !== undefined) {
    item.purchasePrice = purchasePrice;
    if (purchasePrice && !item.purchasedAt) item.purchasedAt = new Date();
  }

  await item.save();
  const populated = await item.populate('cardId');
  res.json(populated);
});

// DELETE /api/portfolios/:id/items/:itemId — remove item
router.delete('/:id/items/:itemId', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const item = await PortfolioItem.findOne({ _id: req.params.itemId, userId });
  if (!item) {
    res.status(404).json({ error: 'Item não encontrado.' });
    return;
  }
  await item.deleteOne();
  res.json({ ok: true });
});

export default router;
