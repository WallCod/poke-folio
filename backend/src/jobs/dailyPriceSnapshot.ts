import cron from 'node-cron';
import Card from '../models/Card';
import PriceHistory from '../models/PriceHistory';
import { refreshCardPrice } from '../services/tcg';

const CHUNK_SIZE = 5;
const CHUNK_DELAY_MS = 2000; // 2s entre chunks para não sobrecarregar MYP

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function todaySnapshotExists(tcgId: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const count = await PriceHistory.countDocuments({
    tcgId,
    recordedAt: { $gte: startOfDay },
  });
  return count > 0;
}

export async function runDailyPriceSnapshot() {
  console.log('[PriceSnapshot] Iniciando snapshot diário de preços…');

  // Pega todos os cards com preço BRL válido (MYP + convertidos de USD/EUR)
  const cards = await Card.find({
    marketPriceBrl: { $ne: null, $gt: 0 },
  }).select('tcgId name priceSource');

  if (!cards.length) {
    console.log('[PriceSnapshot] Nenhum card com preço MYP para snapshottear.');
    return;
  }

  console.log(`[PriceSnapshot] ${cards.length} cards a processar.`);

  let saved = 0;
  let skipped = 0;

  for (let i = 0; i < cards.length; i += CHUNK_SIZE) {
    const chunk = cards.slice(i, i + CHUNK_SIZE);

    await Promise.all(chunk.map(async (card) => {
      try {
        // Pula se já existe snapshot hoje para este card
        const exists = await todaySnapshotExists(card.tcgId);
        if (exists) { skipped++; return; }

        // refreshCardPrice já salva no PriceHistory quando tem preço BRL
        await refreshCardPrice(card.tcgId);
        saved++;
      } catch {
        // silencia falha individual para não abortar o job
      }
    }));

    if (i + CHUNK_SIZE < cards.length) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  console.log(`[PriceSnapshot] Concluído: ${saved} novos snapshots, ${skipped} já tinham snapshot hoje.`);
}

// Roda todo dia às 03:00 (horário do servidor)
export function scheduleDailyPriceSnapshot() {
  cron.schedule('0 3 * * *', () => {
    runDailyPriceSnapshot().catch((err) => {
      console.error('[PriceSnapshot] Erro no job:', err);
    });
  });
  console.log('[PriceSnapshot] Job diário agendado para 03:00.');
}
