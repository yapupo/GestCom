import { useState } from "react";
import { useStore, actions, formatBRL, type FiadoEntry } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HandCoins, Plus, Trash2, Check, User } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

export function Fiado() {
  const s = useStore();
  const open = s.fiados.filter((f) => !f.paid);
  const paid = s.fiados.filter((f) => f.paid);
  const totalOpen = open.reduce((a, b) => a + (b.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <HandCoins className="h-7 w-7 text-primary" /> Fiado
          </h2>
          <p className="text-muted-foreground text-lg">Quem levou e ainda não pagou</p>
        </div>
        <NewFiadoDialog />
      </div>

      <Card className="p-5 shadow-[var(--shadow-soft)] bg-primary/5 border-primary/20">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">A receber</p>
        <p className="text-3xl font-bold text-primary">{formatBRL(totalOpen)}</p>
        <p className="text-sm text-muted-foreground mt-1">{open.length} fiado(s) em aberto</p>
      </Card>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Em aberto</h3>
        {open.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground shadow-[var(--shadow-soft)]">
            Nenhum fiado em aberto. 🎉
          </Card>
        ) : (
          open.map((f) => <FiadoCard key={f.id} f={f} />)
        )}
      </section>

      {paid.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xl font-semibold text-muted-foreground">Já pagos</h3>
          {paid.slice().reverse().slice(0, 10).map((f) => (
            <FiadoCard key={f.id} f={f} />
          ))}
        </section>
      )}
    </div>
  );
}

function FiadoCard({ f }: { f: FiadoEntry }) {
  return (
    <Card
      className={`p-4 shadow-[var(--shadow-soft)] ${
        f.paid ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="font-bold text-lg truncate">{f.customerName}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date(f.date).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            })}
            {f.paid && f.paidAt && ` · Pago em ${new Date(f.paidAt).toLocaleDateString("pt-BR")}`}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-base">{f.items}</p>
        </div>
        <div className="text-right shrink-0">
          {f.amount ? (
            <p className="text-xl font-bold text-primary">{formatBRL(f.amount)}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sem valor</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {!f.paid && (
          <Button
            size="lg"
            className="flex-1 h-11 gap-1"
            onClick={() => actions.markFiadoPaid(f.id)}
          >
            <Check className="h-4 w-4" /> Marcar como pago
          </Button>
        )}
        <Button
          size="lg"
          variant="ghost"
          className="h-11"
          onClick={() => {
            if (confirm("Excluir este fiado?")) actions.removeFiado(f.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

export function NewFiadoDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
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
    setName(""); setItems(""); setAmount("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="gap-2 h-12">
            <Plus className="h-5 w-5" /> Novo Fiado
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Novo Fiado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-base">Nome do cliente</Label>
            <Input
              className="h-14 text-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Seu João"
            />
          </div>
          <div>
            <Label className="text-base">O que pegou</Label>
            <Textarea
              className="min-h-[120px] text-lg"
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="Ex: 3 empadas de frango, 1 refrigerante"
            />
          </div>
          <div>
            <Label className="text-base">Valor (opcional)</Label>
            <Input
              className="h-14 text-lg"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button size="lg" onClick={submit} disabled={!name.trim() || !items.trim()} className="h-12">
            Salvar fiado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
