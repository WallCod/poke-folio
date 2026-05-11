/**
 * Compara resultados de busca entre nosso backend e o MYP Cards
 * Executa: npx ts-node scripts/audit-search.ts
 */

import axios from 'axios';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { searchCards } from '../src/services/tcg';

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI não definido');
  await mongoose.connect(uri, { dbName: 'pokefolio' });
}

const POKEMONS = [
  'Fearow', 'Spearow', 'Charmander', 'Charmeleon', 'Charizard',
  'Pikachu', 'Eevee', 'Mewtwo', 'Gengar', 'Umbreon',
  'Blaziken', 'Lucario', 'Garchomp', 'Sylveon', 'Rayquaza',
];

function toSlug(name: string): string {
  return name
    .replace(/^(mega|dark|light|shadow|m\s+)\s+/i, '')
    .replace(/\s+(ex|gx|v|vmax|vstar|prime)\s*$/i, '')
    .trim()
    .toLowerCase()
    .split(' ')[0];
}

async function getMypCount(name: string): Promise<{ total: number; jp: number; pt: number; en: number }> {
  try {
    const slug = toSlug(name);
    const { data } = await axios.get(
      `https://mypcards.com/api/v1/pokemon/carta/${encodeURIComponent(slug)}`,
      { timeout: 10000 }
    );
    const cards = data.cards as Array<{
      card_code: string;
      img_pt: string | null;
      img_en: string | null;
    }> ?? [];

    const hasValidPath = (url: string | null) =>
      !!url && url.length > 'https://img.mypcards.com/'.length && url.includes('/img/');

    let jp = 0, pt = 0, en = 0;
    const jpPrefixes = /^(sm1m|sm1s|sm1l|sm2|sm3|sm4|sm5|sm6|sm7|sm8|sm9|sm10|sm11|sm12|s1|s2|s3|s4|s5|s6|s7|s8|s9|s10|meg|m1l|mew|xy1|xy2|xy3|xy4|xy5|xy6|xy7|xy8|xy9|xy10|xy11|xy12)/;

    for (const c of cards) {
      const parts = c.card_code.split('_');
      const edition = parts.slice(1, -1).join('').toLowerCase();
      const isPt = hasValidPath(c.img_pt) && c.img_pt !== c.img_en;
      const isJp = jpPrefixes.test(edition);
      if (isPt) pt++;
      else if (isJp) jp++;
      else en++;
    }

    return { total: cards.length, jp, pt, en };
  } catch {
    return { total: -1, jp: 0, pt: 0, en: 0 };
  }
}

async function getOurCount(name: string): Promise<{
  total: number; jp: number; pt: number; en: number;
  broken: number; noprice: number; issues: string[];
}> {
  try {
    // Busca todas as páginas
    let all: any[] = [];
    let page = 1;
    while (true) {
      const { cards, totalCount } = await searchCards(name, page, 24);
      all = all.concat(cards);
      if (all.length >= totalCount || cards.length < 24) break;
      page++;
    }

    const issues: string[] = [];
    let jp = 0, pt = 0, en = 0, broken = 0, noprice = 0;

    for (const c of all) {
      const lang = (c.lang ?? 'EN').toUpperCase();
      if (lang === 'JP') jp++;
      else if (lang === 'PT') pt++;
      else en++;

      // Imagem quebrada = URL base sem path
      const imgOk = c.imageUrl && c.imageUrl.includes('/img/') ||
                    (c.imageUrl && !c.imageUrl.startsWith('https://img.mypcards.com/') );
      if (!imgOk) {
        broken++;
        issues.push(`IMG_BROKEN: ${c.name} ${c.number} (${c.setName})`);
      }

      // Sem preço nenhum
      if (c.marketPriceBrl == null && c.marketPriceUsd == null) {
        noprice++;
        // só loga se for card com fonte MYP (esperado ter preço)
        if (c.priceSource === 'mypcards') {
          issues.push(`NO_PRICE_MYP: ${c.name} ${c.number} (${c.setName})`);
        }
      }
    }

    return { total: all.length, jp, pt, en, broken, noprice, issues };
  } catch (e: any) {
    return { total: -1, jp: 0, pt: 0, en: 0, broken: 0, noprice: 0, issues: [`ERROR: ${e.message}`] };
  }
}

async function main() {
  await connectDb();
  console.log('\n=== AUDIT: Comparação backend vs MYP ===\n');
  console.log(
    'Pokémon'.padEnd(14),
    'MYP(tot/JP/PT)'.padEnd(16),
    'OURS(tot/JP/PT)'.padEnd(17),
    'Δ'.padEnd(5),
    'broken'.padEnd(8),
    'issues'
  );
  console.log('─'.repeat(90));

  let totalIssues = 0;

  for (const name of POKEMONS) {
    const [myp, ours] = await Promise.all([getMypCount(name), getOurCount(name)]);
    const delta = ours.total - myp.total;
    const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
    const ok = Math.abs(delta) <= 5 && ours.broken === 0;
    const flag = ok ? '✓' : '✗';

    console.log(
      `${flag} ${name}`.padEnd(14),
      `${myp.total}/${myp.jp}/${myp.pt}`.padEnd(16),
      `${ours.total}/${ours.jp}/${ours.pt}`.padEnd(17),
      deltaStr.padEnd(5),
      String(ours.broken).padEnd(8),
      ours.issues.slice(0, 2).join(' | ')
    );

    if (ours.issues.length > 0) totalIssues += ours.issues.length;

    // Rate limit gentil
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('─'.repeat(90));
  console.log(`\nTotal de issues: ${totalIssues}`);
  console.log('Δ aceitável: ±5 (TCGdex JP SV + promos não presentes no MYP)\n');
  await mongoose.disconnect();
}

main().catch(console.error);
