import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet, Package, Flame, NotebookPen, Cookie, CalendarDays } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { Estoque } from "@/components/Estoque";
import { Fornadas } from "@/components/Fornadas";
import { Notas } from "@/components/Notas";
import { Calendario } from "@/components/Calendario";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Empadas da Tia — Gestão de Produção e Vendas" },
      { name: "description", content: "Sistema simples para gestão financeira, estoque, fornadas e notas da fábrica caseira de empadas." },
    ],
  }),
  component: Index,
});

type Tab = "dashboard" | "estoque" | "fornadas" | "calendario" | "notas";

const TABS: { id: Tab; label: string; short: string; icon: typeof Wallet }[] = [
  { id: "dashboard", label: "Financeiro", short: "Financeiro", icon: Wallet },
  { id: "estoque", label: "Estoque", short: "Estoque", icon: Package },
  { id: "fornadas", label: "Fornadas", short: "Fornadas", icon: Flame },
  { id: "calendario", label: "Calendário", short: "Agenda", icon: CalendarDays },
  { id: "notas", label: "Notas", short: "Notas", icon: NotebookPen },
];

function Index() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen pb-28 md:pb-8">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div
            className="h-11 w-11 rounded-full flex items-center justify-center text-primary-foreground shadow-[var(--shadow-warm)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Cookie className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Empadas da Tia</h1>
            <p className="text-xs text-muted-foreground">Produção & Vendas</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "dashboard" && <Dashboard />}
        {tab === "estoque" && <Estoque />}
        {tab === "fornadas" && <Fornadas />}
        {tab === "calendario" && <Calendario />}
        {tab === "notas" && <Notas />}
      </main>

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
