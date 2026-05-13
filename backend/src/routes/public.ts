import { Router, Request, Response } from 'express';
import axios from 'axios';
import Card from '../models/Card';

const router = Router();

const TCG_KEY = process.env.POKEMONTCG_API_KEY ?? '';
const tcgClient = axios.create({
  baseURL: 'https://api.pokemontcg.io/v2',
  timeout: 20000,
  headers: TCG_KEY ? { 'X-Api-Key': TCG_KEY } : {},
});
// Cliente com timeout maior para sets com muitas cartas (>150)
const tcgClientSlow = axios.create({
  baseURL: 'https://api.pokemontcg.io/v2',
  timeout: 60000,
  headers: TCG_KEY ? { 'X-Api-Key': TCG_KEY } : {},
});

// Sets estáticos de fallback (usados quando a API pokemontcg.io está inacessível)
const FALLBACK_SETS = [
  { id: 'sv8pt5', name: 'Prismatic Evolutions', series: 'Scarlet & Violet', releaseDate: '2025-01-17', total: 147, printedTotal: 147, logo: 'https://images.pokemontcg.io/sv8pt5/logo.png', symbol: 'https://images.pokemontcg.io/sv8pt5/symbol.png' },
  { id: 'sv8',    name: 'Surging Sparks',       series: 'Scarlet & Violet', releaseDate: '2024-11-08', total: 264, printedTotal: 191, logo: 'https://images.pokemontcg.io/sv8/logo.png',    symbol: 'https://images.pokemontcg.io/sv8/symbol.png' },
  { id: 'sv7',    name: 'Stellar Crown',        series: 'Scarlet & Violet', releaseDate: '2024-09-13', total: 175, printedTotal: 142, logo: 'https://images.pokemontcg.io/sv7/logo.png',    symbol: 'https://images.pokemontcg.io/sv7/symbol.png' },
  { id: 'sv6pt5', name: 'Shrouded Fable',       series: 'Scarlet & Violet', releaseDate: '2024-08-02', total: 99,  printedTotal: 99,  logo: 'https://images.pokemontcg.io/sv6pt5/logo.png', symbol: 'https://images.pokemontcg.io/sv6pt5/symbol.png' },
  { id: 'sv6',    name: 'Twilight Masquerade',  series: 'Scarlet & Violet', releaseDate: '2024-05-24', total: 226, printedTotal: 167, logo: 'https://images.pokemontcg.io/sv6/logo.png',    symbol: 'https://images.pokemontcg.io/sv6/symbol.png' },
  { id: 'sv5',    name: 'Temporal Forces',      series: 'Scarlet & Violet', releaseDate: '2024-03-22', total: 218, printedTotal: 162, logo: 'https://images.pokemontcg.io/sv5/logo.png',    symbol: 'https://images.pokemontcg.io/sv5/symbol.png' },
  { id: 'sv4pt5', name: 'Paldean Fates',        series: 'Scarlet & Violet', releaseDate: '2024-01-26', total: 245, printedTotal: 245, logo: 'https://images.pokemontcg.io/sv4pt5/logo.png', symbol: 'https://images.pokemontcg.io/sv4pt5/symbol.png' },
  { id: 'sv4',    name: 'Paradox Rift',         series: 'Scarlet & Violet', releaseDate: '2023-11-03', total: 266, printedTotal: 182, logo: 'https://images.pokemontcg.io/sv4/logo.png',    symbol: 'https://images.pokemontcg.io/sv4/symbol.png' },
  { id: 'sv3pt5', name: 'Pokemon 151',          series: 'Scarlet & Violet', releaseDate: '2023-09-22', total: 207, printedTotal: 165, logo: 'https://images.pokemontcg.io/sv3pt5/logo.png', symbol: 'https://images.pokemontcg.io/sv3pt5/symbol.png' },
  { id: 'sv3',    name: 'Obsidian Flames',      series: 'Scarlet & Violet', releaseDate: '2023-08-11', total: 230, printedTotal: 197, logo: 'https://images.pokemontcg.io/sv3/logo.png',    symbol: 'https://images.pokemontcg.io/sv3/symbol.png' },
  { id: 'sv2',    name: 'Paldea Evolved',       series: 'Scarlet & Violet', releaseDate: '2023-06-09', total: 279, printedTotal: 193, logo: 'https://images.pokemontcg.io/sv2/logo.png',    symbol: 'https://images.pokemontcg.io/sv2/symbol.png' },
  { id: 'sv1',    name: 'Scarlet & Violet',     series: 'Scarlet & Violet', releaseDate: '2023-03-31', total: 258, printedTotal: 198, logo: 'https://images.pokemontcg.io/sv1/logo.png',    symbol: 'https://images.pokemontcg.io/sv1/symbol.png' },
  { id: 'swsh12', name: 'Silver Tempest',       series: 'Sword & Shield',   releaseDate: '2022-11-11', total: 245, printedTotal: 195, logo: 'https://images.pokemontcg.io/swsh12/logo.png', symbol: 'https://images.pokemontcg.io/swsh12/symbol.png' },
  { id: 'swsh11', name: 'Lost Origin',          series: 'Sword & Shield',   releaseDate: '2022-09-09', total: 246, printedTotal: 196, logo: 'https://images.pokemontcg.io/swsh11/logo.png', symbol: 'https://images.pokemontcg.io/swsh11/symbol.png' },
  { id: 'swsh10', name: 'Pokémon GO',           series: 'Sword & Shield',   releaseDate: '2022-07-01', total: 88,  printedTotal: 78,  logo: 'https://images.pokemontcg.io/swsh10pt5/logo.png', symbol: 'https://images.pokemontcg.io/swsh10pt5/symbol.png' },
  { id: 'swsh9',  name: 'Brilliant Stars',      series: 'Sword & Shield',   releaseDate: '2022-02-25', total: 216, printedTotal: 172, logo: 'https://images.pokemontcg.io/swsh9/logo.png',  symbol: 'https://images.pokemontcg.io/swsh9/symbol.png' },
  { id: 'base1',  name: 'Base Set',             series: 'Base',             releaseDate: '1999-01-09', total: 102, printedTotal: 102, logo: 'https://images.pokemontcg.io/base1/logo.png',  symbol: 'https://images.pokemontcg.io/base1/symbol.png' },
];

