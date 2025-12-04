import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Scale, Users, DollarSign, TrendingUp, MessageCircle, Mail, 
  CheckCircle, Crown, Lock, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Storage } from "@/utils/storage";
import { Caso } from "@/types";

export default function AdvogadoHome() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");
  const [casosNovos, setCasosNovos] = useState<Caso[]>([]);
  const [meusCasos, setMeusCasos] = useState<Caso[]>([]);

  const isPremium = profile?.premium_ativo === true;

  useEffect(() => {
    if (user) {
      loadCasos();
    }
  }, [user]);

  const loadCasos = () => {
    if (!user) return;
    setCasosNovos(Storage.getCasosNovos());
    setMeusCasos(Storage.getCasosByAdvogadoId(user.id));
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

  const totalGanhos = meusCasos.reduce((acc, c) => acc + (c.preco_cents || 0), 0);

  const premiumFeatures = [
    { name: "Minha Carteira", desc: "Gestão completa de clientes" },
    { name: "Gestão de Processos", desc: "Controle de processos e prazos" },
    { name: "Gerador de Peças", desc: "+50 modelos de documentos" },
    { name: "Cálculos Jurídicos", desc: "Trabalhista, cível, família" },
    { name: "IA Jurídica", desc: "Análise inteligente de documentos" },
  ];

  return (
    <div className="space-y-6">
      {/* Premium CTA for non-premium users */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-amber-800">
                  Desbloqueie o Painel Premium
                </h3>
                <p className="text-amber-700 text-sm mt-1">
                  Acesse todas as ferramentas profissionais por apenas R$ 79,90/mês
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {premiumFeatures.map((f) => (
                    <div key={f.name} className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      <Lock className="w-3 h-3" />
                      {f.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              Assinar Agora
            </Button>
          </div>
        </motion.div>
      )}

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
            <p className="text-2xl font-bold text-foreground">{meusCasos.length}</p>
            <p className="text-sm text-muted-foreground">Clientes Ativos</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{formatPrice(totalGanhos)}</p>
            <p className="text-sm text-muted-foreground">Ganhos Potenciais</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{casosNovos.length}</p>
            <p className="text-sm text-muted-foreground">Oportunidades</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="feed">Feed de Oportunidades</TabsTrigger>
          <TabsTrigger value="meus">Meus Casos ({meusCasos.length})</TabsTrigger>
        </TabsList>

        {/* Feed Tab */}
        <TabsContent value="feed">
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

                  <Link to="/dashboard/advogado">
                    <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                      Ver Detalhes
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Meus Casos Tab */}
        <TabsContent value="meus">
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
    </div>
  );
}
