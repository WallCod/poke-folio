import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import net from 'net';

dotenv.config();

import authRouter from './routes/auth';
import cardsRouter from './routes/cards';
import portfoliosRouter from './routes/portfolios';
import marketRouter from './routes/market';
import publicRouter from './routes/public';
import { scheduleDailyPriceSnapshot } from './jobs/dailyPriceSnapshot';
import { scheduleMarketSnapshot } from './jobs/marketSnapshot';

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
app.use('/api/public', publicRouter);

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

  // Garante que a porta está livre antes de fazer bind.
  // ts-node-dev às vezes reinicia o filho antes do OS liberar a porta do processo anterior.
  function waitForPort(port: number | string, retries = 15, delay = 500): Promise<void> {
    return new Promise((resolve, reject) => {
      const attempt = (n: number) => {
        const probe = net.createServer();
        probe.once('error', () => {
          probe.close();
          if (n <= 0) return reject(new Error(`Porta ${port} não liberou após tentativas`));
          setTimeout(() => attempt(n - 1), delay);
        });
        probe.once('listening', () => {
          probe.close(() => resolve());
        });
        probe.listen(port);
      };
      attempt(retries);
    });
  }

  await waitForPort(PORT);

  const server = app.listen(PORT, () => {
    console.log(`[Server] Backend rodando em http://localhost:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);

  scheduleDailyPriceSnapshot();
  scheduleMarketSnapshot();
}

bootstrap();