// ─── Caches em memória ─────────────────────────────────────────────────────────

let setsCache:     { data: any[]; at: number } | null = null;
let trendingCache: { data: any; at: number; period: string } | null = null;
let topCardsCache: { data: any[]; at: number } | null = null;
const setCardsCache: Record<string, { data: any; at: number }> = {};

const SETS_TTL      = 6  * 60 * 60 * 1000;   // 6h
const TREND_TTL     = 30 * 60 * 1000;         // 30min
const TOP_TTL       = 30 * 60 * 1000;         // 30min
const SET_CARDS_TTL = 12 * 60 * 60 * 1000;   // 12h

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

// ─── GET /api/public/cache-purge (dev/ops) ───────────────────────────────────
router.get('/cache-purge', (_req: Request, res: Response) => {
  trendingCache = null;
  topCardsCache = null;
  Object.keys(cardPriceCache).forEach((k) => delete cardPriceCache[k]);
  Object.keys(setCardsCache).forEach((k) => delete setCardsCache[k]);
  res.json({ ok: true, msg: 'all caches cleared' });
});

// ─── GET /api/public/sets ─────────────────────────────────────────────────────

router.get('/sets', async (_req: Request, res: Response) => {
  if (setsCache && Date.now() - setsCache.at < SETS_TTL) {
    res.json(setsCache.data);
    return;
  }

  try {
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
  } catch (err: any) {
    const msg = err?.code ?? err?.message ?? 'erro desconhecido';
    console.warn(`[public/sets] API indisponível (${msg}), usando fallback estático.`);
    res.json(FALLBACK_SETS);
  }
});

