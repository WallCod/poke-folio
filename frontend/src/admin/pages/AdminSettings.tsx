import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { modal } from "@/store/useAppModal";
import { getSettings, saveSettings, type AppSettings } from "@/lib/storage";

const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 p-6 space-y-5">
    <div>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    </div>
    {children}
  </div>
);

const ToggleRow = ({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const AdminSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());

  const patch = (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveSettings(updated);
  };

  const patchNotif = (key: keyof AppSettings["notifications"], value: boolean) => {
    patch({ notifications: { ...settings.notifications, [key]: value } });
  };

  const patchLimit = (plan: keyof AppSettings["planLimits"], key: "cardLimit" | "historyDays", value: number) => {
    setSettings((prev) => ({
      ...prev,
      planLimits: {
        ...prev.planLimits,
        [plan]: { ...prev.planLimits[plan], [key]: value },
      },
    }));
  };

  const saveLimits = () => {
    saveSettings(settings);
    modal.success("Limites salvos", "Os limites dos planos foram atualizados.");
  };

  const saveAll = () => {
    saveSettings(settings);
    modal.success("Configurações salvas", "Todas as alterações foram aplicadas com sucesso.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Ajustes gerais da plataforma</p>
      </div>

      <Section title="Configurações gerais" description="Informações e comportamento da plataforma">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da plataforma</Label>
            <Input
              value={settings.platformName}
              onChange={(e) => patch({ platformName: e.target.value })}
              className="bg-card/60 max-w-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Email de suporte</Label>
            <Input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => patch({ supportEmail: e.target.value })}
              className="bg-card/60 max-w-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Moeda padrão</Label>
            <Select value={settings.currency} onValueChange={(v) => patch({ currency: v as "BRL" | "USD" })}>
              <SelectTrigger className="w-40 bg-card/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL — Real</SelectItem>
                <SelectItem value="USD">USD — Dólar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-2 border-t border-border/60">
            <ToggleRow
              label="Modo manutenção"
              description="Exibe banner de manutenção para todos os usuários do app"
              checked={settings.maintenanceMode}
              onCheckedChange={(v) => patch({ maintenanceMode: v })}
            />
          </div>
        </div>
      </Section>

      <Section title="Limites dos planos" description="Defina os limites de cada plano de assinatura">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="py-2 pr-4 font-medium">Plano</th>
                <th className="py-2 pr-4 font-medium">Limite de cartas</th>
                <th className="py-2 pr-4 font-medium">Histórico (dias)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {(["free", "treinador", "mestre"] as const).map((plan) => (
                <tr key={plan}>
                  <td className="py-3 pr-4 font-medium capitalize">{plan === "free" ? "Free" : plan === "treinador" ? "Treinador" : "Mestre"}</td>
                  <td className="py-3 pr-4">
                    <Input
                      type="number"
                      className="w-32 bg-card/60"
                      value={settings.planLimits[plan].cardLimit}
                      onChange={(e) => patchLimit(plan, "cardLimit", parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <Input
                      type="number"
                      className="w-32 bg-card/60"
                      value={settings.planLimits[plan].historyDays}
                      onChange={(e) => patchLimit(plan, "historyDays", parseInt(e.target.value) || 0)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          onClick={saveLimits}
          className="bg-[hsl(28_85%_44%)] hover:bg-[hsl(28_85%_38%)] text-white"
        >
          Salvar alterações
        </Button>
      </Section>

      <Section title="Notificações" description="Configure alertas automáticos para o administrador">
        <div className="space-y-5">
          <ToggleRow
            label="Notificar em novos cadastros"
            description="Envia email ao admin quando um novo usuário se cadastrar"
            checked={settings.notifications.emailOnNewUser}
            onCheckedChange={(v) => patchNotif("emailOnNewUser", v)}
          />
          <ToggleRow
            label="Notificar em pagamentos em atraso"
            description="Alerta o admin quando um pagamento estiver vencido"
            checked={settings.notifications.emailOnOverdue}
            onCheckedChange={(v) => patchNotif("emailOnOverdue", v)}
          />
          <ToggleRow
            label="Email de boas-vindas"
            description="Envia email de boas-vindas automaticamente para novos usuários"
            checked={settings.notifications.welcomeEmail}
            onCheckedChange={(v) => patchNotif("welcomeEmail", v)}
          />
        </div>
      </Section>

      <div className="flex justify-end pt-2">
        <Button
          onClick={saveAll}
          size="lg"
          className="bg-[hsl(28_85%_44%)] hover:bg-[hsl(28_85%_38%)] text-white px-8"
        >
          Salvar configurações
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
