import { useState } from "react";
import { useStore, formatBRL } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Flame, Cookie, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function Calendario() {
  const s = useStore();
  const [selected, setSelected] = useState<Date>(new Date());

  const batchDates = s.batches.map((b) => new Date(b.date));
  const dayBatches = s.batches.filter((b) => sameDay(new Date(b.date), selected));

  const totals = dayBatches.reduce(
    (acc, b) => ({
      empadas: acc.empadas + b.empadasQty,
      revenue: acc.revenue + b.revenue,
      cost: acc.cost + b.totalCost,
    }),
    { empadas: 0, revenue: 0, cost: 0 }
  );
  const profit = totals.revenue - totals.cost;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          <CalendarDays className="h-7 w-7 text-primary" /> Calendário
        </h2>
        <p className="text-muted-foreground text-lg">Veja o que foi produzido em cada dia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
        <Card className="p-3 shadow-[var(--shadow-soft)] flex justify-center">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => d && setSelected(d)}
            locale={ptBR}
            modifiers={{ hasBatch: batchDates }}
            modifiersClassNames={{
              hasBatch:
                "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary",
            }}
            className={cn("p-3 pointer-events-auto")}
          />
        </Card>

        <div className="space-y-4">
          <Card className="p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Resumo do dia</p>
            <p className="text-2xl font-bold mt-1">
              {selected.toLocaleDateString("pt-BR", {
                weekday: "long", day: "2-digit", month: "long",
              })}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <Stat icon={<Cookie className="h-5 w-5" />} label="Empadas" value={String(totals.empadas)} tone="primary" />
              <Stat icon={<Flame className="h-5 w-5" />} label="Fornadas" value={String(dayBatches.length)} tone="accent" />
              <Stat icon={<TrendingUp className="h-5 w-5" />} label="Receita" value={formatBRL(totals.revenue)} tone="success" />
              <Stat icon={<TrendingDown className="h-5 w-5" />} label="Custo" value={formatBRL(totals.cost)} tone="destructive" />
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-muted-foreground">Lucro do dia</span>
              <span className={`text-2xl font-bold ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                {formatBRL(profit)}
              </span>
            </div>
          </Card>

          {dayBatches.length === 0 ? (
            <Card className="p-8 text-center shadow-[var(--shadow-soft)]">
              <p className="text-muted-foreground">Nenhuma fornada neste dia</p>
            </Card>
          ) : (
            <Card className="p-5 shadow-[var(--shadow-soft)]">
              <h3 className="font-semibold text-lg mb-3">Fornadas do dia</h3>
              <ul className="divide-y divide-border">
                {dayBatches.map((b) => (
                  <li key={b.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                        <Flame className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{b.empadasQty} empadas</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(b.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Receita</p>
                      <p className="font-semibold text-success">{formatBRL(b.revenue)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: {
  icon: React.ReactNode; label: string; value: string;
  tone: "primary" | "success" | "destructive" | "accent";
}) {
  const cls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    accent: "bg-accent/40 text-accent-foreground",
  }[tone];
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className={`h-9 w-9 rounded-full flex items-center justify-center mb-2 ${cls}`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold leading-tight">{value}</p>
    </div>
  );
}
