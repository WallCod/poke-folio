export type PlanId = "free" | "treinador" | "mestre";
export type PlanStatus = "active" | "overdue" | "suspended";
export type PaymentStatus = "paid" | "pending" | "overdue" | "cancelled";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  plan: PlanId;
  planStatus: PlanStatus;
  planExpiry: string | null;
  cards: number;
  joinedAt: string;
}

export interface StoredPayment {
  id: string;
  userId: string;
  plan: PlanId;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
}

export interface AppSettings {
  platformName: string;
  supportEmail: string;
  currency: "BRL" | "USD";
  maintenanceMode: boolean;
  planLimits: {
    free: { cardLimit: number; historyDays: number };
    treinador: { cardLimit: number; historyDays: number };
    mestre: { cardLimit: number; historyDays: number };
  };
  notifications: {
    emailOnNewUser: boolean;
    emailOnOverdue: boolean;
    welcomeEmail: boolean;
  };
}

const KEYS = {
  users: "pokefolio_users",
  payments: "pokefolio_payments",
  settings: "pokefolio_settings",
} as const;

const SEED_USERS: StoredUser[] = [
  { id: "1", name: "Ash Ketchum", email: "ash@email.com", role: "user", plan: "mestre", planStatus: "active", planExpiry: "2025-12-01", cards: 847, joinedAt: "2024-01-15" },
  { id: "2", name: "Misty Waterflower", email: "misty@email.com", role: "user", plan: "treinador", planStatus: "active", planExpiry: "2025-08-15", cards: 312, joinedAt: "2024-03-20" },
  { id: "3", name: "Brock Harrison", email: "brock@email.com", role: "user", plan: "free", planStatus: "active", planExpiry: null, cards: 67, joinedAt: "2024-05-10" },
  { id: "4", name: "Gary Oak", email: "gary@email.com", role: "user", plan: "mestre", planStatus: "overdue", planExpiry: "2025-05-01", cards: 1203, joinedAt: "2023-11-08" },
  { id: "5", name: "Jesse Team Rocket", email: "jesse@email.com", role: "user", plan: "treinador", planStatus: "suspended", planExpiry: "2025-04-01", cards: 0, joinedAt: "2024-07-22" },
];

const PLAN_PRICES: Record<PlanId, number> = { free: 0, treinador: 14.9, mestre: 34.9 };

function seedPayments(users: StoredUser[]): StoredPayment[] {
  const payments: StoredPayment[] = [];
  users.forEach((u) => {
    if (u.plan === "free") return;
    const statusMap: Record<PlanStatus, PaymentStatus> = {
      active: "paid",
      overdue: "overdue",
      suspended: "cancelled",
    };
    payments.push({
      id: `pay_${u.id}`,
      userId: u.id,
      plan: u.plan,
      amount: PLAN_PRICES[u.plan],
      status: statusMap[u.planStatus],
      dueDate: u.planExpiry ?? new Date().toISOString().slice(0, 10),
    });
  });
  return payments;
}

const DEFAULT_SETTINGS: AppSettings = {
  platformName: "Pokéfolio",
  supportEmail: "suporte@pokefolio.app",
  currency: "BRL",
  maintenanceMode: false,
  planLimits: {
    free: { cardLimit: 100, historyDays: 7 },
    treinador: { cardLimit: 1000, historyDays: 90 },
    mestre: { cardLimit: -1, historyDays: 365 },
  },
  notifications: {
    emailOnNewUser: true,
    emailOnOverdue: true,
    welcomeEmail: true,
  },
};

function get<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initStorage(): void {
  if (!get(KEYS.users)) {
    set(KEYS.users, SEED_USERS);
  }
  if (!get(KEYS.payments)) {
    const users = get<StoredUser[]>(KEYS.users) ?? SEED_USERS;
    set(KEYS.payments, seedPayments(users));
  }
  if (!get(KEYS.settings)) {
    set(KEYS.settings, DEFAULT_SETTINGS);
  }
}

// Users
export function getUsers(): StoredUser[] {
  return get<StoredUser[]>(KEYS.users) ?? [];
}
export function saveUsers(users: StoredUser[]): void {
  set(KEYS.users, users);
}
export function updateUser(id: string, patch: Partial<StoredUser>): void {
  const users = getUsers().map((u) => (u.id === id ? { ...u, ...patch } : u));
  saveUsers(users);
}
export function deleteUser(id: string): void {
  saveUsers(getUsers().filter((u) => u.id !== id));
}

// Payments
export function getPayments(): StoredPayment[] {
  return get<StoredPayment[]>(KEYS.payments) ?? [];
}
export function savePayments(payments: StoredPayment[]): void {
  set(KEYS.payments, payments);
}
export function updatePayment(id: string, patch: Partial<StoredPayment>): void {
  const payments = getPayments().map((p) => (p.id === id ? { ...p, ...patch } : p));
  savePayments(payments);
}

// Settings
export function getSettings(): AppSettings {
  return get<AppSettings>(KEYS.settings) ?? DEFAULT_SETTINGS;
}
export function saveSettings(s: AppSettings): void {
  set(KEYS.settings, s);
}

export { PLAN_PRICES };
