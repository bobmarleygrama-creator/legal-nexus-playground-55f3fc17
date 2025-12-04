import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Brain, Upload, FileText, Loader2, Sparkles, 
  MessageSquare, History, Trash2
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
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAnalises, setLoadingAnalises] = useState(true);

  const [documentoTexto, setDocumentoTexto] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [resultado, setResultado] = useState("");
  const [tipoAnalise, setTipoAnalise] = useState<"documento" | "consulta">("consulta");

  useEffect(() => {
    loadAnalises();
  }, [user]);

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

  const analisarComIA = async () => {
    if (!user) return;

    const textoParaAnalisar = tipoAnalise === "documento" ? documentoTexto : pergunta;

    if (!textoParaAnalisar.trim()) {
      toast({ title: "Digite um texto para análise", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResultado("");

    try {
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { 
          role: "user", 
          content: tipoAnalise === "documento" 
            ? `Analise o seguinte documento jurídico e forneça suas impressões profissionais, identificando:\n1. Tipo de documento\n2. Pontos relevantes\n3. Possíveis problemas ou riscos\n4. Sugestões de melhoria\n5. Estratégias recomendadas\n\nDocumento:\n${textoParaAnalisar}`
            : textoParaAnalisar
        },
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

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

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
                  setResultado(fullResponse);
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }

      // Save analysis
      if (fullResponse) {
        await supabase
          .from("ai_analyses")
          .insert({
            advogado_id: user.id,
            tipo_analise: tipoAnalise,
            documento_nome: tipoAnalise === "documento" ? "Documento colado" : "Consulta",
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
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <Brain className="w-7 h-7 text-primary" />
            IA Jurídica
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise inteligente de documentos e consultoria jurídica
          </p>
        </div>

        <Button variant="outline" onClick={() => setShowHistorico(true)} className="gap-2">
          <History className="w-4 h-4" />
          Histórico
        </Button>
      </div>

      {/* AI Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20"
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
              Pronto para analisar documentos, fornecer pareceres e orientar estratégias jurídicas.
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

      {/* Analysis Type Selector */}
      <div className="flex gap-4">
        <Button
          variant={tipoAnalise === "consulta" ? "default" : "outline"}
          onClick={() => setTipoAnalise("consulta")}
          className="flex-1"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Consulta Jurídica
        </Button>
        <Button
          variant={tipoAnalise === "documento" ? "default" : "outline"}
          onClick={() => setTipoAnalise("documento")}
          className="flex-1"
        >
          <FileText className="w-4 h-4 mr-2" />
          Análise de Documento
        </Button>
      </div>

      {/* Input Area */}
      <div className="card-elevated p-6">
        {tipoAnalise === "documento" ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                Cole o conteúdo do documento abaixo para análise
              </p>
              <p className="text-xs text-muted-foreground">
                Contratos, petições, sentenças, pareceres, etc.
              </p>
            </div>

            <Textarea
              value={documentoTexto}
              onChange={(e) => setDocumentoTexto(e.target.value)}
              placeholder="Cole aqui o texto do documento para análise..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              placeholder="Faça sua pergunta jurídica...

Exemplos:
- Qual o prazo para contestação em ação de cobrança?
- Como calcular verbas rescisórias com justa causa?
- Quais os requisitos para usucapião extraordinária?
- Qual a jurisprudência do STJ sobre danos morais em negativação indevida?"
              rows={6}
            />
          </div>
        )}

        <Button
          onClick={analisarComIA}
          disabled={loading}
          className="w-full mt-4"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analisar com IA
            </>
          )}
        </Button>
      </div>

      {/* Result */}
      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Análise do Dr. Juris IA</h3>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg text-sm">
              {resultado}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
