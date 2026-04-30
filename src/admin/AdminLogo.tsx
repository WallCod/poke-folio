import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  to?: string;
  className?: string;
}

export const AdminLogo = ({ to = "/admin/dashboard", className = "" }: Props) => {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 group ${className}`}>
      <div className="relative h-9 w-9 rounded-xl bg-[hsl(28_85%_44%)]/15 border border-[hsl(28_85%_44%)]/40 flex items-center justify-center shadow-[0_0_20px_-6px_hsl(28_85%_44%/0.6)]">
        <Shield className="h-5 w-5 text-[hsl(28_85%_55%)]" strokeWidth={2.4} />
      </div>
      <div className="leading-tight">
        <div className="font-display font-bold text-base tracking-tight">
          Pokéfolio
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[hsl(28_85%_55%)] font-semibold -mt-0.5">
          Admin
        </div>
      </div>
    </Link>
  );
};
