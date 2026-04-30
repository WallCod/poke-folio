// Sample data for admin area — visual only, replace with API.
export type AdminPlan = "Free" | "Treinador" | "Mestre";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: AdminPlan;
  cards: number;
  createdAt: string;
  avatar?: string;
}

const names = [
  "Ash Ketchum", "Misty Williams", "Brock Harrison", "Gary Oak", "May Maple",
  "Dawn Berlitz", "Serena Yvonne", "Iris Rouge", "Cilan Green", "N Harmonia",
  "Lillie Aether", "Hau Alola", "Leon Galar", "Hop Galar", "Marnie Spikemuth",
  "Bea Stowe", "Allister Stow", "Raihan Hammerlocke", "Nessa Hulbury", "Milo Turffield",
];

export const sampleUsers: AdminUser[] = names.map((n, i) => ({
  id: `u_${i + 1}`,
  name: n,
  email: n.toLowerCase().replace(/[^a-z]/g, ".") + "@pokefolio.app",
  plan: (["Free", "Treinador", "Mestre", "Free", "Treinador"] as AdminPlan[])[i % 5],
  cards: [12, 84, 240, 5, 156, 47, 320, 18, 92, 410, 33, 8, 220, 67, 145, 28, 11, 380, 76, 130][i],
  createdAt: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString(),
}));

export const planDistribution = [
  { name: "Free", value: 1240, color: "hsl(240 6% 55%)" },
  { name: "Treinador", value: 480, color: "hsl(211 73% 59%)" },
  { name: "Mestre", value: 165, color: "hsl(48 100% 50%)" },
];

export const newUsersPerDay = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  users: Math.round(20 + Math.sin(i / 3) * 12 + Math.random() * 18),
}));

export const adminPlans = [
  {
    id: "free",
    name: "Iniciante",
    label: "Free",
    price: 0,
    cardLimit: 50,
    priceHistoryDays: 7,
    features: {
      catalog: true,
      priceTracking: false,
      csvExport: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  {
    id: "treinador",
    name: "Treinador",
    label: "Treinador",
    price: 14.9,
    cardLimit: 1000,
    priceHistoryDays: 90,
    features: {
      catalog: true,
      priceTracking: true,
      csvExport: true,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  {
    id: "mestre",
    name: "Mestre Pokémon",
    label: "Mestre",
    price: 34.9,
    cardLimit: -1,
    priceHistoryDays: 365,
    features: {
      catalog: true,
      priceTracking: true,
      csvExport: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
];
