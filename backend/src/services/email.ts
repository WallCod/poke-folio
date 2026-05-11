import { BrevoClient } from '@getbrevo/brevo';

let client: InstanceType<typeof BrevoClient> | null = null;

function getClient() {
  if (!client) {
    client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? '' });
  }
  return client;
}

const FROM = {
  email: process.env.BREVO_FROM_EMAIL ?? 'noreply@pokefolio.app',
  name: process.env.BREVO_FROM_NAME ?? 'Pokéfolio',
};

const POKEBALL_URL = 'https://i.imgur.com/EtAHLzx.png';

function pokeballImg(size: number): string {
  return (
    '<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">' +
    '<tr><td align="center" valign="middle" style="padding:0;">' +
    '<img src="' + POKEBALL_URL + '" width="' + size + '" height="' + size + '" alt="Pokeball" style="display:block;border:0;outline:none;text-decoration:none;" />' +
    '</td></tr></table>'
  );
}

function logoHtml(): string {
  // Pokébola mini para o logo — círculo dourado dividido
  const s = 24;
  const top = Math.round(s * 0.44);
  const belt = Math.round(s * 0.1);
  const bottom = s - top - belt;
  return (
    '<table cellpadding="0" cellspacing="0" style="display:inline-table;vertical-align:middle;margin-right:8px;">' +
    '<tr><td style="padding:2px;background:#f5c842;border-radius:' + s + 'px;">' +
    '<table cellpadding="0" cellspacing="0" style="width:' + s + 'px;border-radius:' + s + 'px;overflow:hidden;border-collapse:collapse;">' +
    '<tr><td height="' + top + '" style="background:#f5c842;height:' + top + 'px;font-size:0;">&nbsp;</td></tr>' +
    '<tr><td height="' + belt + '" style="background:#1a1a2e;height:' + belt + 'px;font-size:0;">&nbsp;</td></tr>' +
    '<tr><td height="' + bottom + '" style="background:#16161f;height:' + bottom + 'px;font-size:0;">&nbsp;</td></tr>' +
    '</table></td></tr></table>'
  );
}

// ─── Base layout ──────────────────────────────────────────────────────────────

function baseLayout(content: string, bannerBg = '#1a1a2e'): string {
  return (
    '<!DOCTYPE html>' +
    '<html lang="pt-BR">' +
    '<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Pokéfolio</title></head>' +
    '<body style="margin:0;padding:0;background:#dde0ea;font-family:\'Segoe UI\',Arial,sans-serif;">' +

    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#dde0ea;padding:40px 16px;">' +
    '<tr><td align="center">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">' +

    // Logo
    '<tr><td align="center" style="padding-bottom:20px;">' +
    '<table cellpadding="0" cellspacing="0" align="center"><tr>' +
    '<td style="background:#1a1a24;border:1px solid #2e2e42;border-radius:14px;padding:10px 22px;">' +
    logoHtml() +
    '<span style="font-size:19px;font-weight:800;color:#f5c842;letter-spacing:-0.5px;vertical-align:middle;">Poké</span>' +
    '<span style="font-size:19px;font-weight:800;color:#e8e8f0;letter-spacing:-0.5px;vertical-align:middle;">folio</span>' +
    '</td></tr></table>' +
    '</td></tr>' +

    // Card
    '<tr><td style="background:#16161f;border-radius:20px;overflow:hidden;">' +

    // Banner topo colorido (pokébola fica no conteúdo de cada template)
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="background:' + bannerBg + ';height:12px;font-size:0;line-height:0;">&nbsp;</td>' +
    '</tr></table>' +

    // Conteúdo
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="padding:28px 36px 40px;">' +
    content +
    '</td></tr></table>' +

    '</td></tr>' +

    // Footer
    '<tr><td align="center" style="padding-top:28px;">' +
    '<p style="margin:0;font-size:12px;color:#5a5a72;line-height:1.7;">' +
    '&copy; ' + new Date().getFullYear() + ' Pok&eacute;folio &nbsp;&middot;&nbsp; N&atilde;o afiliado a The Pok&eacute;mon Company<br/>' +
    'Voc&ecirc; est&aacute; recebendo este email porque se cadastrou na plataforma.' +
    '</p></td></tr>' +

    '</table>' +
    '</td></tr></table>' +
    '</body></html>'
  );
}

function btnPrimary(url: string, label: string): string {
  return (
    '<table cellpadding="0" cellspacing="0" align="center"><tr><td align="center" style="border-radius:12px;background:linear-gradient(135deg,#f5c842,#e8a020);">' +
    '<a href="' + url + '" style="display:inline-block;padding:15px 36px;font-size:15px;font-weight:700;color:#0f0f14;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">' + label + '</a>' +
    '</td></tr></table>'
  );
}

function infoBox(inner: string): string {
  return (
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;border:1px solid #2e2e42;border-radius:14px;margin-bottom:24px;">' +
    '<tr><td style="padding:20px 24px;">' + inner + '</td></tr>' +
    '</table>'
  );
}

