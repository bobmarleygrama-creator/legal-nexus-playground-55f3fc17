import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calculator, Plus, Save, Trash2, History, 
  DollarSign, Percent, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface Calculo {
  id: string;
  titulo: string;
  tipo_calculo: string;
  dados_entrada: Record<string, any>;
  resultado: Record<string, any>;
  processo_id?: string;
  created_at?: string;
}

// Tipos de cálculos jurídicos - FUNCIONAIS
const tiposCalculo = {
  trabalhista: [
    { id: "verbas_rescisorias", nome: "Verbas Rescisórias" },
    { id: "horas_extras", nome: "Horas Extras" },
    { id: "adicional_noturno", nome: "Adicional Noturno" },
    { id: "insalubridade", nome: "Insalubridade" },
    { id: "periculosidade", nome: "Periculosidade" },
  ],
  civel: [
    { id: "correcao_monetaria", nome: "Correção Monetária" },
    { id: "juros_mora", nome: "Juros de Mora" },
    { id: "honorarios", nome: "Honorários Advocatícios" },
  ],
  familia: [
    { id: "pensao_alimenticia", nome: "Pensão Alimentícia" },
    { id: "partilha_bens", nome: "Partilha de Bens" },
  ],
  previdenciario: [
    { id: "tempo_contribuicao", nome: "Tempo de Contribuição" },
  ],
};

const totalCalculos = Object.values(tiposCalculo).flat().length;

