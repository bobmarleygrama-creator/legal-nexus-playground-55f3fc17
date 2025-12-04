import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { LogOut, Wallet, AlertCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AdvogadoSidebar } from "./AdvogadoSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AdvogadoLayout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile || profile.tipo !== "advogado") {
      navigate("/login");
    }
  }, [user, profile, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!profile) return null;

  return (
    <TooltipProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdvogadoSidebar />
        
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Header */}
          <header className="bg-card border-b border-border sticky top-0 z-40">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-foreground">
                  Olá, {profile.nome?.split(" ")[0]}!
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {/* OAB Status */}
                {profile.oab_status === "verificado" ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 bg-green-100 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    OAB Verificada
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-destructive bg-destructive/10 px-3 py-1.5 rounded-full">
                    <AlertCircle className="w-4 h-4" />
                    OAB Pendente
                  </span>
                )}

                {/* Wallet */}
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">
                    {profile.saldo_lcoin?.toFixed(2) || "0.00"} L-COIN
                  </span>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </Button>

                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
