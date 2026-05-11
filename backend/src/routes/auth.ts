import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import {
  sendVerificationEmail,
  sendAccountActivatedEmail,
  sendResetPasswordEmail,
} from '../services/email';

const router = Router();

// Rate limit: 10 tentativas por 15 min por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function signTokens(id: string, role: string, email: string) {
  const accessExpires = (process.env.JWT_EXPIRES_IN ?? '2h') as `${number}${'s'|'m'|'h'|'d'}`;
  const refreshExpires = (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as `${number}${'s'|'m'|'h'|'d'}`;
  const access = jwt.sign({ id, role, email }, process.env.JWT_SECRET!, { expiresIn: accessExpires });
  const refresh = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: refreshExpires });
  return { access, refresh };
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Nome deve ter entre 2 e 80 caracteres'),
    body('email').isEmail().toLowerCase().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ error: errors.array()[0].msg });
      return;
    }

    const { name, email, password } = req.body as { name: string; email: string; password: string };

    try {
      const exists = await User.findOne({ email });
      if (exists) {
        res.status(409).json({ error: 'Este email já está cadastrado' });
        return;
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      const user = await User.create({
        name,
        email,
        password,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });

      sendVerificationEmail(user.email, user.name, verificationToken).catch(() => null);

      res.status(201).json({
        message: 'Conta criada! Verifique seu email para ativar o acesso.',
      });
    } catch (err) {
      console.error('[register]', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().toLowerCase().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ error: errors.array()[0].msg });
      return;
    }

    const { email, password } = req.body as { email: string; password: string };

    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        res.status(401).json({ error: 'Email ou senha incorretos' });
        return;
      }

      if (!user.emailVerified) {
        res.status(403).json({ error: 'Confirme seu email antes de continuar. Verifique sua caixa de entrada.' });
        return;
      }

      if (user.planStatus === 'suspended') {
        res.status(403).json({ error: 'Conta suspensa. Entre em contato com o suporte.' });
        return;
      }

      const { access, refresh } = signTokens(String(user._id), user.role, user.email);

      res.json({
        token: access,
        refreshToken: refresh,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          planStatus: user.planStatus,
        },
      });
    } catch (err) {
      console.error('[login]', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token não fornecido' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const user = await User.findById(payload.id);
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    const { access, refresh } = signTokens(String(user._id), user.role, user.email);
    res.json({ token: access, refreshToken: refresh });
  } catch {
    res.status(401).json({ error: 'Refresh token inválido ou expirado' });
  }
});

// ─── GET /api/auth/verify-email/:token ───────────────────────────────────────
router.get('/verify-email/:token', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: 'Link inválido ou expirado. Faça login para solicitar um novo.' });
      return;
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    sendAccountActivatedEmail(user.email, user.name).catch(() => null);

    const { access, refresh } = signTokens(String(user._id), user.role, user.email);

    res.json({
      message: 'Email verificado com sucesso!',
      token: access,
      refreshToken: refresh,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        planStatus: user.planStatus,
      },
    });
  } catch (err) {
    console.error('[verify-email]', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().toLowerCase().withMessage('Email inválido')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ error: errors.array()[0].msg });
      return;
    }

    const { email } = req.body as { email: string };

    try {
      const user = await User.findOne({ email });

      // Sempre retorna sucesso para não vazar se o email existe
      if (!user || !user.emailVerified) {
        res.json({ message: 'Se este email estiver cadastrado, você receberá as instruções em breve.' });
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = token;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await user.save();

      sendResetPasswordEmail(user.email, user.name, token).catch(() => null);

      res.json({ message: 'Se este email estiver cadastrado, você receberá as instruções em breve.' });
    } catch (err) {
      console.error('[forgot-password]', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post(
  '/reset-password',
  authLimiter,
  [
    body('token').notEmpty().withMessage('Token inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ error: errors.array()[0].msg });
      return;
    }

    const { token, password } = req.body as { token: string; password: string };

    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      }).select('+password');

      if (!user) {
        res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo.' });
        return;
      }

      user.password = password;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      res.json({ message: 'Senha redefinida com sucesso! Faça login com a nova senha.' });
    } catch (err) {
      console.error('[reset-password]', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(payload.id);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      planStatus: user.planStatus,
      planExpiry: user.planExpiry,
      cards: user.cards,
      createdAt: user.createdAt,
    });
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
