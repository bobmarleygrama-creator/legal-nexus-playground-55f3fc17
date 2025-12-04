import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Plus, Search, Download, Edit, Trash2, 
  Eye, Copy, FileSignature
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Documento {
  id: string;
  titulo: string;
  tipo_documento: string;
  conteudo?: string;
  cliente_id?: string;
  processo_id?: string;
  created_at?: string;
  updated_at?: string;
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

// Categorias de documentos jurídicos
const categoriaDocumentos = [
  {
    categoria: "Petições Iniciais",
    documentos: [
      "Petição Inicial Cível",
      "Petição Inicial Trabalhista",
      "Petição Inicial de Alimentos",
      "Petição Inicial de Divórcio",
      "Petição Inicial de Guarda",
      "Petição Inicial de Execução",
      "Petição Inicial de Usucapião",
      "Petição Inicial de Inventário",
    ]
  },
  {
    categoria: "Contestações e Defesas",
    documentos: [
      "Contestação Cível",
      "Contestação Trabalhista",
      "Defesa Prévia Criminal",
      "Resposta à Acusação",
      "Exceção de Incompetência",
      "Exceção de Suspeição",
    ]
  },
  {
    categoria: "Recursos",
    documentos: [
      "Recurso de Apelação",
      "Recurso Ordinário Trabalhista",
      "Agravo de Instrumento",
      "Agravo Interno",
      "Embargos de Declaração",
      "Recurso Especial",
      "Recurso Extraordinário",
      "Recurso Inominado",
    ]
  },
  {
    categoria: "Petições Diversas",
    documentos: [
      "Petição Intermediária",
      "Pedido de Tutela de Urgência",
      "Pedido de Tutela de Evidência",
      "Pedido de Produção de Provas",
      "Manifestação",
      "Impugnação à Contestação",
      "Réplica",
      "Alegações Finais",
      "Memoriais",
    ]
  },
  {
    categoria: "Contratos",
    documentos: [
      "Contrato de Prestação de Serviços",
      "Contrato de Honorários Advocatícios",
      "Contrato de Locação",
      "Contrato de Compra e Venda",
      "Distrato",
      "Aditivo Contratual",
      "Termo de Confissão de Dívida",
    ]
  },
  {
    categoria: "Procurações e Termos",
    documentos: [
      "Procuração Ad Judicia",
      "Procuração Ad Judicia et Extra",
      "Substabelecimento",
      "Termo de Renúncia",
      "Declaração de Hipossuficiência",
      "Termo de Compromisso",
    ]
  },
  {
    categoria: "Notificações",
    documentos: [
      "Notificação Extrajudicial",
      "Notificação de Cobrança",
      "Notificação de Rescisão",
      "Interpelação Judicial",
    ]
  },
  {
    categoria: "Criminal",
    documentos: [
      "Habeas Corpus",
      "Queixa-Crime",
      "Representação Criminal",
      "Memoriais Criminais",
      "Liberdade Provisória",
      "Relaxamento de Prisão",
      "Revisão Criminal",
    ]
  },
  {
    categoria: "Previdenciário",
    documentos: [
      "Petição de Aposentadoria",
      "Petição de Auxílio-Doença",
      "Petição de BPC/LOAS",
      "Petição de Pensão por Morte",
      "Recurso Administrativo INSS",
    ]
  },
];

const allDocumentos = categoriaDocumentos.flatMap(c => c.documentos);

export default function DocumentosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<Partial<Documento>>({
    titulo: "",
    tipo_documento: "",
    conteudo: "",
    cliente_id: "",
    processo_id: "",
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [docsRes, clientesRes, processosRes] = await Promise.all([
      supabase
        .from("legal_documents")
        .select("*")
        .eq("advogado_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("lawyer_clients")
        .select("id, nome")
        .eq("advogado_id", user.id),
      supabase
        .from("processes")
        .select("id, numero_processo, tipo_acao")
        .eq("advogado_id", user.id),
    ]);

    setDocumentos(docsRes.data || []);
    setClientes(clientesRes.data || []);
    setProcessos(processosRes.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.titulo || !form.tipo_documento) {
      toast({ title: "Título e tipo são obrigatórios", variant: "destructive" });
      return;
    }

    if (editingDoc) {
      const { error } = await supabase
        .from("legal_documents")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", editingDoc.id);

      if (error) {
        toast({ title: "Erro ao atualizar documento", variant: "destructive" });
      } else {
        toast({ title: "Documento atualizado!" });
      }
    } else {
      const docData = {
        titulo: form.titulo,
        tipo_documento: form.tipo_documento,
        conteudo: form.conteudo || null,
        cliente_id: form.cliente_id || null,
        processo_id: form.processo_id || null,
        advogado_id: user.id,
      };

      const { error } = await supabase
        .from("legal_documents")
        .insert([docData]);

      if (error) {
        console.error("Erro ao criar documento:", error);
        toast({ title: "Erro ao criar documento", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Documento criado!" });
      }
    }

    setShowModal(false);
    setEditingDoc(null);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir este documento?")) return;

    const { error } = await supabase.from("legal_documents").delete().eq("id", id);

    if (!error) {
      toast({ title: "Documento excluído!" });
      loadData();
    }
  };

  const handleExportPDF = (doc: Documento) => {
    // Create a simple text file for now (could integrate jsPDF)
    const content = `
${doc.titulo.toUpperCase()}
${"=".repeat(50)}
Tipo: ${doc.tipo_documento}
Data: ${new Date(doc.updated_at || doc.created_at || "").toLocaleDateString("pt-BR")}
${"=".repeat(50)}

${doc.conteudo || ""}
    `.trim();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.titulo.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Documento exportado!" });
  };

  const handleDuplicate = async (doc: Documento) => {
    if (!user) return;

    const { error } = await supabase
      .from("legal_documents")
      .insert({
        titulo: `${doc.titulo} (Cópia)`,
        tipo_documento: doc.tipo_documento,
        conteudo: doc.conteudo,
        cliente_id: doc.cliente_id,
        processo_id: doc.processo_id,
        advogado_id: user.id,
      });

    if (!error) {
      toast({ title: "Documento duplicado!" });
      loadData();
    }
  };

  const resetForm = () => {
    setForm({
      titulo: "",
      tipo_documento: "",
      conteudo: "",
      cliente_id: "",
      processo_id: "",
    });
  };

  const filteredDocs = documentos.filter(d =>
    d.titulo.toLowerCase().includes(search.toLowerCase()) ||
    d.tipo_documento.toLowerCase().includes(search.toLowerCase())
  );

  const getDocTypeColor = (tipo: string) => {
    if (tipo.includes("Petição")) return "bg-blue-100 text-blue-700";
    if (tipo.includes("Contrato")) return "bg-green-100 text-green-700";
    if (tipo.includes("Recurso")) return "bg-purple-100 text-purple-700";
    if (tipo.includes("Criminal") || tipo.includes("Habeas")) return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <FileSignature className="w-7 h-7 text-primary" />
            Gerador de Peças Jurídicas
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie documentos jurídicos
          </p>
        </div>

        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingDoc(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? "Editar Documento" : "Criar Novo Documento"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Título do Documento *</Label>
                  <Input
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ex: Petição Inicial - João Silva"
                  />
                </div>

                <div>
                  <Label>Tipo de Documento *</Label>
                  <Select
                    value={form.tipo_documento}
                    onValueChange={(v) => setForm({ ...form, tipo_documento: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {categoriaDocumentos.map(cat => (
                        <div key={cat.categoria}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                            {cat.categoria}
                          </div>
                          {cat.documentos.map(doc => (
                            <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cliente (opcional)</Label>
                  <Select
                    value={form.cliente_id || ""}
                    onValueChange={(v) => setForm({ ...form, cliente_id: v || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {clientes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Processo (opcional)</Label>
                  <Select
                    value={form.processo_id || ""}
                    onValueChange={(v) => setForm({ ...form, processo_id: v || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a um processo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {processos.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.numero_processo || p.tipo_acao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Conteúdo do Documento</Label>
                  <Textarea
                    value={form.conteudo}
                    onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                    placeholder="Digite ou cole o conteúdo do documento aqui...

EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA...

[NOME DO CLIENTE], [nacionalidade], [estado civil], [profissão], inscrito no CPF sob o nº [CPF], residente e domiciliado na [endereço completo], vem, respeitosamente, por intermédio de seu advogado que esta subscreve..."
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDoc ? "Salvar" : "Criar Documento"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{documentos.length}</p>
            <p className="text-sm text-muted-foreground">Documentos Criados</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <FileSignature className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{allDocumentos.length}</p>
            <p className="text-sm text-muted-foreground">Modelos Disponíveis</p>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Document Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {search ? "Nenhum documento encontrado" : "Nenhum documento criado"}
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-elevated p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <Badge className={getDocTypeColor(doc.tipo_documento)}>
                  {doc.tipo_documento}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(doc.updated_at || doc.created_at || "").toLocaleDateString("pt-BR")}
                </span>
              </div>

              <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                {doc.titulo}
              </h3>

              {doc.conteudo && (
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {doc.conteudo}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewDoc(doc);
                    setShowPreview(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingDoc(doc);
                    setForm(doc);
                    setShowModal(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(doc)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportPDF(doc)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive ml-auto"
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewDoc?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Badge className={getDocTypeColor(previewDoc?.tipo_documento || "")}>
              {previewDoc?.tipo_documento}
            </Badge>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg whitespace-pre-wrap font-mono text-sm">
              {previewDoc?.conteudo || "Documento sem conteúdo."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
