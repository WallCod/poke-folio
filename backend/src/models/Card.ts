import mongoose, { Schema, Document } from 'mongoose';

export interface ICard extends Document {
  tcgId: string;       // ID da pokemontcg.io (ex: "sv3pt5-197")
  name: string;
  setName: string;
  setCode: string;
  number: string;
  rarity: string;
  types: string[];
  artist: string;
  imageUrl: string;
  imageUrlHiRes: string;
  marketPriceUsd: number | null;
  marketPriceBrl: number | null;
  marketPriceBrlMin: number | null;
  marketPriceBrlMax: number | null;
  previousPriceBrl: number | null;
  priceChangePct: number | null;
  priceSource: string;
  priceUpdatedAt: Date | null;
  supertype: string;
  subtypes: string[];
  hp: string;
  lang: string;        // idioma do card: 'EN', 'JP', 'POCKET'
}

const CardSchema = new Schema<ICard>(
  {
    tcgId:           { type: String, required: true, unique: true, index: true },
    name:            { type: String, required: true },
    setName:         { type: String, required: true },
    setCode:         { type: String, required: true },
    number:          { type: String, default: '' },
    rarity:          { type: String, default: 'Unknown' },
    types:           { type: [String], default: [] },
    artist:          { type: String, default: '' },
    imageUrl:        { type: String, default: '' },
    imageUrlHiRes:   { type: String, default: '' },
    marketPriceUsd:    { type: Number, default: null },
    marketPriceBrl:    { type: Number, default: null },
    marketPriceBrlMin: { type: Number, default: null },
    marketPriceBrlMax: { type: Number, default: null },
    previousPriceBrl:  { type: Number, default: null },
    priceChangePct:    { type: Number, default: null },
    priceSource:       { type: String, default: 'unavailable' },
    priceUpdatedAt:    { type: Date,   default: null },
    supertype:       { type: String, default: 'Pokémon' },
    subtypes:        { type: [String], default: [] },
    hp:              { type: String, default: '' },
    lang:            { type: String, default: 'EN' },
  },
  { timestamps: true }
);

export default mongoose.model<ICard>('Card', CardSchema);
