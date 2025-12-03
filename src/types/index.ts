export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string;
  tipo: "cliente" | "advogado" | "admin";
  whatsapp?: string;
  origem?: string;
  oab_numero?: string;
  oab_estado?: string;
  oab_status?: "pendente" | "verificado";
  saldo_lxc?: number;
  criado_em: string;
}

export interface Caso {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_whatsapp?: string;
  advogado_id?: string;
  advogado_nome?: string;
  area_juridica: AreaJuridica;
  resumo: string;
  status: "novo" | "em_atendimento" | "concluido";
  criado_em: string;
  preco_cents: number;
  origem: string;
  oab_status?: "pendente" | "verificado";
  avaliacao?: number;
}

export interface Mensagem {
  id: string;
  caso_id: string;
  remetente_id: string;
  remetente_nome: string;
  texto: string;
  criado_em: string;
  tipo: "texto" | "imagem" | "arquivo" | "video";
}

export type AreaJuridica = 
  | "Trabalhista" 
  | "Família" 
  | "Cível" 
  | "Criminal" 
  | "Previdenciário" 
  | "Empresarial";

export const AREAS_JURIDICAS: { value: AreaJuridica; label: string; icon: string }[] = [
  { value: "Trabalhista", label: "Trabalhista", icon: "👔" },
  { value: "Família", label: "Família", icon: "👨‍👩‍👧‍👦" },
  { value: "Cível", label: "Cível", icon: "⚖️" },
  { value: "Criminal", label: "Criminal", icon: "🚓" },
  { value: "Previdenciário", label: "Previdenciário", icon: "👴" },
  { value: "Empresarial", label: "Empresarial", icon: "💼" },
];

export interface RegisterForm {
  nome: string;
  email: string;
  senha: string;
  tipo: "cliente" | "advogado";
  whatsapp?: string;
}

export interface LCoinTransaction {
  id: string;
  user_id: string;
  tipo: "compra" | "debito";
  valor: number;
  descricao: string;
  criado_em: string;
}
