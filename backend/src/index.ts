import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import authRouter from './routes/auth';
import cardsRouter from './routes/cards';
import portfoliosRouter from './routes/portfolios';
import marketRouter from './routes/market';
import { scheduleDailyPriceSnapshot } from './jobs/dailyPriceSnapshot';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares globais ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// ─── Arquivos estáticos ───────────────────────────────────────────────────────
app.use('/static', express.static('public'));

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/portfolios', portfoliosRouter);
app.use('/api/market', marketRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', timestamp: new Date().toISOString() });
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
async function bootstrap() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[MongoDB] MONGODB_URI não definido no .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { dbName: 'pokefolio' });
    console.log('[MongoDB] Conectado ao Atlas');
  } catch (err) {
    console.error('[MongoDB] Falha na conexão:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[Server] Backend rodando em http://localhost:${PORT}`);
  });

  scheduleDailyPriceSnapshot();
}

bootstrap();