// ─── GET /api/public/sets/:setId/cards ───────────────────────────────────────

async function fetchSetCards(setId: string): Promise<any> {
  const client = tcgClientSlow; // timeout 60s — sets grandes (me1=188, sv8=264)
  const { data } = await client.get('/cards', {
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
  return result;
}

// Pré-aquece os sets em lotes para não sobrecarregar a TCG API
export async function warmUpSetCache(): Promise<void> {
  const ids = FALLBACK_SETS.map((s) => s.id);
  const BATCH = 3;
  console.log(`[Cache] Aquecendo ${ids.length} sets em lotes de ${BATCH}...`);
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map((id) =>
        fetchSetCards(id)
          .then(() => console.log(`[Cache] Set ${id} pronto`))
          .catch((e: any) => console.warn(`[Cache] Set ${id} falhou: ${e?.message}`))
      )
    );
    // Pausa entre lotes para não saturar a API externa
    if (i + BATCH < ids.length) await new Promise((r) => setTimeout(r, 1000));
  }
  console.log('[Cache] Warm-up de sets concluído.');
}

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

    const result = await fetchSetCards(setId);
    res.json(result);
  } catch (err: any) {
    const msg = err?.code ?? err?.message ?? 'erro desconhecido';
    console.warn(`[public/sets/${setId}/cards] API indisponível (${msg}).`);
    res.status(502).json({ error: 'Não foi possível carregar as cartas do set. A API externa está inacessível.' });
  }
});

// ─── GET /api/public/card-price/:tcgId ───────────────────────────────────────
// Busca preços diretamente da MYP usando name+number passados como query params.
// Não depende do BD — preços vêm sempre de fora.

const cardPriceCache: Record<string, { data: any; at: number }> = {};
const CARD_PRICE_TTL = 15 * 60 * 1000; // 15min

// Mapa setId TCG → edition_code MYP (verificado empiricamente)
const TCG_TO_MYP: Record<string, string> = {
  // Scarlet & Violet (EN)
  'sv10':    'DRI', 'sv9':    'JTG', 'sv8pt5': 'PRE', 'sv8': 'SSP',
  'sv7':     'SCR', 'sv6pt5': 'SFA', 'sv6':    'TWM', 'sv5': 'TEF',
  'sv4pt5':  'PAF', 'sv4':    'PAR', 'sv3pt5': 'MEW', 'sv3': 'OBF',
  'sv2':     'SV2', 'sv1':    'SV1',
  // Scarlet & Violet sub-sets / especiais
  'rsv10pt5': 'WHT', 'zsv10pt5': 'BLK',
  'swsh12pt5': 'CRZ',
  // Sword & Shield
  'swsh12':   'SIT', 'swsh11': 'LOR', 'swsh10pt5': 'PGO', 'swsh10': 'ASR',
  'swsh9':    'BRS', 'swsh8':  'FST', 'swsh7':     'EVS', 'swsh6':  'CRE',
  'swsh5':    'BST', 'swsh4pt5': 'SHF', 'swsh4':   'VIV', 'swsh35': 'CEL',
  'swsh3':    'DAA', 'swsh2':  'RCL', 'swsh1':     'SSH',
  'pgo':      'PGO',
  // Sun & Moon
  'sm12': 'CEC', 'sm11': 'UNM', 'sm10': 'UNB', 'sm9':  'TEU',
  'sm8':  'HIF', 'sm7':  'CLS', 'sm75': 'DRM', 'sm6':  'FLI',
  'sm5':  'UPR', 'sm4':  'CIN', 'sm35': 'SLG', 'sm3':  'BUS',
  'sm2':  'GRI', 'sm1':  'SUM',
  // XY
  'xy12': 'EVO', 'xy11': 'STS', 'xy10': 'FCO', 'xy9':  'BKP',
  'xy8':  'BKT', 'xy7':  'AOR', 'xy6':  'ROS', 'xy5':  'PRC',
  'xy4':  'PHF', 'xy3':  'FFI', 'xy2':  'FLF', 'xy1':  'XY',
  // Black & White
  'bw11': 'LTR', 'bw10': 'PLB', 'bw9':  'PLF', 'bw8':  'BCR',
  'bw7':  'LT',  'bw6':  'DRX', 'bw5':  'DEX', 'bw4':  'NXD',
  'bw3':  'NVI', 'bw2':  'EPO', 'bw1':  'BLW',
  // HeartGold SoulSilver
  'hgss4': 'TRM', 'hgss3': 'UL', 'hgss2': 'UD', 'hgss1': 'HS',
  // Platinum
  'pl4': 'AR', 'pl3': 'SH', 'pl2': 'RR', 'pl1': 'PL',
  // Diamond & Pearl
  'dp6': 'MT', 'dp5': 'SW', 'dp4': 'GE', 'dp3': 'MD', 'dp1': 'DP',
  // Base sets
  'base1': 'BS', 'base2': 'B2', 'base3': 'JU', 'base4': 'FO',
  'base5': 'TK', 'base6': 'LC', 'gym1': 'G1', 'gym2': 'G2',
  'neo1': 'N1', 'neo2': 'N2', 'neo3': 'N3', 'neo4': 'N4',
  // Mega Evolution (2025-2026)
  'me1': 'MEG', 'me2': 'PFL', 'me2pt5': 'ASC', 'me3': 'POR',
};

