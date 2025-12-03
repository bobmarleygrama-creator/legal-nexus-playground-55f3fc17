import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, LogOut, Users, FileText, AlertCircle, CheckCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Storage } from "@/utils/storage";
import { User, Caso } from "@/types";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [pendingLawyers, setPendingLawyers] = useState<User[]>([]);

  useEffect(() => {
    if (!user || user.tipo !== "admin") {
      alert("Acesso negado. Você não tem permissão para acessar esta página.");
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = () => {
    const allUsers = Storage.getUsers();
    const allCasos = Storage.getCasos();
    
    setUsers(allUsers);
    setCasos(allCasos);
    setPendingLawyers(allUsers.filter(u => u.tipo === "advogado" && u.oab_status === "pendente"));
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

  const handleLogout = () => {
    logout();
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Pending Lawyers */}
          <div className="md:col-span-2">
            <div className="bg-background/5 rounded-xl border border-background/10 overflow-hidden">
              <div className="p-4 border-b border-background/10 flex items-center justify-between">
                <h2 className="font-semibold">Advogados Aguardando Verificação</h2>
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                  {oabPendentes} pendentes
                </span>
              </div>

              {pendingLawyers.length === 0 ? (
                <div className="p-8 text-center text-background/50">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum advogado pendente de aprovação.</p>
                </div>
              ) : (
                <div className="divide-y divide-background/10">
                  {pendingLawyers.map((lawyer) => (
                    <div key={lawyer.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{lawyer.nome}</p>
                        <p className="text-sm text-background/50">{lawyer.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-2 py-1 bg-background/10 rounded text-xs">
                          OAB {lawyer.oab_numero}/{lawyer.oab_estado}
                        </span>
                        <span className="text-xs text-background/50">
                          {formatDate(lawyer.criado_em)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-400 hover:bg-green-500 hover:text-foreground"
                          onClick={() => handleAproveLawyer(lawyer.id)}
                        >
                          ✔ Aprovar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Origins */}
          <div>
            <div className="bg-background/5 rounded-xl border border-background/10 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-background/50" />
                <h2 className="font-semibold">Origem dos Usuários</h2>
              </div>

              <div className="space-y-4">
                {origins.map((origin) => (
                  <div key={origin.name} className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${origin.color}`} />
                    <span className="flex-1 text-sm">{origin.name}</span>
                    <span className="font-bold">{origin.count}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-background/40 mt-4 text-center">
                Monitoramento em tempo real
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
