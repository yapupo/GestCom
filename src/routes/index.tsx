import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, Package, Flame, NotebookPen, CalendarDays, HandCoins } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { Estoque } from "@/components/Estoque";
import { Fornadas } from "@/components/Fornadas";
import { Notas } from "@/components/Notas";
import { Calendario } from "@/components/Calendario";
import { Fiado } from "@/components/Fiado";
import { QuickActionFab } from "@/components/QuickActionFab";
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

const TABS: { id: Tab; label: string; short: string; icon: typeof Wallet }[] = [
  { id: "dashboard", label: "Financeiro", short: "Caixa", icon: Wallet },
  { id: "estoque", label: "Estoque", short: "Estoque", icon: Package },
  { id: "fornadas", label: "Fornadas", short: "Fornadas", icon: Flame },
  { id: "fiado", label: "Fiado", short: "Fiado", icon: HandCoins },
  { id: "calendario", label: "Calendário", short: "Agenda", icon: CalendarDays },
  { id: "notas", label: "Notas", short: "Notas", icon: NotebookPen },
];

function Index() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen pb-28 md:pb-8">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] overflow-hidden flex items-center justify-center">
            <img src={betoneiraLogo} alt="Empada do Betoneira" className="h-11 w-11 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Empada do Betoneira</h1>
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

      <QuickActionFab />

      <nav className="fixed bottom-0 inset-x-0 md:static md:max-w-5xl md:mx-auto md:px-4 md:pb-6 z-20">
        <div className="bg-card/95 backdrop-blur border-t md:border md:rounded-2xl border-border shadow-[var(--shadow-warm)] md:mt-4">
          <div className="grid grid-cols-5 gap-1 p-2">
            {TABS.map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-semibold">{t.short}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
