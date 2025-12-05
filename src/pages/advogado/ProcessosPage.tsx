import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FolderOpen, Plus, Search, Calendar, AlertTriangle,
  Edit, Trash2, Clock, CheckCircle, FileText, Download, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Processo {
  id: string;
  numero_processo?: string;
  tipo_acao: string;
  comarca?: string;
  vara?: string;
  estado?: string;
  parte_contraria?: string;
  valor_causa?: number;
  status?: string;
  descricao?: string;
  cliente_id?: string;
  created_at?: string;
}

interface Prazo {
  id: string;
  processo_id: string;
  titulo: string;
  descricao?: string;
  data_prazo: string;
  concluido?: boolean;
  alerta_enviado?: boolean;
}

interface Cliente {
  id: string;
  nome: string;
}

interface TimelineEvent {
  id: string;
  tipo: "criacao" | "prazo" | "status" | "documento";
  data: string;
  titulo: string;
  descricao?: string;
}

const tiposAcao = [
  "Ação Trabalhista",
  "Reclamação Trabalhista",
  "Ação de Alimentos",
  "Ação de Divórcio",
  "Ação de Guarda",
  "Ação de Indenização",
  "Ação de Cobrança",
  "Execução de Título",
  "Mandado de Segurança",
  "Habeas Corpus",
  "Ação Penal",
  "Aposentadoria",
  "Benefício Previdenciário",
  "Outros",
];

const statusProcesso = [
  { value: "em_andamento", label: "Em Andamento", color: "bg-blue-100 text-blue-700" },
  { value: "aguardando", label: "Aguardando", color: "bg-yellow-100 text-yellow-700" },
  { value: "suspenso", label: "Suspenso", color: "bg-orange-100 text-orange-700" },
  { value: "encerrado", label: "Encerrado", color: "bg-green-100 text-green-700" },
  { value: "arquivado", label: "Arquivado", color: "bg-gray-100 text-gray-700" },
];

