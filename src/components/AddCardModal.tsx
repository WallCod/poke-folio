import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Minus } from "lucide-react";
import { useCollection, type Condition } from "@/store/useCollection";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const AddCardModal = ({ open, onOpenChange }: Props) => {
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState(1);
  const [condition, setCondition] = useState<Condition>("NM");
  const [foil, setFoil] = useState(false);
  const addCard = useCollection((s) => s.addCard);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      toast.error("Digite o nome de uma carta");
      return;
    }
    addCard({
      id: crypto.randomUUID(),
      name: search,
      set: "Set personalizado",
      setCode: "—",
      number: "—",
      rarity: foil ? "holo" : "common",
      type: "—",
      artist: "—",
      year: new Date().getFullYear(),
      marketPrice: 0,
      quantity: qty,
      condition,
      foil,
      addedAt: new Date().toISOString(),
    });
    toast.success(`${search} adicionada à coleção!`);
    setSearch("");
    setQty(1);
    setFoil(false);
    setCondition("NM");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/70 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Adicionar à coleção
          </DialogTitle>
          <DialogDescription>
            Busque uma carta pelo nome e escolha as opções de armazenamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar carta</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Ex: Charizard ex"
                className="pl-9 surface-elevated border-border/70"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <div className="flex items-center surface-elevated rounded-lg border border-border/70 h-10">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 h-full text-muted-foreground hover:text-primary transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex-1 text-center font-display font-semibold">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 h-full text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Condição</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
                <SelectTrigger className="surface-elevated border-border/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mint">Mint</SelectItem>
                  <SelectItem value="NM">Near Mint</SelectItem>
                  <SelectItem value="LP">Lightly Played</SelectItem>
                  <SelectItem value="MP">Moderately Played</SelectItem>
                  <SelectItem value="HP">Heavily Played</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between surface-elevated rounded-lg border border-border/70 p-3">
            <div>
              <Label htmlFor="foil" className="cursor-pointer">
                Foil / Holográfica
              </Label>
              <p className="text-xs text-muted-foreground">
                Versão com acabamento brilhante
              </p>
            </div>
            <Switch id="foil" checked={foil} onCheckedChange={setFoil} />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold transition-all"
          >
            Confirmar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
