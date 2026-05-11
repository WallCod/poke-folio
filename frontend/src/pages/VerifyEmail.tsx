import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { setSessionFromApi } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight } from "lucide-react";

type State = "loading" | "success" | "error" | "no-token";

// Pokébola SVG — mesma usada nos emails, mas como componente React
const Pokeball = ({ size = 80, glow = false }: { size?: number; glow?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 72 72"
    xmlns="http://www.w3.org/2000/svg"
    style={glow ? { filter: "drop-shadow(0 0 14px rgba(245,200,66,0.5))" } : undefined}
  >
    {/* anel dourado */}
    <circle cx="36" cy="36" r="34" fill="none" stroke="#f5c842" strokeWidth="3" />
    {/* metade superior vermelha */}
    <path d="M 3,36 A 33,33 0 0 1 69,36 Z" fill="#e63939" />
    {/* metade inferior branca */}
    <path d="M 3,36 A 33,33 0 0 0 69,36 Z" fill="#e8e8f0" />
    {/* faixa central escura */}
    <rect x="3" y="34" width="66" height="4" fill="#1a1a2e" />
    {/* círculo central fundo escuro */}
    <circle cx="36" cy="36" r="12" fill="#1a1a2e" />
    {/* círculo central claro */}
    <circle cx="36" cy="36" r="9" fill="#e8e8f0" stroke="#1a1a2e" strokeWidth="2" />
    {/* brilho */}
    <circle cx="31" cy="31" r="3" fill="white" opacity="0.6" />
  </svg>
);

// Modal de resultado — overlay centralizado elegante
const ResultModal = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* backdrop blur */}
    <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
    {/* card do modal */}
    <div className="relative w-full max-w-sm glass-panel p-8 flex flex-col items-center text-center gap-6 animate-fade-in shadow-2xl border border-border/80">
      {children}
    </div>
  </div>
);

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>(token ? "loading" : "no-token");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (!token) {
      return;
    }

    authApi
      .verifyEmail(token!)
      .then(({ data }) => {
        setSessionFromApi(data);
        setState("success");
      })
      .catch((err) => {
        setErrorMsg(
          err.response?.data?.error ?? "Link inválido ou expirado."
        );
        setState("error");
      });
  }, [searchParams]);

  // Redireciona automaticamente após sucesso
  useEffect(() => {
    if (state !== "success") return;
    if (countdown <= 0) {
      navigate("/dashboard");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [state, countdown, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial — mais vivo */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* ── LOADING (tela cheia, antes do modal aparecer) ── */}
      {state === "loading" && (
        <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
          <div className="mb-4">
            <Logo />
          </div>
          <div className="relative">
            <Pokeball size={80} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin opacity-0" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Verificando seu email…</h1>
            <p className="text-sm text-muted-foreground mt-2">Aguarde um momento.</p>
          </div>
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      )}

      {/* ── NO TOKEN (estado inicial após cadastro) ── */}
      {state === "no-token" && (
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="mb-8">
            <Logo />
          </div>
          <div className="glass-panel p-8 w-full flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-amber-950/60 border-2 border-amber-500/40 flex items-center justify-center">
              <Mail className="h-10 w-10 text-amber-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Verifique seu email</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Enviamos um link de ativação. Clique nele para ativar sua conta.
              </p>
            </div>
            <div className="w-full bg-surface-elevated/60 border border-border/60 rounded-xl p-5 flex flex-col items-center gap-2">
              <p className="font-semibold text-foreground text-sm">Não recebeu?</p>
              <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
                <p>Verifique a pasta de spam</p>
                <p>O link expira em 24 horas</p>
                <p>Faça login para reenviar o email</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl bg-gradient-gold text-background font-bold font-display hover:opacity-90 transition-opacity"
            >
              Ir para o início
            </button>
          </div>
        </div>
      )}

      {/* ── SUCCESS — modal centralizado elegante ── */}
      {state === "success" && (
        <ResultModal>
          {/* Pokébola com check badge */}
          <div className="relative">
            <Pokeball size={88} glow />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-gradient-gold">
              Conta ativada!
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sua jornada como colecionador começa agora.
              <br />
              Redirecionando em <span className="text-primary font-bold text-base">{countdown}s</span>…
            </p>
          </div>

          {/* Barra de progresso do countdown */}
          <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-gold rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 8) * 100}%` }}
            />
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 rounded-xl bg-gradient-gold text-background font-bold font-display hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Entrar agora
            <ArrowRight className="h-4 w-4" />
          </button>
        </ResultModal>
      )}

      {/* ── ERROR — modal centralizado elegante ── */}
      {state === "error" && (
        <ResultModal>
          <div className="w-20 h-20 rounded-full bg-red-950/60 border-2 border-red-500/40 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold">Link inválido</h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-surface-elevated border border-border text-foreground font-semibold hover:bg-surface-elevated/80 transition-colors"
          >
            Voltar ao início
          </button>
        </ResultModal>
      )}
    </div>
  );
};

export default VerifyEmail;