const extractMypNum = (code: string) =>
  (code.split('_').slice(-1)[0] ?? '').split('/')[0].replace(/^0+/, '');

// Gera lista de slugs candidatos para tentar na MYP, do mais específico ao mais genérico.
// MYP indexa pelo nome base do Pokémon sem prefixos/sufixos ("venusaur", não "mega venusaur ex").
function mypSlugs(name: string): string[] {
  const base = name.toLowerCase().replace(/['']/g, '').trim();
  const slugs: string[] = [];

  // 1. Nome completo sem sufixo ex/gx/vmax/vstar/v (ex: "charizard ex" → "charizard")
  const noSuffix = base.replace(/\s+(ex|gx|vmax|vstar|v)$/i, '').trim();
  slugs.push(noSuffix);

  // 2. Sem prefixo "mega" (ex: "mega venusaur" → "venusaur")
  const noMega = noSuffix.replace(/^mega\s+/i, '').trim();
  if (noMega !== noSuffix) slugs.push(noMega);

  // 3. Primeira palavra apenas (ex: "boss" de "boss's orders")
  const firstWord = base.split(' ')[0];
  if (!slugs.includes(firstWord)) slugs.push(firstWord);

  // 4. Nome completo original como último recurso
  if (!slugs.includes(base)) slugs.push(base);

  return [...new Set(slugs)].filter(Boolean);
}

async function queryMyp(slug: string): Promise<any[]> {
  try {
    const { data } = await axios.get(
      `https://mypcards.com/api/v1/pokemon/carta/${encodeURIComponent(slug)}`,
      { timeout: 8000 }
    );
    return (data.cards as any[]) ?? [];
  } catch {
    return [];
  }
}

// Sets EN modernos em ordem de preferência (mais recente primeiro)
const EN_EDITIONS_ORDERED = [
  'PRE','SSP','SCR','SFA','TWM','TEF','PAF','PAR','MEW','OBF','SV2','SV1',
  'SIT','LOR','PGO','ASR','BRS','FST','EVS','CRE','BST','SHF','VIV','CEL','DAA','RCL','SSH',
  'CEC','UNM','UNB','TEU','HIF','CLS','DRM','FLI','UPR','CIN','SLG','BUS','GRI','SUM',
  'EVO','STS','FCO','BKP','BKT','AOR','ROS','PRC','PHF','FFI','FLF','XY',
  'LTR','PLB','PLF','BCR','DRX','DEX','NXD','NVI','EPO','BLW',
  'BS','B2','JU','FO','LC','N1','N2','N3','N4','AR','RR','HS','UD',
];
const EN_EDITIONS_SET = new Set(EN_EDITIONS_ORDERED);

