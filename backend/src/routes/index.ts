import { Router } from 'express';

export const router = Router();

router.get('/ping', (_req, res) => {
  res.json({ message: 'pong' });
});
