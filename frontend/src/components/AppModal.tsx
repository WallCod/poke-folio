import { useAppModal } from "@/store/useAppModal";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const CONFIG = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-950/60 border-emerald-500/30",
    btnClass: "bg-gradient-gold text-background hover:opacity-90",
    accentBar: "bg-emerald-500",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-400",
    iconBg: "bg-red-950/60 border-red-500/30",
    btnClass: "bg-red-600 text-white hover:bg-red-500",
    accentBar: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-950/60 border-amber-500/30",
    btnClass: "bg-amber-500 text-background hover:bg-amber-400",
    accentBar: "bg-amber-500",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-950/60 border-blue-500/30",
    btnClass: "bg-blue-600 text-white hover:bg-blue-500",
    accentBar: "bg-blue-500",
  },
};

export const AppModal = () => {
  const { open, type, title, message, actionLabel, onAction, hide } = useAppModal();

  if (!open) return null;

  const c = CONFIG[type];
  const Icon = c.icon;

  const handleAction = () => {
    onAction?.();
    hide();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/75 backdrop-blur-md"
        onClick={hide}
      />

      {/* Card do modal */}
      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Barra de acento no topo */}
        <div className={`absolute top-0 left-6 right-6 h-0.5 rounded-full ${c.accentBar}`} />

        <div className="relative bg-card border border-border/70 rounded-2xl shadow-2xl p-7 flex flex-col items-center text-center gap-5">
          {/* Botão fechar */}
          <button
            onClick={hide}
            className="absolute top-4 right-4 h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Ícone */}
          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${c.iconBg}`}>
            <Icon className={`h-8 w-8 ${c.iconColor}`} />
          </div>

          {/* Texto */}
          <div className="space-y-1.5 px-1">
            <h3 className="font-display text-lg font-bold leading-snug">{title}</h3>
            {message && (
              <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
            )}
          </div>

          {/* Botões */}
          <div className="w-full flex flex-col gap-2 pt-1">
            {actionLabel && onAction && (
              <button
                onClick={handleAction}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${c.btnClass}`}
              >
                {actionLabel}
              </button>
            )}
            <button
              onClick={hide}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                actionLabel
                  ? "bg-surface-elevated border border-border/60 text-foreground hover:bg-surface-elevated/80"
                  : c.btnClass
              }`}
            >
              {actionLabel ? "Fechar" : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