function pickBestCard(cards: any[], mypEdition: string | undefined, numClean: string): any | null {
  // Se não temos o código de edição MYP mapeado, não podemos garantir que é
  // a carta certa — retorna null para não mostrar preço de outro set.
  if (!mypEdition) return null;

  // 1. Edição exata + número exato
  const exact = cards.find((c) =>
    c.edition_code?.toUpperCase() === mypEdition.toUpperCase() &&
    extractMypNum(c.card_code) === numClean
  );
  if (exact) return exact;

  // 2. Edição exata, qualquer número com preço (variantes da mesma edição: holo, full art, etc.)
  // Só aceita se há exatamente 1 resultado — ambiguidade = null
  const sameEd = cards.filter((c) =>
    c.edition_code?.toUpperCase() === mypEdition.toUpperCase() &&
    c.min_price != null
  );
  if (sameEd.length === 1) return sameEd[0];

  return null;
}

// Scraping do HTML da página de produto MYP para extrair o floor real (menor listagem ativa).
// A API /carta/:slug só retorna histórico (min_price). O floor real está na tabela de lojistas.
const floorScrapeCache: Record<string, { floor: number | null; at: number }> = {};
const FLOOR_SCRAPE_TTL = 15 * 60 * 1000; // 15min

async function scrapeMypFloor(link: string): Promise<number | null> {
  if (floorScrapeCache[link] && Date.now() - floorScrapeCache[link].at < FLOOR_SCRAPE_TTL) {
    return floorScrapeCache[link].floor;
  }
  try {
    const { data: html } = await axios.get(link, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      responseType: 'text',
    });

    // Extrai todos os preços das listagens ativas: <span class="moeda">R$ X,XX</span>
    // Aparece dentro de <td class="estoque-lista-precoestoque">
    const matches = [...(html as string).matchAll(/estoque-lista-precoestoque[^<]*<span class="moeda">R\$\s*([\d]+,[\d]+)/g)];
    if (matches.length === 0) {
      floorScrapeCache[link] = { floor: null, at: Date.now() };
      return null;
    }

    // Menor preço entre todas as listagens ativas = floor real
    const prices = matches.map((m) => parseFloat(m[1].replace(',', '.')));
    const floor = Math.min(...prices);

    floorScrapeCache[link] = { floor, at: Date.now() };
    return floor;
  } catch {
    return null;
  }
}

async function fetchMypPrice(name: string, number: string, tcgId?: string): Promise<{ floor: number | null; floorLive: number | null; avg: number | null; max: number | null; link: string | null; qty: number | null }> {
  const setId   = tcgId?.split('-')[0]?.toLowerCase();
  const mypEd   = setId ? TCG_TO_MYP[setId] : undefined;
  const numClean = number.replace(/[^0-9]/g, '').replace(/^0+/, '') || number.toLowerCase();

  let match: any = null;

  for (const slug of mypSlugs(name)) {
    const cards = await queryMyp(slug);
    if (cards.length === 0) continue;
    match = pickBestCard(cards, mypEd, numClean);
    if (match) break;
  }

  if (!match) return { floor: null, floorLive: null, avg: null, max: null, link: null, qty: null };

  const link = match.link ?? null;

  // Scraping do floor real em paralelo com o retorno dos dados históricos
  const floorLive = link ? await scrapeMypFloor(link) : null;

  return {
    floor:     match.min_price != null ? parseFloat(match.min_price) : null, // histórico
    floorLive,                                                                 // menor listagem ativa agora
    avg:       match.avg_price != null ? parseFloat(match.avg_price) : null,
    max:       match.max_price != null ? parseFloat(match.max_price) : null,
    link,
    qty:       match.available_quantity ?? null,
  };
}

type TcgPriceResult = { floor: number | null; floorLive: number | null; avg: number | null; max: number | null; link: string | null; qty: number | null; source: string };
const NULL_PRICE: TcgPriceResult = { floor: null, floorLive: null, avg: null, max: null, link: null, qty: null, source: 'tcgplayer' };

