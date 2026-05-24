import { useStore, actions, formatBRL, formatQty, unitCostOf } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Plus, Trash2, ChefHat } from "lucide-react";
import { useState, useMemo } from "react";
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
          <p className="text-sm text-muted-foreground mt-1">Toque em "Nova Fornada" para começar</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((b) => {
            const profit = b.revenue - b.totalCost;
            const flv = s.flavors.find((f) => f.id === b.flavorId);
            return (
              <Card key={b.id} className="p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                      <Flame className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {b.empadasQty} empadas{flv ? ` · ${flv.name}` : ""}
                      </h3>
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
  const [flavorId, setFlavorId] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState<Record<string, string>>({});

  const flv = s.flavors.find((f) => f.id === flavorId);
  const qtyNum = parseInt(qty) || 0;

  // Custo estimado em tempo real
  const estCost = useMemo(() => {
    if (flv && qtyNum > 0) {
      return flv.recipe.reduce((acc, r) => {
        const ing = s.ingredients.find((i) => i.id === r.ingredientId);
        if (!ing) return acc;
        return acc + unitCostOf(ing) * r.quantityPerUnit * qtyNum;
      }, 0);
    }
    return Object.entries(items).reduce((acc, [ingId, q]) => {
      const ing = s.ingredients.find((i) => i.id === ingId);
      const quantity = parseFloat(q.replace(",", ".")) || 0;
      if (!ing) return acc;
      return acc + unitCostOf(ing) * quantity;
    }, 0);
  }, [flv, qtyNum, items, s.ingredients]);

  const priceNum = parseFloat(price.replace(",", ".")) || 0;
  const estRevenue = priceNum * qtyNum;

  function reset() {
    setQty(""); setPrice(""); setItems({}); setFlavorId(null);
  }

  function pickFlavor(id: string) {
    if (flavorId === id) {
      setFlavorId(null);
      return;
    }
    setFlavorId(id);
    const f = s.flavors.find((x) => x.id === id);
    if (f) setPrice(String(f.price).replace(".", ","));
  }

  function submit() {
    if (qtyNum <= 0) return;
    if (flv) {
      actions.addBatch({ empadasQty: qtyNum, pricePerUnit: priceNum, flavorId: flv.id });
    } else {
      const batchItems = Object.entries(items)
        .map(([ingredientId, q]) => ({ ingredientId, quantity: parseFloat(q.replace(",", ".")) || 0 }))
        .filter((x) => x.quantity > 0);
      actions.addBatch({ empadasQty: qtyNum, pricePerUnit: priceNum, items: batchItems });
    }
    reset(); setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 h-12">
          <Plus className="h-5 w-5" /> Nova Fornada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-2xl">Nova Fornada</DialogTitle></DialogHeader>
        <div className="space-y-5">
          {s.flavors.length > 0 && (
            <div>
              <Label className="text-base mb-2 block">Sabor</Label>
              <div className="flex flex-wrap gap-2">
                {s.flavors.map((f) => {
                  const active = f.id === flavorId;
                  return (
                    <button
                      key={f.id}
                      onClick={() => pickFlavor(f.id)}
                      className={`px-4 h-11 rounded-full text-base font-medium border transition-all ${
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-soft)]"
                          : "bg-card border-border hover:border-primary/50"
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
              {flv && (
                <p className="text-xs text-muted-foreground mt-2">
                  Ingredientes serão deduzidos automaticamente da receita.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-base">Quantidade</Label>
              <Input className="h-14 text-lg" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-base">Preço unit. (R$)</Label>
              <Input className="h-14 text-lg" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
            </div>
          </div>

          {!flv && s.ingredients.length > 0 && (
            <div>
              <Label className="text-base">Ingredientes utilizados</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Sem sabor selecionado — informe o que foi usado nesta fornada.
              </p>
              <div className="space-y-2">
                {s.ingredients.map((i) => (
                  <div key={i.id} className="flex items-center gap-2 bg-muted/50 p-3 rounded-xl">
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
            </div>
          )}

          {(estCost > 0 || estRevenue > 0) && (
            <div className="rounded-2xl bg-muted/50 p-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Custo</p>
                <p className="font-bold text-destructive">{formatBRL(estCost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita</p>
                <p className="font-bold text-success">{formatBRL(estRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro</p>
                <p className={`font-bold ${estRevenue - estCost >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatBRL(estRevenue - estCost)}
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button size="lg" onClick={submit} className="h-12">Salvar Fornada</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
