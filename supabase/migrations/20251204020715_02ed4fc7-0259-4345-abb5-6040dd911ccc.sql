-- Enum para tipo de usuário
CREATE TYPE public.user_type AS ENUM ('cliente', 'advogado', 'admin');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  tipo user_type NOT NULL DEFAULT 'cliente',
  whatsapp TEXT,
  oab_numero TEXT,
  oab_status TEXT DEFAULT 'pendente',
  premium_ativo BOOLEAN DEFAULT FALSE,
  saldo_lcoin INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de clientes cadastrados pelo advogado
CREATE TABLE public.lawyer_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  data_nascimento DATE,
  profissao TEXT,
  estado_civil TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de processos/casos
CREATE TABLE public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.lawyer_clients(id) ON DELETE SET NULL,
  numero_processo TEXT,
  tipo_acao TEXT NOT NULL,
  vara TEXT,
  comarca TEXT,
  estado TEXT,
  parte_contraria TEXT,
  valor_causa DECIMAL(15,2),
  status TEXT DEFAULT 'em_andamento',
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de prazos processuais
CREATE TABLE public.process_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  advogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_prazo DATE NOT NULL,
  alerta_enviado BOOLEAN DEFAULT FALSE,
  concluido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de documentos gerados
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  processo_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.lawyer_clients(id) ON DELETE SET NULL,
  tipo_documento TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cálculos jurídicos salvos
CREATE TABLE public.legal_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  processo_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  tipo_calculo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  dados_entrada JSONB,
  resultado JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de análises de IA
CREATE TABLE public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  processo_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  tipo_analise TEXT NOT NULL,
  documento_nome TEXT,
  documento_url TEXT,
  analise TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações L-COIN
CREATE TABLE public.lcoin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'credito', 'debito'
  valor INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lcoin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins podem ver e editar todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

-- RLS para lawyer_clients (somente o advogado dono)
CREATE POLICY "Lawyers can manage own clients" ON public.lawyer_clients
  FOR ALL USING (auth.uid() = advogado_id);

-- RLS para processes
CREATE POLICY "Lawyers can manage own processes" ON public.processes
  FOR ALL USING (auth.uid() = advogado_id);

-- RLS para deadlines
CREATE POLICY "Lawyers can manage own deadlines" ON public.process_deadlines
  FOR ALL USING (auth.uid() = advogado_id);

-- RLS para documents
CREATE POLICY "Lawyers can manage own documents" ON public.legal_documents
  FOR ALL USING (auth.uid() = advogado_id);

-- RLS para calculations
CREATE POLICY "Lawyers can manage own calculations" ON public.legal_calculations
  FOR ALL USING (auth.uid() = advogado_id);

-- RLS para AI analyses
CREATE POLICY "Lawyers can manage own analyses" ON public.ai_analyses
  FOR ALL USING (auth.uid() = advogado_id);

-- RLS para transactions
CREATE POLICY "Lawyers can view own transactions" ON public.lcoin_transactions
  FOR SELECT USING (auth.uid() = advogado_id);

CREATE POLICY "Lawyers can insert own transactions" ON public.lcoin_transactions
  FOR INSERT WITH CHECK (auth.uid() = advogado_id);

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lawyer_clients_updated_at BEFORE UPDATE ON public.lawyer_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON public.processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();