import { useStore, actions, type Note } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, NotebookPen, ChevronLeft, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function Notas() {
  const s = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Migrar nota legada para a nova lista
  useEffect(() => {
    if (s.notes && s.noteList.length === 0) {
      actions.addNote("Anotações antigas");
      const created = state_lastNote();
      if (created) {
        actions.updateNote(created.id, { content: s.notes });
        actions.setNotes("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...s.noteList].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (!q) return list;
    return list.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [s.noteList, query]);

  const selected = s.noteList.find((n) => n.id === selectedId) ?? null;

  function createNew() {
    const id = actions.addNote("Nova anotação");
    setSelectedId(id);
  }

  if (selected) {
    return <NoteEditor note={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <NotebookPen className="h-7 w-7 text-primary" /> Bloco de Notas
          </h2>
          <p className="text-muted-foreground text-lg">Receitas, lista de compras, recados</p>
        </div>
        <Button size="lg" className="gap-2" onClick={createNew}>
          <Plus className="h-5 w-5" /> Nova Nota
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="h-12 pl-10"
          placeholder="Buscar nas notas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center shadow-[var(--shadow-soft)]">
          <NotebookPen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg text-muted-foreground">
            {query ? "Nenhuma nota encontrada" : "Nenhuma nota ainda"}
          </p>
          {!query && (
            <Button size="lg" className="mt-4 gap-2" onClick={createNew}>
              <Plus className="h-5 w-5" /> Criar primeira nota
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((n) => (
            <Card
              key={n.id}
              className="p-5 shadow-[var(--shadow-soft)] cursor-pointer hover:shadow-[var(--shadow-warm)] transition-shadow"
              onClick={() => setSelectedId(n.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg truncate flex-1">{n.title}</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Excluir esta nota?")) actions.removeNote(n.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mt-1 whitespace-pre-wrap">
                {n.content || "Vazia"}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                {new Date(n.updatedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteEditor({ note, onBack }: { note: Note; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="lg" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-5 w-5" /> Voltar
        </Button>
      </div>
      <Input
        className="h-14 text-2xl font-bold border-0 bg-transparent px-2 focus-visible:ring-0 shadow-none"
        value={note.title}
        onChange={(e) => actions.updateNote(note.id, { title: e.target.value })}
        placeholder="Título"
      />
      <Card className="p-2 shadow-[var(--shadow-soft)]">
        <Textarea
          value={note.content}
          onChange={(e) => actions.updateNote(note.id, { content: e.target.value })}
          placeholder="Escreva aqui..."
          className="min-h-[55vh] text-lg border-0 focus-visible:ring-0 resize-none bg-transparent"
        />
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Salvo automaticamente • Última edição{" "}
        {new Date(note.updatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

// Helper para pegar a nota mais recente (usada na migração).
function state_lastNote() {
  // Acessa o estado via store rerender. Recupera via localStorage para garantir.
  try {
    const raw = localStorage.getItem("empadas-app-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { noteList?: Note[] };
    return parsed.noteList?.[0] ?? null;
  } catch {
    return null;
  }
}