function timerBox(hours: number): string {
  return infoBox(
    '<table width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td align="center" style="font-size:26px;padding-bottom:6px;">&#9201;</td></tr>' +
    '<tr><td align="center">' +
    '<p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#f5c842;text-align:center;">Link v&aacute;lido por ' + hours + ' hora' + (hours > 1 ? 's' : '') + '</p>' +
    '<p style="margin:0;font-size:12px;color:#8888aa;text-align:center;">Ap&oacute;s esse prazo, solicite um novo link pelo app.</p>' +
    '</td></tr></table>'
  );
}

function planBox(): string {
  return infoBox(
    '<p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#f5c842;text-transform:uppercase;letter-spacing:1px;text-align:center;">Seu plano atual</p>' +
    '<p style="margin:0 0 2px;font-size:20px;font-weight:800;color:#e8e8f0;text-align:center;">Iniciante <span style="font-size:13px;font-weight:400;color:#8888aa;">&middot; Gr&aacute;tis para sempre</span></p>' +
    '<p style="margin:0;font-size:13px;color:#8888aa;text-align:center;">At&eacute; 100 cartas &nbsp;&middot;&nbsp; Cat&aacute;logo b&aacute;sico &nbsp;&middot;&nbsp; Pre&ccedil;os semanais</p>'
  );
}

function featureList(items: string[][]): string {
  return (
    '<table cellpadding="0" cellspacing="0" style="margin:0 auto;">' +
    items.map(([icon, text]) =>
      '<tr><td align="center" style="padding:5px 16px;font-size:14px;color:#8888aa;">' +
      icon + '&nbsp;&nbsp;' + text +
      '</td></tr>'
    ).join('') +
    '</table>'
  );
}

// ─── Template: Verificação de email ──────────────────────────────────────────

export function verificationTemplate(name: string, link: string): string {
  const content = (
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:20px;">' +
    pokeballImg(80) +
    '</td></tr></table>' +

    '<h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#e8e8f0;letter-spacing:-0.5px;text-align:center;">Ative sua conta, ' + name + '!</h1>' +
    '<p style="margin:0 0 28px;font-size:15px;color:#8888aa;line-height:1.7;text-align:center;">Voc&ecirc; est&aacute; a um passo de come&ccedil;ar sua jornada no Pok&eacute;folio.<br/>Confirme seu email para liberar o acesso completo.</p>' +

    timerBox(24) +

    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">' + btnPrimary(link, 'Verificar meu email') + '</td></tr></table>' +

    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #2e2e42;padding-top:24px;" align="center">' +
    '<p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#aaaacc;text-align:center;text-transform:uppercase;letter-spacing:0.8px;">O que te espera</p>' +
    featureList([
      ['🗂️', 'Catalogar suas cartas Pok&eacute;mon TCG'],
      ['📈', 'Acompanhar o valor da sua cole&ccedil;&atilde;o'],
      ['🏆', 'Ver quais sets voc&ecirc; j&aacute; completou'],
    ]) +
    '</td></tr></table>' +

    '<p style="margin:20px 0 0;font-size:12px;color:#555570;text-align:center;">Se n&atilde;o foi voc&ecirc;, ignore este email com seguran&ccedil;a.</p>'
  );

  return baseLayout(content, '#1a1a2e');
}

// ─── Template: Conta ativada ──────────────────────────────────────────────────

function typeBadge(color: string, emoji: string, label: string): string {
  return (
    '<td align="center" style="padding:0 5px;">' +
    '<div style="width:40px;height:40px;border-radius:40px;background:' + color + ';margin:0 auto 6px;line-height:40px;font-size:20px;text-align:center;">' + emoji + '</div>' +
    '<p style="margin:0;font-size:10px;color:#8888aa;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">' + label + '</p>' +
    '</td>'
  );
}

export function accountActivatedTemplate(name: string): string {
  const dashUrl = (process.env.FRONTEND_URL ?? 'http://localhost:8080') + '/dashboard';

  const content = (
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:20px;">' +
    pokeballImg(80) +
    '</td></tr></table>' +

    '<h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#e8e8f0;letter-spacing:-0.5px;text-align:center;">Conta ativada!</h1>' +
    '<p style="margin:0 0 28px;font-size:15px;color:#8888aa;line-height:1.7;text-align:center;">Bem-vindo, <strong style="color:#f5c842;">' + name + '</strong>!<br/>Sua jornada como colecionador come&ccedil;a agora.</p>' +

    planBox() +

    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:28px;">' +
    '<p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#aaaacc;text-transform:uppercase;letter-spacing:0.8px;text-align:center;">Tipos do TCG</p>' +
    '<table cellpadding="0" cellspacing="0" align="center"><tr>' +
    typeBadge('#ef4444', '🔥', 'Fogo') +
    typeBadge('#3b82f6', '💧', '&Aacute;gua') +
    typeBadge('#facc15', '⚡', 'El&eacute;trico') +
    typeBadge('#22c55e', '🌿', 'Grama') +
    typeBadge('#a855f7', '🔮', 'Ps&iacute;quico') +
    '</tr></table>' +
    '</td></tr></table>' +

    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:20px;">' + btnPrimary(dashUrl, 'Come&ccedil;ar minha jornada') + '</td></tr></table>' +

    '<p style="margin:0;font-size:12px;color:#555570;text-align:center;">Precisa de ajuda? Responda este email a qualquer momento.</p>'
  );

  return baseLayout(content, '#166534');
}