// Busca preço do TCGPlayer como fallback quando a MYP não tem o card.
// Pega o tier com maior market price — mais representativo para o colecionador.
async function fetchTcgPrice(tcgId: string): Promise<TcgPriceResult> {
  try {
    const rate = await getUsdBrlRate();
    const { data } = await tcgClient.get(`/cards/${tcgId}`, {
      params: { select: 'id,tcgplayer' },
    });
    const p   = data?.data?.tcgplayer?.prices as Record<string, any> | undefined;
    const url = data?.data?.tcgplayer?.url ?? null;
    if (!p) return { ...NULL_PRICE, link: url };

    // Pega o tier com maior market (ignora tiers sem market)
    const tier = Object.values(p)
      .filter((t) => t?.market != null)
      .sort((a, b) => (b.market ?? 0) - (a.market ?? 0))[0] ?? null;

    if (!tier) return { ...NULL_PRICE, link: url };

    const brl = (v: number | null | undefined) => v != null ? Math.round(v * rate * 100) / 100 : null;
    const market = tier.market as number;
    const mid    = tier.mid    as number | null;
    const low    = tier.low    as number | null;
    const high   = tier.high   as number | null;

    // low/high do TCGPlayer frequentemente têm outliers ($0.01 / $9999).
    // Só usa se estiver dentro de 10x do market price.
    const safeFloor = low  != null && low  >= market / 10 ? brl(low)  : null;
    const safeCeil  = high != null && high <= market * 10  ? brl(high) : null;

    return {
      floor:     safeFloor,
      floorLive: safeFloor, // TCGPlayer não tem scraping — usa o mesmo floor
      avg:       brl(market ?? mid),
      max:       safeCeil,
      link:      url,
      qty:       null,
      source:    'tcgplayer',
    };
  } catch {
    return { ...NULL_PRICE };
  }
}

router.get('/card-price/:tcgId', async (req: Request, res: Response) => {
  const { tcgId } = req.params;
  const { name, number } = req.query as { name?: string; number?: string };

  const cacheKey = name && number ? `${tcgId}|${name}|${number}` : tcgId;
  if (cardPriceCache[cacheKey] && Date.now() - cardPriceCache[cacheKey].at < CARD_PRICE_TTL) {
    res.json(cardPriceCache[cacheKey].data);
    return;
  }

  try {
    let result: any = { floor: null, avg: null, max: null, link: null, qty: null };

    if (name && number) {
      result = await fetchMypPrice(name, number, tcgId);
    } else {
      const card = await Card.findOne({ tcgId }).select('name number');
      if (card?.name && card?.number) {
        result = await fetchMypPrice(card.name, card.number, tcgId);
      }
    }

    // MYP não tem esse card — usa TCGPlayer convertido para BRL
    if (result.floor == null && result.avg == null) {
      result = await fetchTcgPrice(tcgId);
    }

    cardPriceCache[cacheKey] = { data: result, at: Date.now() };
    res.json(result);
  } catch (err: any) {
    console.warn(`[public/card-price/${tcgId}] erro: ${err?.message ?? err}`);
    res.json({ floor: null, avg: null, max: null });
  }
});

// ─── Helpers para top/trending — dados externos, zero MongoDB ────────────────

