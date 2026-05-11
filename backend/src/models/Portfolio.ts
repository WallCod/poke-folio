import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── Portfolio (container nomeado) ────────────────────────────────────────────

export interface IPortfolio extends Document {
  userId: Types.ObjectId;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:        { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, default: '', maxlength: 200 },
    isDefault:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);

// ─── PortfolioItem (carta dentro de um portfolio) ─────────────────────────────

export type Condition = 'Mint' | 'NM' | 'LP' | 'MP' | 'HP';

export interface IPortfolioItem extends Document {
  portfolioId: Types.ObjectId;
  userId: Types.ObjectId;
  cardId: Types.ObjectId;       // ref Card
  tcgId: string;                // desnormalizado para queries rápidas
  quantity: number;
  condition: Condition;
  foil: boolean;
  notes: string;
  purchasePrice: number | null;  // preço pago pelo usuário (BRL)
  purchasedAt: Date | null;
  addedAt: Date;
}

const PortfolioItemSchema = new Schema<IPortfolioItem>(
  {
    portfolioId:   { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
    userId:        { type: Schema.Types.ObjectId, ref: 'User',      required: true, index: true },
    cardId:        { type: Schema.Types.ObjectId, ref: 'Card',      required: true },
    tcgId:         { type: String, required: true },
    quantity:      { type: Number, required: true, min: 1, default: 1 },
    condition:     { type: String, enum: ['Mint','NM','LP','MP','HP'], default: 'NM' },
    foil:          { type: Boolean, default: false },
    notes:         { type: String, default: '', maxlength: 500 },
    purchasePrice: { type: Number, default: null },
    purchasedAt:   { type: Date,   default: null },
    addedAt:       { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Índice composto — um usuário não pode ter o mesmo card+condição duplicado no mesmo portfolio
PortfolioItemSchema.index({ portfolioId: 1, cardId: 1, condition: 1 });

export const PortfolioItem = mongoose.model<IPortfolioItem>('PortfolioItem', PortfolioItemSchema);
