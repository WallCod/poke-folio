import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { mockLogin, setSessionFromApi } from "@/lib/auth";
import { authApi } from "@/lib/api";
import api from "@/lib/api";
import { modal } from "@/store/useAppModal";
import { useAuthModal } from "@/store/useAuthModal";

const GoldPokeball = () => (
  <svg viewBox="0 0 72 72" width="56" height="56" aria-hidden="true" className="mx-auto mb-4">
    <defs>
      <linearGradient id="gpb-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5c842" />
        <stop offset="100%" stopColor="#e8a020" />
      </linearGradient>
    </defs>
    <circle cx="36" cy="36" r="34" fill="url(#gpb-gold)" />
    <path d="M2,36 A34,34 0 0 1 70,36 Z" fill="#c47a10" fillOpacity="0.5" />
    <rect x="2" y="33" width="68" height="6" fill="#c47a10" fillOpacity="0.6" />
    <circle cx="36" cy="36" r="10" fill="#1a1a2e" stroke="url(#gpb-gold)" strokeWidth="3" />
    <circle cx="36" cy="36" r="5" fill="#f5c842" fillOpacity="0.8" />
  </svg>
);

export const AuthModal = () => {
  const { view, close } = useAuthModal();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName(""); setEmail(""); setPassword("");
    setNewPassword(""); setConfirmPassword(""); setShowPassword(false);
  };

  const closeModal = () => { reset(); close(); };

  const switchView = (v: "login" | "signup" | "forgot") => {
    reset();
    useAuthModal.getState().open(v);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { modal.error("Campos obrigatórios", "Preencha email e senha."); return; }
    setLoading(true);
    try {
      if (view === "signup") {
        if (!name.trim()) { modal.error("Nome obrigatório", "Informe seu nome."); setLoading(false); return; }
        await authApi.register({ name, email, password });
        closeModal();
        navigate("/verify-email");
      } else {
        const { data } = await authApi.login({ email, password });
        const s = setSessionFromApi(data);
        closeModal();
        modal.success(`Bem-vindo de volta, ${s.name}!`);
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error ?? "Erro ao conectar com o servidor";
      if (msg === "Erro ao conectar com o servidor" && import.meta.env.DEV) {
        const s = mockLogin(email);
        closeModal();
        modal.success(`[dev] ${s.name}`, "Backend offline — usando mock.");
        navigate("/dashboard");
      } else {
        modal.error("Falha no acesso", msg);
      }
    } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { modal.error("Campo obrigatório", "Informe seu email."); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      useAuthModal.getState().open("forgot-sent");
    } catch (err: unknown) {
      modal.error("Erro", (err as any)?.response?.data?.error ?? "Não foi possível enviar.");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={view !== null} onOpenChange={(v) => { if (!v) closeModal(); }}>
      <DialogContent className="bg-card border-border/70 max-w-md">

        {(view === "login" || view === "signup") && (
          <>
            <DialogHeader className="items-center text-center space-y-0 pb-0">
              <GoldPokeball />
              <DialogTitle className="font-display text-2xl text-center">
                {view === "signup" ? "Criar sua conta" : "Bem-vindo de volta"}
              </DialogTitle>
            </DialogHeader>
            <form className="space-y-4 pt-4" onSubmit={handleAuth}>
              {view === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="am-name">Nome</Label>
                  <Input id="am-name" placeholder="Como devemos te chamar?" className="surface-elevated border-border/70" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="am-email">Email</Label>
                <Input id="am-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="treinador@email.com" className="surface-elevated border-border/70" autoFocus={view === "login"} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="am-password">Senha</Label>
                  {view === "login" && (
                    <button type="button" onClick={() => switchView("forgot")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input id="am-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="surface-elevated border-border/70 pr-10" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold disabled:opacity-60">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</> : (view === "signup" ? "Criar conta" : "Entrar")}
              </Button>
              <p className="text-center text-xs text-muted-foreground pt-1">
                {view === "signup" ? "Já tem conta?" : "Novo por aqui?"}{" "}
                <button type="button" onClick={() => switchView(view === "signup" ? "login" : "signup")} className="text-primary hover:underline font-medium">
                  {view === "signup" ? "Entrar" : "Criar conta"}
                </button>
              </p>
            </form>
          </>
        )}

        {view === "forgot" && (
          <>
            <DialogHeader className="items-center text-center space-y-0 pb-0">
              <GoldPokeball />
              <DialogTitle className="font-display text-2xl text-center">Esqueceu a senha?</DialogTitle>
            </DialogHeader>
            <p className="text-center text-sm text-muted-foreground -mt-1">Informe seu email e enviaremos um link para redefinir sua senha.</p>
            <form className="space-y-4" onSubmit={handleForgot}>
              <div className="space-y-2">
                <Label htmlFor="am-forgot-email">Email</Label>
                <Input id="am-forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="treinador@email.com" className="surface-elevated border-border/70" autoFocus />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold disabled:opacity-60">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : "Enviar link de redefinição"}
              </Button>
              <button type="button" onClick={() => switchView("login")} className="block w-full text-center text-xs text-muted-foreground hover:text-foreground pt-1">
                ← Voltar para o login
              </button>
            </form>
          </>
        )}

        {view === "forgot-sent" && (
          <div className="flex flex-col items-center text-center gap-5 py-2">
            <GoldPokeball />
            <div className="h-14 w-14 -mt-2 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="font-display text-2xl">Verifique seu email</DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Se o email <span className="text-foreground font-medium">{email}</span> estiver cadastrado, você receberá as instruções em breve.
              <br /><br />Não recebeu? Verifique o spam ou aguarde alguns minutos.
            </p>
            <button type="button" onClick={closeModal} className="px-6 py-2 rounded-lg border border-border/70 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors">Fechar</button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};
