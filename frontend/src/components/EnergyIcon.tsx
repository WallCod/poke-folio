interface EnergyIconProps {
  type: string;
  size?: number;
  className?: string;
}

const ENERGY_DEFS: Record<string, { bg: string; symbol: React.ReactNode }> = {
  Fire: {
    bg: "#FF6A00",
    symbol: (
      <g fill="white" fillOpacity="0.95">
        <ellipse cx="12" cy="17" rx="4.5" ry="5.5" />
        <ellipse cx="12" cy="12.5" rx="3" ry="5" />
        <ellipse cx="9.5" cy="16" rx="2.2" ry="3.5" />
        <ellipse cx="14.5" cy="16" rx="2.2" ry="3.5" />
        <ellipse cx="12" cy="9" rx="1.8" ry="3" />
      </g>
    ),
  },
  Water: {
    bg: "#1B87E6",
    symbol: (
      <path
        d="M12 4.5 C12 4.5, 5.5 11.5, 5.5 15.5 A6.5 6.5 0 0 0 18.5 15.5 C18.5 11.5, 12 4.5, 12 4.5Z"
        fill="white" fillOpacity="0.95"
      />
    ),
  },
  Grass: {
    bg: "#3DAD4C",
    symbol: (
      <g>
        <ellipse cx="12" cy="11.5" rx="6.5" ry="9" fill="white" fillOpacity="0.9" transform="rotate(-12 12 12)" />
        <line x1="12" y1="21" x2="12" y2="5" stroke="#3DAD4C" strokeWidth="1.4" />
        <line x1="8" y1="14" x2="12" y2="10" stroke="#3DAD4C" strokeWidth="0.8" />
        <line x1="16" y1="14" x2="12" y2="10" stroke="#3DAD4C" strokeWidth="0.8" />
      </g>
    ),
  },
  Lightning: {
    bg: "#DAA800",
    symbol: (
      <polygon
        points="14,3.5 7.5,13 12,13 10,20.5 17,10.5 12.5,10.5"
        fill="white" fillOpacity="0.95"
      />
    ),
  },
  Psychic: {
    bg: "#E8579A",
    symbol: (
      <g fill="white" fillOpacity="0.95">
        <circle cx="12" cy="12" r="4" />
        <ellipse cx="12" cy="5.5" rx="1.8" ry="3.2" />
        <ellipse cx="12" cy="18.5" rx="1.8" ry="3.2" />
        <ellipse cx="5.5" cy="12" rx="3.2" ry="1.8" />
        <ellipse cx="18.5" cy="12" rx="3.2" ry="1.8" />
      </g>
    ),
  },
  Fighting: {
    bg: "#C03028",
    symbol: (
      <g fill="white" fillOpacity="0.93">
        <circle cx="10" cy="12.5" r="4.5" />
        <circle cx="14.5" cy="10.5" r="4" />
        <ellipse cx="12" cy="17" rx="5" ry="2.5" />
      </g>
    ),
  },
  Darkness: {
    bg: "#4A4878",
    symbol: (
      <path
        d="M13 4.5 A7.5 7.5 0 1 0 13 19.5 A5.5 5.5 0 1 1 13 4.5Z"
        fill="white" fillOpacity="0.92"
      />
    ),
  },
  Metal: {
    bg: "#8BA6BB",
    symbol: (
      <g>
        <polygon
          points="12,3.5 18.5,7.5 18.5,16.5 12,20.5 5.5,16.5 5.5,7.5"
          fill="white" fillOpacity="0.15"
          stroke="white" strokeWidth="1.4" strokeOpacity="0.9"
        />
        <circle cx="12" cy="12" r="3.5" fill="white" fillOpacity="0.93" />
      </g>
    ),
  },
  Dragon: {
    bg: "#5060C0",
    symbol: (
      <g fill="white" fillOpacity="0.93">
        <polygon points="12,3.5 15.5,12 12,20.5 8.5,12" />
        <polygon points="3.5,12 12,8.5 20.5,12 12,15.5" fillOpacity="0.55" />
      </g>
    ),
  },
  Fairy: {
    bg: "#DA6FC8",
    symbol: (
      <polygon
        points="12,3.5 13.8,9 19.5,9 14.8,12.8 16.5,18.5 12,15 7.5,18.5 9.2,12.8 4.5,9 10.2,9"
        fill="white" fillOpacity="0.93"
      />
    ),
  },
  Colorless: {
    bg: "#A0A0B8",
    symbol: (
      <polygon
        points="12,4 14.2,9.8 20.5,10.5 16,15 17.5,21 12,18 6.5,21 8,15 3.5,10.5 9.8,9.8"
        fill="white" fillOpacity="0.9"
      />
    ),
  },
};

export function EnergyIcon({ type, size = 24, className = "" }: EnergyIconProps) {
  const def = ENERGY_DEFS[type] ?? ENERGY_DEFS.Colorless;
  const gradId = `eg-${type.toLowerCase().replace(/\s/g, "-")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-label={`${type} energy`}
      role="img"
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity="0.32" />
          <stop offset="60%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      {/* Círculo base */}
      <circle cx="12" cy="12" r="11.5" fill={def.bg} />
      {/* Gradiente de brilho */}
      <circle cx="12" cy="12" r="11.5" fill={`url(#${gradId})`} />
      {/* Borda sutil */}
      <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.7" />
      {/* Símbolo */}
      {def.symbol}
    </svg>
  );
}

export const ENERGY_TYPES_TCG = [
  { name: "Fogo",     type: "Fire",      color: "#FF6A00" },
  { name: "Água",     type: "Water",     color: "#1B87E6" },
  { name: "Grama",    type: "Grass",     color: "#3DAD4C" },
  { name: "Elétrico", type: "Lightning", color: "#DAA800" },
  { name: "Psíquico", type: "Psychic",   color: "#E8579A" },
  { name: "Lutador",  type: "Fighting",  color: "#C03028" },
  { name: "Sombrio",  type: "Darkness",  color: "#4A4878" },
  { name: "Metal",    type: "Metal",     color: "#8BA6BB" },
  { name: "Dragão",   type: "Dragon",    color: "#5060C0" },
  { name: "Fada",     type: "Fairy",     color: "#DA6FC8" },
  { name: "Incolor",  type: "Colorless", color: "#A0A0B8" },
];
