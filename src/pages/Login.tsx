import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, senha);

    if (result.ok) {
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      });

      // Get user type from storage to redirect
      const userStr = localStorage.getItem("socialjuris_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        switch (user.tipo) {
          case "cliente":
            navigate("/dashboard/cliente");
            break;
          case "advogado":
            navigate("/dashboard/advogado");
            break;
          case "admin":
            navigate("/dashboard/admin");
            break;
          default:
            navigate("/");
        }
      }
    } else {
      setError(result.error || "Erro ao fazer login");
    }

    setLoading(false);
  };

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
            Bem-vindo de volta
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Entre com suas credenciais
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
            </div>

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
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            Não tem conta?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Cadastre-se
            </Link>
          </p>

        </div>
      </motion.div>
    </div>
  );
};

export default Login;
