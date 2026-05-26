import { useStore, actions, formatBRL, formatQty, inputUnitFor, type IngredientUnit, type FlavorIngredient } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Plus, Trash2, AlertTriangle, Cookie, Pencil } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Section = "itens" | "sabores";

export function Estoque() {
  const [section, setSection] = useState<Section>("itens");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold">Estoque</h2>
        <p className="text-muted-foreground text-lg">Ingredientes, embalagens e sabores</p>
      </div>

      <div className="inline-flex p-1 rounded-full bg-muted/60 border border-border">
        <SectionBtn active={section === "itens"} onClick={() => setSection("itens")}>
          Ingredientes
        </SectionBtn>
        <SectionBtn active={section === "sabores"} onClick={() => setSection("sabores")}>
          Sabores
        </SectionBtn>
      </div>

      {section === "itens" ? <ItensSection /> : <SaboresSection />}
    </div>
  );
}

function SectionBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 h-11 rounded-full text-sm font-semibold transition-all ${
        active ? "bg-card shadow-[var(--shadow-soft)] text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------ Ingredientes ------------------ */

function ItensSection() {
  const s = useStore();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddItemDialog />
      </div>

      {s.ingredients.length === 0 ? (
        <Card className="p-12 text-center shadow-[var(--shadow-soft)]">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg text-muted-foreground">Nenhum item cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">Toque em "Adicionar Item" para começar</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {s.ingredients.map((i) => {
            const low = i.minQty
              ? i.currentQty <= i.minQty
              : i.purchasedQty > 0 && i.currentQty / i.purchasedQty < 0.2;
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
                      Comprado: {formatQty(i.purchasedQty, i.unit)} · {formatBRL(i.paidValue)}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => actions.removeIngredient(i.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Disponível</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        className="h-12 text-lg font-semibold"
                        inputMode="decimal"
                        value={i.currentQty}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value.replace(",", "."));
                          actions.updateIngredient(i.id, { currentQty: isNaN(v) ? 0 : v });
                        }}
                      />
                      <span className="text-muted-foreground font-medium">{i.unit}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Mín. para alerta</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        className="h-12"
                        inputMode="decimal"
                        placeholder="—"
                        value={i.minQty ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value.replace(",", "."));
                          actions.updateIngredient(i.id, { minQty: isNaN(v) ? undefined : v });
                        }}
                      />
                      <span className="text-muted-foreground font-medium">{i.unit}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddItemDialog() {
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
        <Button size="lg" className="gap-2 h-12">
          <Plus className="h-5 w-5" /> Adicionar Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-2xl">Novo Item</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-base">Nome</Label>
            <Input className="h-12" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Farinha de trigo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-base">Quantidade</Label>
              <Input className="h-12" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-base">Unidade</Label>
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
            <Label className="text-base">Valor Pago (R$)</Label>
            <Input className="h-12" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0,00" />
          </div>
        </div>
        <DialogFooter>
          <Button size="lg" onClick={submit} className="h-12">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------ Sabores ------------------ */

function SaboresSection() {
  const s = useStore();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FlavorDialog />
      </div>

      {s.flavors.length === 0 ? (
        <Card className="p-12 text-center shadow-[var(--shadow-soft)]">
          <Cookie className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg text-muted-foreground">Nenhum sabor cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre sabores para preencher fornadas e vendas com um toque
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {s.flavors.map((f) => (
            <Card key={f.id} className="p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{f.name}</h3>
                  <p className="text-2xl font-bold text-primary mt-1">{formatBRL(f.price)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">por empada</p>
                </div>
                <div className="flex gap-1">
                  <FlavorDialog flavorId={f.id} trigger={
                    <Button size="icon" variant="ghost" className="h-11 w-11"><Pencil className="h-4 w-4" /></Button>
                  } />
                  <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => actions.removeFlavor(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {f.recipe.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Por empada</p>
                  <ul className="space-y-1 text-sm">
                    {f.recipe.map((r, idx) => {
                      const ing = s.ingredients.find((i) => i.id === r.ingredientId);
                      return (
                        <li key={idx} className="flex justify-between">
                          <span>{ing?.name ?? "(removido)"}</span>
                          <span className="text-muted-foreground">
                            {ing ? formatQty(r.quantityPerUnit, ing.unit) : r.quantityPerUnit}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FlavorDialog({ flavorId, trigger }: { flavorId?: string; trigger?: React.ReactNode }) {
  const s = useStore();
  const existing = flavorId ? s.flavors.find((f) => f.id === flavorId) : null;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [price, setPrice] = useState(existing ? String(existing.price).replace(".", ",") : "");
  const [recipe, setRecipe] = useState<Record<string, string>>(() => {
    const r: Record<string, string> = {};
    existing?.recipe.forEach((x) => { r[x.ingredientId] = String(x.quantityPerUnit).replace(".", ","); });
    return r;
  });

  function reset() {
    if (!existing) { setName(""); setPrice(""); setRecipe({}); }
  }

  function submit() {
    const p = parseFloat(price.replace(",", ".")) || 0;
    if (!name) return;
    const finalRecipe: FlavorIngredient[] = Object.entries(recipe)
      .map(([ingredientId, q]) => ({ ingredientId, quantityPerUnit: parseFloat(q.replace(",", ".")) || 0 }))
      .filter((x) => x.quantityPerUnit > 0);
    if (existing) {
      actions.updateFlavor(existing.id, { name, price: p, recipe: finalRecipe });
    } else {
      actions.addFlavor({ name, price: p, recipe: finalRecipe });
    }
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="gap-2 h-12">
            <Plus className="h-5 w-5" /> Novo Sabor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{existing ? "Editar Sabor" : "Novo Sabor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <Label className="text-base">Nome</Label>
              <Input className="h-12" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Frango com catupiry" />
            </div>
            <div>
              <Label className="text-base">Preço (R$)</Label>
              <Input className="h-12 w-28" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
            </div>
          </div>

          <div>
            <Label className="text-base">Receita (por 1 empada)</Label>
            {s.ingredients.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                Cadastre ingredientes antes para montar a receita.
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {s.ingredients.map((i) => (
                  <div key={i.id} className="flex items-center gap-2 bg-muted/50 p-3 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Estoque: {formatQty(i.currentQty, i.unit)}
                      </p>
                    </div>
                    <Input
                      className="h-11 w-24"
                      inputMode="decimal"
                      placeholder="0"
                      value={recipe[i.id] ?? ""}
                      onChange={(e) => setRecipe({ ...recipe, [i.id]: e.target.value })}
                    />
                    <span className="text-sm text-muted-foreground w-8">{i.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button size="lg" onClick={submit} className="h-12">Salvar Sabor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
