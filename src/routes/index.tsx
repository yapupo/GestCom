import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Wallet, Package, Flame, NotebookPen, CalendarDays, HandCoins, Menu, ShoppingCart, LogOut, Loader2,
} from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { Estoque } from "@/components/Estoque";
import { Fornadas } from "@/components/Fornadas";
import { Notas } from "@/components/Notas";
import { Calendario } from "@/components/Calendario";
import { Fiado } from "@/components/Fiado";
import { QuickActionFab } from "@/components/QuickActionFab";
import { LoginScreen } from "@/components/LoginScreen";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import betoneiraLogo from "@/assets/betoneira.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Empada do Betoneira — Gestão de Produção e Vendas" },
      { name: "description", content: "Sistema simples para gestão financeira, estoque, fornadas e sabores da Empada do Betoneira." },
    ],
  }),
  component: Index,
});

type Tab = "dashboard" | "estoque" | "fornadas" | "fiado" | "calendario" | "notas";

const SECONDARY: { id: Tab; label: string; icon: typeof Wallet; description: string }[] = [
  { id: "fornadas", label: "Fornadas", icon: Flame, description: "Produção e lotes" },
  { id: "fiado", label: "Fiado", icon: HandCoins, description: "Vendas a receber" },
  { id: "calendario", label: "Calendário", icon: CalendarDays, description: "Histórico por dia" },
  { id: "notas", label: "Notas", icon: NotebookPen, description: "Receitas e lembretes" },
];

function Index() {
  const auth = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!auth.authorized) {
    return <LoginScreen />;
  }

  function go(t: Tab) {
    setTab(t);
    setMenuOpen(false);
  }

  const currentSecondary = SECONDARY.find((s) => s.id === tab);

  return (
    <div className="min-h-screen pb-28 md:pb-8">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Abrir menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-96 p-0">
              <SheetHeader className="p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-card border border-border overflow-hidden flex items-center justify-center">
                    <img src={betoneiraLogo} alt="" className="h-11 w-11 object-contain" />
                  </div>
                  <div className="text-left">
                    <SheetTitle className="text-lg">Empada do Betoneira</SheetTitle>
                    <p className="text-xs text-muted-foreground">Menu completo</p>
                  </div>
                </div>
              </SheetHeader>
              <nav className="p-3 space-y-1">
                <DrawerItem active={tab === "dashboard"} onClick={() => go("dashboard")} icon={Wallet} label="Financeiro" description="Caixa e movimentações" />
                <DrawerItem active={tab === "estoque"} onClick={() => go("estoque")} icon={Package} label="Estoque" description="Ingredientes e sabores" />
                <div className="my-3 border-t border-border" />
                {SECONDARY.map((s) => (
                  <DrawerItem
                    key={s.id}
                    active={tab === s.id}
                    onClick={() => go(s.id)}
                    icon={s.icon}
                    label={s.label}
                    description={s.description}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="h-11 w-11 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] overflow-hidden flex items-center justify-center">
            <img src={betoneiraLogo} alt="Empada do Betoneira" className="h-10 w-10 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight truncate">Empada do Betoneira</h1>
            <p className="text-xs text-muted-foreground">Produção & Vendas</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "dashboard" && <Dashboard />}
        {tab === "estoque" && <Estoque />}
        {tab === "fornadas" && <Fornadas />}
        {tab === "fiado" && <Fiado />}
        {tab === "calendario" && <Calendario />}
        {tab === "notas" && <Notas />}
      </main>

      <QuickActionFab open={saleOpen} onOpenChange={setSaleOpen} initialMode="sale" hideFab />
      <QuickActionFab />

      {/* Bottom nav: foco em 3 ações + menu */}
      <nav className="fixed bottom-0 inset-x-0 md:static md:max-w-5xl md:mx-auto md:px-4 md:pb-6 z-20">
        <div className="bg-card/95 backdrop-blur border-t md:border md:rounded-2xl border-border shadow-[var(--shadow-warm)] md:mt-4">
          <div className="grid grid-cols-4 gap-1 p-2 items-end">
            <NavBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={Wallet} label="Caixa" />
            <NavBtn active={tab === "estoque"} onClick={() => setTab("estoque")} icon={Package} label="Estoque" />
            <button
              onClick={() => setSaleOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-primary-foreground shadow-[var(--shadow-soft)] active:scale-95 transition-transform"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="text-[11px] font-bold">Nova Venda</span>
            </button>
            <NavBtn
              active={!!currentSecondary}
              onClick={() => setMenuOpen(true)}
              icon={currentSecondary?.icon ?? Menu}
              label={currentSecondary?.label ?? "Mais"}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}

function NavBtn({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: typeof Wallet; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all ${
        active ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

function DrawerItem({
  active, onClick, icon: Icon, label, description,
}: { active: boolean; onClick: () => void; icon: typeof Wallet; label: string; description: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
        active ? "bg-primary/15 text-primary" : "hover:bg-muted"
      }`}
    >
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
