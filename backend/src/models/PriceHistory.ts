import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceHistory extends Document {
  tcgId: string;
  priceBrl: number;
  priceUsd: number | null;
  source: string;
  recordedAt: Date;
}

const PriceHistorySchema = new Schema<IPriceHistory>({
  tcgId:      { type: String, required: true, index: true },
  priceBrl:   { type: Number, required: true },
  priceUsd:   { type: Number, default: null },
  source:     { type: String, default: 'mypcards' },
  recordedAt: { type: Date, default: () => new Date() },
});

// TTL: mantém até 2 anos de histórico
PriceHistorySchema.index({ recordedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });

// Índice composto para busca eficiente por card + data
PriceHistorySchema.index({ tcgId: 1, recordedAt: -1 });

export default mongoose.model<IPriceHistory>('PriceHistory', PriceHistorySchema);
