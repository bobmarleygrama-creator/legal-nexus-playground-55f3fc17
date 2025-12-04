import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, LogOut, Users, FileText, AlertCircle, CheckCircle, Globe, Crown, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Storage } from "@/utils/storage";
import { User, Caso } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  oab_numero?: string;
  oab_status?: string;
  premium_ativo?: boolean;
  created_at?: string;
}

const AdminDashboard = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [pendingLawyers, setPendingLawyers] = useState<User[]>([]);
  const [advogados, setAdvogados] = useState<Profile[]>([]);

  useEffect(() => {
    if (!user || !profile || profile.tipo !== "admin") {
      alert("Acesso negado. Você não tem permissão para acessar esta página.");
      navigate("/login");
      return;
    }
    loadData();
    loadAdvogados();
  }, [user, profile, navigate]);

  const loadData = () => {
    const allUsers = Storage.getUsers();
    const allCasos = Storage.getCasos();
    
    setUsers(allUsers);
    setCasos(allCasos);
    setPendingLawyers(allUsers.filter(u => u.tipo === "advogado" && u.oab_status === "pendente"));
  };

  const loadAdvogados = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("tipo", "advogado")
      .order("nome");
    
    setAdvogados((data as Profile[]) || []);
  };

  const handleAproveLawyer = (lawyerId: string) => {
    if (window.confirm("Confirma que verificou a OAB deste advogado?")) {
      const lawyer = Storage.getUserById(lawyerId);
      if (lawyer) {
        Storage.saveUser({ ...lawyer, oab_status: "verificado" });
        loadData();
        toast({
          title: "Advogado aprovado!",
          description: "A verificação foi concluída com sucesso.",
        });
      }
    }
  };

  const handleTogglePremium = async (advogadoId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ premium_ativo: !currentStatus })
      .eq("id", advogadoId);

    if (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    } else {
      toast({ 
        title: !currentStatus ? "Premium Ativado!" : "Premium Desativado",
        description: `Status atualizado com sucesso.`,
      });
      loadAdvogados();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // Stats
  const totalUsers = users.length;
  const totalCasos = casos.length;
  const novasDemandas = casos.filter(c => c.status === "novo").length;
  const oabPendentes = pendingLawyers.length;
  const premiumAtivos = advogados.filter(a => a.premium_ativo).length;

  // User origins (simulated)
  const origins = [
    { name: "Orgânico", count: Math.floor(totalUsers * 0.5), color: "bg-green-500" },
    { name: "Facebook", count: Math.floor(totalUsers * 0.3), color: "bg-blue-500" },
    { name: "Google", count: Math.floor(totalUsers * 0.15), color: "bg-red-500" },
    { name: "Indicação", count: Math.floor(totalUsers * 0.05) || 1, color: "bg-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-foreground text-background">
      {/* Header */}
      <header className="bg-foreground border-b border-background/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-destructive-foreground" />
            </div>
            <span className="font-heading font-bold">SJ ADMIN</span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="border-background/30 text-background hover:bg-background/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-heading font-bold mb-8">Visão Geral do Sistema</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background/5 rounded-xl p-4 border border-background/10"
          >
            <Users className="w-8 h-8 text-background/50 mb-2" />
            <p className="text-3xl font-bold">{totalUsers}</p>
            <p className="text-sm text-background/60">Total Usuários</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary/20 rounded-xl p-4 border border-primary/30"
          >
            <FileText className="w-8 h-8 text-primary mb-2" />
            <p className="text-3xl font-bold">{totalCasos}</p>
            <p className="text-sm text-background/60">Total Casos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-500/20 rounded-xl p-4 border border-green-500/30"
          >
            <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-3xl font-bold">{novasDemandas}</p>
            <p className="text-sm text-background/60">Novas Demandas</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-orange-500/20 rounded-xl p-4 border border-orange-500/30"
          >
            <AlertCircle className="w-8 h-8 text-orange-400 mb-2" />
            <p className="text-3xl font-bold">{oabPendentes}</p>
            <p className="text-sm text-background/60">OABs Pendentes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-amber-500/20 rounded-xl p-4 border border-amber-500/30"
          >
            <Crown className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-3xl font-bold">{premiumAtivos}</p>
            <p className="text-sm text-background/60">Premium Ativos</p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Pending Lawyers */}
          <div className="md:col-span-1">
            <div className="bg-background/5 rounded-xl border border-background/10 overflow-hidden">
              <div className="p-4 border-b border-background/10 flex items-center justify-between">
                <h2 className="font-semibold">OABs Pendentes</h2>
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                  {oabPendentes}
                </span>
              </div>

              {pendingLawyers.length === 0 ? (
                <div className="p-8 text-center text-background/50">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum pendente.</p>
                </div>
              ) : (
                <div className="divide-y divide-background/10 max-h-64 overflow-y-auto">
                  {pendingLawyers.map((lawyer) => (
                    <div key={lawyer.id} className="p-4">
                      <p className="font-medium text-sm">{lawyer.nome}</p>
                      <p className="text-xs text-background/50">{lawyer.oab_numero}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-foreground text-xs"
                        onClick={() => handleAproveLawyer(lawyer.id)}
                      >
                        ✔ Aprovar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Premium Control */}
          <div className="md:col-span-2">
            <div className="bg-background/5 rounded-xl border border-background/10 overflow-hidden">
              <div className="p-4 border-b border-background/10 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Controle Premium (R$ 79,90/mês)
                </h2>
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                  {premiumAtivos} ativos
                </span>
              </div>

              {advogados.length === 0 ? (
                <div className="p-8 text-center text-background/50">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum advogado cadastrado.</p>
                </div>
              ) : (
                <div className="divide-y divide-background/10 max-h-80 overflow-y-auto">
                  {advogados.map((adv) => (
                    <div key={adv.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{adv.nome}</p>
                        <p className="text-sm text-background/50">{adv.email}</p>
                        {adv.oab_numero && (
                          <p className="text-xs text-background/40">OAB: {adv.oab_numero}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleTogglePremium(adv.id, adv.premium_ativo || false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          adv.premium_ativo 
                            ? "bg-amber-500/20 text-amber-400" 
                            : "bg-background/10 text-background/50"
                        }`}
                      >
                        {adv.premium_ativo ? (
                          <>
                            <ToggleRight className="w-6 h-6" />
                            <span className="text-sm font-medium">Ativo</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-6 h-6" />
                            <span className="text-sm">Inativo</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Origins */}
        <div className="mt-8">
          <div className="bg-background/5 rounded-xl border border-background/10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-background/50" />
              <h2 className="font-semibold">Origem dos Usuários</h2>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {origins.map((origin) => (
                <div key={origin.name} className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${origin.color}`} />
                  <span className="flex-1 text-sm">{origin.name}</span>
                  <span className="font-bold">{origin.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