// ─── Template: Boas-vindas ────────────────────────────────────────────────────

export function welcomeTemplate(name: string): string {
  const dashUrl = (process.env.FRONTEND_URL ?? 'http://localhost:8080') + '/dashboard';

  const content = (
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:20px;">' +
    pokeballImg(80) +
    '</td></tr></table>' +

    '<h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#e8e8f0;letter-spacing:-0.5px;text-align:center;">Bem-vindo, ' + name + '! 🎴</h1>' +
    '<p style="margin:0 0 28px;font-size:15px;color:#8888aa;line-height:1.7;text-align:center;">Sua conta no Pok&eacute;folio foi criada com sucesso.<br/>Come&ccedil;e a catalogar sua cole&ccedil;&atilde;o agora mesmo.</p>' +

    planBox() +

    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">' + btnPrimary(dashUrl, 'Acessar minha cole&ccedil;&atilde;o') + '</td></tr></table>' +

    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #2e2e42;padding-top:24px;" align="center">' +
    '<p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#aaaacc;text-align:center;text-transform:uppercase;letter-spacing:0.8px;">O que voc&ecirc; pode fazer agora</p>' +
    featureList([
      ['🗂️', 'Adicionar cartas &agrave; sua cole&ccedil;&atilde;o'],
      ['📈', 'Acompanhar o valor das suas cartas'],
      ['🔍', 'Explorar o cat&aacute;logo completo do TCG'],
    ]) +
    '</td></tr></table>'
  );

  return baseLayout(content, '#1a1a2e');
}

// ─── Template: Reset de senha ─────────────────────────────────────────────────

export function resetPasswordTemplate(name: string, link: string): string {
  const content = (
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:20px;">' +
    pokeballImg(80) +
    '</td></tr></table>' +

    '<h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#e8e8f0;letter-spacing:-0.5px;text-align:center;">Redefinir senha 🔑</h1>' +
    '<p style="margin:0 0 28px;font-size:15px;color:#8888aa;line-height:1.7;text-align:center;">Ol&aacute;, <strong style="color:#f5c842;">' + name + '</strong>!<br/>Recebemos um pedido para redefinir a senha da sua conta.</p>' +

    timerBox(1) +

    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:28px;">' + btnPrimary(link, 'Redefinir minha senha') + '</td></tr></table>' +

    '<p style="margin:0;font-size:12px;color:#555570;text-align:center;">Se voc&ecirc; n&atilde;o solicitou isso, ignore este email.<br/>Sua senha permanecer&aacute; a mesma.</p>'
  );

  return baseLayout(content, '#1e3a5f');
}

// ─── Funções de envio ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  try {
    const result = await getClient().transactionalEmails.sendTransacEmail({
      subject: 'Bem-vindo ao Pokéfolio!',
      htmlContent: welcomeTemplate(name),
      sender: FROM,
      to: [{ email: to, name }],
    });
    console.log('[Brevo] Welcome email enviado:', JSON.stringify(result));
  } catch (err: unknown) {
    const detail = (err as { body?: unknown })?.body ?? err;
    console.error('[Brevo] Erro ao enviar welcome email:', JSON.stringify(detail));
  }
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${process.env.FRONTEND_URL ?? 'http://localhost:8080'}/verify-email?token=${token}`;
  try {
    await getClient().transactionalEmails.sendTransacEmail({
      subject: 'Confirme seu email — Pokéfolio',
      htmlContent: verificationTemplate(name, link),
      sender: FROM,
      to: [{ email: to, name }],
    });
  } catch (err: unknown) {
    const detail = (err as { body?: unknown })?.body ?? err;
    console.error('[Brevo] Erro ao enviar verification email:', JSON.stringify(detail));
  }
}

export async function sendAccountActivatedEmail(to: string, name: string): Promise<void> {
  try {
    await getClient().transactionalEmails.sendTransacEmail({
      subject: 'Conta ativada — Pokéfolio',
      htmlContent: accountActivatedTemplate(name),
      sender: FROM,
      to: [{ email: to, name }],
    });
  } catch (err) {
    console.error('[Brevo] Erro ao enviar account activated email:', err);
  }
}

export async function sendResetPasswordEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${process.env.FRONTEND_URL ?? 'http://localhost:8080'}/?reset=${token}`;
  try {
    await getClient().transactionalEmails.sendTransacEmail({
      subject: 'Redefinir senha — Pokéfolio',
      htmlContent: resetPasswordTemplate(name, link),
      sender: FROM,
      to: [{ email: to, name }],
    });
  } catch (err) {
    console.error('[Brevo] Erro ao enviar reset password email:', err);
  }
}
