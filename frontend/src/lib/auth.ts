export type Role = "admin" | "user";

export interface AuthSession {
  token: string;
  refreshToken?: string;
  role: Role;
  name: string;
  email?: string;
  plan?: string;
  planStatus?: string;
}

const KEY = "pokefolio.session";

export const getSession = (): AuthSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const setSession = (s: AuthSession) => {
  localStorage.setItem(KEY, JSON.stringify(s));
};

export const clearSession = () => {
  localStorage.removeItem(KEY);
};

export const isAdmin = () => getSession()?.role === "admin";

export const setSessionFromApi = (data: {
  token: string;
  refreshToken: string;
  user: { name: string; email: string; role: Role; plan: string; planStatus: string };
}): AuthSession => {
  const session: AuthSession = {
    token: data.token,
    refreshToken: data.refreshToken,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    plan: data.user.plan,
    planStatus: data.user.planStatus,
  };
  setSession(session);
  return session;
};

// Mantido para fallback em dev enquanto o backend não estiver configurado
export const mockLogin = (email: string): AuthSession => {
  const role: Role = email.toLowerCase().includes("admin") ? "admin" : "user";
  const session: AuthSession = {
    token: role === "admin" ? "mock-admin-token" : "mock-user-token",
    role,
    name: role === "admin" ? "Administrador" : "Treinador",
    email,
    plan: "free",
    planStatus: "active",
  };
  setSession(session);
  return session;
};
