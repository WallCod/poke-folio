import { useUser, useCollection } from "@/store/useCollection";
import { sampleOwned } from "@/data/sample";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Library, Heart, LogOut, Moon, Sun, Shield, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "@/lib/auth";
import { toast } from "sonner";

const Profile = () => {
  const user = useUser();
  const currency = useCollection((s) => s.currency);
  const setCurrency = useCollection((s) => s.setCurrency);
  const userCards = useCollection((s) => s.cards);
  const cards = userCards.length > 0 ? userCards : sampleOwned;
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const session = getSession();
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="container pt-8 space-y-6 animate-fade-in max-w-3xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Perfil</h1>

      {/* Identity */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="h-20 w-20 rounded-full bg-gradient-gold text-background font-display font-bold text-3xl flex items-center justify-center shadow-glow-gold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="font-display text-2xl font-bold">{user.name}</h2>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full surface-elevated border border-border/60">
              <Calendar className="h-3 w-3" /> Membro desde {user.memberSince}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full surface-elevated border border-border/60">
              <Library className="h-3 w-3 text-primary" /> {totalCards} cartas
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total cartas</p>
          <p className="font-display text-2xl font-bold mt-2">{totalCards}</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sets favoritos</p>
          <p className="font-display text-2xl font-bold mt-2">3</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Heart className="h-3 w-3" /> Pokémon favorito
          </p>
          <p className="font-display text-2xl font-bold mt-2">Charizard</p>
        </div>
      </div>

      {/* Admin area card — only for admins */}
      {isAdmin && (
        <div className="glass-panel p-6 border border-[hsl(28_85%_44%)]/40 bg-[hsl(28_85%_44%)]/5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-[hsl(28_85%_44%)]/15 border border-[hsl(28_85%_44%)]/40 flex items-center justify-center text-[hsl(28_85%_60%)] shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold">Área Administrativa</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Você tem permissões de administrador. Acesse o painel para gerenciar usuários, planos e configurações.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin/dashboard")}
            className="w-full bg-[hsl(28_85%_44%)] hover:bg-[hsl(28_85%_38%)] text-white font-semibold"
          >
            Acessar painel admin <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Settings */}
      <div className="glass-panel p-6 space-y-5">
        <h3 className="font-display text-lg font-bold">Configurações</h3>

        <div className="space-y-2">
          <Label>Tema</Label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border transition-colors ${
                theme === "dark"
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/70 surface-elevated text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="h-4 w-4" /> Escuro
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border transition-colors ${
                theme === "light"
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/70 surface-elevated text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="h-4 w-4" /> Claro
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Moeda preferida</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as "BRL" | "USD")}>
            <SelectTrigger className="surface-elevated border-border/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">R$ — Real brasileiro</SelectItem>
              <SelectItem value="USD">US$ — Dólar americano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => {
            clearSession();
            toast.success("Sessão encerrada");
            navigate("/");
          }}
          variant="outline"
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Sair da conta
        </Button>
      </div>
    </div>
  );
};

export default Profile;
