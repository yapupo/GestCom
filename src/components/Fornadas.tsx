import { useStore, actions, formatBRL, formatQty } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Plus, Trash2, ChefHat } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export function Fornadas() {
  const s = useStore();
  const sorted = [...s.batches].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Fornadas</h2>
          <p className="text-muted-foreground text-lg">Produção de empadas</p>
        </div>
        <NewBatchDialog />
      </div>

      {sorted.length === 0 ? (
        <Card className="p-12 text-center shadow-[var(--shadow-soft)]">
          <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg text-muted-foreground">Nenhuma fornada registrada</p>
          <p className="text-sm text-muted-foreground mt-1">Clique em "Nova Fornada" para começar</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((b) => {
            const profit = b.revenue - b.totalCost;
            return (
              <Card key={b.id} className="p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                      <Flame className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{b.empadasQty} empadas</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(b.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Lucro</p>
                    <p className={`text-xl font-bold ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatBRL(profit)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border text-sm">
                  <div>
                    <p className="text-muted-foreground">Receita</p>
                    <p className="font-semibold text-success">{formatBRL(b.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Custo</p>
                    <p className="font-semibold text-destructive">{formatBRL(b.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Preço/unid.</p>
                    <p className="font-semibold">{formatBRL(b.pricePerUnit)}</p>
                  </div>
                </div>
                {b.items.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm text-muted-foreground cursor-pointer">Ver ingredientes usados</summary>
                    <ul className="mt-2 text-sm space-y-1">
                      {b.items.map((it, idx) => {
                        const ing = s.ingredients.find((i) => i.id === it.ingredientId);
                        return (
                          <li key={idx} className="flex justify-between">
                            <span>{ing?.name ?? "(removido)"}</span>
                            <span className="text-muted-foreground">
                              {ing ? formatQty(it.quantity, ing.unit) : it.quantity}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}
                <div className="flex justify-end mt-2">
                  <Button size="sm" variant="ghost" onClick={() => actions.removeBatch(b.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Remover
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewBatchDialog() {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState<Record<string, string>>({});

  function reset() {
    setQty(""); setPrice(""); setItems({});
  }

  function submit() {
    const empadasQty = parseInt(qty);
    const pricePerUnit = parseFloat(price.replace(",", ".")) || 0;
    if (isNaN(empadasQty) || empadasQty <= 0) return;
    const batchItems = Object.entries(items)
      .map(([ingredientId, q]) => ({ ingredientId, quantity: parseFloat(q.replace(",", ".")) || 0 }))
      .filter((x) => x.quantity > 0);
    actions.addBatch({ empadasQty, pricePerUnit, items: batchItems });
    reset(); setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" /> Nova Fornada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Registrar Nova Fornada</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantidade de empadas</Label>
              <Input className="h-12" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Preço por empada (R$)</Label>
              <Input className="h-12" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
            </div>
          </div>

          <div>
            <Label className="text-base">Ingredientes utilizados</Label>
            {s.ingredients.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                Cadastre itens no Estoque primeiro.
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {s.ingredients.map((i) => (
                  <div key={i.id} className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Disp.: {formatQty(i.currentQty, i.unit)}
                      </p>
                    </div>
                    <Input
                      className="h-11 w-24"
                      inputMode="decimal"
                      placeholder="0"
                      value={items[i.id] ?? ""}
                      onChange={(e) => setItems({ ...items, [i.id]: e.target.value })}
                    />
                    <span className="text-sm text-muted-foreground w-8">{i.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button size="lg" onClick={submit}>Salvar Fornada</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
