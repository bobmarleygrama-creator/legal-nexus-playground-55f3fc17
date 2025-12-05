import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Brain, Upload, FileText, Loader2, 
  MessageSquare, History, Trash2, Send, X, File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Analise {
  id: string;
  tipo_analise: string;
  documento_nome?: string;
  documento_url?: string;
  analise?: string;
  processo_id?: string;
  created_at?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Você é um advogado sênior com 40 anos de experiência em todas as áreas do Direito brasileiro. 
Você possui profundo conhecimento em:
- Direito Civil, Trabalhista, Criminal, Previdenciário, Tributário, Empresarial e Família
- Jurisprudência dos Tribunais Superiores (STF, STJ, TST)
- Doutrina jurídica clássica e contemporânea
- Procedimentos processuais e prazos
- Estratégias jurídicas e argumentação

Ao analisar documentos ou responder perguntas:
1. Seja preciso e fundamentado em legislação e jurisprudência
2. Identifique pontos fortes e fracos
3. Sugira estratégias e alternativas
4. Alerte sobre riscos e prazos
5. Use linguagem técnica mas acessível

Sempre responda em português brasileiro.`;

export default function IAJuridicaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAnalises, setLoadingAnalises] = useState(true);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    loadAnalises();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const loadAnalises = async () => {
    if (!user) return;
    setLoadingAnalises(true);

    const { data } = await supabase
      .from("ai_analyses")
      .select("*")
      .eq("advogado_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setAnalises(data || []);
    setLoadingAnalises(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".txt")) {
      toast({ 
        title: "Formato não suportado", 
        description: "Use PDF, DOC, DOCX ou TXT",
        variant: "destructive" 
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "Arquivo muito grande", 
        description: "Máximo 5MB permitido",
        variant: "destructive" 
      });
      return;
    }

    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        setUploadedFile({ name: file.name, content: text });
        toast({ title: `Arquivo "${file.name}" carregado!` });
      } else {
        toast({ 
          title: "PDF/DOC detectado", 
          description: "Cole o conteúdo do documento no chat para análise",
        });
        setUploadedFile({ 
          name: file.name, 
          content: `[Documento ${file.name} carregado - Cole o conteúdo abaixo para análise]` 
        });
      }
    } catch {
      toast({ title: "Erro ao ler arquivo", variant: "destructive" });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if (!user || (!inputMessage.trim() && !uploadedFile)) return;

    let messageContent = inputMessage.trim();
    
    if (uploadedFile && uploadedFile.content) {
      messageContent = `[Documento: ${uploadedFile.name}]\n\n${uploadedFile.content}\n\n${messageContent || "Analise este documento jurídico e forneça suas impressões profissionais."}`;
    }

    if (!messageContent) return;

    const userMessage: ChatMessage = { role: "user", content: messageContent };
    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setUploadedFile(null);
    setLoading(true);
    setIsStreaming(true);

    try {
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatMessages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: messageContent },
      ];

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-juridico`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro na análise");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  setChatMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: fullResponse };
                    return updated;
                  });
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }

      if (fullResponse) {
        await supabase
          .from("ai_analyses")
          .insert({
            advogado_id: user.id,
            tipo_analise: uploadedFile ? "documento" : "consulta",
            documento_nome: uploadedFile?.name || "Consulta Chat",
            analise: fullResponse,
          });

        loadAnalises();
      }
    } catch (error: any) {
      console.error("Erro na análise:", error);
      toast({ 
        title: "Erro na análise", 
        description: error.message || "Tente novamente",
        variant: "destructive" 
      });
      setChatMessages(prev => prev.filter(m => m.content !== ""));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleDeleteAnalise = async (id: string) => {
    const { error } = await supabase
      .from("ai_analyses")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Análise excluída!" });
      loadAnalises();
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    setUploadedFile(null);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <Brain className="w-7 h-7 text-primary" />
            IA Jurídica
          </h1>
          <p className="text-muted-foreground mt-1">
            Converse com Dr. Juris - seu assistente jurídico inteligente
          </p>
        </div>

        <div className="flex gap-2">
          {chatMessages.length > 0 && (
            <Button variant="outline" onClick={clearChat} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Limpar Chat
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowHistorico(true)} className="gap-2">
            <History className="w-4 h-4" />
            Histórico
          </Button>
        </div>
      </div>

      {/* AI Profile Card (when no chat) */}
      {chatMessages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20 shrink-0"
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Dr. Juris IA
                <Badge className="bg-amber-100 text-amber-700">40 anos de experiência</Badge>
              </h3>
              <p className="text-muted-foreground mt-1">
                Advogado sênior especializado em todas as áreas do Direito brasileiro. 
                Envie documentos PDF/TXT ou faça perguntas jurídicas diretamente.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary">Civil</Badge>
                <Badge variant="secondary">Trabalhista</Badge>
                <Badge variant="secondary">Criminal</Badge>
                <Badge variant="secondary">Previdenciário</Badge>
                <Badge variant="secondary">Família</Badge>
                <Badge variant="secondary">Empresarial</Badge>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat Area */}
      <div className="flex-1 card-elevated flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Inicie uma conversa</p>
              <p className="text-sm mt-1">Faça uma pergunta jurídica ou envie um documento para análise</p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
                <button
                  onClick={() => setInputMessage("Qual o prazo para contestação em ação de cobrança?")}
                  className="p-3 text-left rounded-lg border bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  📋 Prazo para contestação em ação de cobrança
                </button>
                <button
                  onClick={() => setInputMessage("Como calcular verbas rescisórias com justa causa?")}
                  className="p-3 text-left rounded-lg border bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  💼 Calcular verbas rescisórias
                </button>
                <button
                  onClick={() => setInputMessage("Quais os requisitos para usucapião extraordinária?")}
                  className="p-3 text-left rounded-lg border bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  🏠 Requisitos de usucapião
                </button>
                <button
                  onClick={() => setInputMessage("Jurisprudência do STJ sobre danos morais em negativação indevida")}
                  className="p-3 text-left rounded-lg border bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  ⚖️ Jurisprudência sobre danos morais
                </button>
              </div>
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Dr. Juris</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">
                    {msg.content || (isStreaming ? "..." : "")}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Uploaded File Preview */}
        {uploadedFile && (
          <div className="px-4 py-2 border-t bg-muted/50">
            <div className="flex items-center gap-2 text-sm">
              <File className="w-4 h-4 text-primary" />
              <span className="font-medium">{uploadedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto"
                onClick={() => setUploadedFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Enviar documento"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua pergunta jurídica ou cole o conteúdo de um documento..."
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || (!inputMessage.trim() && !uploadedFile)}
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Suporta PDF, DOC, DOCX, TXT (máx. 5MB) • Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{analises.length}</p>
            <p className="text-sm text-muted-foreground">Análises Realizadas</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {analises.filter(a => a.tipo_analise === "documento").length}
            </p>
            <p className="text-sm text-muted-foreground">Documentos Analisados</p>
          </div>
        </motion.div>
      </div>

      {/* Histórico Modal */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Análises</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {loadingAnalises ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : analises.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma análise realizada ainda.
              </p>
            ) : (
              analises.map((analise) => (
                <div key={analise.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={analise.tipo_analise === "documento" ? "default" : "secondary"}>
                        {analise.tipo_analise === "documento" ? "Documento" : "Consulta"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(analise.created_at || "").toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAnalise(analise.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {analise.documento_nome && (
                    <p className="font-medium mb-2">{analise.documento_nome}</p>
                  )}
                  
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {analise.analise}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