export default function CalculosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calculos, setCalculos] = useState<Calculo[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const [activeTab, setActiveTab] = useState("trabalhista");
  const [loading, setLoading] = useState(true);

  // Form states for different calculations
  const [verbasForm, setVerbasForm] = useState({
    salario: "",
    mesesTrabalhados: "",
    feriasVencidas: "0",
    avisoPrevio: "trabalhado",
    motivoRescisao: "sem_justa_causa",
  });

  const [horasExtrasForm, setHorasExtrasForm] = useState({
    salarioBase: "",
    horasMensais: "220",
    qtdHorasExtras: "",
    percentual: "50",
  });

  const [noturnoForm, setNoturnoForm] = useState({
    salarioBase: "",
    horasNoturnas: "",
  });

  const [insalubridadeForm, setInsalubridadeForm] = useState({
    salarioMinimo: "1412",
    grau: "20",
    meses: "12",
  });

  const [periculosidadeForm, setPericulosidadeForm] = useState({
    salarioBase: "",
    meses: "12",
  });

  const [correcaoForm, setCorrecaoForm] = useState({
    valorOriginal: "",
    dataInicial: "",
    dataFinal: "",
    indice: "ipca",
    juros: "1",
  });

  const [honorariosForm, setHonorariosForm] = useState({
    valorCausa: "",
    percentual: "15",
  });

  const [pensaoForm, setPensaoForm] = useState({
    rendimentoMensal: "",
    percentual: "30",
    qtdFilhos: "1",
  });

  const [partilhaForm, setPartilhaForm] = useState({
    valorTotal: "",
    percentual: "50",
  });

  const [tempoContribForm, setTempoContribForm] = useState({
    dataInicio: "",
    dataFim: "",
  });

  const [resultado, setResultado] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    loadCalculos();
  }, [user]);

  const loadCalculos = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("legal_calculations")
      .select("*")
      .eq("advogado_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setCalculos((data as Calculo[]) || []);
    setLoading(false);
  };

  const calcularVerbasRescisorias = () => {
    const salario = parseFloat(verbasForm.salario) || 0;
    const meses = parseInt(verbasForm.mesesTrabalhados) || 0;
    const feriasVencidas = parseInt(verbasForm.feriasVencidas) || 0;

    // Saldo de salário (considerando meio mês)
    const saldoSalario = salario / 2;

    // 13º proporcional
    const decimoTerceiro = (salario / 12) * (meses % 12 || 12);

    // Férias proporcionais + 1/3
    const feriasProp = ((salario / 12) * (meses % 12 || 12));
    const tercoFerias = feriasProp / 3;
    const feriasTotal = feriasProp + tercoFerias;

    // Férias vencidas + 1/3
    const feriasVencidasTotal = feriasVencidas > 0 ? (salario + salario / 3) * feriasVencidas : 0;

    // Aviso prévio
    const anosCompletos = Math.floor(meses / 12);
    const diasAviso = 30 + Math.min(anosCompletos * 3, 60);
    const avisoPrevio = verbasForm.avisoPrevio === "indenizado" ? (salario / 30) * diasAviso : 0;

    // FGTS
    const fgtsDepositado = salario * 0.08 * meses;
    const multaFgts = verbasForm.motivoRescisao === "sem_justa_causa" ? fgtsDepositado * 0.4 : 0;

    const total = saldoSalario + decimoTerceiro + feriasTotal + feriasVencidasTotal + avisoPrevio + multaFgts;

    const res = {
      saldoSalario,
      decimoTerceiro,
      feriasProp,
      tercoFerias,
      feriasVencidasTotal,
      avisoPrevio,
      diasAviso,
      fgtsDepositado,
      multaFgts,
      total,
    };

    setResultado(res);
    return res;
  };

  const calcularHorasExtras = () => {
    const salarioBase = parseFloat(horasExtrasForm.salarioBase) || 0;
    const horasMensais = parseFloat(horasExtrasForm.horasMensais) || 220;
    const qtdHoras = parseFloat(horasExtrasForm.qtdHorasExtras) || 0;
    const percentual = parseFloat(horasExtrasForm.percentual) || 50;

    const valorHora = salarioBase / horasMensais;
    const valorHoraExtra = valorHora * (1 + percentual / 100);
    const totalHorasExtras = valorHoraExtra * qtdHoras;

    // DSR sobre horas extras
    const dsrHorasExtras = totalHorasExtras / 6;

    const res = {
      valorHora,
      valorHoraExtra,
      totalHorasExtras,
      dsrHorasExtras,
      total: totalHorasExtras + dsrHorasExtras,
    };

    setResultado(res);
    return res;
  };

  const calcularCorrecaoMonetaria = () => {
    const valor = parseFloat(correcaoForm.valorOriginal) || 0;
    const juros = parseFloat(correcaoForm.juros) || 1;

    // Simulação de correção (em produção, usar API de índices)
    const dataInicial = new Date(correcaoForm.dataInicial);
    const dataFinal = new Date(correcaoForm.dataFinal);
    const meses = Math.max(1, Math.floor((dataFinal.getTime() - dataInicial.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    // Taxas simuladas por índice
    const taxas: Record<string, number> = {
      ipca: 0.005,
      inpc: 0.0048,
      igpm: 0.006,
      selic: 0.0075,
    };

    const taxaCorrecao = taxas[correcaoForm.indice] || 0.005;
    const correcaoAcumulada = Math.pow(1 + taxaCorrecao, meses) - 1;
    const valorCorrigido = valor * (1 + correcaoAcumulada);

    const jurosAcumulados = valor * (juros / 100) * meses;
    const total = valorCorrigido + jurosAcumulados;

    const res = {
      valorOriginal: valor,
      meses,
      correcaoAcumulada: correcaoAcumulada * 100,
      valorCorrigido,
      jurosAcumulados,
      total,
    };

    setResultado(res);
    return res;
  };

  const calcularPensao = () => {
    const rendimento = parseFloat(pensaoForm.rendimentoMensal) || 0;
    const percentual = parseFloat(pensaoForm.percentual) || 30;
    const filhos = parseInt(pensaoForm.qtdFilhos) || 1;

    const pensaoTotal = rendimento * (percentual / 100);
    const pensaoPorFilho = pensaoTotal / filhos;
    const pensaoAnual = pensaoTotal * 12;
    const decimoTerceiro = pensaoTotal;

    const res = {
      rendimentoBase: rendimento,
      percentual,
      pensaoMensal: pensaoTotal,
      pensaoPorFilho,
      pensaoAnual,
      decimoTerceiro,
      totalAnual: pensaoAnual + decimoTerceiro,
    };

    setResultado(res);
    return res;
  };

  const calcularNoturno = () => {
    const salario = parseFloat(noturnoForm.salarioBase) || 0;
    const horasNoturnas = parseFloat(noturnoForm.horasNoturnas) || 0;
    const valorHora = salario / 220;
    const adicionalNoturno = valorHora * 0.20 * horasNoturnas;
    const horaReduzida = horasNoturnas * (52.5 / 60); // Hora noturna = 52:30
    const diferencaHoras = horasNoturnas - horaReduzida;
    const valorDiferenca = diferencaHoras * valorHora * 1.20;
    
    const res = {
      valorHoraNormal: valorHora,
      adicional20Percent: adicionalNoturno,
      horasReduzidas: horaReduzida,
      diferencaHoras,
      valorDiferenca,
      total: adicionalNoturno + valorDiferenca,
    };
    setResultado(res);
    return res;
  };

  const calcularInsalubridade = () => {
    const salarioMinimo = parseFloat(insalubridadeForm.salarioMinimo) || 1412;
    const grau = parseFloat(insalubridadeForm.grau) || 20;
    const meses = parseInt(insalubridadeForm.meses) || 12;
    const adicionalMensal = salarioMinimo * (grau / 100);
    const totalPeriodo = adicionalMensal * meses;
    const reflexo13 = adicionalMensal;
    const reflexoFerias = adicionalMensal + (adicionalMensal / 3);
    
    const res = {
      baseCalculo: salarioMinimo,
      percentualGrau: grau,
      adicionalMensal,
      totalPeriodo,
      reflexo13,
      reflexoFerias,
      total: totalPeriodo + reflexo13 + reflexoFerias,
    };
    setResultado(res);
    return res;
  };

  const calcularPericulosidade = () => {
    const salario = parseFloat(periculosidadeForm.salarioBase) || 0;
    const meses = parseInt(periculosidadeForm.meses) || 12;
    const adicionalMensal = salario * 0.30;
    const totalPeriodo = adicionalMensal * meses;
    const reflexo13 = adicionalMensal;
    const reflexoFerias = adicionalMensal + (adicionalMensal / 3);
    
    const res = {
      salarioBase: salario,
      adicional30Percent: adicionalMensal,
      totalPeriodo,
      reflexo13,
      reflexoFerias,
      total: totalPeriodo + reflexo13 + reflexoFerias,
    };
    setResultado(res);
    return res;
  };

  const calcularHonorarios = () => {
    const valorCausa = parseFloat(honorariosForm.valorCausa) || 0;
    const percentual = parseFloat(honorariosForm.percentual) || 15;
    const honorarios = valorCausa * (percentual / 100);
    
    const res = {
      valorCausa,
      percentual,
      honorariosCalculados: honorarios,
      minimo10Percent: valorCausa * 0.10,
      maximo20Percent: valorCausa * 0.20,
      total: honorarios,
    };
    setResultado(res);
    return res;
  };

  const calcularPartilha = () => {
    const valorTotal = parseFloat(partilhaForm.valorTotal) || 0;
    const percentual = parseFloat(partilhaForm.percentual) || 50;
    const meacao = valorTotal * (percentual / 100);
    
    const res = {
      patrimonioTotal: valorTotal,
      percentualMeacao: percentual,
      valorMeacao: meacao,
      valorOutraParte: valorTotal - meacao,
      total: meacao,
    };
    setResultado(res);
    return res;
  };

  const calcularTempoContribuicao = () => {
    const dataInicio = new Date(tempoContribForm.dataInicio);
    const dataFim = new Date(tempoContribForm.dataFim);
    const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const anos = Math.floor(diffDays / 365);
    const meses = Math.floor((diffDays % 365) / 30);
    const dias = diffDays % 30;
    
    const res = {
      totalDias: diffDays,
      anos,
      meses,
      dias,
      tempoFormatado: `${anos} anos, ${meses} meses e ${dias} dias`,
      total: diffDays,
    };
    setResultado(res);
    return res;
  };

  const salvarCalculo = async (titulo: string, tipo: string, dados: any, res: any) => {
    if (!user) return;

    const { error } = await supabase
      .from("legal_calculations")
      .insert({
        advogado_id: user.id,
        titulo,
        tipo_calculo: tipo,
        dados_entrada: dados,
        resultado: res,
      });

    if (!error) {
      toast({ title: "Cálculo salvo!" });
      loadCalculos();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <Calculator className="w-7 h-7 text-primary" />
            Cálculos Jurídicos
          </h1>
          <p className="text-muted-foreground mt-1">
            Realize cálculos trabalhistas, cíveis, previdenciários e mais
          </p>
        </div>

        <Button variant="outline" onClick={() => setShowHistorico(true)} className="gap-2">
          <History className="w-4 h-4" />
          Histórico
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{calculos.length}</p>
            <p className="text-sm text-muted-foreground">Cálculos Salvos</p>
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
            <p className="text-2xl font-bold text-foreground">
              {totalCalculos}
            </p>
            <p className="text-sm text-muted-foreground">Tipos Disponíveis</p>
          </div>
        </motion.div>
      </div>

      {/* Calculator Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-2">
          <TabsTrigger value="trabalhista">Trabalhista</TabsTrigger>
          <TabsTrigger value="civel">Cível</TabsTrigger>
          <TabsTrigger value="familia">Família</TabsTrigger>
          <TabsTrigger value="previdenciario">Previdenciário</TabsTrigger>
        </TabsList>

        {/* Trabalhista */}
        <TabsContent value="trabalhista" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Verbas Rescisórias */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Verbas Rescisórias
              </h3>

              <div className="space-y-4">
                <div>
                  <Label>Salário Base</Label>
                  <Input
                    type="number"
                    value={verbasForm.salario}
                    onChange={(e) => setVerbasForm({ ...verbasForm, salario: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Meses Trabalhados</Label>
                  <Input
                    type="number"
                    value={verbasForm.mesesTrabalhados}
                    onChange={(e) => setVerbasForm({ ...verbasForm, mesesTrabalhados: e.target.value })}
                    placeholder="12"
                  />
                </div>

                <div>
                  <Label>Férias Vencidas</Label>
                  <Select
                    value={verbasForm.feriasVencidas}
                    onValueChange={(v) => setVerbasForm({ ...verbasForm, feriasVencidas: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Nenhuma</SelectItem>
                      <SelectItem value="1">1 período</SelectItem>
                      <SelectItem value="2">2 períodos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Aviso Prévio</Label>
                  <Select
                    value={verbasForm.avisoPrevio}
                    onValueChange={(v) => setVerbasForm({ ...verbasForm, avisoPrevio: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trabalhado">Trabalhado</SelectItem>
                      <SelectItem value="indenizado">Indenizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Motivo da Rescisão</Label>
                  <Select
                    value={verbasForm.motivoRescisao}
                    onValueChange={(v) => setVerbasForm({ ...verbasForm, motivoRescisao: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem_justa_causa">Sem Justa Causa</SelectItem>
                      <SelectItem value="com_justa_causa">Com Justa Causa</SelectItem>
                      <SelectItem value="pedido_demissao">Pedido de Demissão</SelectItem>
                      <SelectItem value="acordo">Acordo (Lei 13.467)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={calcularVerbasRescisorias} className="w-full">
                  Calcular
                </Button>
              </div>
            </div>

            {/* Horas Extras */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Horas Extras
              </h3>

              <div className="space-y-4">
                <div>
                  <Label>Salário Base</Label>
                  <Input
                    type="number"
                    value={horasExtrasForm.salarioBase}
                    onChange={(e) => setHorasExtrasForm({ ...horasExtrasForm, salarioBase: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Horas Mensais (Jornada)</Label>
                  <Input
                    type="number"
                    value={horasExtrasForm.horasMensais}
                    onChange={(e) => setHorasExtrasForm({ ...horasExtrasForm, horasMensais: e.target.value })}
                    placeholder="220"
                  />
                </div>

                <div>
                  <Label>Quantidade de Horas Extras</Label>
                  <Input
                    type="number"
                    value={horasExtrasForm.qtdHorasExtras}
                    onChange={(e) => setHorasExtrasForm({ ...horasExtrasForm, qtdHorasExtras: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>Percentual Adicional</Label>
                  <Select
                    value={horasExtrasForm.percentual}
                    onValueChange={(v) => setHorasExtrasForm({ ...horasExtrasForm, percentual: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50% (Normal)</SelectItem>
                      <SelectItem value="100">100% (Feriado/Domingo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={calcularHorasExtras} className="w-full">
                  Calcular
                </Button>
              </div>
            </div>

            {/* Adicional Noturno */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Adicional Noturno
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Salário Base</Label>
                  <Input
                    type="number"
                    value={noturnoForm.salarioBase}
                    onChange={(e) => setNoturnoForm({ ...noturnoForm, salarioBase: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Horas Noturnas (22h-5h)</Label>
                  <Input
                    type="number"
                    value={noturnoForm.horasNoturnas}
                    onChange={(e) => setNoturnoForm({ ...noturnoForm, horasNoturnas: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <Button onClick={calcularNoturno} className="w-full">Calcular</Button>
              </div>
            </div>

            {/* Insalubridade */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Adicional de Insalubridade
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Salário Mínimo (Base)</Label>
                  <Input
                    type="number"
                    value={insalubridadeForm.salarioMinimo}
                    onChange={(e) => setInsalubridadeForm({ ...insalubridadeForm, salarioMinimo: e.target.value })}
                    placeholder="1412"
                  />
                </div>
                <div>
                  <Label>Grau de Insalubridade</Label>
                  <Select
                    value={insalubridadeForm.grau}
                    onValueChange={(v) => setInsalubridadeForm({ ...insalubridadeForm, grau: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10% - Mínimo</SelectItem>
                      <SelectItem value="20">20% - Médio</SelectItem>
                      <SelectItem value="40">40% - Máximo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meses de Exposição</Label>
                  <Input
                    type="number"
                    value={insalubridadeForm.meses}
                    onChange={(e) => setInsalubridadeForm({ ...insalubridadeForm, meses: e.target.value })}
                    placeholder="12"
                  />
                </div>
                <Button onClick={calcularInsalubridade} className="w-full">Calcular</Button>
              </div>
            </div>

            {/* Periculosidade */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Adicional de Periculosidade
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Salário Base</Label>
                  <Input
                    type="number"
                    value={periculosidadeForm.salarioBase}
                    onChange={(e) => setPericulosidadeForm({ ...periculosidadeForm, salarioBase: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Meses de Exposição</Label>
                  <Input
                    type="number"
                    value={periculosidadeForm.meses}
                    onChange={(e) => setPericulosidadeForm({ ...periculosidadeForm, meses: e.target.value })}
                    placeholder="12"
                  />
                </div>
                <Button onClick={calcularPericulosidade} className="w-full">Calcular</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Cível */}
        <TabsContent value="civel" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                Correção Monetária + Juros
              </h3>

              <div className="space-y-4">
                <div>
                  <Label>Valor Original</Label>
                  <Input
                    type="number"
                    value={correcaoForm.valorOriginal}
                    onChange={(e) => setCorrecaoForm({ ...correcaoForm, valorOriginal: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={correcaoForm.dataInicial}
                    onChange={(e) => setCorrecaoForm({ ...correcaoForm, dataInicial: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={correcaoForm.dataFinal}
                    onChange={(e) => setCorrecaoForm({ ...correcaoForm, dataFinal: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Índice de Correção</Label>
                  <Select
                    value={correcaoForm.indice}
                    onValueChange={(v) => setCorrecaoForm({ ...correcaoForm, indice: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ipca">IPCA</SelectItem>
                      <SelectItem value="inpc">INPC</SelectItem>
                      <SelectItem value="igpm">IGP-M</SelectItem>
                      <SelectItem value="selic">SELIC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Juros de Mora (% a.m.)</Label>
                  <Input
                    type="number"
                    value={correcaoForm.juros}
                    onChange={(e) => setCorrecaoForm({ ...correcaoForm, juros: e.target.value })}
                    placeholder="1"
                  />
                </div>

                <Button onClick={calcularCorrecaoMonetaria} className="w-full">
                  Calcular
                </Button>
              </div>
            </div>

            {/* Honorários Advocatícios */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                Honorários Advocatícios
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Valor da Causa</Label>
                  <Input
                    type="number"
                    value={honorariosForm.valorCausa}
                    onChange={(e) => setHonorariosForm({ ...honorariosForm, valorCausa: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Percentual de Honorários</Label>
                  <Select
                    value={honorariosForm.percentual}
                    onValueChange={(v) => setHonorariosForm({ ...honorariosForm, percentual: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="15">15%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={calcularHonorarios} className="w-full">Calcular</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Família */}
        <TabsContent value="familia" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Pensão Alimentícia
              </h3>

              <div className="space-y-4">
                <div>
                  <Label>Rendimento Mensal do Alimentante</Label>
                  <Input
                    type="number"
                    value={pensaoForm.rendimentoMensal}
                    onChange={(e) => setPensaoForm({ ...pensaoForm, rendimentoMensal: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Percentual</Label>
                  <Select
                    value={pensaoForm.percentual}
                    onValueChange={(v) => setPensaoForm({ ...pensaoForm, percentual: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="33">33% (1/3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Número de Filhos</Label>
                  <Input
                    type="number"
                    value={pensaoForm.qtdFilhos}
                    onChange={(e) => setPensaoForm({ ...pensaoForm, qtdFilhos: e.target.value })}
                    placeholder="1"
                  />
                </div>

                <Button onClick={calcularPensao} className="w-full">
                  Calcular
                </Button>
              </div>
            </div>

            {/* Partilha de Bens */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Partilha de Bens
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Valor Total do Patrimônio</Label>
                  <Input
                    type="number"
                    value={partilhaForm.valorTotal}
                    onChange={(e) => setPartilhaForm({ ...partilhaForm, valorTotal: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Percentual de Meação</Label>
                  <Select
                    value={partilhaForm.percentual}
                    onValueChange={(v) => setPartilhaForm({ ...partilhaForm, percentual: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50% (Meação Padrão)</SelectItem>
                      <SelectItem value="60">60%</SelectItem>
                      <SelectItem value="70">70%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={calcularPartilha} className="w-full">Calcular</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Previdenciário */}
        <TabsContent value="previdenciario" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Tempo de Contribuição
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={tempoContribForm.dataInicio}
                    onChange={(e) => setTempoContribForm({ ...tempoContribForm, dataInicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={tempoContribForm.dataFim}
                    onChange={(e) => setTempoContribForm({ ...tempoContribForm, dataFim: e.target.value })}
                  />
                </div>
                <Button onClick={calcularTempoContribuicao} className="w-full">Calcular</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Resultado */}
      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-6 bg-gradient-to-r from-primary/5 to-primary/10"
        >
          <h3 className="font-semibold text-lg mb-4">Resultado do Cálculo</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(resultado).map(([key, value]) => (
              <div key={key} className="bg-background/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </p>
                <p className="text-lg font-semibold">
                  {typeof value === "number" 
                    ? key.includes("percent") || key.includes("Percent")
                      ? `${value.toFixed(2)}%`
                      : formatCurrency(value)
                    : value}
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                const titulo = prompt("Nome do cálculo:");
                if (titulo) {
                  salvarCalculo(titulo, activeTab, {}, resultado);
                }
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Cálculo
            </Button>
          </div>
        </motion.div>
      )}

      {/* Histórico Modal */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Cálculos</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {calculos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum cálculo salvo ainda.
              </p>
            ) : (
              calculos.map((calc) => (
                <div key={calc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{calc.titulo}</h4>
                    <Badge variant="secondary">{calc.tipo_calculo}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(calc.created_at || "").toLocaleDateString("pt-BR")}
                  </p>
                  {calc.resultado?.total && (
                    <p className="text-lg font-semibold text-primary mt-2">
                      Total: {formatCurrency(calc.resultado.total)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
