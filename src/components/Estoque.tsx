import { useStore, actions, formatBRL, formatQty, type IngredientUnit } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function Estoque() {
  const s = useStore();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Estoque</h2>
          <p className="text-muted-foreground text-lg">Ingredientes e embalagens</p>
        </div>
        <AddDialog />
      </div>

      {s.ingredients.length === 0 ? (
        <Card className="p-12 text-center shadow-[var(--shadow-soft)]">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg text-muted-foreground">Nenhum item cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">Clique em "Adicionar Item" para começar</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {s.ingredients.map((i) => {
            const low = i.purchasedQty > 0 && i.currentQty / i.purchasedQty < 0.2;
            return (
              <Card key={i.id} className="p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-semibold truncate">{i.name}</h3>
                      {low && (
                        <span className="inline-flex items-center gap-1 text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full">
                          <AlertTriangle className="h-3 w-3" /> Estoque baixo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Comprado: {formatQty(i.purchasedQty, i.unit)} • {formatBRL(i.paidValue)}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => actions.removeIngredient(i.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Label className="text-sm shrink-0">Disponível:</Label>
                  <Input
                    className="h-11 text-lg font-semibold"
                    inputMode="decimal"
                    value={i.currentQty}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value.replace(",", "."));
                      actions.updateIngredient(i.id, { currentQty: isNaN(v) ? 0 : v });
                    }}
                  />
                  <span className="text-muted-foreground font-medium">{i.unit}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<IngredientUnit>("kg");
  const [qty, setQty] = useState("");
  const [value, setValue] = useState("");

  function submit() {
    const q = parseFloat(qty.replace(",", "."));
    const v = parseFloat(value.replace(",", "."));
    if (!name || isNaN(q) || isNaN(v) || q <= 0) return;
    actions.addIngredient({ name, unit, purchasedQty: q, paidValue: v });
    setName(""); setQty(""); setValue(""); setUnit("kg"); setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" /> Adicionar Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Item no Estoque</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome do Item</Label>
            <Input className="h-12" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Farinha de trigo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantidade Comprada</Label>
              <Input className="h-12" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Unidade</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as IngredientUnit)}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Quilos (kg)</SelectItem>
                  <SelectItem value="g">Gramas (g)</SelectItem>
                  <SelectItem value="un">Unidades</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Valor Pago (R$)</Label>
            <Input className="h-12" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0,00" />
          </div>
        </div>
        <DialogFooter>
          <Button size="lg" onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
