import { useStore, formatBRL, actions, lowStockIngredients, formatQty, startOfToday, startOfWeek, isAfterOrEqual } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wallet, Trash2, AlertTriangle } from "lucide-react";

export function Dashboard() {
  const s = useStore();
  const today = startOfToday();
  const weekStart = startOfWeek();
  const revenue = s.finance
    .filter((f) => f.type === "in" && isAfterOrEqual(f.date, today))
    .reduce((a, b) => a + b.amount, 0);
  const cost = s.finance
    .filter((f) => f.type === "out" && isAfterOrEqual(f.date, weekStart))
    .reduce((a, b) => a + b.amount, 0);
  const profit = revenue - cost;
  const lows = lowStockIngredients(s.ingredients);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Resumo financeiro</h2>
        <p className="text-muted-foreground text-lg">Acompanhe a saúde do negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Receita de hoje"
          value={formatBRL(revenue)}
          icon={<TrendingUp className="h-6 w-6" />}
          tone="success"
          hint="reinicia todo dia"
        />
        <StatCard
          label="Custos da semana"
          value={formatBRL(cost)}
          icon={<TrendingDown className="h-6 w-6" />}
          tone="destructive"
          hint="reinicia toda segunda"
        />
        <StatCard
          label="Lucro de hoje"
          value={formatBRL(profit)}
          icon={<Wallet className="h-6 w-6" />}
          tone={profit >= 0 ? "primary" : "destructive"}
          highlight
          hint="receita do dia − custos da semana"
        />
      </div>

      {lows.length > 0 && (
        <Card className="p-5 shadow-[var(--shadow-soft)] border-l-4 border-l-destructive/70 bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-lg">Alertas de estoque</h3>
          </div>
          <ul className="flex flex-wrap gap-2">
            {lows.map((i) => (
              <li
                key={i.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-destructive/30 text-sm"
              >
                <span className="font-medium">{i.name}</span>
                <span className="text-muted-foreground">
                  resta {formatQty(i.currentQty, i.unit)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6 shadow-[var(--shadow-soft)]">
        <h3 className="text-xl font-semibold mb-4">Histórico de Entradas e Saídas</h3>
        {s.finance.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            Nenhuma movimentação ainda. Use o botão <span className="font-semibold">+</span> para registrar uma venda ou gasto.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {[...s.finance].reverse().map((f) => (
              <li key={f.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${
                    f.type === "in" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  }`}>
                    {f.type === "in" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{f.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(f.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg ${f.type === "in" ? "text-success" : "text-destructive"}`}>
                    {f.type === "in" ? "+" : "−"} {formatBRL(f.amount)}
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => actions.removeFinance(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, tone, highlight, hint }: {
  label: string; value: string; icon: React.ReactNode;
  tone: "success" | "destructive" | "primary"; highlight?: boolean; hint?: string;
}) {
  const toneClasses = {
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    primary: "bg-primary/10 text-primary",
  }[tone];
  return (
    <Card className={`p-6 shadow-[var(--shadow-soft)] ${highlight ? "ring-2 ring-primary/30" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${toneClasses}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </Card>
  );
}