// Função para importar dados pelo CNJ (simulação - em produção conectaria a API do tribunal)
const parseCNJ = (cnj: string) => {
  // Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
  const match = cnj.match(/^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  
  const [, sequencial, digito, ano, justica, tribunal, origem] = match;
  
  const justicas: Record<string, string> = {
    "1": "STF", "2": "CNJ", "3": "STJ", "4": "Justiça Federal",
    "5": "Justiça do Trabalho", "6": "Justiça Eleitoral",
    "7": "Justiça Militar da União", "8": "Justiça Estadual", "9": "Justiça Militar Estadual"
  };

  const estados: Record<string, string> = {
    "01": "AC", "02": "AL", "03": "AP", "04": "AM", "05": "BA", "06": "CE",
    "07": "DF", "08": "ES", "09": "GO", "10": "MA", "11": "MT", "12": "MS",
    "13": "MG", "14": "PA", "15": "PB", "16": "PR", "17": "PE", "18": "PI",
    "19": "RJ", "20": "RN", "21": "RS", "22": "RO", "23": "RR", "24": "SC",
    "25": "SE", "26": "SP", "27": "TO"
  };

  return {
    numero_processo: cnj,
    justica: justicas[justica] || "Desconhecido",
    estado: estados[tribunal] || tribunal,
    vara: `${parseInt(origem)}ª Vara`,
    ano
  };
};

export default function ProcessosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [showProcessoModal, setShowProcessoModal] = useState(false);
  const [showPrazoModal, setShowPrazoModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [editingProcesso, setEditingProcesso] = useState<Processo | null>(null);
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);
  const [selectedProcessoTimeline, setSelectedProcessoTimeline] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [importingCNJ, setImportingCNJ] = useState(false);
  const [cnjInput, setCnjInput] = useState("");

  const [processoForm, setProcessoForm] = useState<Partial<Processo>>({
    numero_processo: "",
    tipo_acao: "",
    comarca: "",
    vara: "",
    estado: "",
    parte_contraria: "",
    valor_causa: 0,
    status: "em_andamento",
    descricao: "",
    cliente_id: "",
  });

  const [prazoForm, setPrazoForm] = useState<Partial<Prazo>>({
    titulo: "",
    descricao: "",
    data_prazo: "",
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [processosRes, prazosRes, clientesRes] = await Promise.all([
      supabase
        .from("processes")
        .select("*")
        .eq("advogado_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("process_deadlines")
        .select("*")
        .eq("advogado_id", user.id)
        .order("data_prazo", { ascending: true }),
      supabase
        .from("lawyer_clients")
        .select("id, nome")
        .eq("advogado_id", user.id),
    ]);

    setProcessos(processosRes.data || []);
    setPrazos(prazosRes.data || []);
    setClientes(clientesRes.data || []);
    setLoading(false);
  };

  const handleSubmitProcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!processoForm.tipo_acao) {
      toast({ title: "Tipo de ação é obrigatório", variant: "destructive" });
      return;
    }

    if (editingProcesso) {
      const { error } = await supabase
        .from("processes")
        .update({ ...processoForm, updated_at: new Date().toISOString() })
        .eq("id", editingProcesso.id);

      if (error) {
        toast({ title: "Erro ao atualizar processo", variant: "destructive" });
      } else {
        toast({ title: "Processo atualizado!" });
      }
    } else {
      const { error } = await supabase
        .from("processes")
        .insert([{ ...processoForm, advogado_id: user.id }] as any);

      if (error) {
        toast({ title: "Erro ao cadastrar processo", variant: "destructive" });
      } else {
        toast({ title: "Processo cadastrado!" });
      }
    }

    setShowProcessoModal(false);
    setEditingProcesso(null);
    resetProcessoForm();
    loadData();
  };

  const handleSubmitPrazo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProcessoId) return;

    if (!prazoForm.titulo || !prazoForm.data_prazo) {
      toast({ title: "Título e data são obrigatórios", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("process_deadlines")
      .insert([{
        ...prazoForm,
        processo_id: selectedProcessoId,
        advogado_id: user.id,
      }] as any);

    if (error) {
      toast({ title: "Erro ao cadastrar prazo", variant: "destructive" });
    } else {
      toast({ title: "Prazo cadastrado!" });
    }

    setShowPrazoModal(false);
    resetPrazoForm();
    loadData();
  };

  const handleDeleteProcesso = async (id: string) => {
    if (!window.confirm("Excluir este processo?")) return;

    const { error } = await supabase.from("processes").delete().eq("id", id);

    if (!error) {
      toast({ title: "Processo excluído!" });
      loadData();
    }
  };

  const handleTogglePrazo = async (prazo: Prazo) => {
    const { error } = await supabase
      .from("process_deadlines")
      .update({ concluido: !prazo.concluido })
      .eq("id", prazo.id);

    if (!error) loadData();
  };

  const resetProcessoForm = () => {
    setProcessoForm({
      numero_processo: "",
      tipo_acao: "",
      comarca: "",
      vara: "",
      estado: "",
      parte_contraria: "",
      valor_causa: 0,
      status: "em_andamento",
      descricao: "",
      cliente_id: "",
    });
  };

  const resetPrazoForm = () => {
    setPrazoForm({ titulo: "", descricao: "", data_prazo: "" });
  };

  const filteredProcessos = processos.filter(p =>
    p.numero_processo?.toLowerCase().includes(search.toLowerCase()) ||
    p.tipo_acao.toLowerCase().includes(search.toLowerCase()) ||
    p.parte_contraria?.toLowerCase().includes(search.toLowerCase())
  );

  const prazosProximos = prazos.filter(p => {
    if (p.concluido) return false;
    const dataP = new Date(p.data_prazo);
    const hoje = new Date();
    const diff = (dataP.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff >= 0;
  });

  const getStatusBadge = (status?: string) => {
    const s = statusProcesso.find(sp => sp.value === status);
    return s || statusProcesso[0];
  };

  const handleImportCNJ = () => {
    const parsed = parseCNJ(cnjInput.trim());
    if (!parsed) {
      toast({ title: "Número CNJ inválido", description: "Use o formato: 0000000-00.0000.0.00.0000", variant: "destructive" });
      return;
    }
    
    setProcessoForm(prev => ({
      ...prev,
      numero_processo: parsed.numero_processo,
      estado: parsed.estado,
      vara: parsed.vara,
      tipo_acao: parsed.justica === "Justiça do Trabalho" ? "Ação Trabalhista" : prev.tipo_acao,
    }));
    
    toast({ title: "Dados importados!", description: `Processo ${parsed.justica} - ${parsed.estado}` });
    setImportingCNJ(false);
    setCnjInput("");
  };

  const getTimelineEvents = (processo: Processo): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    // Criação
    if (processo.created_at) {
      events.push({
        id: "criacao",
        tipo: "criacao",
        data: processo.created_at,
        titulo: "Processo cadastrado",
        descricao: `${processo.tipo_acao} registrado no sistema`
      });
    }
    
    // Prazos
    const processPrazos = prazos.filter(p => p.processo_id === processo.id);
    processPrazos.forEach(p => {
      events.push({
        id: p.id,
        tipo: "prazo",
        data: p.data_prazo,
        titulo: p.titulo,
        descricao: p.concluido ? "Prazo cumprido" : "Prazo pendente"
      });
    });
    
    return events.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-primary" />
            Gestão de Processos
          </h1>
          <p className="text-muted-foreground mt-1">
            Controle seus processos e prazos
          </p>
        </div>

        <div className="flex gap-2">
          {/* Import CNJ Button */}
          <Dialog open={importingCNJ} onOpenChange={setImportingCNJ}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Importar CNJ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar pelo Número CNJ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Número do Processo (CNJ)</Label>
                  <Input
                    value={cnjInput}
                    onChange={(e) => setCnjInput(e.target.value)}
                    placeholder="0000000-00.0000.0.00.0000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setImportingCNJ(false)}>Cancelar</Button>
                  <Button onClick={handleImportCNJ}>Importar e Preencher</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showProcessoModal} onOpenChange={(open) => {
            setShowProcessoModal(open);
            if (!open) {
              setEditingProcesso(null);
              resetProcessoForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProcesso ? "Editar Processo" : "Cadastrar Novo Processo"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitProcesso} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número do Processo</Label>
                  <Input
                    value={processoForm.numero_processo}
                    onChange={(e) => setProcessoForm({ ...processoForm, numero_processo: e.target.value })}
                    placeholder="0000000-00.0000.0.00.0000"
                  />
                </div>

                <div>
                  <Label>Tipo de Ação *</Label>
                  <Select
                    value={processoForm.tipo_acao}
                    onValueChange={(v) => setProcessoForm({ ...processoForm, tipo_acao: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposAcao.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cliente</Label>
                  <Select
                    value={processoForm.cliente_id}
                    onValueChange={(v) => setProcessoForm({ ...processoForm, cliente_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Parte Contrária</Label>
                  <Input
                    value={processoForm.parte_contraria}
                    onChange={(e) => setProcessoForm({ ...processoForm, parte_contraria: e.target.value })}
                    placeholder="Nome da parte contrária"
                  />
                </div>

                <div>
                  <Label>Comarca</Label>
                  <Input
                    value={processoForm.comarca}
                    onChange={(e) => setProcessoForm({ ...processoForm, comarca: e.target.value })}
                    placeholder="Comarca"
                  />
                </div>

                <div>
                  <Label>Vara</Label>
                  <Input
                    value={processoForm.vara}
                    onChange={(e) => setProcessoForm({ ...processoForm, vara: e.target.value })}
                    placeholder="Ex: 1ª Vara do Trabalho"
                  />
                </div>

                <div>
                  <Label>Estado</Label>
                  <Input
                    value={processoForm.estado}
                    onChange={(e) => setProcessoForm({ ...processoForm, estado: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label>Valor da Causa</Label>
                  <Input
                    type="number"
                    value={processoForm.valor_causa}
                    onChange={(e) => setProcessoForm({ ...processoForm, valor_causa: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={processoForm.status}
                    onValueChange={(v) => setProcessoForm({ ...processoForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusProcesso.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={processoForm.descricao}
                    onChange={(e) => setProcessoForm({ ...processoForm, descricao: e.target.value })}
                    placeholder="Detalhes do processo..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowProcessoModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProcesso ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Alerts */}
      {prazosProximos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-destructive font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            Prazos Próximos (7 dias)
          </div>
          <div className="space-y-2">
            {prazosProximos.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.titulo}</span>
                <span className="text-muted-foreground">
                  {new Date(p.data_prazo).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{processos.length}</p>
            <p className="text-sm text-muted-foreground">Total Processos</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {processos.filter(p => p.status === "em_andamento").length}
            </p>
            <p className="text-sm text-muted-foreground">Em Andamento</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{prazos.filter(p => !p.concluido).length}</p>
            <p className="text-sm text-muted-foreground">Prazos Pendentes</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {processos.filter(p => p.status === "encerrado").length}
            </p>
            <p className="text-sm text-muted-foreground">Encerrados</p>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar processo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Process List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : filteredProcessos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search ? "Nenhum processo encontrado" : "Nenhum processo cadastrado"}
          </div>
        ) : (
          filteredProcessos.map((processo) => {
            const processPrazos = prazos.filter(p => p.processo_id === processo.id);
            const statusBadge = getStatusBadge(processo.status);
            
            return (
              <motion.div
                key={processo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elevated p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {processo.numero_processo || "Sem número"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{processo.tipo_acao}</h3>
                    {processo.parte_contraria && (
                      <p className="text-muted-foreground">vs. {processo.parte_contraria}</p>
                    )}
                    {(processo.comarca || processo.vara) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {processo.vara} - {processo.comarca}/{processo.estado}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProcessoTimeline(processo);
                        setShowTimelineModal(true);
                      }}
                    >
                      <History className="w-4 h-4 mr-1" />
                      Timeline
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProcessoId(processo.id);
                        setShowPrazoModal(true);
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Prazo
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingProcesso(processo);
                        setProcessoForm(processo);
                        setShowProcessoModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteProcesso(processo.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Prazos do processo */}
                {processPrazos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-2">Prazos:</p>
                    <div className="space-y-2">
                      {processPrazos.map(prazo => (
                        <div
                          key={prazo.id}
                          className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleTogglePrazo(prazo)}>
                              {prazo.concluido ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <span className={prazo.concluido ? "line-through text-muted-foreground" : ""}>
                              {prazo.titulo}
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            {new Date(prazo.data_prazo).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal Prazo */}
      <Dialog open={showPrazoModal} onOpenChange={setShowPrazoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Prazo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPrazo} className="space-y-4 mt-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={prazoForm.titulo}
                onChange={(e) => setPrazoForm({ ...prazoForm, titulo: e.target.value })}
                placeholder="Ex: Prazo para contestação"
              />
            </div>
            <div>
              <Label>Data do Prazo *</Label>
              <Input
                type="date"
                value={prazoForm.data_prazo}
                onChange={(e) => setPrazoForm({ ...prazoForm, data_prazo: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={prazoForm.descricao}
                onChange={(e) => setPrazoForm({ ...prazoForm, descricao: e.target.value })}
                placeholder="Observações..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPrazoModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Prazo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Timeline */}
      <Dialog open={showTimelineModal} onOpenChange={setShowTimelineModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Timeline do Processo
            </DialogTitle>
          </DialogHeader>
          {selectedProcessoTimeline && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                {selectedProcessoTimeline.numero_processo || "Sem número"} - {selectedProcessoTimeline.tipo_acao}
              </p>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4">
                  {getTimelineEvents(selectedProcessoTimeline).map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative pl-10"
                    >
                      <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                        event.tipo === "criacao" ? "bg-primary text-primary-foreground" :
                        event.tipo === "prazo" ? "bg-orange-500 text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {event.tipo === "criacao" ? (
                          <FileText className="w-3 h-3" />
                        ) : event.tipo === "prazo" ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{event.titulo}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.data).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {event.descricao && (
                          <p className="text-xs text-muted-foreground mt-1">{event.descricao}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
