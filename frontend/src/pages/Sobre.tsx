import { PublicHeader } from "@/components/PublicHeader";
import { TrendingUp, Shield, Database, Zap, Globe, ArrowRight, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getSession } from "@/lib/auth";

const FEATURES = [
  {
    icon: TrendingUp,
    titulo: "Preços em tempo real",
    desc: "Integramos com MYP Cards (mercado brasileiro) e TCGPlayer, com conversão automática USD/EUR → BRL via taxa de câmbio live.",
  },
  {
    icon: Database,
    titulo: "Base de dados completa",
    desc: "Mais de 20.000 cartas indexadas via pokemontcg.io e TCGdex, incluindo sets japoneses, Pocket TCG e edições especiais.",
  },
  {
    icon: Shield,
    titulo: "Portfolio seguro",
    desc: "Suas coleções ficam associadas à sua conta, com autenticação JWT e dados armazenados em MongoDB Atlas com backups automáticos.",
  },
  {
    icon: Zap,
    titulo: "Múltiplos portfolios",
    desc: "Organize por tipo de coleção — pessoal, investimento, cartas para venda — até 20 portfolios distintos por conta.",
  },
  {
    icon: Globe,
    titulo: "Mercado brasileiro",
    desc: "Desenvolvido por e para colecionadores brasileiros. Preços em Real, suporte a cartas importadas e raras japonesas com valor local.",
  },
  {
    icon: BookOpen,
    titulo: "Guia e educação",
    desc: "Recursos para colecionadores de todos os níveis — de iniciantes aprendendo raridades a investidores monitorando valorização.",
  },
];

const STACK = [
  { label: "Frontend", tech: "React 18 + TypeScript + Vite + TailwindCSS" },
  { label: "Backend", tech: "Node.js + Express + TypeScript" },
  { label: "Banco de dados", tech: "MongoDB Atlas + Mongoose" },
  { label: "Preços TCG", tech: "pokemontcg.io + TCGdex + MYP Cards" },
  { label: "Câmbio", tech: "AwesomeAPI (USD-BRL / EUR-BRL live)" },
  { label: "Auth", tech: "JWT + bcrypt + Brevo (email)" },
];

const Sobre = () => {
  const session = getSession();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="container pt-14 pb-12 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-elevated border border-border/70 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Sobre o projeto
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            O que é o <span className="text-gradient-gold">PokéFolio</span>?
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Uma plataforma brasileira para colecionadores de Pokémon TCG acompanharem o valor real das suas cartas, organizarem suas coleções e entenderem o mercado local.
          </p>
        </section>

        {/* Missão */}
        <section className="border-t border-border/40 py-14">
          <div className="container max-w-3xl mx-auto">
            <div className="glass-panel p-8 md:p-10 text-center space-y-4">
              <h2 className="font-display text-xl font-bold">Nossa missão</h2>
              <p className="text-muted-foreground leading-relaxed">
                O mercado de cartas Pokémon no Brasil cresceu exponencialmente nos últimos anos, mas a maioria das ferramentas disponíveis exibe preços em dólar e é voltada ao mercado norte-americano.
                O PokéFolio existe para preencher essa lacuna — trazendo preços reais do mercado brasileiro, em Real, com dados de plataformas como MYP Cards e Liga Pokémon.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Seja você um colecionador casual que quer saber quanto vale aquele Charizard antigo, ou um investidor acompanhando a valorização do seu portfolio, nossa plataforma oferece as ferramentas certas.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/40 py-14">
          <div className="container max-w-5xl mx-auto">
            <h2 className="font-display text-2xl font-bold mb-8 text-center">O que oferecemos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ icon: Icon, titulo, desc }) => (
                <div key={titulo} className="glass-panel p-5 space-y-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{titulo}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stack técnica */}
        <section className="border-t border-border/40 py-14">
          <div className="container max-w-3xl mx-auto">
            <h2 className="font-display text-2xl font-bold mb-8">Tecnologia</h2>
            <div className="glass-panel overflow-hidden">
              {STACK.map(({ label, tech }, i) => (
                <div
                  key={label}
                  className={`flex items-center justify-between px-6 py-4 text-sm ${i < STACK.length - 1 ? "border-b border-border/40" : ""}`}
                >
                  <span className="text-muted-foreground font-medium w-40 shrink-0">{label}</span>
                  <span className="text-foreground/90">{tech}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fontes de dados */}
        <section className="border-t border-border/40 py-14">
          <div className="container max-w-3xl mx-auto space-y-6">
            <h2 className="font-display text-2xl font-bold">Fontes de dados</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">pokemontcg.io</strong> — API pública com mais de 20.000 cartas EN, incluindo preços USD via TCGPlayer e EUR via Cardmarket. Nossa fonte primária para catálogo e metadados.
              </p>
              <p>
                <strong className="text-foreground">TCGdex</strong> — API complementar com sets japoneses, Pocket TCG e edições não cobertas pela pokemontcg.io. Permite buscar cartas de sets como A1, A4 e promos JP.
              </p>
              <p>
                <strong className="text-foreground">MYP Cards</strong> — Marketplace brasileiro com preços reais de compradores e vendedores locais. Usamos seus dados como fonte primária de BRL, por refletirem o mercado nacional.
              </p>
              <p>
                <strong className="text-foreground">AwesomeAPI</strong> — Taxa de câmbio USD-BRL e EUR-BRL em tempo real. Usada como fallback quando o MYP não tem preço para uma carta específica.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 py-16">
          <div className="container max-w-2xl mx-auto text-center space-y-4">
            <h2 className="font-display text-2xl font-bold">Comece agora</h2>
            <p className="text-muted-foreground text-sm">Crie sua conta gratuitamente e organize sua coleção hoje mesmo.</p>
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
              <Link to="/guia-tcg" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl surface-elevated border border-border/70 text-sm font-medium hover:bg-surface-elevated/80 transition-colors">
                <BookOpen className="h-4 w-4" /> Guia TCG
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Sobre;