function tcgCardToItem(raw: any, rate: number): any | null {
  const p = raw?.tcgplayer?.prices;
  if (!p) return null;

  // Pega o tier de preço disponível (holofoil tem priority)
  const tier =
    p.holofoil ??
    p['1stEditionHolofoil'] ??
    p.ultraHolofoil ??
    p.reverseHolofoil ??
    p.normal ??
    null;
  if (!tier) return null;

  const market = tier.market    as number | null;
  const mid    = tier.mid       as number | null;
  const low    = tier.low       as number | null;
  const high   = tier.high      as number | null;

  if (!market || market < 0.5) return null;

  // changePct: usa market vs mid como sinal de pressão de compra/venda.
  // Se mid não disponível, usa low como referência.
  // Para gainers: market > mid (compra acima do mediano)
  // Para losers: market < mid (venda abaixo do mediano)
  let changePct: number | null = null;
  if (mid != null && mid > 0) {
    changePct = Math.round(((market - mid) / mid) * 1000) / 10;
  } else if (low != null && low > 0) {
    changePct = Math.round(((market - low) / low) * 1000) / 10;
  }

  const brl = (v: number | null) => v != null ? Math.round(v * rate * 100) / 100 : null;

  return {
    tcgId:        raw.id,
    name:         raw.name,
    setName:      raw.set?.name ?? '',
    number:       raw.number,
    rarity:       raw.rarity ?? '',
    imageUrl:     raw.images?.small ?? '',
    imageUrlLarge: raw.images?.large ?? raw.images?.small ?? '',
    priceBrl:     brl(market),
    priceUsd:     market,
    midUsd:       mid,
    lowUsd:       low,
    highUsd:      high,
    midBrl:       brl(mid),
    lowBrl:       brl(low),
    highBrl:      brl(high),
    changePct,
    types:        raw.types ?? [],
    tcgUrl:       raw.tcgplayer?.url ?? null,
  };
}

// ─── GET /api/public/top ─────────────────────────────────────────────────────
// Cartas mais valiosas do mercado global — direto da TCG API, sem BD

router.get('/top', async (_req: Request, res: Response) => {
  try {
    if (topCardsCache && Date.now() - topCardsCache.at < TOP_TTL) {
      res.json(topCardsCache.data);
      return;
    }

    const rate = await getUsdBrlRate();

    // Busca as cartas com maior preço de mercado TCGPlayer
    const { data } = await tcgClient.get('/cards', {
      params: {
        q: 'tcgplayer.prices.holofoil.market:[20 TO *]',
        orderBy: '-tcgplayer.prices.holofoil.market',
        pageSize: 30,
        select: 'id,name,set,number,rarity,types,images,tcgplayer',
      },
    });

    const result = (data.data as any[])
      .map((c) => tcgCardToItem(c, rate))
      .filter(Boolean)
      .slice(0, 10);

    topCardsCache = { data: result, at: Date.now() };
    res.json(result);
  } catch (err: any) {
    console.error('[public/top] erro:', err?.message ?? err);
    res.json([]);
  }
});

// ─── GET /api/public/trending ─────────────────────────────────────────────────

