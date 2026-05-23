import { useStore, actions } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { NotebookPen } from "lucide-react";

export function Notas() {
  const s = useStore();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          <NotebookPen className="h-8 w-8 text-primary" /> Bloco de Notas
        </h2>
        <p className="text-muted-foreground text-lg">Receitas, lista de compras, recados...</p>
      </div>
      <Card className="p-2 shadow-[var(--shadow-soft)]">
        <Textarea
          value={s.notes}
          onChange={(e) => actions.setNotes(e.target.value)}
          placeholder="Anote aqui..."
          className="min-h-[60vh] text-lg border-0 focus-visible:ring-0 resize-none bg-transparent"
        />
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Suas notas são salvas automaticamente
      </p>
    </div>
  );
}
