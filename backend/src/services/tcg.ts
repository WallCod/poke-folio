import axios from 'axios';
import Card, { ICard } from '../models/Card';
import PriceHistory from '../models/PriceHistory';

const TCG_BASE = 'https://api.pokemontcg.io/v2';
const TCG_KEY  = process.env.POKEMONTCG_API_KEY ?? '';

const tcgClient = axios.create({
  baseURL: TCG_BASE,
  timeout: 12000,
  headers: TCG_KEY ? { 'X-Api-Key': TCG_KEY } : {},
});

const tcgdexClient = axios.create({
  baseURL: 'https://api.tcgdex.net/v2',
  timeout: 10000,
});

// ─── Tipos internos da pokemontcg.io ─────────────────────────────────────────

interface TcgCardRaw {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  number: string;
  artist?: string;
  rarity?: string;
  set: { id: string; name: string };
  images: { small: string; large: string };
  tcgplayer?: {
    prices?: {
      holofoil?: { market?: number };
      normal?: { market?: number };
      reverseHolofoil?: { market?: number };
      '1stEditionHolofoil'?: { market?: number };
    };
  };
  cardmarket?: {
    prices?: { averageSellPrice?: number; trendPrice?: number };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractUsdPrice(raw: TcgCardRaw): number | null {
  const p = raw.tcgplayer?.prices;
  if (!p) return null;
  return (
    p.holofoil?.market ??
    p['1stEditionHolofoil']?.market ??
    p.reverseHolofoil?.market ??
    p.normal?.market ??
    null
  );
}

function extractEurPrice(raw: TcgCardRaw): number | null {
  const p = raw.cardmarket?.prices;
  if (!p) return null;
  return p.averageSellPrice ?? p.trendPrice ?? null;
}

async function getEurBrlRate(): Promise<number> {
  try {
    const { data } = await axios.get(
      'https://economia.awesomeapi.com.br/last/EUR-BRL',
      { timeout: 5000 }
    );
    return parseFloat(data.EURBRL?.bid ?? '6.0');
  } catch {
    return 6.0;
  }
}

async function getUsdBrlRate(): Promise<number> {
  try {
    const { data } = await axios.get(
      'https://economia.awesomeapi.com.br/last/USD-BRL',
      { timeout: 5000 }
    );
    return parseFloat(data.USDBRL?.bid ?? '5.5');
  } catch {
    return 5.5;
  }
}

// MYP edition_code → pokemontcg.io setCode mapping
// MYP usa seus próprios códigos de edição (185 no total); mapeamos para os IDs da pokemontcg.io
// para que o match de número de carta seja feito dentro do set correto
const MYP_SET_MAP: Record<string, string> = {
  // Base/Jungle/Fossil/Team Rocket (1999–2000)
  'base1':       'base1',   'jun':        'jungle',  'fos':        'fossil',
  'team':        'base4',   'b2':         'base2',   'gym1':       'gym1',
  'gym2':        'gym2',
  // Neo (2000–2002)
  'neo1':        'neo1',    'neo2':       'neo2',    'neo3':       'neo3',    'neo4': 'neo4',
  // Legendary Collection / e-Card / Expedition
  'lc':          'base6',   'exp':        'ecard1',  'aq':         'ecard2',  'sk':   'ecard3',
  // ADV (Japão) / EX series (EN)
  'ex1':         'ex1',     'ex2':        'ex2',     'ex3':        'ex3',     'ex4':  'ex4',
  'ex5':         'ex5',     'ex6':        'ex6',     'ex7':        'ex7',     'ex8':  'ex8',
  'ex9':         'ex9',     'ex10':       'ex10',    'ex11':       'ex11',    'ex12': 'ex12',
  'ex13':        'ex13',    'ex14':       'ex14',    'ex15':       'ex15',    'ex16': 'ex16',
  // Diamond & Pearl / Platinum / HeartGold SoulSilver
  'dp1':         'dp1',     'dp2':        'dp2',     'dp3':        'dp3',     'dp4':  'dp4',
  'dp5':         'dp5',     'dp6':        'dp6',     'dp7':        'dp7',
  'pl1':         'pl1',     'pl2':        'pl2',     'pl3':        'pl3',     'pl4':  'pl4',
  'hgss1':       'hgss1',   'hgss2':      'hgss2',   'hgss3':      'hgss3',   'hgss4':'hgss4',
  // Black & White
  'bw1':         'bw1',     'bw2':        'bw2',     'bw3':        'bw3',     'bw4':  'bw4',
  'bw5':         'bw5',     'bw6':        'bw6',     'bw7':        'bw7',     'bw8':  'bw8',
  'bw9':         'bw9',     'bw10':       'bw10',    'bw11':       'bw11',
  'dv1':         'dv1',     'bw_pb':      'bwp',
  // XY
  'xy0':         'xy0',     'xy1':        'xy1',     'xy2':        'xy2',     'xy3':  'xy3',
  'xy4':         'xy4',     'xy5':        'xy5',     'xy6':        'xy6',     'xy7':  'xy7',
  'xy8':         'xy8',     'xy9':        'xy9',     'xy10':       'xy10',    'xy11': 'xy11',
  'xy12':        'xy12',    'g1':         'g1',      'xy_pb':      'xyp',
  // Sun & Moon
  'sm1':         'sm1',     'sm2':        'sm2',     'sm3':        'sm3',     'sm3a': 'sm3a',
  'sm4':         'sm4',     'sm5':        'sm5',     'sm6':        'sm6',     'sm7':  'sm7',
  'sm7a':        'sm7a',    'sm8':        'sm8',     'sm9':        'sm9',     'sm9a': 'sm9a',
  'sm9b':        'sm9b',    'sm10':       'sm10',    'sm10a':      'sm10a',   'sm11': 'sm11',
  'sm11a':       'sm11a',   'sm12':       'sm12',    'smp':        'smp',
  // Sword & Shield
  'swsh1':       'swsh1',   'swsh2':      'swsh2',   'swsh3':      'swsh3',   'swsh4':'swsh4',
  'swsh5':       'swsh5',   'swsh6':      'swsh6',   'swsh7':      'swsh7',   'swsh8':'swsh8',
  'swsh9':       'swsh9',   'swsh10':     'swsh10',  'swsh11':     'swsh11',  'swsh12':'swsh12',
  'swsh12pt5':   'swsh12pt5','swshp':     'swshp',   'cel25':      'cel25',   'fut20':'fut20',
  // Scarlet & Violet
  'sv1':         'sv1',     'sv2':        'sv2',     'sv2a':       'sv2a',    'sv3':  'sv3',
  'sv3pt5':      'sv3pt5',  'sv4':        'sv4',     'sv4pt5':     'sv4pt5',  'sv5':  'sv5',
  'sv6':         'sv6',     'sv6pt5':     'sv6pt5',  'sv7':        'sv7',     'sv7pt5':'sv7pt5',
  'sv8':         'sv8',     'sv8pt5':     'sv8pt5',  'svp':        'svp',
  // Japonesas antigas (pokemontcg.io usa prefixo com idioma)
  'sm1m':        'sm1',     'sm1s':       'sm1',     'sm1l':       'sm1',
  's1a':         'swsh1',   's1h':        'swsh1',   's1w':        'swsh1',
  's2a':         'swsh2',   's3a':        'swsh3',   's4a':        'swsh4',
  's5a':         'swsh5',   's5i':        'swsh6',   's6a':        'swsh7',
  's7d':         'swsh8',   's7r':        'swsh8',   's8':         'swsh9',
  's8a':         'swsh10',  's8b':        'swsh11',  's9':         'swsh12',
  's9a':         'swsh12',  's10d':       'swsh12',  's10p':       'swsh12',
  'sv1s':        'sv1',     'sv2d':       'sv2',     'sv2p':       'sv2a',
  'sv3pt5_jp':   'sv3pt5',  'sv4k':       'sv4',     'sv4m':       'sv4pt5',
  'sv5k':        'sv5',     'sv5m':       'sv6',     'sv6m':       'sv6pt5',
  // Promos / especiais
  'me1':         'np',      'me2':        'base2',   'me2pt5':     'base3',
  'pop1':        'pop1',    'pop2':       'pop2',    'pop3':       'pop3',    'pop4': 'pop4',
  'pop5':        'pop5',    'pop6':       'pop6',    'pop7':       'pop7',    'pop8': 'pop8',
  'pop9':        'pop9',    'dc1':        'dc1',
  // Abreviações MYP adicionais → setCode pokemontcg.io
  'ju':    'jungle',  'ex':    'ecard1',   // 'ex' MYP = Expedition EN
  'cg':    'ex13',   'rg':    'ex3',      'phf':   'xy8',
  'ros':   'xy6',    'sum':   'sm1',      'unb':   'sm10',
  'ul':    'sm11',   'bst':   'swsh5',    'mew':   'sv4pt5',
  'pr-xy': 'xyp',   'md':    'dp4',      'ss':    'base3',
  'meg':   'me1',   // Megaevolução JP → promo me1 na pokemontcg.io
};

// Extrai o prefixo de edição do card_code MYP: "pokemon_sv3pt5_123/182" → "sv3pt5"
function mypEditionFromCode(cardCode: string): string {
  // card_code formato: "pokemon_{edition}_{num}/{total}" ou "pokemon_{edition1}_{edition2}_{num}/{total}"
  const parts = cardCode.split('_');
  // Remove "pokemon" do início e o último segmento (número/total)
  const editionParts = parts.slice(1, -1);
  return editionParts.join('');
}

// MYP Cards — preços diretos em BRL do mercado brasileiro
async function getMypCardsBrl(
  cardName: string,
  cardNumber: string,
  setCode?: string,
): Promise<{ floor: number | null; avg: number | null; max: number | null; fullNumber: string | null }> {
  try {
    const cleaned = cardName
      .replace(/^(mega|dark|light|shadow|m\s+|team\s+rocket|rocket|lt\.\s+surge'?s?|misty'?s?|brock'?s?|blaine'?s?|erika'?s?|giovanni'?s?|koga'?s?|sabrina'?s?)\s+/i, '')
      .replace(/\s+(ex|gx|v|vmax|vstar|prime|lv\.x|break|gl|fb|g|sp|c|◇|☆|δ)\s*$/i, '')
      .trim();
    const slug = cleaned.toLowerCase().split(' ')[0];

    const { data } = await axios.get(
      `https://mypcards.com/api/v1/pokemon/carta/${encodeURIComponent(slug)}`,
      { timeout: 8000 }
    );

    const cards = data.cards as Array<{
      card_code: string;
      avg_price: string | null;
      min_price: string | null;
      max_price: string | null;
    }> ?? [];

    if (!cards.length) return { floor: null, avg: null, max: null, fullNumber: null };

    const num = cardNumber.replace(/[^0-9]/g, '');

    const setLower = setCode?.toLowerCase() ?? '';

    // Tenta match por set + número (mais preciso quando setCode é fornecido)
    let match = null;
    if (setCode) {
      match = cards.find((c) => {
        const mypEdition = mypEditionFromCode(c.card_code);
        // Match direto pelo edition code JP (ex: setCode=SM1M → mypEdition=sm1m)
        const directMatch = mypEdition.toLowerCase() === setLower;
        // Match via mapeamento EN (ex: setCode=swsh5 → mappedSet=swsh5)
        const mappedSet = MYP_SET_MAP[mypEdition] ?? MYP_SET_MAP[mypEdition.toLowerCase()];
        if (!directMatch && mappedSet !== setCode) return false;
        const parts = c.card_code.split('_');
        const numPart = parts[parts.length - 1]?.split('/')[0] ?? '';
        return numPart.replace(/^0+/, '') === num.replace(/^0+/, '');
      }) ?? null;
    }

    // Fallback: match apenas pelo número
    if (!match) {
      match = cards.find((c) => {
        const parts = c.card_code.split('_');
        const numPart = parts[parts.length - 1]?.split('/')[0] ?? '';
        return numPart.replace(/^0+/, '') === num.replace(/^0+/, '');
      }) ?? cards[0];
    }

    const rawNumSegment = match.card_code.split('_').pop() ?? '';
    const fullNumber = /^\d+\/\d+$/.test(rawNumSegment) ? rawNumSegment : null;

    return {
      floor: match.min_price ? parseFloat(match.min_price) : null,
      avg:   match.avg_price ? parseFloat(match.avg_price) : null,
      max:   match.max_price ? parseFloat(match.max_price) : null,
      fullNumber,
    };
  } catch {
    return { floor: null, avg: null, max: null, fullNumber: null };
  }
}

// ─── TCGdex — fonte secundária (sets JP/Pocket não cobertos pela pokemontcg.io) ─

interface TcgdexCardRaw {
  id: string;
  name: string;
  localId: string;
  image?: string;
  rarity?: string;
  illustrator?: string;
  hp?: number;
  set?: { id: string; name: string };
  types?: string[];
}

// Sets Pocket TCG (EN) — exclusivos do TCGdex, não existem na pokemontcg.io
const TCGDEX_POCKET_SETS = new Set(['A1', 'A1a', 'A2', 'A2a', 'A3', 'A3a', 'A4', 'A4a', 'PA', 'PROMO-A']);

// Sets JP que realmente existem no TCGdex /ja/cards (confirmado via API).
// SM1M, S5I e similares NÃO existem no TCGdex — apenas no MYP.
// Estes são os sets JP confirmados com cards no dump /ja/cards:
const TCGDEX_JP_SETS = new Set([
  // Scarlet & Violet JP (confirmados no TCGdex)
  'SV1S', 'SV2D', 'SV2P', 'SV2a', 'SV3PT5', 'SV4A', 'SV4K', 'SV4M',
  'SV5K', 'SV5M', 'SV6', 'SV6M', 'SV7K', 'SV7M', 'SV8', 'SV8A',
  'SV9', 'SV10', 'SV11W', 'SV11K',
]);


function mapTcgdexCard(c: TcgdexCardRaw, lang: 'EN' | 'JP' | 'POCKET'): Partial<ICard> {
  return {
    tcgId:          c.id,
    name:           c.name,
    setName:        c.set?.name ?? '',
    setCode:        c.set?.id ?? '',
    number:         c.localId,
    rarity:         c.rarity ?? 'Unknown',
    types:          c.types ?? [],
    artist:         c.illustrator ?? '',
    imageUrl:       c.image ? `${c.image}/low.webp` : '',
    imageUrlHiRes:  c.image ? `${c.image}/high.webp` : '',
    supertype:      'Pokémon',
    subtypes:       [],
    hp:             c.hp ? String(c.hp) : '',
    lang,
    marketPriceUsd:    null,
    marketPriceBrl:    null,
    marketPriceBrlMin: null,
    marketPriceBrlMax: null,
    priceSource:       'unavailable',
    priceUpdatedAt:    null,
  };
}

// ─── Cache em memória do índice JP ────────────────────────────────────────────
// O TCGdex /ja/cards não suporta filtro por nome — retorna dump completo com nomes JP.
// Estratégia: baixa o dump, extrai setId+localId de cada card JP, e indexa por
// nome EN buscando o card EN correspondente via pokemontcg.io (mesmo número, set mapeado).
//
// Mapa JP set → EN set correspondente na pokemontcg.io
const JP_TO_EN_SET: Record<string, string> = {
  'SV2a':    'sv03.5',  // Pokémon Card 151 JP → 151 EN
  'SV2D':    'sv2',     // Clay Burst JP → Paldea Evolved
  'SV2P':    'sv2',     // Snow Hazard JP → Paldea Evolved
  'SV1S':    'sv1',     // Scarlet ex JP → Scarlet & Violet EN
  'SV3PT5':  'sv3pt5',
  'SV4A':    'sv4',
  'SV4K':    'sv4',
  'SV4M':    'sv4pt5',
  'SV5K':    'sv5',
  'SV5M':    'sv6',
  'SV6':     'sv6',
  'SV6M':    'sv6pt5',
  'SV7K':    'sv7',
  'SV7M':    'sv7pt5',
  'SV8':     'sv8',
  'SV8A':    'sv8pt5',
  'SV9':     'sv9',
  'SV10':    'sv10',
  'SV11W':   'sv11',
  'SV11K':   'sv11',
};

// Nome legível do set JP para exibição
const JP_SET_DISPLAY_NAME: Record<string, string> = {
  'SV2a':   'Pokémon Card 151 (JP)',
  'SV2D':   'Clay Burst (JP)',
  'SV2P':   'Snow Hazard (JP)',
  'SV1S':   'Scarlet ex (JP)',
  'SV4A':   'Ancient Roar (JP)',
  'SV4K':   'Future Flash (JP)',
  'SV4M':   'Paradise Dragona (JP)',
  'SV5K':   'Wild Force (JP)',
  'SV5M':   'Cyber Judge (JP)',
  'SV6':    'Mask of Change (JP)',
  'SV6M':   'Night Wanderer (JP)',
  'SV7K':   'Stellar Miracle (JP)',
  'SV7M':   'Crimson Haze (JP)',
  'SV8':    'Super Electric Breaker (JP)',
  'SV8A':   'Terastal Festival ex (JP)',
  'SV9':    'Surging Sparks (JP)',
  'SV10':   'Stellar Crown (JP)',
  'SV11W':  'Prismatic Evolutions (JP)',
  'SV11K':  'Prismatic Evolutions (JP)',
};

interface JpCardIndex {
  // "fearow" → [card JP com nome EN já preenchido, ...]
  byEnName: Map<string, TcgdexCardRaw[]>;
  loadedAt: number;
}

let jpIndex: JpCardIndex | null = null;
const JP_INDEX_TTL_MS = 6 * 60 * 60 * 1000; // 6h

async function getJpIndex(): Promise<JpCardIndex['byEnName']> {
  const now = Date.now();
  if (jpIndex && now - jpIndex.loadedAt < JP_INDEX_TTL_MS) {
    return jpIndex.byEnName;
  }

  try {
    console.log('[TCGdex] Construindo índice JP…');
    const { data } = await tcgdexClient.get('/ja/cards', { timeout: 8000 });
    const raw: Array<{ id: string; localId: string; name: string; image?: string }> = Array.isArray(data) ? data : [];

    // Filtra apenas sets JP que conhecemos e que têm equivalente EN
    const jpCards = raw
      .map((c) => ({ ...c, setId: c.id.split('-')[0] ?? '' }))
      .filter((c) => TCGDEX_JP_SETS.has(c.setId) && JP_TO_EN_SET[c.setId]);

    if (!jpCards.length) {
      jpIndex = { byEnName: new Map(), loadedAt: now };
      return jpIndex.byEnName;
    }

    // Busca nomes EN via GraphQL do TCGdex agrupando por set EN
    // Monta mapa: "enSetId-localId" → nome EN
    const enSetIds = [...new Set(jpCards.map((c) => JP_TO_EN_SET[c.setId]!))];
    const enNameMap = new Map<string, string>(); // "sv03.5-022" → "Fearow"

    await Promise.allSettled(enSetIds.map(async (enSetId) => {
      try {
        const { data: setData } = await tcgdexClient.get(`/en/sets/${enSetId}`, { timeout: 10000 });
        for (const c of (setData?.cards ?? []) as Array<{ localId: string; name: string }>) {
          enNameMap.set(`${enSetId}-${c.localId}`, c.name);
        }
      } catch { /* silencia */ }
    }));

    // Constrói cards JP com nome EN substituído, indexa por nome EN lowercase
    const byEnName = new Map<string, TcgdexCardRaw[]>();

    for (const c of jpCards) {
      const enSetId = JP_TO_EN_SET[c.setId]!;
      const enName  = enNameMap.get(`${enSetId}-${c.localId}`);
      if (!enName) continue; // sem correspondência EN → descarta

      const card: TcgdexCardRaw = {
        id:          c.id,
        name:        enName,
        localId:     c.localId,
        image:       c.image,
        set:         { id: c.setId, name: JP_SET_DISPLAY_NAME[c.setId] ?? `${c.setId} (JP)` },
        rarity:      undefined,
        illustrator: undefined,
        hp:          undefined,
        types:       undefined,
      };

      const key = enName.toLowerCase();
      if (!byEnName.has(key)) byEnName.set(key, []);
      byEnName.get(key)!.push(card);
    }

    jpIndex = { byEnName, loadedAt: now };
    console.log(`[TCGdex] Índice JP pronto: ${[...byEnName.values()].flat().length} cards indexados por nome EN.`);
    return byEnName;
  } catch (err: any) {
    console.warn('[TCGdex] Falha ao construir índice JP:', err?.message ?? err);
    // Salva índice vazio com timestamp para não tentar de novo por 1h
    jpIndex = { byEnName: new Map(), loadedAt: now };
    return jpIndex.byEnName;
  }
}

// Busca cards EN no TCGdex (Pocket TCG) via GraphQL
async function searchTcgdexEn(query: string): Promise<Partial<ICard>[]> {
  try {
    const safe = query.replace(/"/g, '').replace(/\*/g, '');
    const gql = `{
      cards(filters: {name: "${safe}"}) {
        id name localId image rarity illustrator hp
        set { id name }
        types
      }
    }`;
    const { data } = await tcgdexClient.post('/graphql', { query: gql }, {
      headers: { 'Content-Type': 'application/json' },
    });
    const cards: TcgdexCardRaw[] = data?.data?.cards ?? [];
    return cards
      .filter((c) => c.set?.id && TCGDEX_POCKET_SETS.has(c.set.id))
      .map((c) => mapTcgdexCard(c, 'POCKET'));
  } catch {
    return [];
  }
}

// Busca cards JP no índice em memória usando nome EN como chave
async function searchTcgdexJp(query: string): Promise<Partial<ICard>[]> {
  try {
    const byEnName = await getJpIndex();
    const key = query.trim().toLowerCase();
    const matches = byEnName.get(key) ?? [];
    return matches.map((c) => mapTcgdexCard(c, 'JP'));
  } catch {
    return [];
  }
}

// Chama ambas as fontes TCGdex
async function searchTcgdex(query: string): Promise<Partial<ICard>[]> {
  const [en, jp] = await Promise.allSettled([
    searchTcgdexEn(query),
    searchTcgdexJp(query),
  ]);
  return [
    ...(en.status === 'fulfilled' ? en.value : []),
    ...(jp.status === 'fulfilled' ? jp.value : []),
  ];
}

function mapRawToCard(raw: TcgCardRaw): Partial<ICard> {
  return {
    tcgId:          raw.id,
    name:           raw.name,
    setName:        raw.set.name,
    setCode:        raw.set.id,
    number:         raw.number,
    rarity:         raw.rarity ?? 'Unknown',
    types:          raw.types ?? [],
    artist:         raw.artist ?? '',
    imageUrl:       raw.images.small,
    imageUrlHiRes:  raw.images.large,
    supertype:      raw.supertype,
    subtypes:       raw.subtypes ?? [],
    hp:             raw.hp ?? '',
    lang:           'EN',
    marketPriceUsd:    null,
    marketPriceBrl:    null,
    marketPriceBrlMin: null,
    marketPriceBrlMax: null,
    priceSource:       'unavailable',
    priceUpdatedAt:    null,
  };
}

// ─── Funções públicas ─────────────────────────────────────────────────────────

// Dados completos retornados pelo MYP para cada carta
export interface MypCardData {
  brl:            number | null;   // floor (min_price) — preço vendível real
  brlMin:         number | null;
  brlAvg:         number | null;
  brlMax:         number | null;
  tcgPriceUsd:    number | null;   // tcg_price em USD
  availableQty:   number | null;
  namePt:         string | null;
  editionPt:      string | null;
  editionEn:      string | null;
  imgPt:          string | null;
  imgEn:          string | null;
  internalCode:   number | null;
  link:           string | null;
  hasPtVersion:   boolean;         // true quando img_pt !== img_en (card PT separado)
  cardCode:       string;          // card_code original do MYP (para lookup)
  fullNumber:     string | null;   // número completo "103/132" extraído do card_code
}

// Busca todos os preços MYP para um conjunto de cartas agrupando por slug único.
// O MYP retorna todas as versões de um Pokémon num único request, então slugs únicos
// minimizam o número de chamadas (ex: 19 Fearows = 1 request só).
async function fetchMypBatchForCards(
  pageCards: Array<{ name?: string; number?: string; setCode?: string; tcgId?: string; lang?: string }>
): Promise<Map<string, MypCardData>> {
  const result = new Map<string, MypCardData>();

  function toSlug(name: string): string {
    const cleaned = name
      .replace(/^(mega|dark|light|shadow|m\s+|team\s+rocket|rocket|lt\.\s+surge'?s?|misty'?s?|brock'?s?|blaine'?s?|erika'?s?|giovanni'?s?|koga'?s?|sabrina'?s?)\s+/i, '')
      .replace(/\s+(ex|gx|v|vmax|vstar|prime|lv\.x|break|gl|fb|g|sp|c|◇|☆|δ)\s*$/i, '')
      .trim();
    return cleaned.toLowerCase().split(' ')[0];
  }

  const slugGroups = new Map<string, typeof pageCards>();
  for (const card of pageCards) {
    if (!card.name || !card.tcgId) continue;
    const slug = toSlug(card.name);
    if (!slugGroups.has(slug)) slugGroups.set(slug, []);
    slugGroups.get(slug)!.push(card);
  }

  await Promise.allSettled(
    Array.from(slugGroups.entries()).map(async ([slug, cards]) => {
      try {
        const { data } = await axios.get(
          `https://mypcards.com/api/v1/pokemon/carta/${encodeURIComponent(slug)}`,
          { timeout: 6000 }
        );
        const mypCards = data.cards as Array<{
          internal_code: number;
          card_code: string;
          name_pt: string | null;
          name_en: string | null;
          edition_pt: string | null;
          edition_en: string | null;
          avg_price: string | null;
          min_price: string | null;
          max_price: string | null;
          tcg_price: string | null;
          available_quantity: number | null;
          img_pt: string | null;
          img_en: string | null;
          link: string | null;
        }> ?? [];
        if (!mypCards.length) return;

        // Deduplica entradas repetidas da API do MYP
        const seenMc = new Set<string>();
        const uniqueMc = mypCards.filter((mc) => {
          const k = `${mc.internal_code}__${mc.card_code}`;
          if (seenMc.has(k)) return false;
          seenMc.add(k);
          return true;
        });

        for (const card of cards) {
          const num = (card.number ?? '').replace(/[^0-9]/g, '');
          const setCode = card.setCode;
          const setLower = setCode?.toLowerCase() ?? '';

          let match = null;
          if (setCode) {
            match = uniqueMc.find((mc) => {
              const mypEdition = mypEditionFromCode(mc.card_code);
              const directMatch = mypEdition.toLowerCase() === setLower;
              const mappedSet = MYP_SET_MAP[mypEdition] ?? MYP_SET_MAP[mypEdition.toLowerCase()];
              if (!directMatch && mappedSet !== setCode) return false;
              const parts = mc.card_code.split('_');
              const numPart = parts[parts.length - 1]?.split('/')[0] ?? '';
              return numPart.replace(/^0+/, '') === num.replace(/^0+/, '');
            }) ?? null;
          }
          if (!match) {
            match = uniqueMc.find((mc) => {
              const parts = mc.card_code.split('_');
              const numPart = parts[parts.length - 1]?.split('/')[0] ?? '';
              return numPart.replace(/^0+/, '') === num.replace(/^0+/, '');
            }) ?? null;
          }

          if (match && card.tcgId) {
            const imgPt = match.img_pt ?? null;
            const imgEn = match.img_en ?? null;
            // Extrai número completo "103/132" do último segmento do card_code
            const rawNumSegment = match.card_code.split('_').pop() ?? '';
            const fullNumber = /^\d+\/\d+$/.test(rawNumSegment) ? rawNumSegment : null;
            result.set(card.tcgId, {
              brl:          match.min_price ? parseFloat(match.min_price) : null,
              brlMin:       match.min_price ? parseFloat(match.min_price) : null,
              brlAvg:       match.avg_price ? parseFloat(match.avg_price) : null,
              brlMax:       match.max_price ? parseFloat(match.max_price) : null,
              tcgPriceUsd:  match.tcg_price ? parseFloat(match.tcg_price) : null,
              availableQty: match.available_quantity ?? null,
              namePt:       match.name_pt ?? null,
              editionPt:    match.edition_pt ?? null,
              editionEn:    match.edition_en ?? null,
              imgPt,
              imgEn,
              internalCode: match.internal_code ?? null,
              link:         match.link ?? null,
              hasPtVersion: !!(imgPt && imgEn && imgPt !== imgEn),
              cardCode:     match.card_code,
              fullNumber,
            });
          }
        }
      } catch {
        // silencia falhas individuais
      }
    })
  );

  return result;
}

// Mapa lowercase: editionCode MYP → nome do set para cards JP exclusivos do MYP
// Inclui todos os sets JP que NÃO têm equivalente direto na pokemontcg.io
const MYP_JP_SET_NAMES: Record<string, string> = {
  // Special/promo JP sets
  'mew':    'Mew VMAX League Battle Deck (JP)',
  // XY-era JP
  'meg':    'Megaevolução (JP)',
  'xy1':    'Collection X (JP)',   'xy2':    'Collection Y (JP)',
  'xy3':    'Rising Fist (JP)',    'xy4':    'Phantom Gate (JP)',
  'xy5':    'Tidal Storm (JP)',    'xy6':    'Gaia Volcano (JP)',
  'xy7':    'Bandit Ring (JP)',    'xy8':    'Blue Shock (JP)',
  'xy9':    'Red Flash (JP)',      'xy10':   'Golduck Break (JP)',
  'xy11':   'Rage of the Broken Heavens (JP)',
  'xy12':   'Fever Burst Fighter (JP)',
  'm1l':    'Mega Battle Deck (JP)',
  'cpr':    'CP Raichu (JP)',      'cp1':    'Booster Pack (JP)',
  'cp2':    'Concept Pack (JP)',   'cp3':    'Concept Pack 3 (JP)',
  'cp4':    'Premium Champion Pack (JP)', 'cp5': 'Mythical/Legendary Dream Shine (JP)',
  'cp6':    'Evolutions CP (JP)',
  // Sun & Moon JP
  'sm1m':   'Collection Moon (JP)',
  'sm1s':   'Collection Sun (JP)',
  'sm1l':   'Starter Set (JP)',
  'sm2':    'Alolan Moonlight (JP)',
  'sm3m':   'Darkness that Consumes Light (JP)',
  'sm3h':   'Awakened Heroes (JP)',
  'sm4':    'Awakening Psychic King (JP)',
  'sm4a':   'Premium Trainer Box (JP)',
  'sm5':    'Facing a New Trial (JP)',
  'sm5m':   'To Have Seen the Battle Rainbow (JP)',
  'sm5s':   'Dramatic Voltage (JP)',
  'sm6':    'Forbidden Light (JP)',
  'sm6a':   'Dragon Storm (JP)',
  'sm7':    'Celestial Storm (JP)',
  'sm7a':   'Fairy Rise (JP)',
  'sm8':    'Super-Burst Impact (JP)',
  'sm8a':   'GX Ultra Shiny (JP)',
  'sm9':    'Tag Bolt (JP)',
  'sm9a':   'Night Unison (JP)',
  'sm9b':   'Full Metal Wall (JP)',
  'sm10':   'Double Blaze (JP)',
  'sm10a':  'GX Tag All Stars (JP)',
  'sm11':   'Remix Bout (JP)',
  'sm11a':  'Dream League (JP)',
  'sm12':   'Alter Genesis (JP)',
  // Sword & Shield JP
  's1a':    'VMAX Rising (JP)',
  's1h':    'Sword (JP)',
  's1w':    'Shield (JP)',
  's2a':    'Rebellion Crash (JP)',
  's3a':    'Legendary Heartbeat (JP)',
  's4a':    'Amazing Volt Tackle (JP)',
  's5a':    'Matchless Fighters (JP)',
  's5i':    'Single Strike Master (JP)',
  's6a':    'Eevee Heroes (JP)',
  's7d':    'Evolving Skies (JP)',
  's7r':    'Blue Sky Stream (JP)',
  's8':     'Fusion Arts (JP)',
  's8a':    'VMAX Climax (JP)',
  's8b':    'Star Birth (JP)',
  's9':     'Battle Region (JP)',
  's9a':    'Time Gazer (JP)',
  's10d':   'Dark Phantasma (JP)',
  's10p':   'Pokemon GO (JP)',
};

// Busca cards diretamente no MYP e gera cards sintéticos para os que não existem
// nas outras fontes (pokemontcg.io / TCGdex). Usado para cobrir:
//   - JP antigos (XY, SM, SWSH não cobertos pelo TCGdex)
//   - PT localizados
async function searchMypCards(query: string): Promise<Partial<ICard>[]> {
  try {
    const cleaned = query.trim()
      .replace(/^(mega|dark|light|shadow|m\s+)\s+/i, '')
      .replace(/\s+(ex|gx|v|vmax|vstar|prime)\s*$/i, '')
      .trim();
    const slug = cleaned.toLowerCase().split(' ')[0];

    const { data } = await axios.get(
      `https://mypcards.com/api/v1/pokemon/carta/${encodeURIComponent(slug)}`,
      { timeout: 8000 }
    );

    const mypCards = data.cards as Array<{
      internal_code: number;
      card_code: string;
      name_pt: string | null;
      name_en: string | null;
      edition_pt: string | null;
      edition_en: string | null;
      avg_price: string | null;
      min_price: string | null;
      max_price: string | null;
      tcg_price: string | null;
      available_quantity: number | null;
      img_pt: string | null;
      img_en: string | null;
      link: string | null;
    }> ?? [];

    if (!mypCards.length) return [];

    // Deduplica entradas do MYP — a API às vezes retorna o mesmo card_code + internal_code múltiplas vezes
    const seen = new Set<string>();
    const uniqueMypCards = mypCards.filter((mc) => {
      const key = `${mc.internal_code}__${mc.card_code}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const results: Partial<ICard>[] = [];

    // Set de editionCodes que a pokemontcg.io já cobre — não gerar cards sintéticos para eles
    const tcgioEditions = new Set(Object.keys(MYP_SET_MAP));

    // URL válida = tem path além do domínio base (mais que "https://img.mypcards.com/")
    const hasValidPath = (url: string | null) =>
      !!url && url.length > 'https://img.mypcards.com/'.length && url.includes('/img/');

    for (const mc of uniqueMypCards) {
      const editionCode = mypEditionFromCode(mc.card_code).toLowerCase();
      const rawNum = mc.card_code.split('_').pop() ?? '';
      const fullNumber = /^\d+\/\d+$/.test(rawNum) ? rawNum : rawNum;

      const jpSetName = MYP_JP_SET_NAMES[editionCode];

      // Card PT real: img_pt tem path completo (_pt.jpg) e é diferente de img_en
      const isPt = hasValidPath(mc.img_pt) && mc.img_pt !== mc.img_en;
      if (isPt && mc.img_pt) {
        const tcgId = `myp__${mc.internal_code}__PT`;
        const setName = mc.edition_pt ?? `${editionCode} (PT)`;
        results.push({
          tcgId,
          name:        mc.name_pt ?? mc.name_en ?? query,
          setName,
          setCode:     editionCode,
          number:      fullNumber,
          rarity:      'Unknown',
          types:       [],
          artist:      '',
          imageUrl:    mc.img_pt,
          imageUrlHiRes: mc.img_pt,
          supertype:   'Pokémon',
          subtypes:    [],
          hp:          '',
          lang:        'PT',
          marketPriceBrl:    mc.min_price ? parseFloat(mc.min_price) : null,
          marketPriceBrlMin: mc.min_price ? parseFloat(mc.min_price) : null,
          marketPriceBrlMax: mc.max_price ? parseFloat(mc.max_price) : null,
          marketPriceUsd:    mc.tcg_price ? parseFloat(mc.tcg_price) : null,
          priceSource:       mc.min_price ? 'mypcards' : 'unavailable',
          mypAvg:          mc.avg_price ? parseFloat(mc.avg_price) : null,
          mypTcgPriceUsd:  mc.tcg_price ? parseFloat(mc.tcg_price) : null,
          mypAvailableQty: mc.available_quantity ?? null,
          mypLink:         mc.link ?? null,
          editionPt:       mc.edition_pt ?? null,
          editionEn:       mc.edition_en ?? null,
          namePt:          mc.name_pt ?? null,
          imgPt:           mc.img_pt ?? null,
        } as Partial<ICard>);
      }

      // Gera card JP quando o editionCode está em MYP_JP_SET_NAMES e tem imagem válida.
      // A deduplicação por número em searchCards evita duplicatas com pokemontcg.io.
      if (!!jpSetName && hasValidPath(mc.img_en)) {
        const tcgId = `myp__${mc.internal_code}__JP`;
        const setName = jpSetName;
        results.push({
          tcgId,
          name:        mc.name_en ?? query,
          setName,
          setCode:     editionCode,
          number:      fullNumber,
          rarity:      'Unknown',
          types:       [],
          artist:      '',
          imageUrl:    mc.img_en,
          imageUrlHiRes: mc.img_en,
          supertype:   'Pokémon',
          subtypes:    [],
          hp:          '',
          lang:        'JP',
          marketPriceBrl:    mc.min_price ? parseFloat(mc.min_price) : null,
          marketPriceBrlMin: mc.min_price ? parseFloat(mc.min_price) : null,
          marketPriceBrlMax: mc.max_price ? parseFloat(mc.max_price) : null,
          marketPriceUsd:    mc.tcg_price ? parseFloat(mc.tcg_price) : null,
          priceSource:       mc.min_price ? 'mypcards' : 'unavailable',
          mypAvg:          mc.avg_price ? parseFloat(mc.avg_price) : null,
          mypTcgPriceUsd:  mc.tcg_price ? parseFloat(mc.tcg_price) : null,
          mypAvailableQty: mc.available_quantity ?? null,
          mypLink:         mc.link ?? null,
          editionPt:       mc.edition_pt ?? null,
          editionEn:       mc.edition_en ?? null,
          namePt:          mc.name_pt ?? null,
          imgPt:           mc.img_pt ?? null,
        } as Partial<ICard>);
      }
    }

    return results;
  } catch {
    return [];
  }
}

export async function searchCards(query: string, page = 1, pageSize = 24) {
  // Detecta se a query é um número de carta (ex: "046/132", "046", "132/264")
  const isNumberQuery = /^\d{1,3}(\/\d{1,3})?$/.test(query.trim());
  const q = isNumberQuery
    ? `number:${query.trim().split('/')[0].replace(/^0+/, '') || query.trim()}`
    : `name:"${query}*"`;

  const [tcgioData, tcgdexCards, mypExtraCards, usdRate, eurRate] = await Promise.allSettled([
    tcgClient.get('/cards', {
      params: {
        q, page: 1, pageSize: 250,
        orderBy: isNumberQuery ? 'set.releaseDate' : 'name',
        select: 'id,name,set,number,rarity,types,artist,images,supertype,subtypes,hp,tcgplayer,cardmarket',
      },
    }),
    isNumberQuery ? Promise.resolve([]) : searchTcgdex(query),
    isNumberQuery ? Promise.resolve([]) : searchMypCards(query),
    getUsdBrlRate(),
    getEurBrlRate(),
  ]);

  const rateUsd = usdRate.status === 'fulfilled' ? usdRate.value : 5.5;
  const rateEur = eurRate.status === 'fulfilled' ? eurRate.value : 6.0;

  // Cartas da pokemontcg.io com USD como fallback de conversão
  const tcgioCards: Partial<ICard & { marketPriceUsd: number | null; marketPriceBrl: number | null; priceSource: string }>[] = [];
  if (tcgioData.status === 'fulfilled') {
    for (const raw of tcgioData.value.data.data as TcgCardRaw[]) {
      const usd = extractUsdPrice(raw);
      const eur = extractEurPrice(raw);
      let brl: number | null = null;
      let source = 'unavailable';
      if (usd != null) {
        brl = Math.round(usd * rateUsd * 100) / 100;
        source = 'tcgplayer_converted';
      } else if (eur != null) {
        brl = Math.round(eur * rateEur * 100) / 100;
        source = 'cardmarket_converted';
      }
      tcgioCards.push({ ...mapRawToCard(raw), marketPriceUsd: usd, marketPriceBrl: brl, priceSource: source });
    }
  }

  // TCGdex (Pocket + JP SV): filtrado por sets exclusivos, sem duplicar pokemontcg.io
  const tcgioIds = new Set(tcgioCards.map((c) => c.tcgId));
  const tcgdexOnly = (tcgdexCards.status === 'fulfilled' ? tcgdexCards.value : [])
    .filter((c) => c.tcgId && !tcgioIds.has(c.tcgId));

  // MYP-only: cards PT/JP antigos não cobertos pelas outras fontes.
  // Deduplicação: um card JP do MYP só aparece se o seu número (parte antes da /)
  // ainda não existe entre os resultados da pokemontcg.io + TCGdex.
  // Isso funciona porque para qualquer busca por nome, a pokemontcg.io já retorna
  // todas as versões EN/promo daquele Pokémon — se o número bate, é o mesmo card.
  // Índice dos cards já existentes: "numBase/total" e "numBase" (sem zeros à esquerda)
  // usado para deduplicar cards JP do MYP que já existem na pokemontcg.io/TCGdex
  const existingCardKeys = new Set<string>();
  for (const c of [...tcgioCards, ...tcgdexOnly]) {
    if (c.number) {
      const parts = c.number.split('/');
      const base  = parts[0].replace(/^0+/, '') || parts[0];
      const total = parts[1] ?? '';
      existingCardKeys.add(base);
      if (total) existingCardKeys.add(`${base}/${total}`);
    }
  }

  const mypOnly = (mypExtraCards.status === 'fulfilled' ? mypExtraCards.value : [])
    .filter((c) => {
      if (!c.tcgId) return false;
      // Cards PT são versões localizadas únicas — sempre incluir
      if (c.tcgId.endsWith('__PT')) return true;
      // Cards JP: só incluir se o número base (parte antes de /) não existe ainda.
      // Usamos sempre o base sem total porque a pokemontcg.io frequentemente omite o total
      // (ex: me1-103 tem number="103", MYP tem "103/132" — mesmo card)
      const raw  = c.number ?? '';
      const base = raw.split('/')[0].replace(/^0+/, '') || raw;
      return base !== '' && !existingCardKeys.has(base);
    });

  const allCards = [...tcgioCards, ...tcgdexOnly, ...mypOnly].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '')
  );

  const totalCount = allCards.length;
  const start = (page - 1) * pageSize;
  const pageCards = allCards.slice(start, start + pageSize);

  // Busca preços MYP (mercado BR) em paralelo para a página — agrupa por slug único
  // e sobrescreve a conversão USD quando encontra preço real
  const [mypPrices, cachedDocs] = await Promise.all([
    fetchMypBatchForCards(pageCards),
    Card.find({ tcgId: { $in: pageCards.map((c) => c.tcgId as string).filter(Boolean) } })
      .select('tcgId marketPriceBrl marketPriceBrlMin marketPriceBrlMax priceSource priceUpdatedAt'),
  ]);

  const cachedMap = new Map(cachedDocs.map((c) => [c.tcgId, c]));

  const cards = pageCards.map((c) => {
    const myp = mypPrices.get(c.tcgId as string);
    const db  = cachedMap.get(c.tcgId as string);

    // Prioridade: MYP live > MYP no BD > conversão USD/EUR
    let result: typeof c;
    if (myp?.brl != null) {
      result = {
        ...c,
        marketPriceBrl:    myp.brl,
        marketPriceBrlMin: myp.brlMin,
        marketPriceBrlMax: myp.brlMax,
        priceSource:       'mypcards',
      };
    } else {
      const hasMypDb = db?.priceSource === 'mypcards' && db?.marketPriceBrl != null;
      if (hasMypDb) {
        result = {
          ...c,
          marketPriceBrl:    db!.marketPriceBrl,
          marketPriceBrlMin: db!.marketPriceBrlMin,
          marketPriceBrlMax: db!.marketPriceBrlMax,
          priceSource:       'mypcards',
        };
      } else {
        result = {
          ...c,
          marketPriceBrl:    c.marketPriceBrl    ?? null,
          marketPriceBrlMin: null,
          marketPriceBrlMax: null,
          priceSource:       c.priceSource       ?? 'unavailable',
        };
      }
    }

    // Enriquece com campos extras do MYP quando disponível
    if (myp) {
      return {
        ...result,
        ...(myp.fullNumber ? { number: myp.fullNumber } : {}),
        mypAvg:          myp.brlAvg,
        mypTcgPriceUsd:  myp.tcgPriceUsd,
        mypAvailableQty: myp.availableQty,
        mypLink:         myp.link,
        editionPt:       myp.editionPt,
        editionEn:       myp.editionEn,
        namePt:          myp.namePt,
        imgPt:           myp.imgPt,
      };
    }
    return result;
  });

  return { cards, totalCount, page, pageSize };
}

export async function getCardById(tcgId: string): Promise<Partial<ICard> | null> {
  try {
    const { data } = await tcgClient.get(`/cards/${tcgId}`);
    return mapRawToCard(data.data as TcgCardRaw);
  } catch {
    return null;
  }
}

// Cria card sintético a partir de um tcgId MYP-only (formato "myp__internalCode__PT/JP")
// buscando os dados diretamente do MYP pela URL de detalhes da carta
async function createMypOnlyCard(tcgId: string): Promise<Partial<ICard> | null> {
  try {
    // Extrai internalCode do tcgId: "myp__123__PT" → 123
    const match = tcgId.match(/^myp__(\d+)__(PT|JP)$/);
    if (!match) return null;
    const internalCode = parseInt(match[1]);
    const lang = match[2] as 'PT' | 'JP';

    // Busca todos os cards do Pokémon pelo MYP usando o internalCode para encontrar o correto
    // O MYP não tem endpoint por internalCode direto — precisamos de um slug.
    // Usamos o link do card se disponível, senão fallamos silenciosamente.
    // Estratégia: busca no banco por internalCode via qualquer card MYP já salvo com nome parecido
    // Como não temos o slug aqui, vamos buscar qualquer card MYP com esse internalCode no BD
    const existingByCode = await Card.findOne({
      tcgId: { $regex: `^myp__${internalCode}__` },
    });
    if (existingByCode) return null; // já existe, deixa o findOne principal retornar

    return null; // sem dados suficientes para criar sem o slug
  } catch {
    return null;
  }
}

export async function getOrCreateCard(tcgId: string): Promise<InstanceType<typeof Card> | null> {
  let card = await Card.findOne({ tcgId });

  if (card) {
    // Corrige o número se ainda não tem o formato "103/132" do MYP
    if (card.number && !card.number.includes('/') && card.name && card.setCode) {
      const myp = await getMypCardsBrl(card.name, card.number, card.setCode);
      if (myp.fullNumber) {
        card.number = myp.fullNumber;
        await card.save();
      }
    }
    return card;
  }

  // Cards MYP-only têm tcgId no formato "myp__internalCode__PT/JP"
  // Para esses, os dados vêm do frontend via addItemWithCardData (chamada separada)
  // Aqui apenas retornamos null — o backend não consegue reconstruir sem o slug
  if (tcgId.startsWith('myp__')) return null;

  const raw = await getCardById(tcgId);
  if (!raw) return null;

  // Tenta enriquecer o número com o formato completo "103/132" do MYP
  if (raw.name && raw.number && raw.setCode) {
    const myp = await getMypCardsBrl(raw.name, raw.number as string, raw.setCode as string);
    if (myp.fullNumber) raw.number = myp.fullNumber;
  }

  card = await Card.create(raw);
  return card;
}

export async function refreshCardPrice(tcgId: string): Promise<{ usd: number | null; brl: number | null; brlMin: number | null; brlMax: number | null; source: string }> {
  try {
    // 1. Busca USD na pokemontcg.io
    const { data } = await tcgClient.get(`/cards/${tcgId}`);
    const raw = data.data as TcgCardRaw;
    const usd = extractUsdPrice(raw);

    // 2. Tenta MYP Cards (preço BRL direto do mercado brasileiro)
    const myp = await getMypCardsBrl(raw.name, raw.number, raw.set.id);

    let brl: number | null = null;
    let source = 'unavailable';

    const eur = extractEurPrice(raw);

    if (myp.floor != null) {
      brl = myp.floor;
      source = 'mypcards';
    } else if (usd != null) {
      const rate = await getUsdBrlRate();
      brl = Math.round(usd * rate * 100) / 100;
      source = 'tcgplayer_converted';
    } else if (eur != null) {
      const rate = await getEurBrlRate();
      brl = Math.round(eur * rate * 100) / 100;
      source = 'cardmarket_converted';
    }

    const existing = await Card.findOne({ tcgId }).select('marketPriceBrl');
    const prevBrl = existing?.marketPriceBrl ?? null;
    const changePct = prevBrl != null && brl != null && prevBrl > 0
      ? Math.round(((brl - prevBrl) / prevBrl) * 10000) / 100
      : null;

    await Card.findOneAndUpdate(
      { tcgId },
      {
        marketPriceUsd: usd,
        marketPriceBrl: brl,
        marketPriceBrlMin: myp.floor,
        marketPriceBrlMax: myp.max,
        previousPriceBrl: prevBrl,
        priceChangePct: changePct,
        priceUpdatedAt: new Date(),
      },
      { upsert: false }
    );

    // Salva snapshot no histórico de preços (apenas quando temos preço BRL)
    if (brl != null) {
      await PriceHistory.create({ tcgId, priceBrl: brl, priceUsd: usd, source });
    }

    return { usd, brl, brlMin: myp.floor, brlMax: myp.max, source };
  } catch {
    return { usd: null, brl: null, brlMin: null, brlMax: null, source: 'error' };
  }
}
