const TYPE_LINE = "linear-gradient(90deg, #FF6A00, #1B87E6, #3DAD4C, #DAA800, #E8579A, #C03028, #4A4878, #8BA6BB, #5060C0, #DA6FC8, #A0A0B8)";

export const PublicFooter = () => (
  <footer className="container py-5 border-t border-border/50 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 relative mt-auto">
    <div
      className="absolute top-0 left-0 right-0 h-px pointer-events-none"
      style={{ background: TYPE_LINE }}
    />
    <p>© {new Date().getFullYear()} Pokéfolio. Feito por colecionadores.</p>
    <p>Não afiliado a The Pokémon Company.</p>
  </footer>
);
