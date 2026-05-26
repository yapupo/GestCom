import { useState, useMemo, useEffect } from "react";
import { Plus, ShoppingCart, TrendingDown, X, HandCoins, Banknote, QrCode, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useStore, actions, formatBRL } from "@/lib/store";
import { buildPixPayload, PIX_DEFAULTS } from "@/lib/pix";

type Mode = "menu" | "sale" | "expense" | "fiado";

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialMode?: Mode;
  hideFab?: boolean;
}

export function QuickActionFab({ open: ctrlOpen, onOpenChange, initialMode = "menu", hideFab }: Props = {}) {
  const [uOpen, setUOpen] = useState(false);
  const open = ctrlOpen ?? uOpen;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setUOpen(v); };
  const [mode, setMode] = useState<Mode>(initialMode);

  useEffect(() => { if (open) setMode(initialMode); }, [open, initialMode]);

  function close() {
    setOpen(false);
    setTimeout(() => setMode("menu"), 200);
  }

  return (
    <>
      {!hideFab && (
        <button
          aria-label="Ações rápidas"
          onClick={() => { setMode("menu"); setOpen(true); }}
          className="fixed z-30 bottom-[6.5rem] right-5 md:bottom-8 md:right-8 h-16 w-16 rounded-full flex items-center justify-center text-primary-foreground shadow-[var(--shadow-warm)] active:scale-95 transition-transform"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <Plus className="h-7 w-7" />
        </button>
      )}

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {mode === "menu" && <MenuView onPick={setMode} />}
          {mode === "sale" && <SaleForm onDone={close} onBack={() => setMode("menu")} />}
          {mode === "expense" && <ExpenseForm onDone={close} onBack={() => setMode("menu")} />}
          {mode === "fiado" && <FiadoForm onDone={close} onBack={() => setMode("menu")} />}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        <button
          onClick={() => onPick("sale")}
          className="rounded-2xl p-5 bg-success/10 hover:bg-success/15 text-left transition-colors border border-success/20"
        >
          <div className="h-12 w-12 rounded-full bg-success/20 text-success flex items-center justify-center mb-3">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <p className="text-lg font-bold">Nova Venda</p>
          <p className="text-sm text-muted-foreground">Entrada no caixa</p>
        </button>
        <button
          onClick={() => onPick("fiado")}
          className="rounded-2xl p-5 bg-primary/10 hover:bg-primary/15 text-left transition-colors border border-primary/20"
        >
          <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-3">
            <HandCoins className="h-6 w-6" />
          </div>
          <p className="text-lg font-bold">Novo Fiado</p>
          <p className="text-sm text-muted-foreground">Cliente vai pagar depois</p>
        </button>
        <button
          onClick={() => onPick("expense")}
          className="rounded-2xl p-5 bg-destructive/10 hover:bg-destructive/15 text-left transition-colors border border-destructive/20"
        >
          <div className="h-12 w-12 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mb-3">
            <TrendingDown className="h-6 w-6" />
          </div>
          <p className="text-lg font-bold">Novo Gasto</p>
          <p className="text-sm text-muted-foreground">Compra, despesa</p>
        </button>
      </div>
    </>
  );
}

