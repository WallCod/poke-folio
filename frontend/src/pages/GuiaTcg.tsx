import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Shield, TrendingUp, Star, Layers, Zap, ArrowRight, ChevronDown, BookOpen, Sparkles, Crown } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

const RAREZAS = [
  { nome: "Common", cor: "bg-slate-500/15 text-slate-300 border-slate-500/30", desc: "Carta básica, geralmente Pokémons de estágio inicial ou Treinadores simples. Fácil de encontrar em qualquer booster." },
  { nome: "Uncommon", cor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", desc: "Slightly harder to find. Often Stage 1 Pokémons and Trainer cards with stronger effects." },
  { nome: "Rare", cor: "bg-primary/15 text-primary border-primary/30", desc: "Geralmente um por booster. Inclui Pokémons de estágio 2 e Treinadores poderosos. Bordas e arte mais elaboradas." },
  { nome: "Rare Holo", cor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", desc: "Versão holográfica da Rare. A arte brilha com efeito espelhado. Muito valorizada por colecionadores." },
  { nome: "Ultra Rare", cor: "bg-purple-500/15 text-purple-400 border-purple-500/30", desc: "EX, GX, V, VMAX — cartas de alto impacto no jogo e alto valor de mercado. Arte full-art ou diferenciada." },
  { nome: "Secret Rare", cor: "bg-rose-500/15 text-rose-400 border-rose-500/30", desc: "Número acima do total do set (ex: 201/200). Hyper Rares, Rainbow, Gold cards. As mais valiosas e raras." },
];

const ERAS = [
  { era: "Base Set (1999)", sets: "Base, Jungle, Fossil, Team Rocket", destaque: "Charizard Base holo, Mewtwo, Blastoise" },
  { era: "Neo (2000–2002)", sets: "Neo Genesis, Discovery, Revelation, Destiny", destaque: "Lugia, Ho-Oh, Celebi" },
  { era: "EX (2003–2007)", sets: "Ruby & Sapphire → Power Keepers", destaque: "Rayquaza ex, Deoxys ex, Charizard ex" },
  { era: "Diamond & Pearl (2007–2010)", sets: "DP Base → Arceus", destaque: "Palkia/Dialga Lv.X, Arceus Secret Rare" },
  { era: "Black & White (2011–2013)", sets: "BW Base → Plasma Blast", destaque: "Charizard Prime, Rayquaza Full Art" },
  { era: "XY (2013–2016)", sets: "XY Base → Evolutions", destaque: "Mega Charizard EX, M Rayquaza EX" },
  { era: "Sun & Moon (2016–2019)", sets: "SM Base → Cosmic Eclipse", destaque: "Pikachu GX, Umbreon GX, Charizard GX" },
  { era: "Sword & Shield (2019–2022)", sets: "SWSH Base → Crown Zenith", destaque: "Charizard VMAX, Umbreon VMAX, Alt Arts" },
  { era: "Scarlet & Violet (2023–hoje)", sets: "SV Base → atual", destaque: "Charizard ex (SV), Miraidon ex, SAR cards" },
];

const DICAS = [
  { icon: Shield, titulo: "Verifique autenticidade", desc: "Cartas originais têm bordas uniformes, cores vibrantes e a textura do verso idêntica. Desconfie de brilho excessivo ou impressão borrada." },
  { icon: Layers, titulo: "Entenda graduação", desc: "PSA, BGS e CGC são empresas que encapsulam e classificam cartas de 1 a 10. Uma PSA 10 pode valer 5–20x mais que a mesma carta não graduada." },
  { icon: TrendingUp, titulo: "Acompanhe o mercado", desc: "Preços flutuam com lançamentos, torneios e hype de séries animadas. Fearow, Charizard e Pikachu são os mais sensíveis a eventos externos." },
  { icon: Star, titulo: "Condições importam", desc: "Mint (M), Near Mint (NM), Lightly Played (LP), Moderately Played (MP), Heavily Played (HP). Um canto amassado pode reduzir o valor em 50%." },
  { icon: Zap, titulo: "Primeiras edições", desc: "Cartas com o símbolo ◆ ou 'Edition 1' na esquerda da arte (sets 1999–2000) valem significativamente mais que versões ilimitadas." },
  { icon: Sparkles, titulo: "Alt Arts e SAR", desc: "Special Illustration Rares (SV era) e Alternate Arts (SWSH era) são as cartas mais buscadas atualmente — arte diferente da versão padrão." },
];

const FAQ = [
  { q: "Qual a diferença entre Holo e Reverse Holo?", r: "Na Holo, apenas a arte do Pokémon brilha. Na Reverse Holo, o efeito holográfico está no resto da carta, enquanto a arte é impressão normal." },
  { q: "Posso jogar com carta graduada (PSA)?", r: "Tecnicamente sim, mas o encapsulamento dificulta o manuseio. A graduação é focada em preservação e valor de coleção, não em jogo competitivo." },
  { q: "Sets japoneses valem mais ou menos?", r: "Depende. Cartas japonesas geralmente têm tiragens menores e chegam ao mercado antes das versões EN. Certas exclusivas JP podem valer mais." },
  { q: "Como saber se um booster foi pesado (weighed)?", r: "Boosters de sets recentes têm gramatura similar entre os packs. Packs do mesmo set com peso diferente indicam que alguém verificou conteúdo antes — evite." },
  { q: "O preço do meu portfolio é em tempo real?", r: "Sim — o PokéFolio atualiza preços via mercado brasileiro e TCGPlayer, convertendo para BRL com taxa de câmbio live." },
];

const AccordionItem = ({ q, r }: { q: string; r: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left text-sm font-medium hover:text-primary transition-colors"
      >
        {q}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform text-muted-foreground", open && "rotate-180")} />
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{r}</p>}
    </div>
  );
};

const GuiaTcg = () => {
  const session = getSession();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="container pt-14 pb-10 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-elevated border border-border/70 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Guia do Colecionador
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Tudo sobre o <span className="text-gradient-gold">Pokémon TCG</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            De iniciante a mestre — entenda raridades, eras, graduação e como maximizar o valor da sua coleção.
          </p>
        </section>

        {/* Raridades */}
        <section className="container pb-16 max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-6">Hierarquia de Raridades</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {RAREZAS.map((r) => (
              <div key={r.nome} className="glass-panel p-5">
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-3", r.cor)}>
                  {r.nome}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline de Eras */}
        <section className="border-t border-border/40 py-16">
          <div className="container max-w-4xl mx-auto">
            <h2 className="font-display text-2xl font-bold mb-8">Eras do TCG</h2>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border/40" />
              <div className="space-y-6">
                {ERAS.map((e, i) => (
                  <div key={i} className="flex gap-6 relative">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5 z-10">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="glass-panel p-4 flex-1">
                      <p className="font-display font-bold text-sm text-primary">{e.era}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{e.sets}</p>
                      <p className="text-xs text-foreground/80 mt-2"><span className="text-muted-foreground">Destaques:</span> {e.destaque}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dicas de colecionador */}
        <section className="border-t border-border/40 py-16">
          <div className="container max-w-4xl mx-auto">
            <h2 className="font-display text-2xl font-bold mb-8">Dicas do Colecionador</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DICAS.map(({ icon: Icon, titulo, desc }) => (
                <div key={titulo} className="glass-panel p-5 space-y-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{titulo}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/40 py-16">
          <div className="container max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold mb-8">Perguntas Frequentes</h2>
            <div>
              {FAQ.map((item) => (
                <AccordionItem key={item.q} q={item.q} r={item.r} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 py-16">
          <div className="container max-w-2xl mx-auto text-center space-y-4">
            <h2 className="font-display text-2xl font-bold">Pronto para gerenciar sua coleção?</h2>
            <p className="text-muted-foreground text-sm">Acompanhe preços em tempo real, organize seus portfolios e descubra o valor real das suas cartas.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {session ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-gold text-background font-semibold text-sm hover:opacity-90 hover:shadow-glow-gold transition-all"
                >
                  Ir ao meu portfolio <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  to="/" state={{ openModal: "signup" }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-gold text-background font-semibold text-sm hover:opacity-90 hover:shadow-glow-gold transition-all"
                >
                  Criar conta grátis <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl surface-elevated border border-border/70 text-sm font-medium hover:bg-surface-elevated/80 transition-colors">
                <Crown className="h-4 w-4 text-primary" /> Ver planos
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default GuiaTcg;
