import { Settings as SettingsIcon } from "lucide-react";

const AdminSettings = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Configurações</h1>
      <p className="text-sm text-muted-foreground mt-1">Ajustes gerais da plataforma</p>
    </div>

    <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 p-12 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-[hsl(28_85%_44%)]/15 border border-[hsl(28_85%_44%)]/40 items-center justify-center text-[hsl(28_85%_60%)] mb-4">
        <SettingsIcon className="h-6 w-6" />
      </div>
      <h2 className="font-display text-lg font-bold">Em breve</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Preferências globais, integrações e feature flags estarão disponíveis aqui.
      </p>
    </div>
  </div>
);

export default AdminSettings;
