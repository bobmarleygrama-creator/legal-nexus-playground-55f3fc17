import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Plus, LogOut, Bell, MessageCircle, Clock, CheckCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Storage } from "@/utils/storage";
import { Caso, AreaJuridica, AREAS_JURIDICAS } from "@/types";
import { useToast } from "@/hooks/use-toast";

const ClienteDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [casos, setCasos] = useState<Caso[]>([]);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [resumo, setResumo] = useState("");
  const [areaJuridica, setAreaJuridica] = useState<AreaJuridica>("Cível");
  const [aiSuggestion, setAiSuggestion] = useState<AreaJuridica | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.tipo !== "cliente") {
      navigate("/login");
      return;
    }
    loadCasos();
  }, [user, navigate]);

  const loadCasos = () => {
    if (!user) return;
    const userCasos = Storage.getCasosByClienteId(user.id);
    setCasos(userCasos);
  };

  // AI detection simulation
  useEffect(() => {
    const text = resumo.toLowerCase();
    
    if (/demitid|empreg|salário|férias|hora extra|clt|trabalhista/i.test(text)) {
      setAiSuggestion("Trabalhista");
    } else if (/divórcio|pensão|guarda|filho|casamento|família/i.test(text)) {
      setAiSuggestion("Família");
    } else if (/preso|crime|polícia|acusado|criminal/i.test(text)) {
      setAiSuggestion("Criminal");
    } else if (/inss|aposentadoria|benefício|previdência/i.test(text)) {
      setAiSuggestion("Previdenciário");
    } else if (/contrato|dano moral|banco|dívida|serasa|consumidor/i.test(text)) {
      setAiSuggestion("Cível");
    } else if (/empresa|sócio|negócio|cnpj/i.test(text)) {
      setAiSuggestion("Empresarial");
    } else {
      setAiSuggestion(null);
    }
  }, [resumo]);

  useEffect(() => {
    if (aiSuggestion) {
      setAreaJuridica(aiSuggestion);
    }
  }, [aiSuggestion]);

  const calculatePrice = () => {
    // Simulate price based on complexity (word count)
    const wordCount = resumo.split(" ").length;
    let base = 10000; // R$ 100,00
    if (wordCount > 20) base += 5000;
    if (wordCount > 50) base += 10000;
    if (areaJuridica === "Criminal") base += 15000;
    if (areaJuridica === "Empresarial") base += 10000;
    return base + Math.floor(Math.random() * 5000);
  };

  const handleSubmitCase = () => {
    if (!resumo.trim()) return;
    const price = calculatePrice();
    setEstimatedPrice(price);
    setShowPriceModal(true);
  };

  const confirmCase = () => {
    if (!user) return;

    const newCaso: Caso = {
      id: Storage.generateId(),
      cliente_id: user.id,
      cliente_nome: user.nome,
      cliente_email: user.email,
      area_juridica: areaJuridica,
      resumo: resumo.trim(),
      status: "novo",
      criado_em: new Date().toISOString(),
      preco_cents: estimatedPrice,
      origem: "Plataforma",
    };

    Storage.saveCaso(newCaso);
    loadCasos();
    
    setShowNewCaseModal(false);
    setShowPriceModal(false);
    setResumo("");
    
    toast({
      title: "Demanda enviada!",
      description: `Valor: R$ ${(estimatedPrice / 100).toFixed(2)}`,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case "novo": return 0;
      case "em_atendimento": return 1;
      case "concluido": return 2;
      default: return 0;
    }
  };

  const getAreaBadgeClass = (area: string) => {
    const classes: Record<string, string> = {
      Trabalhista: "badge-trabalhista",
      Família: "badge-familia",
      Cível: "badge-civel",
      Criminal: "badge-criminal",
      Previdenciário: "badge-previdenciario",
      Empresarial: "badge-empresarial",
    };
    return classes[area] || "bg-muted text-muted-foreground";
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-primary-foreground px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <Bell className="w-5 h-5 animate-pulse" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-hero rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-heading font-bold text-foreground">SocialJuris</span>
              <span className="text-muted-foreground ml-2">| Cliente</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-foreground">Olá, {user?.nome?.split(" ")[0]}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Hero CTA */}
      <section className="gradient-dark py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary-foreground mb-3">
            Precisa de orientação jurídica?
          </h1>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Descreva seu caso. Nossa IA conecta você ao especialista ideal em minutos.
          </p>
          <Button
            size="lg"
            className="btn-hero"
            onClick={() => setShowNewCaseModal(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Demanda
          </Button>
        </div>
      </section>

      {/* Cases */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Meus Processos e Consultas
        </h2>

        {casos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Scale className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Nenhuma demanda ativa.</p>
            <p>Seus casos aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {casos.map((caso, index) => (
              <motion.div
                key={caso.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-elevated p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`badge-area ${getAreaBadgeClass(caso.area_juridica)}`}>
                    {caso.area_juridica}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(caso.criado_em)}
                  </span>
                </div>

                <p className="text-foreground text-sm mb-4 line-clamp-3">
                  {caso.resumo}
                </p>

                {/* Timeline */}
                <div className="flex items-center gap-1 mb-4">
                  {["Enviado", "Atendimento", "Concluído"].map((step, i) => (
                    <div key={step} className="flex-1 flex flex-col items-center">
                      <div
                        className={`h-1.5 w-full rounded-full ${
                          i <= getStatusStep(caso.status)
                            ? i === 2 ? "bg-green-500" : "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground mt-1">{step}</span>
                    </div>
                  ))}
                </div>

                {caso.status !== "novo" && caso.advogado_nome ? (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{caso.advogado_nome}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          caso.oab_status === "verificado" 
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {caso.oab_status === "verificado" ? "✓ OAB Verificada" : "⚠ OAB Pendente"}
                        </span>
                      </div>
                    </div>
                    <Link to={`/dashboard/chat/${caso.id}`}>
                      <Button className="w-full" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Abrir Chat
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="border-t border-border pt-4">
                    <span className="inline-flex items-center gap-2 text-sm text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full">
                      <Clock className="w-4 h-4" />
                      Aguardando Advogado
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* New Case Modal */}
      <Dialog open={showNewCaseModal} onOpenChange={setShowNewCaseModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading flex items-center gap-2">
              🎯 Nova Solicitação
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Qual a área jurídica?</Label>
              <Select value={areaJuridica} onValueChange={(v) => setAreaJuridica(v as AreaJuridica)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREAS_JURIDICAS.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.icon} {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {aiSuggestion && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full"
                >
                  ✨ Sugestão Automática: {aiSuggestion}
                </motion.span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Descreva seu caso</Label>
              <Textarea
                placeholder="Ex: Fui demitido ontem e não recebi minhas verbas rescisórias..."
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Quanto mais detalhes, melhor a triagem.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowNewCaseModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitCase} disabled={!resumo.trim()}>
              🚀 Enviar para Análise
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Confirmation Modal */}
      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Confirmar Envio</DialogTitle>
          </DialogHeader>

          <div className="py-6">
            <p className="text-muted-foreground mb-4">Valor sugerido para este caso:</p>
            <p className="text-4xl font-bold text-primary mb-2">
              R$ {(estimatedPrice / 100).toFixed(2)}
            </p>
            <span className="text-sm text-muted-foreground">
              Complexidade: {estimatedPrice < 15000 ? "Baixa" : estimatedPrice < 25000 ? "Média" : "Alta"}
            </span>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowPriceModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmCase}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClienteDashboard;
