import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockLogin } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const session = mockLogin(email);
      toast.success(`Bem-vindo, ${session.name}!`);
      navigate(session.role === "admin" ? "/admin/dashboard" : "/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container py-6">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="glass-panel p-8">
            <h1 className="font-display text-2xl font-bold text-center">
              Bem-vindo de volta
            </h1>
            <p className="text-center text-sm text-muted-foreground mt-1 mb-6">
              Acesse sua coleção
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="treinador@email.com"
                  className="surface-elevated border-border/70"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="surface-elevated border-border/70"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Dica: emails contendo <span className="text-primary">"admin"</span> entram como administrador.
              </p>

              <Link
                to="/"
                className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar para a home
              </Link>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
