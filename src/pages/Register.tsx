import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, Mail, Lock, User, Loader2, CheckCircle2, XCircle, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", 
  "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const Register = () => {
  const [searchParams] = useSearchParams();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [senha, setSenha] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState<"cliente" | "advogado">(
    (searchParams.get("tipo") as "cliente" | "advogado") || "cliente"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && profile) {
      switch (profile.tipo) {
        case "cliente":
          navigate("/dashboard/cliente");
          break;
        case "advogado":
          navigate("/dashboard/advogado");
          break;
        case "admin":
          navigate("/dashboard/admin");
          break;
      }
    }
  }, [profile, authLoading, navigate]);

  // Format WhatsApp
  const formatWhatsapp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Validations
  const isNomeValid = nome.length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isWhatsappValid = whatsapp.replace(/\D/g, "").length >= 10;
  const isSenhaValid = senha.length >= 8 && /[a-zA-Z]/.test(senha) && /[0-9]/.test(senha);
  const isCidadeValid = cidade.length >= 2;
  const isEstadoValid = estado.length === 2;
  const isFormValid = isNomeValid && isEmailValid && isSenhaValid && isCidadeValid && isEstadoValid && (tipo === "advogado" || isWhatsappValid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setError("");
    setLoading(true);

    const result = await register({ 
      nome, 
      email, 
      senha, 
      tipo, 
      whatsapp: tipo === "cliente" ? whatsapp : undefined,
      cidade,
      estado,
    });

    if (result.ok) {
      toast({
        title: "Cadastro realizado!",
        description: "Você já pode fazer login.",
      });
      navigate("/login");
    } else {
      setError(result.error || "Erro ao cadastrar");
    }

    setLoading(false);
  };

  const ValidationIndicator = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${isValid ? "text-green-600" : "text-muted-foreground"}`}>
      {isValid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {text}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 gradient-hero rounded-xl flex items-center justify-center">
              <Scale className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-heading font-bold text-foreground">SocialJuris</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Criar conta
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            {tipo === "cliente" 
              ? "Encontre o advogado ideal para seu caso"
              : "Conecte-se com clientes que precisam de você"
            }
          </p>

          {/* Facebook button mock */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 py-5"
            onClick={() => alert("TODO: Integração com Facebook")}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Entrar com Facebook
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou use seu email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {nome && <ValidationIndicator isValid={isNomeValid} text="Mínimo 3 caracteres" />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {email && <ValidationIndicator isValid={isEmailValid} text="Email válido" />}
            </div>

            {tipo === "cliente" && (
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
                    className="pl-10"
                    maxLength={15}
                    required
                  />
                </div>
                {whatsapp && <ValidationIndicator isValid={isWhatsappValid} text="WhatsApp válido (mínimo 10 dígitos)" />}
              </div>
            )}

            {/* Cidade e Estado */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="cidade"
                    type="text"
                    placeholder="Sua cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">UF</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(cidade || estado) && (
              <div className="flex gap-4">
                <ValidationIndicator isValid={isCidadeValid} text="Cidade válida" />
                <ValidationIndicator isValid={isEstadoValid} text="UF selecionado" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {senha && (
                <div className="space-y-1">
                  <ValidationIndicator isValid={senha.length >= 8} text="Mínimo 8 caracteres" />
                  <ValidationIndicator isValid={/[a-zA-Z]/.test(senha)} text="Pelo menos uma letra" />
                  <ValidationIndicator isValid={/[0-9]/.test(senha)} text="Pelo menos um número" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Conta</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as "cliente" | "advogado")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">👤 Cliente - Preciso de um advogado</SelectItem>
                  <SelectItem value="advogado">⚖️ Advogado - Quero atender clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Cadastrar"
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Faça Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;