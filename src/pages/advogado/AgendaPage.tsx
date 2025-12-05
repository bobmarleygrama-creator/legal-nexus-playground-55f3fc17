import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar as CalendarIcon, Plus, Clock, MapPin, 
  AlertTriangle, CheckCircle2, Trash2, Edit, 
  Gavel, Users, FileText, CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, startOfMonth, endOfMonth, addDays, isToday, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  advogado_id: string;
  processo_id?: string;
  cliente_id?: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  data_inicio: string;
  data_fim?: string;
  local?: string;
  created_at?: string;
}

interface Cliente {
  id: string;
  nome: string;
}

interface Processo {
  id: string;
  numero_processo?: string;
  tipo_acao: string;
}

const tipoConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  audiencia: { label: "Audiência", color: "bg-red-100 text-red-700 border-red-200", icon: Gavel },
  prazo: { label: "Prazo", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle },
  reuniao: { label: "Reunião", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Users },
  compromisso: { label: "Compromisso", color: "bg-green-100 text-green-700 border-green-200", icon: CalendarDays },
};

export default function AgendaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo: "compromisso",
    data_inicio: "",
    hora_inicio: "09:00",
    data_fim: "",
    hora_fim: "",
    local: "",
    cliente_id: "",
    processo_id: "",
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [appointmentsRes, clientesRes, processosRes] = await Promise.all([
      supabase
        .from("legal_appointments")
        .select("*")
        .eq("advogado_id", user.id)
        .order("data_inicio", { ascending: true }),
      supabase
        .from("lawyer_clients")
        .select("id, nome")
        .eq("advogado_id", user.id),
      supabase
        .from("processes")
        .select("id, numero_processo, tipo_acao")
        .eq("advogado_id", user.id),
    ]);

    setAppointments(appointmentsRes.data || []);
    setClientes(clientesRes.data || []);
    setProcessos(processosRes.data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      titulo: "",
      descricao: "",
      tipo: "compromisso",
      data_inicio: format(selectedDate, "yyyy-MM-dd"),
      hora_inicio: "09:00",
      data_fim: "",
      hora_fim: "",
      local: "",
      cliente_id: "",
      processo_id: "",
    });
    setEditingId(null);
  };

  const openNewModal = () => {
    resetForm();
    setForm(f => ({ ...f, data_inicio: format(selectedDate, "yyyy-MM-dd") }));
    setShowModal(true);
  };

  const openEditModal = (apt: Appointment) => {
    const dataInicio = new Date(apt.data_inicio);
    const dataFim = apt.data_fim ? new Date(apt.data_fim) : null;
    
    setForm({
      titulo: apt.titulo,
      descricao: apt.descricao || "",
      tipo: apt.tipo,
      data_inicio: format(dataInicio, "yyyy-MM-dd"),
      hora_inicio: format(dataInicio, "HH:mm"),
      data_fim: dataFim ? format(dataFim, "yyyy-MM-dd") : "",
      hora_fim: dataFim ? format(dataFim, "HH:mm") : "",
      local: apt.local || "",
      cliente_id: apt.cliente_id || "",
      processo_id: apt.processo_id || "",
    });
    setEditingId(apt.id);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!user || !form.titulo || !form.data_inicio) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    const dataInicio = new Date(`${form.data_inicio}T${form.hora_inicio}:00`);
    const dataFim = form.data_fim && form.hora_fim 
      ? new Date(`${form.data_fim}T${form.hora_fim}:00`) 
      : null;

    const payload = {
      advogado_id: user.id,
      titulo: form.titulo,
      descricao: form.descricao || null,
      tipo: form.tipo,
      data_inicio: dataInicio.toISOString(),
      data_fim: dataFim?.toISOString() || null,
      local: form.local || null,
      cliente_id: form.cliente_id || null,
      processo_id: form.processo_id || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("legal_appointments")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      } else {
        toast({ title: "Compromisso atualizado!" });
        setShowModal(false);
        loadData();
      }
    } else {
      const { error } = await supabase
        .from("legal_appointments")
        .insert(payload);

      if (error) {
        toast({ title: "Erro ao criar", variant: "destructive" });
      } else {
        toast({ title: "Compromisso criado!" });
        setShowModal(false);
        loadData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("legal_appointments")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Compromisso excluído!" });
      loadData();
    }
  };

  // Get appointments for selected date
  const selectedDateAppointments = appointments.filter(apt => 
    isSameDay(new Date(apt.data_inicio), selectedDate)
  );

  // Get upcoming appointments (next 7 days)
  const upcomingAppointments = appointments.filter(apt => {
    const date = new Date(apt.data_inicio);
    return date >= new Date() && date <= addDays(new Date(), 7);
  }).slice(0, 5);

  // Dates with appointments for calendar highlighting
  const datesWithAppointments = appointments.map(apt => new Date(apt.data_inicio));

  // Stats
  const audienciasProximas = appointments.filter(apt => 
    apt.tipo === "audiencia" && new Date(apt.data_inicio) >= new Date()
  ).length;
  
  const prazosProximos = appointments.filter(apt => 
    apt.tipo === "prazo" && new Date(apt.data_inicio) >= new Date()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-primary" />
            Agenda Jurídica
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie compromissos, audiências e prazos
          </p>
        </div>

        <Button onClick={openNewModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Compromisso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{appointments.length}</p>
            <p className="text-sm text-muted-foreground">Total Compromissos</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <Gavel className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{audienciasProximas}</p>
            <p className="text-sm text-muted-foreground">Audiências Próximas</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{prazosProximos}</p>
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
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{selectedDateAppointments.length}</p>
            <p className="text-sm text-muted-foreground">Hoje</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-elevated p-4"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ptBR}
            className="rounded-md"
            modifiers={{
              hasAppointment: datesWithAppointments,
            }}
            modifiersStyles={{
              hasAppointment: {
                fontWeight: "bold",
                backgroundColor: "hsl(var(--primary) / 0.1)",
                color: "hsl(var(--primary))",
              },
            }}
          />
        </motion.div>

        {/* Selected Day Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
              {isToday(selectedDate) && (
                <Badge className="ml-2 bg-primary/10 text-primary">Hoje</Badge>
              )}
            </h3>
            <Button size="sm" variant="outline" onClick={openNewModal}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>

          {selectedDateAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum compromisso neste dia</p>
              <Button variant="link" onClick={openNewModal}>
                Criar novo compromisso
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateAppointments.map((apt) => {
                const config = tipoConfig[apt.tipo] || tipoConfig.compromisso;
                const Icon = config.icon;
                
                return (
                  <div
                    key={apt.id}
                    className={`p-4 rounded-lg border ${config.color} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 mt-0.5" />
                        <div>
                          <h4 className="font-medium">{apt.titulo}</h4>
                          {apt.descricao && (
                            <p className="text-sm opacity-80 mt-1">{apt.descricao}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(apt.data_inicio), "HH:mm")}
                              {apt.data_fim && ` - ${format(new Date(apt.data_fim), "HH:mm")}`}
                            </span>
                            {apt.local && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {apt.local}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditModal(apt)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(apt.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Upcoming Events */}
      {upcomingAppointments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4"
        >
          <h3 className="font-semibold mb-4">Próximos Compromissos</h3>
          <div className="space-y-2">
            {upcomingAppointments.map((apt) => {
              const config = tipoConfig[apt.tipo] || tipoConfig.compromisso;
              const Icon = config.icon;
              
              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedDate(new Date(apt.data_inicio));
                    openEditModal(apt);
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{apt.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(apt.data_inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="secondary">{config.label}</Badge>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Compromisso" : "Novo Compromisso"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Audiência Trabalhista"
              />
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audiencia">🔨 Audiência</SelectItem>
                  <SelectItem value="prazo">⚠️ Prazo</SelectItem>
                  <SelectItem value="reuniao">👥 Reunião</SelectItem>
                  <SelectItem value="compromisso">📅 Compromisso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Início *</Label>
                <Input
                  type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={form.data_fim}
                  onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Fim</Label>
                <Input
                  type="time"
                  value={form.hora_fim}
                  onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Local</Label>
              <Input
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
                placeholder="Ex: Fórum Central - Sala 3"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Detalhes adicionais..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente (opcional)</Label>
                <Select
                  value={form.cliente_id || "none"}
                  onValueChange={(v) => setForm({ ...form, cliente_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vincular cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Processo (opcional)</Label>
                <Select
                  value={form.processo_id || "none"}
                  onValueChange={(v) => setForm({ ...form, processo_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vincular processo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {processos.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.numero_processo || p.tipo_acao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
