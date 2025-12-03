import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, RegisterForm } from "@/types";
import { Storage } from "@/utils/storage";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  register: (form: RegisterForm) => Promise<{ ok: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = Storage.getCurrentUser();
    const savedToken = Storage.getToken();
    if (savedUser && savedToken) {
      setUser(savedUser);
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string): Promise<{ ok: boolean; error?: string }> => {
    const existingUser = Storage.getUserByEmail(email);
    
    if (!existingUser) {
      return { ok: false, error: "Email ou senha inválidos" };
    }

    if (existingUser.senha !== senha) {
      return { ok: false, error: "Email ou senha inválidos" };
    }

    const newToken = Storage.generateToken();
    Storage.setCurrentUser(existingUser, newToken);
    setUser(existingUser);
    setToken(newToken);

    return { ok: true };
  };

  const logout = () => {
    Storage.clearSession();
    setUser(null);
    setToken(null);
  };

  const register = async (form: RegisterForm): Promise<{ ok: boolean; error?: string }> => {
    const existingUser = Storage.getUserByEmail(form.email);
    
    if (existingUser) {
      return { ok: false, error: "Email já cadastrado" };
    }

    const newUser: User = {
      id: Storage.generateId(),
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      tipo: form.tipo,
      criado_em: new Date().toISOString(),
      ...(form.tipo === "cliente" && {
        whatsapp: form.whatsapp,
      }),
      ...(form.tipo === "advogado" && {
        oab_status: "pendente" as const,
        saldo_lxc: 100,
      }),
    };

    Storage.saveUser(newUser);
    return { ok: true };
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    Storage.saveUser(updatedUser);
    Storage.setCurrentUser(updatedUser, token || "");
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
