export type Role = "admin" | "user";

export interface AuthSession {
  token: string;
  role: Role;
  name: string;
  email?: string;
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

/** Mock login: emails containing "admin" become admins. */
export const mockLogin = (email: string): AuthSession => {
  const role: Role = email.toLowerCase().includes("admin") ? "admin" : "user";
  const session: AuthSession = {
    token: role === "admin" ? "mock-admin-token" : "mock-user-token",
    role,
    name: role === "admin" ? "Administrador" : "Treinador",
    email,
  };
  setSession(session);
  return session;
};