async function fetchTrendingData(period: string): Promise<{ gainers: any[]; losers: any[]; popular: any[]; period: string }> {
  const rate = await getUsdBrlRate();

  const [highRes, midRes, popularRes] = await Promise.allSettled([
    tcgClient.get('/cards', {
      params: {
        q: 'tcgplayer.prices.holofoil.market:[50 TO *]',
        orderBy: '-tcgplayer.prices.holofoil.market',
        pageSize: 100,
        select: 'id,name,set,number,rarity,types,images,tcgplayer',
      },
    }),
    tcgClient.get('/cards', {
      params: {
        q: 'tcgplayer.prices.holofoil.market:[20 TO 80]',
        orderBy: '-tcgplayer.prices.holofoil.market',
        pageSize: 250,
        select: 'id,name,set,number,rarity,types,images,tcgplayer',
      },
    }),
    tcgClient.get('/cards', {
      params: {
        q: 'tcgplayer.prices.holofoil.market:[10 TO *]',
        orderBy: '-tcgplayer.prices.holofoil.market',
        pageSize: 30,
        select: 'id,name,set,number,rarity,types,images,tcgplayer',
      },
    }),
  ]);

  const isSparse = (c: any) =>
    c.lowUsd != null && c.midUsd != null && c.highUsd != null &&
    c.lowUsd === c.midUsd && c.midUsd === c.highUsd;

  const gainers = highRes.status === 'fulfilled'
    ? (highRes.value.data.data as any[])
        .map((c) => tcgCardToItem(c, rate))
        .filter(Boolean)
        .filter((c: any) => !isSparse(c))
        .map((c: any) => {
          const { priceUsd: market, lowUsd: low } = c;
          if (low != null && low > 0 && market != null && low >= market / 3) {
            return { ...c, changePct: Math.round(((market - low) / low) * 1000) / 10 };
          }
          return { ...c, changePct: null };
        })
        .filter((c: any) => c.changePct !== null && c.changePct > 5)
        .sort((a: any, b: any) => (b.changePct ?? 0) - (a.changePct ?? 0))
        .slice(0, 10)
    : [];

  const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  let losers: any[] = [];
  if (midRes.status === 'fulfilled') {
    // Losers: market < mid significa que as transações recentes acontecem abaixo
    // do preço pedido mediano — sinal real de queda de demanda.
    // O high do TCGPlayer inclui listagens históricas abandonadas, não é útil aqui.
    losers = (midRes.value.data.data as any[])
      .map((c) => tcgCardToItem(c, rate))
      .filter(Boolean)
      .filter((c: any) => !isSparse(c))
      .map((c: any) => {
        const { priceUsd: market, midUsd: mid, lowUsd: low } = c;
        // Usa mid como referência; fallback para low se mid ausente
        const ref = mid ?? low;
        if (ref != null && ref > 0 && market != null) {
          return { ...c, changePct: Math.round(((market - ref) / ref) * 1000) / 10 };
        }
        return { ...c, changePct: null };
      })
      .filter((c: any) => c.changePct !== null && c.changePct < -8)
      .map((c: any, i: number) => ({ c, sort: (i * 2654435761 + daySeed) >>> 0 }))
      .sort((a: any, b: any) => a.sort - b.sort)
      .map(({ c }: any) => c)
      .slice(0, 10);
  } else {
    const reason = (midRes as PromiseRejectedResult).reason;
    console.error('[trending/losers] midRes rejected:', reason?.code ?? reason?.message ?? reason);
  }

  const popular = popularRes.status === 'fulfilled'
    ? (popularRes.value.data.data as any[])
        .map((c) => tcgCardToItem(c, rate))
        .filter(Boolean)
        .map((c: any) => {
          if (isSparse(c)) return { ...c, changePct: null };
          if (c.changePct !== null) return c;
          const { priceUsd: market, lowUsd: low } = c;
          if (low != null && low > 0 && market != null && low <= market * 5) {
            return { ...c, changePct: Math.round(((market - low) / low) * 1000) / 10 };
          }
          return c;
        })
        .slice(0, 10)
    : [];

  return { gainers, losers, popular, period };
}

// Pré-aquece o cache de trending na inicialização do servidor
export async function warmUpTrendingCache(): Promise<void> {
  try {
    console.log('[Cache] Aquecendo cache de trending...');
    const data = await fetchTrendingData('week');
    if (data.popular.length > 0 || data.gainers.length > 0) {
      trendingCache = { data, at: Date.now(), period: 'week' };
      console.log(`[Cache] Trending pronto: gainers=${data.gainers.length} losers=${data.losers.length} popular=${data.popular.length}`);
    }
  } catch (err: any) {
    console.error('[Cache] Falha no warm-up do trending:', err?.message);
  }
}

router.get('/trending', async (req: Request, res: Response) => {
  const period = (req.query.period as string) ?? 'week';

  try {
    if (trendingCache && trendingCache.period === period && Date.now() - trendingCache.at < TREND_TTL) {
      res.json(trendingCache.data);
      return;
    }

    const result = await fetchTrendingData(period);
    if (result.popular.length > 0 || result.gainers.length > 0) {
      trendingCache = { data: result, at: Date.now(), period };
    }
    res.json(result);
  } catch (err: any) {
    console.error('[public/trending] erro:', err?.message ?? err);
    res.json({ gainers: [], losers: [], popular: [], period });
  }
});

export default router;
