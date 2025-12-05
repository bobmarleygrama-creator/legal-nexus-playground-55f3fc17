-- Create appointments/events table for legal calendar
CREATE TABLE public.legal_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  processo_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.lawyer_clients(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'compromisso', -- 'audiencia', 'prazo', 'reuniao', 'compromisso'
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE,
  local TEXT,
  lembrete_enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Lawyers can manage own appointments"
ON public.legal_appointments
FOR ALL
USING (auth.uid() = advogado_id);

-- Trigger for updated_at
CREATE TRIGGER update_legal_appointments_updated_at
BEFORE UPDATE ON public.legal_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();