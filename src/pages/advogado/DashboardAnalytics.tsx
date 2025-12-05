import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, FolderOpen, Calendar, DollarSign,
  Clock, CheckCircle, AlertTriangle, FileText, Scale, ArrowUp, ArrowDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";

interface Stats {
  totalProcessos: number;
  emAndamento: number;
  encerrados: number;
  suspensos: number;
  totalClientes: number;
  totalDocumentos: number;
  prazosProximos: number;
  prazosConcluidos: number;
  valorTotalCausas: number;
  compromissosHoje: number;
}

interface ProcessoByStatus {
  name: string;
  value: number;
  color: string;
}

interface ProcessoByTipo {
  tipo: string;
  quantidade: number;
}

interface ProcessoByMonth {
  mes: string;
  novos: number;
  encerrados: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function DashboardAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProcessos: 0,
    emAndamento: 0,
    encerrados: 0,
    suspensos: 0,
    totalClientes: 0,
    totalDocumentos: 0,
    prazosProximos: 0,
    prazosConcluidos: 0,
    valorTotalCausas: 0,
    compromissosHoje: 0,
  });
  const [processosByTipo, setProcessosByTipo] = useState<ProcessoByTipo[]>([]);
  const [processosByMonth, setProcessosByMonth] = useState<ProcessoByMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    const [processosRes, clientesRes, documentosRes, prazosRes, compromissosRes] = await Promise.all([
      supabase.from("processes").select("*").eq("advogado_id", user.id),
      supabase.from("lawyer_clients").select("id").eq("advogado_id", user.id),
      supabase.from("legal_documents").select("id").eq("advogado_id", user.id),
      supabase.from("process_deadlines").select("*").eq("advogado_id", user.id),
      supabase.from("legal_appointments").select("*").eq("advogado_id", user.id),
    ]);

    const processos = processosRes.data || [];
    const prazos = prazosRes.data || [];
    const compromissos = compromissosRes.data || [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Stats
    const emAndamento = processos.filter(p => p.status === "em_andamento").length;
    const encerrados = processos.filter(p => p.status === "encerrado").length;
    const suspensos = processos.filter(p => p.status === "suspenso").length;
    const valorTotal = processos.reduce((acc, p) => acc + (p.valor_causa || 0), 0);
    
    const prazosProximos = prazos.filter(p => {
      if (p.concluido) return false;
      const dataP = new Date(p.data_prazo);
      const diff = (dataP.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7 && diff >= 0;
    }).length;

    const compromissosHoje = compromissos.filter(c => {
      const dataC = new Date(c.data_inicio);
      return dataC.toDateString() === hoje.toDateString();
    }).length;

    setStats({
      totalProcessos: processos.length,
      emAndamento,
      encerrados,
      suspensos,
      totalClientes: clientesRes.data?.length || 0,
      totalDocumentos: documentosRes.data?.length || 0,
      prazosProximos,
      prazosConcluidos: prazos.filter(p => p.concluido).length,
      valorTotalCausas: valorTotal,
      compromissosHoje,
    });

    // Processos por tipo
    const tipoCount: Record<string, number> = {};
    processos.forEach(p => {
      tipoCount[p.tipo_acao] = (tipoCount[p.tipo_acao] || 0) + 1;
    });
    setProcessosByTipo(
      Object.entries(tipoCount)
        .map(([tipo, quantidade]) => ({ tipo, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 6)
    );

    // Processos por mês (últimos 6 meses)
    const monthData: Record<string, { novos: number; encerrados: number }> = {};
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${meses[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
      monthData[key] = { novos: 0, encerrados: 0 };
    }

    processos.forEach(p => {
      const d = new Date(p.created_at || "");
      const key = `${meses[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
      if (monthData[key]) monthData[key].novos++;
    });

    setProcessosByMonth(
      Object.entries(monthData).map(([mes, data]) => ({ mes, ...data }))
    );

    setLoading(false);
  };

  const processosByStatus = useMemo<ProcessoByStatus[]>(() => [
    { name: "Em Andamento", value: stats.emAndamento, color: "hsl(var(--primary))" },
    { name: "Encerrados", value: stats.encerrados, color: "hsl(var(--chart-2))" },
    { name: "Suspensos", value: stats.suspensos, color: "hsl(var(--chart-3))" },
  ].filter(s => s.value > 0), [stats]);

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary" />
          Dashboard Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do desempenho do escritório
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { icon: FolderOpen, label: "Processos", value: stats.totalProcessos, color: "bg-primary/10 text-primary" },
          { icon: Clock, label: "Em Andamento", value: stats.emAndamento, color: "bg-blue-100 text-blue-600" },
          { icon: CheckCircle, label: "Encerrados", value: stats.encerrados, color: "bg-green-100 text-green-600" },
          { icon: Users, label: "Clientes", value: stats.totalClientes, color: "bg-purple-100 text-purple-600" },
          { icon: AlertTriangle, label: "Prazos Próximos", value: stats.prazosProximos, color: "bg-orange-100 text-orange-600" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-elevated p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Valor Total */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card-elevated p-6 bg-gradient-to-r from-primary/5 to-primary/10"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Valor Total em Causas</p>
            <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(stats.valorTotalCausas)}</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-primary" />
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Processos por Mês */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Processos por Mês
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processosByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="novos" 
                  name="Novos" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status dos Processos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="card-elevated p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Status dos Processos
          </h3>
          <div className="h-64 flex items-center justify-center">
            {processosByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processosByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {processosByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">Sem dados</p>
            )}
          </div>
        </motion.div>

        {/* Processos por Tipo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-elevated p-6 lg:col-span-2"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Processos por Tipo de Ação
          </h3>
          <div className="h-64">
            {processosByTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processosByTipo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    type="category" 
                    dataKey="tipo" 
                    width={150} 
                    tick={{ fontSize: 11 }} 
                    stroke="hsl(var(--muted-foreground))" 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Cadastre processos para ver estatísticas
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.totalDocumentos}</p>
            <p className="text-sm text-muted-foreground">Documentos Gerados</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.prazosConcluidos}</p>
            <p className="text-sm text-muted-foreground">Prazos Cumpridos</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.compromissosHoje}</p>
            <p className="text-sm text-muted-foreground">Compromissos Hoje</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
