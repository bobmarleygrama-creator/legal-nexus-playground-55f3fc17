import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Scale, LogOut, Wallet, Users, DollarSign, TrendingUp, 
  MessageCircle, Mail, CheckCircle, AlertCircle, X, ArrowDownLeft, ArrowUpRight, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Storage } from "@/utils/storage";
import { Caso, LCoinTransaction } from "@/types";
import { useToast } from "@/hooks/use-toast";

const ESTADOS_OAB = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

const AdvogadoDashboard = () => {
  const { user, profile, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("feed");
  const [casosNovos, setCasosNovos] = useState<Caso[]>([]);
  const [meusCasos, setMeusCasos] = useState<Caso[]>([]);
  const [showOabModal, setShowOabModal] = useState(false);
  const [showLCoinModal, setShowLCoinModal] = useState(false);
  const [lcoinTab, setLcoinTab] = useState("pacotes");
  const [transactions, setTransactions] = useState<LCoinTransaction[]>([]);
  const [oabNumero, setOabNumero] = useState(profile?.oab_numero || "");
  const [oabEstado, setOabEstado] = useState("SP");
  const [oabVerified, setOabVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const LCOIN_PACKAGES = [
    { id: 1, coins: 50, price: 4900, label: "50 L-COIN", priceLabel: "R$ 49,00" },
    { id: 2, coins: 100, price: 7900, label: "100 L-COIN", priceLabel: "R$ 79,00" },
    { id: 3, coins: 200, price: 9900, label: "200 L-COIN", priceLabel: "R$ 99,00", popular: true },
  ];

  useEffect(() => {
    if (!user || !profile || profile.tipo !== "advogado") {
      navigate("/login");
      return;
    }
    loadCasos();
    loadTransactions();
  }, [user, profile, navigate]);

  const loadCasos = () => {
    if (!user) return;
    setCasosNovos(Storage.getCasosNovos());
    setMeusCasos(Storage.getCasosByAdvogadoId(user.id));
  };

  const loadTransactions = () => {
    if (!user) return;
    setTransactions(Storage.getTransactions(user.id));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2)}`;
  };

  const handleAtender = async (caso: Caso) => {
    if (!user || !profile) return;
    
    const custoLCoin = caso.preco_cents / 100;
    const saldoAtual = profile.saldo_lcoin || 0;
    
    if (saldoAtual < custoLCoin) {
      toast({
        title: "Saldo insuficiente",
        description: `Você precisa de ${custoLCoin.toFixed(2)} L-COIN para aceitar este caso. Saldo atual: ${saldoAtual.toFixed(2)} L-COIN`,
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm(`Aceitar este caso custará ${custoLCoin.toFixed(2)} L-COIN. Deseja continuar?`)) {
      // Deduct L-COIN from wallet
      const novoSaldo = saldoAtual - custoLCoin;
      await updateProfile({ saldo_lcoin: novoSaldo });
      
      // Record transaction
      Storage.saveTransaction({
        id: Storage.generateId(),
        user_id: user.id,
        tipo: "debito",
        valor: custoLCoin,
        descricao: `Caso aceito: ${caso.area_juridica} - ${caso.cliente_nome}`,
        criado_em: new Date().toISOString(),
      });
      
      Storage.updateCaso(caso.id, {
        advogado_id: user.id,
        advogado_nome: profile.nome,
        status: "em_atendimento",
        oab_status: profile.oab_status as "pendente" | "verificado",
      });
      
      loadCasos();
      loadTransactions();
      setActiveTab("meus");
      
      toast({
        title: "Caso aceito!",
        description: `${custoLCoin.toFixed(2)} L-COIN debitados. Saldo: ${novoSaldo.toFixed(2)} L-COIN`,
      });
    }
  };

  const handleVerifyOab = async () => {
    setVerifying(true);
    
    // Simulate OAB verification
    setTimeout(async () => {
      setVerifying(false);
      setOabVerified(true);
      
      await updateProfile({
        oab_numero: oabNumero,
        oab_status: "verificado",
      });
      
      setTimeout(() => {
        setShowOabModal(false);
        setOabVerified(false);
        toast({
          title: "OAB Verificada!",
          description: "Seu cadastro está regular.",
        });
      }, 2000);
    }, 1500);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const totalGanhos = meusCasos.reduce((acc, c) => acc + (c.preco_cents || 0), 0);

  const getAreaBadgeClass = (area: string) => {
    const classes: Record<string, string> = {
      Trabalhista: "bg-blue-100 text-blue-700",
      Família: "bg-pink-100 text-pink-700",
      Cível: "bg-purple-100 text-purple-700",
      Criminal: "bg-red-100 text-red-700",
      Previdenciário: "bg-orange-100 text-orange-700",
      Empresarial: "bg-green-100 text-green-700",
    };
    return classes[area] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-hero rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-heading font-bold text-foreground">SocialJuris</span>
              <span className="text-muted-foreground ml-2">| Painel Jurídico</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* OAB Status */}
            {profile?.oab_status === "verificado" ? (
              <span className="flex items-center gap-1.5 text-sm text-green-600 bg-green-100 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                ✓ Verificado
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowOabModal(true)}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                OAB Pendente
              </Button>
            )}

            {/* Wallet - Clickable */}
            <button 
              onClick={() => setShowLCoinModal(true)}
              className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-primary" />
              <span className="font-medium text-primary">{profile?.saldo_lcoin?.toFixed(2) || "0.00"} L-COIN</span>
            </button>

            <span className="text-foreground hidden md:block">{profile?.nome}</span>
            
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="feed">Feed de Oportunidades</TabsTrigger>
            <TabsTrigger value="meus">Meus Casos em Andamento</TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed">
            <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide mb-6">
              Feed de Oportunidades
            </h2>

            {casosNovos.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Scale className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Sem novas oportunidades no momento.</p>
                <p>Volte mais tarde.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {casosNovos.map((caso, index) => (
                  <motion.div
                    key={caso.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card-elevated p-6"
                  >
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`badge-area ${getAreaBadgeClass(caso.area_juridica)}`}>
                          {caso.area_juridica}
                        </span>
                        <span className="badge-area bg-primary/10 text-primary">
                          {(caso.preco_cents / 100).toFixed(2)} L-COIN
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(caso.criado_em)}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-foreground mb-2">{caso.cliente_nome}</p>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-4">
                      {caso.resumo}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">Origem: {caso.origem}</p>

                    <Button 
                      className="w-full bg-foreground text-background hover:bg-foreground/90"
                      onClick={() => handleAtender(caso)}
                    >
                      Atender Cliente
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Meus Casos Tab */}
          <TabsContent value="meus">
            <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide mb-6">
              Meus Casos em Andamento
            </h2>

            {meusCasos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card-elevated p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{meusCasos.length}</p>
                    <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                  </div>
                </div>

                <div className="card-elevated p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatPrice(totalGanhos)}</p>
                    <p className="text-sm text-muted-foreground">Ganhos Potenciais</p>
                  </div>
                </div>

                <div className="card-elevated p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">100%</p>
                    <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  </div>
                </div>
              </div>
            )}

            {meusCasos.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Scale className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Você não tem casos ativos.</p>
                <Button variant="link" onClick={() => setActiveTab("feed")}>
                  Ir para o Feed
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {meusCasos.map((caso, index) => (
                  <motion.div
                    key={caso.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card-elevated p-6 flex flex-col md:flex-row gap-6"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium uppercase">
                          {caso.status.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">{caso.area_juridica}</span>
                        <span className="text-xs text-muted-foreground">• {formatDate(caso.criado_em)}</span>
                      </div>

                      <p className="text-lg font-semibold text-foreground mb-2">{caso.cliente_nome}</p>
                      <div className="bg-muted/50 p-3 rounded-lg mb-3">
                        <p className="text-sm text-muted-foreground">{caso.resumo}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <a 
                          href={`mailto:${caso.cliente_email}`} 
                          className="text-sm text-primary hover:underline"
                        >
                          {caso.cliente_email}
                        </a>
                        {caso.cliente_whatsapp && (
                          <a 
                            href={`https://wa.me/55${caso.cliente_whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:underline flex items-center gap-1"
                          >
                            📱 {caso.cliente_whatsapp}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-3 min-w-[150px]">
                      <p className="text-2xl font-bold text-foreground">
                        {formatPrice(caso.preco_cents)}
                      </p>
                      <a href={`mailto:${caso.cliente_email}`}>
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar Email
                        </Button>
                      </a>
                      <Link to={`/dashboard/chat/${caso.id}`}>
                        <Button size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Abrir Chat
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* OAB Verification Modal */}
      <Dialog open={showOabModal} onOpenChange={setShowOabModal}>
        <DialogContent className="sm:max-w-md">
          {!oabVerified ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-heading">Verificação Profissional</DialogTitle>
                <p className="text-sm text-muted-foreground">Validação junto ao CNA</p>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input value={profile?.nome || ""} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Número OAB</Label>
                  <Input 
                    placeholder="123456"
                    value={oabNumero}
                    onChange={(e) => setOabNumero(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado (UF)</Label>
                  <Select value={oabEstado} onValueChange={setOabEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_OAB.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleVerifyOab} 
                className="w-full"
                disabled={!oabNumero || verifying}
              >
                {verifying ? "Verificando..." : "Consultar CNA"}
              </Button>
            </>
          ) : (
            <div className="py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <h3 className="text-xl font-semibold text-foreground mb-2">OAB Verificada!</h3>
              <p className="text-muted-foreground">Cadastro regular junto à OAB/{oabEstado}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* L-COIN Modal */}
      <Dialog open={showLCoinModal} onOpenChange={setShowLCoinModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              Carteira L-COIN
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-4 border-b border-border">
            <p className="text-sm text-muted-foreground mb-1">Saldo disponível</p>
            <p className="text-4xl font-bold text-primary">{profile?.saldo_lcoin?.toFixed(2) || "0.00"}</p>
            <p className="text-sm text-muted-foreground">L-COIN</p>
          </div>

          <Tabs value={lcoinTab} onValueChange={setLcoinTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pacotes">Recarregar</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="pacotes" className="mt-4">
              <div className="grid gap-3">
                {LCOIN_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary ${
                      pkg.popular ? "border-primary bg-primary/5" : "border-border"
                    }`}
                    onClick={() => {
                      toast({
                        title: "Pagamento",
                        description: "Integração de pagamento em breve.",
                      });
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{pkg.label}</p>
                        <p className="text-2xl font-bold text-primary">{pkg.priceLabel}</p>
                      </div>
                      {pkg.popular && (
                        <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                          POPULAR
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Sem transações</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.tipo === "compra" ? "bg-green-100" : "bg-red-100"
                      }`}>
                        {tx.tipo === "compra" ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{tx.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.criado_em).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <p className={`font-semibold ${
                        tx.tipo === "compra" ? "text-green-600" : "text-red-600"
                      }`}>
                        {tx.tipo === "compra" ? "+" : "-"}{tx.valor.toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvogadoDashboard;
