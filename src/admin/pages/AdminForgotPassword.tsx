import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AdminLogo } from "../AdminLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(0 70% 45% / 0.08), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, hsl(28 85% 44% / 0.07), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-xl border border-[hsl(28_85%_44%)]/35 rounded-2xl shadow-[0_30px_80px_-20px_hsl(0_70%_30%/0.4)] p-8">
          <div className="flex items-center justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] font-bold bg-destructive/15 text-destructive border border-destructive/40">
              <ShieldAlert className="h-3 w-3" />
              Área Restrita
            </span>
          </div>

          <div className="flex justify-center mb-6">
            <AdminLogo to="/admin/login" />
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <h1 className="font-display text-lg font-bold mb-2">Verifique seu email</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Se houver uma conta de admin associada a <span className="text-foreground">{email}</span>,
                você receberá instruções em breve.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-center font-display text-xl font-bold mb-1">
                Recuperar acesso
              </h1>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Informe seu email administrativo
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@pokefolio.app"
                    className="bg-background/60"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[hsl(28_85%_44%)] hover:bg-[hsl(28_85%_38%)] text-white font-semibold"
                >
                  Enviar instruções
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[hsl(28_85%_60%)] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar ao login
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 mt-6">
          Acesso restrito a administradores
        </p>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
