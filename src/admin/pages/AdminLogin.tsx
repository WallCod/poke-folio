import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ShieldAlert, Loader2 } from "lucide-react";
import { AdminLogo } from "../AdminLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("adminToken", "demo-admin-token");
      navigate("/admin/dashboard");
    }, 600);
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
        <div className="bg-card/80 backdrop-blur-xl border border-[hsl(28_85%_44%)]/35 rounded-2xl shadow-[0_30px_80px_-20px_hsl(0_70%_30%/0.4),0_0_0_1px_hsl(28_85%_44%/0.15)] p-8">
          <div className="flex items-center justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] font-bold bg-destructive/15 text-destructive border border-destructive/40">
              <ShieldAlert className="h-3 w-3" />
              Área Restrita
            </span>
          </div>

          <div className="flex justify-center mb-6">
            <AdminLogo to="/admin/login" />
          </div>

          <h1 className="text-center font-display text-xl font-bold mb-1">
            Acesso ao Painel
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-6">
            Entre com suas credenciais administrativas
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pokefolio.app"
                className="bg-background/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha</Label>
              <Input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background/60"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(28_85%_44%)] hover:bg-[hsl(28_85%_38%)] text-white font-semibold shadow-[0_8px_24px_-8px_hsl(28_85%_44%/0.7)]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Acessar painel"}
            </Button>

            <div className="text-center">
              <Link
                to="/admin/forgot-password"
                className="text-xs text-muted-foreground hover:text-[hsl(28_85%_60%)] transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 mt-6">
          Acesso restrito a administradores
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
