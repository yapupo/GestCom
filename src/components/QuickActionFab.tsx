import { useState } from "react";
import { Plus, ShoppingCart, TrendingDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useStore, actions, formatBRL } from "@/lib/store";

type Mode = "menu" | "sale" | "expense";

export function QuickActionFab() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");

  function close() {
    setOpen(false);
    setTimeout(() => setMode("menu"), 200);
  }

  return (
    <>
      <button
        aria-label="Ações rápidas"
        onClick={() => { setMode("menu"); setOpen(true); }}
        className="fixed z-30 bottom-[6.5rem] right-5 md:bottom-8 md:right-8 h-16 w-16 rounded-full flex items-center justify-center text-primary-foreground shadow-[var(--shadow-warm)] active:scale-95 transition-transform"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <Plus className="h-7 w-7" />
      </button>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {mode === "menu" && <MenuView onPick={setMode} />}
          {mode === "sale" && <SaleForm onDone={close} onBack={() => setMode("menu")} />}
          {mode === "expense" && <ExpenseForm onDone={close} onBack={() => setMode("menu")} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function MenuView({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">O que você quer registrar?</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        <button
          onClick={() => onPick("sale")}
          className="rounded-2xl p-6 bg-success/10 hover:bg-success/15 text-left transition-colors border border-success/20"
        >
          <div className="h-12 w-12 rounded-full bg-success/20 text-success flex items-center justify-center mb-3">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <p className="text-xl font-bold">Nova Venda</p>
          <p className="text-sm text-muted-foreground">Registrar entrada no caixa</p>
        </button>
        <button
          onClick={() => onPick("expense")}
          className="rounded-2xl p-6 bg-destructive/10 hover:bg-destructive/15 text-left transition-colors border border-destructive/20"
        >
          <div className="h-12 w-12 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mb-3">
            <TrendingDown className="h-6 w-6" />
          </div>
          <p className="text-xl font-bold">Novo Gasto</p>
          <p className="text-sm text-muted-foreground">Compra, despesa, saída</p>
        </button>
      </div>
    </>
  );
}

function SaleForm({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const s = useStore();
  const [flavorId, setFlavorId] = useState<string | null>(null);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [customerName, setCustomerName] = useState("");

  const flv = s.flavors.find((f) => f.id === flavorId);
  const qtyNum = parseInt(qty) || 0;
  const priceNum = parseFloat(price.replace(",", ".")) || 0;
  const total = qtyNum * priceNum;

  function pickFlavor(id: string) {
    setFlavorId(id);
    const f = s.flavors.find((x) => x.id === id);
    if (f) setPrice(String(f.price).replace(".", ","));
  }

  function submit() {
    if (total <= 0) return;
    actions.addSale({
      flavorId: flv?.id,
      quantity: flv ? qtyNum : undefined,
      amount: total,
      description: flv ? undefined : `Venda avulsa`,
      customerName: customerName.trim() || undefined,
    });
    onDone();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">Nova Venda</DialogTitle>
      </DialogHeader>
      <div className="space-y-5 mt-2">
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
                    {f.name} · {formatBRL(f.price)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base">Quantidade</Label>
            <Input
              className="h-14 text-lg"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-base">Preço unit. (R$)</Label>
            <Input
              className="h-14 text-lg"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <Label className="text-base">Cliente (opcional)</Label>
          <Input
            className="h-14 text-lg"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nome de quem comprou"
          />
        </div>

        <div className="rounded-2xl bg-muted/50 p-4 flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="text-3xl font-bold text-success">{formatBRL(total)}</span>
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="ghost" size="lg" onClick={onBack} className="h-12">
          <X className="h-4 w-4" /> Voltar
        </Button>
        <Button size="lg" onClick={submit} disabled={total <= 0} className="h-12 text-base">
          Registrar venda
        </Button>
      </DialogFooter>
    </>
  );
}

function ExpenseForm({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  function submit() {
    const a = parseFloat(amount.replace(",", ".")) || 0;
    if (!desc || a <= 0) return;
    actions.addFinance({ type: "out", description: desc, amount: a });
    onDone();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">Novo Gasto</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-2">
        <div>
          <Label className="text-base">O que foi?</Label>
          <Input
            className="h-14 text-lg"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Ex: Gás de cozinha"
          />
        </div>
        <div>
          <Label className="text-base">Valor (R$)</Label>
          <Input
            className="h-14 text-lg"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="ghost" size="lg" onClick={onBack} className="h-12">
          <X className="h-4 w-4" /> Voltar
        </Button>
        <Button size="lg" onClick={submit} className="h-12 text-base">
          Registrar gasto
        </Button>
      </DialogFooter>
    </>
  );
}
