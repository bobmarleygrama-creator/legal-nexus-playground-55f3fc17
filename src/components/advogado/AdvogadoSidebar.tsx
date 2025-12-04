import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Users, FileText, Calculator, Brain, FolderOpen, 
  ChevronLeft, ChevronRight, Lock, Scale, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
  premium: boolean;
}

const sidebarItems: SidebarItem[] = [
  { icon: Users, label: "Minha Carteira", href: "/dashboard/advogado/clientes", premium: true },
  { icon: FolderOpen, label: "Gestão de Processos", href: "/dashboard/advogado/processos", premium: true },
  { icon: FileText, label: "Gerador de Peças", href: "/dashboard/advogado/documentos", premium: true },
  { icon: Calculator, label: "Cálculos Jurídicos", href: "/dashboard/advogado/calculos", premium: true },
  { icon: Brain, label: "IA Jurídica", href: "/dashboard/advogado/ia", premium: true },
];

export function AdvogadoSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();
  
  const isPremium = profile?.premium_ativo === true;

  return (
    <aside
      className={cn(
        "bg-sidebar-background border-r border-sidebar-border flex flex-col transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/dashboard/advogado" className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-hero rounded-lg flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-heading font-bold text-sidebar-foreground">SocialJuris</span>
              <p className="text-xs text-sidebar-foreground/60">Painel Premium</p>
            </div>
          )}
        </Link>
      </div>

      {/* Premium Status */}
      {!collapsed && (
        <div className={cn(
          "mx-3 mt-4 p-3 rounded-lg border",
          isPremium 
            ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30" 
            : "bg-muted/50 border-border"
        )}>
          <div className="flex items-center gap-2">
            <Crown className={cn("w-5 h-5", isPremium ? "text-amber-500" : "text-muted-foreground")} />
            <div>
              <p className={cn("text-sm font-medium", isPremium ? "text-amber-700" : "text-muted-foreground")}>
                {isPremium ? "Premium Ativo" : "Premium Bloqueado"}
              </p>
              {!isPremium && (
                <p className="text-xs text-muted-foreground">R$ 79,90/mês</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          const isLocked = item.premium && !isPremium;
          
          const ItemContent = (
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : isLocked
                  ? "text-sidebar-foreground/40 cursor-not-allowed"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isLocked && "opacity-50")} />
              {!collapsed && (
                <>
                  <span className={cn("flex-1 text-sm font-medium", isLocked && "opacity-50")}>
                    {item.label}
                  </span>
                  {isLocked && (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </>
              )}
              {collapsed && isLocked && (
                <Lock className="w-3 h-3 absolute -top-1 -right-1 text-muted-foreground" />
              )}
            </div>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  {isLocked ? (
                    <div>{ItemContent}</div>
                  ) : (
                    <Link to={item.href}>{ItemContent}</Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  {item.label}
                  {isLocked && <Lock className="w-3 h-3" />}
                </TooltipContent>
              </Tooltip>
            );
          }

          return isLocked ? (
            <div key={item.href}>{ItemContent}</div>
          ) : (
            <Link key={item.href} to={item.href}>{ItemContent}</Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
}
