import { Link } from "react-router-dom";
import { Scale } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 gradient-hero rounded-lg flex items-center justify-center">
                <Scale className="w-6 h-6 text-background" />
              </div>
              <span className="text-xl font-heading font-bold">SocialJuris</span>
            </div>
            <p className="text-background/70 max-w-md">
              Conexão jurídica rápida e segura. Encontramos o advogado ideal para o seu caso em minutos.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Links</h4>
            <ul className="space-y-2 text-background/70">
              <li>
                <Link to="/" className="hover:text-background transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/register?tipo=cliente" className="hover:text-background transition-colors">
                  Para Clientes
                </Link>
              </li>
              <li>
                <Link to="/register?tipo=advogado" className="hover:text-background transition-colors">
                  Para Advogados
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-background/70">
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center text-background/60 text-sm">
          © {new Date().getFullYear()} SocialJuris. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