function FiadoForm({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [items, setItems] = useState("");
  const [amount, setAmount] = useState("");

  function submit() {
    if (!name.trim() || !items.trim()) return;
    const a = parseFloat(amount.replace(",", ".")) || 0;
    actions.addFiado({
      customerName: name.trim(),
      items: items.trim(),
      amount: a > 0 ? a : undefined,
    });
    onDone();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">Novo Fiado</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-2">
        <div>
          <Label className="text-base">Nome do cliente</Label>
          <Input className="h-14 text-lg" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Seu João" />
        </div>
        <div>
          <Label className="text-base">O que pegou</Label>
          <Textarea className="min-h-[100px] text-lg" value={items} onChange={(e) => setItems(e.target.value)} placeholder="Ex: 3 empadas de frango, 1 refrigerante" />
        </div>
        <div>
          <Label className="text-base">Valor (opcional, R$)</Label>
          <Input className="h-14 text-lg" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="ghost" size="lg" onClick={onBack} className="h-12">
          <X className="h-4 w-4" /> Voltar
        </Button>
        <Button size="lg" onClick={submit} disabled={!name.trim() || !items.trim()} className="h-12 text-base">
          Salvar fiado
        </Button>
      </DialogFooter>
    </>
  );
}

type PayMethod = "dinheiro" | "pix";
type Step = "form" | "payment" | "pix";

function SaleForm({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const s = useStore();
  const [flavorId, setFlavorId] = useState<string | null>(null);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [method, setMethod] = useState<PayMethod>("dinheiro");
  const [copied, setCopied] = useState(false);

  const flv = s.flavors.find((f) => f.id === flavorId);
  const qtyNum = parseInt(qty) || 0;
  const priceNum = parseFloat(price.replace(",", ".")) || 0;
  const total = qtyNum * priceNum;

  const pixPayload = useMemo(() => {
    if (total <= 0) return "";
    return buildPixPayload({ ...PIX_DEFAULTS, amount: total });
  }, [total]);

  function pickFlavor(id: string) {
    setFlavorId(id);
    const f = s.flavors.find((x) => x.id === id);
    if (f) setPrice(String(f.price).replace(".", ","));
  }

  function register(payMethod: PayMethod) {
    if (total <= 0) return;
    const desc = flv ? undefined : "Venda avulsa";
    actions.addSale({
      flavorId: flv?.id,
      quantity: flv ? qtyNum : undefined,
      amount: total,
      description: desc ? `${desc} (${payMethod === "pix" ? "PIX" : "Dinheiro"})` : `${flv?.name} — ${payMethod === "pix" ? "PIX" : "Dinheiro"}`,
      customerName: customerName.trim() || undefined,
    });
    onDone();
  }

  function copyPix() {
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (step === "pix") {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <QrCode className="h-6 w-6" /> Pagamento PIX
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Total a receber</p>
            <p className="text-4xl font-bold text-success">{formatBRL(total)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 flex justify-center border border-border">
            <QRCodeSVG value={pixPayload} size={232} level="M" />
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={copyPix}
            className="w-full h-12 gap-2"
          >
            {copied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5" />}
            {copied ? "Código copiado!" : "Copiar código PIX"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Chave CPF · Empada do Betoneira
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-2 mt-2">
          <Button variant="ghost" size="lg" onClick={() => setStep("payment")} className="h-12">
            <X className="h-4 w-4" /> Voltar
          </Button>
          <Button size="lg" onClick={() => register("pix")} className="h-12 text-base">
            Confirmar pagamento
          </Button>
        </DialogFooter>
      </>
    );
  }

  if (step === "payment") {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl">Forma de pagamento</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div className="rounded-2xl bg-muted/50 p-4 flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="text-3xl font-bold text-success">{formatBRL(total)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setMethod("dinheiro"); register("dinheiro"); }}
              className="rounded-2xl p-6 bg-success/10 hover:bg-success/15 border-2 border-success/30 transition-all active:scale-[0.98]"
            >
              <Banknote className="h-10 w-10 mx-auto text-success mb-2" />
              <p className="text-lg font-bold">Dinheiro</p>
              <p className="text-xs text-muted-foreground mt-1">Registrar e fechar</p>
            </button>
            <button
              onClick={() => { setMethod("pix"); setStep("pix"); }}
              className="rounded-2xl p-6 bg-primary/10 hover:bg-primary/15 border-2 border-primary/30 transition-all active:scale-[0.98]"
            >
              <QrCode className="h-10 w-10 mx-auto text-primary mb-2" />
              <p className="text-lg font-bold">PIX</p>
              <p className="text-xs text-muted-foreground mt-1">Gerar QR Code</p>
            </button>
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="ghost" size="lg" onClick={() => setStep("form")} className="h-12">
            <X className="h-4 w-4" /> Voltar
          </Button>
        </DialogFooter>
      </>
    );
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
            <Input className="h-14 text-lg" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <Label className="text-base">Preço unit. (R$)</Label>
            <Input className="h-14 text-lg" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
          </div>
        </div>

        <div>
          <Label className="text-base">Cliente (opcional)</Label>
          <Input className="h-14 text-lg" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome de quem comprou" />
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
        <Button size="lg" onClick={() => setStep("payment")} disabled={total <= 0} className="h-12 text-base">
          Avançar
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
          <Input className="h-14 text-lg" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex: Gás de cozinha" />
        </div>
        <div>
          <Label className="text-base">Valor (R$)</Label>
          <Input className="h-14 text-lg" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="ghost" size="lg" onClick={onBack} className="h-12">
          <X className="h-4 w-4" /> Voltar
        </Button>
        <Button size="lg" onClick={submit} className="h-12 text-base">Registrar gasto</Button>
      </DialogFooter>
    </>
  );
}
