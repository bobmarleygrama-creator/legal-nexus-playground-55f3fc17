import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  nome: string;
  email: string;
  tipo: "cliente" | "advogado" | "admin";
  whatsapp?: string;
  oab_numero?: string;
  oab_status?: string;
  saldo_lcoin?: number;
  premium_ativo?: boolean;
  created_at?: string;
  cidade?: string;
  estado?: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (form: RegisterForm) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface RegisterForm {
  nome: string;
  email: string;
  senha: string;
  tipo: "cliente" | "advogado";
  whatsapp?: string;
  cidade?: string;
  estado?: string;
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail?: string, userMeta?: any) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    // Se o perfil não existe, criar automaticamente
    if (!data && userEmail) {
      const newProfile = {
        id: userId,
        nome: userMeta?.nome || userEmail.split('@')[0],
        email: userEmail,
        tipo: userMeta?.tipo || 'cliente',
        whatsapp: userMeta?.whatsapp || null,
        cidade: userMeta?.cidade || null,
        estado: userMeta?.estado || null,
        saldo_lcoin: 0,
        premium_ativo: false,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
        return null;
      }

      return createdProfile as Profile;
    }

    return data as Profile;
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    if (profileData) {
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(async () => {
            const profileData = await fetchProfile(
              currentSession.user.id,
              currentSession.user.email,
              currentSession.user.user_metadata
            );
            setProfile(profileData);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(
          currentSession.user.id,
          currentSession.user.email,
          currentSession.user.user_metadata
        ).then((profileData) => {
          setProfile(profileData);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, senha: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      return { ok: false, error: error.message === "Invalid login credentials" ? "Email ou senha inválidos" : error.message };
    }

    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const register = async (form: RegisterForm): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
      options: {
        data: {
          nome: form.nome,
          tipo: form.tipo,
          whatsapp: form.tipo === "cliente" ? form.whatsapp : undefined,
          cidade: form.cidade,
          estado: form.estado,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { ok: false, error: "Email já cadastrado" };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      return;
    }

    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        login,
        logout,
        register,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
