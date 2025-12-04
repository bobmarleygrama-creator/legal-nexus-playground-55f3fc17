import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, Plus, Search, Phone, Mail, MapPin, 
  Edit, Trash2, Eye, FileText, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  estado_civil?: string;
  profissao?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  created_at?: string;
}

const estadosCivis = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];

export default function ClientesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<Partial<Cliente>>({
    nome: "",
    email: "",
    telefone: "",
    whatsapp: "",
    cpf: "",
    rg: "",
    data_nascimento: "",
    estado_civil: "",
    profissao: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    observacoes: "",
  });

  useEffect(() => {
    loadClientes();
  }, [user]);

  const loadClientes = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("lawyer_clients")
      .select("*")
      .eq("advogado_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading clients:", error);
    } else {
      setClientes(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.nome) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    if (editingCliente) {
      const { error } = await supabase
        .from("lawyer_clients")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", editingCliente.id);

      if (error) {
        toast({ title: "Erro ao atualizar cliente", variant: "destructive" });
      } else {
        toast({ title: "Cliente atualizado com sucesso!" });
      }
    } else {
      const { error } = await supabase
        .from("lawyer_clients")
        .insert([{ ...form, advogado_id: user.id }] as any);

      if (error) {
        toast({ title: "Erro ao cadastrar cliente", variant: "destructive" });
      } else {
        toast({ title: "Cliente cadastrado com sucesso!" });
      }
    }

    setShowModal(false);
    setEditingCliente(null);
    resetForm();
    loadClientes();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este cliente?")) return;

    const { error } = await supabase
      .from("lawyer_clients")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir cliente", variant: "destructive" });
    } else {
      toast({ title: "Cliente excluído com sucesso!" });
      loadClientes();
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setForm(cliente);
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      nome: "",
      email: "",
      telefone: "",
      whatsapp: "",
      cpf: "",
      rg: "",
      data_nascimento: "",
      estado_civil: "",
      profissao: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      observacoes: "",
    });
  };

  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" />
            Minha Carteira de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os seus clientes em um só lugar
          </p>
        </div>

        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingCliente(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? "Editar Cliente" : "Cadastrar Novo Cliente"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Nome completo do cliente"
                  />
                </div>

                <div>
                  <Label>CPF</Label>
                  <Input
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <Label>RG</Label>
                  <Input
                    value={form.rg}
                    onChange={(e) => setForm({ ...form, rg: e.target.value })}
                    placeholder="Número do RG"
                  />
                </div>

                <div>
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={form.data_nascimento}
                    onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Estado Civil</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={form.estado_civil}
                    onChange={(e) => setForm({ ...form, estado_civil: e.target.value })}
                  >
                    <option value="">Selecione</option>
                    {estadosCivis.map(ec => (
                      <option key={ec} value={ec}>{ec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Profissão</Label>
                  <Input
                    value={form.profissao}
                    onChange={(e) => setForm({ ...form, profissao: e.target.value })}
                    placeholder="Profissão"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>

                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <Label>Estado</Label>
                  <Input
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label>CEP</Label>
                  <Input
                    value={form.cep}
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    placeholder="Anotações sobre o cliente..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCliente ? "Salvar Alterações" : "Cadastrar Cliente"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{clientes.length}</p>
            <p className="text-sm text-muted-foreground">Total de Clientes</p>
          </div>
        </motion.div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredClientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                </TableCell>
              </TableRow>
            ) : (
              filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {cliente.email && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {cliente.email}
                        </span>
                      )}
                      {cliente.whatsapp && (
                        <a 
                          href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-green-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" /> {cliente.whatsapp}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{cliente.cpf || "-"}</TableCell>
                  <TableCell>
                    {cliente.cidade && cliente.estado 
                      ? `${cliente.cidade}/${cliente.estado}` 
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(cliente)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cliente.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
