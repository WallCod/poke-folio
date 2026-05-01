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

// ─── Templates HTML ───────────────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pokéfolio</title>
</head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;background:#1a1a24;border:1px solid #2a2a3a;border-radius:12px;padding:12px 24px;">
                <span style="font-size:20px;font-weight:800;color:#f5c842;letter-spacing:-0.5px;">Poké</span><span style="font-size:20px;font-weight:800;color:#e8e8f0;letter-spacing:-0.5px;">folio</span>
              </div>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background:#16161f;border:1px solid #2a2a3a;border-radius:20px;padding:40px 36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#555566;line-height:1.6;">
                © ${new Date().getFullYear()} Pokéfolio · Não afiliado a The Pokémon Company<br/>
                Você está recebendo este email porque se cadastrou na plataforma.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btnPrimary(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#f5c842,#e8a020);color:#0f0f14;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.2px;">${label}</a>`;
}

// ─── Template: Boas-vindas ────────────────────────────────────────────────────

export function welcomeTemplate(name: string): string {
  const dashUrl = (process.env.FRONTEND_URL ?? 'http://localhost:8080') + '/dashboard';
  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#e8e8f0;letter-spacing:-0.5px;">
      Bem-vindo, ${name}! 🎴
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#8888aa;line-height:1.7;">
      Sua conta no Pokéfolio foi criada com sucesso. Agora você pode começar a catalogar sua coleção de cartas do TCG.
    </p>

    <div style="background:#0f0f14;border:1px solid #2a2a3a;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#f5c842;text-transform:uppercase;letter-spacing:1px;">Seu plano atual</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#e8e8f0;">Iniciante <span style="font-size:13px;font-weight:400;color:#8888aa;">· Grátis para sempre</span></p>
      <p style="margin:8px 0 0;font-size:13px;color:#8888aa;">Até 100 cartas · Catálogo básico · Preços semanais</p>
    </div>

    <div style="margin-bottom:32px;text-align:center;">
      ${btnPrimary(dashUrl, 'Acessar minha coleção')}
    </div>

    <div style="border-top:1px solid #2a2a3a;padding-top:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#e8e8f0;">O que você pode fazer agora:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          ['🗂️', 'Adicionar cartas à sua coleção'],
          ['📈', 'Acompanhar o valor das suas cartas'],
          ['🔍', 'Explorar o catálogo completo do TCG'],
        ].map(([icon, text]) => `
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#8888aa;">
              <span style="margin-right:10px;">${icon}</span>${text}
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  `);
}

// ─── Template: Alerta de login ────────────────────────────────────────────────

export function loginAlertTemplate(name: string, ip: string, time: string): string {
  const resetUrl = (process.env.FRONTEND_URL ?? 'http://localhost:8080') + '/reset-password';
  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#e8e8f0;">
      Novo acesso detectado
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#8888aa;line-height:1.7;">
      Olá, <strong style="color:#e8e8f0;">${name}</strong>. Detectamos um novo login na sua conta.
    </p>

    <div style="background:#0f0f14;border:1px solid #2a2a3a;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#8888aa;">Horário</td>
          <td style="padding:6px 0;font-size:13px;color:#e8e8f0;text-align:right;">${time}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#8888aa;">IP</td>
          <td style="padding:6px 0;font-size:13px;color:#e8e8f0;text-align:right;">${ip}</td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 24px;font-size:14px;color:#8888aa;line-height:1.6;">
      Se foi você, pode ignorar este email. Se não reconhece este acesso, recomendamos alterar sua senha imediatamente.
    </p>

    <div style="text-align:center;">
      ${btnPrimary(resetUrl, 'Alterar minha senha')}
    </div>
  `);
}

// ─── Funções de envio ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  try {
    await getClient().transactionalEmails.sendTransacEmail({
      subject: '🎴 Bem-vindo ao Pokéfolio!',
      htmlContent: welcomeTemplate(name),
      sender: FROM,
      to: [{ email: to, name }],
    });
  } catch (err) {
    console.error('[Brevo] Erro ao enviar welcome email:', err);
  }
}

export async function sendLoginAlertEmail(
  to: string,
  name: string,
  ip: string
): Promise<void> {
  const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  try {
    await getClient().transactionalEmails.sendTransacEmail({
      subject: '🔐 Novo acesso na sua conta Pokéfolio',
      htmlContent: loginAlertTemplate(name, ip, time),
      sender: FROM,
      to: [{ email: to, name }],
    });
  } catch (err) {
    console.error('[Brevo] Erro ao enviar login alert:', err);
  }
}
