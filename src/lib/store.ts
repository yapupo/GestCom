import { useEffect, useState } from "react";

export type IngredientUnit = "kg" | "g" | "un";

export interface Ingredient {
  id: string;
  name: string;
  unit: IngredientUnit;
  purchasedQty: number;
  paidValue: number;
  currentQty: number;
  minQty?: number;
}

export interface BatchItem {
  ingredientId: string;
  quantity: number;
}

export interface FlavorIngredient {
  ingredientId: string;
  /** Quantidade por 1 empada (na unidade do ingrediente) */
  quantityPerUnit: number;
}

export interface Flavor {
  id: string;
  name: string;
  /** Preço sugerido por empada */
  price: number;
  recipe: FlavorIngredient[];
  /** Quantidade de empadas que a receita inteira rende (lote). */
  recipeYield?: number;
  color?: string;
}

export interface Batch {
  id: string;
  date: string;
  empadasQty: number;
  pricePerUnit: number;
  items: BatchItem[];
  totalCost: number;
  revenue: number;
  flavorId?: string;
}

export interface FinanceEntry {
  id: string;
  date: string;
  type: "in" | "out";
  description: string;
  amount: number;
  flavorId?: string;
  quantity?: number;
  customerName?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface FiadoEntry {
  id: string;
  date: string;
  customerName: string;
  items: string;
  amount?: number;
  paid: boolean;
  paidAt?: string;
}

interface AppState {
  ingredients: Ingredient[];
  batches: Batch[];
  finance: FinanceEntry[];
  notes: string;
  noteList: Note[];
  flavors: Flavor[];
  fiados: FiadoEntry[];
}

const KEY = "empadas-app-v1";

const defaultState: AppState = {
  ingredients: [],
  batches: [],
  finance: [],
  notes: "",
  noteList: [],
  flavors: [],
  fiados: [],
};

function load(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

const listeners = new Set<() => void>();
let state: AppState = load();

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return state;
}

export function unitCostOf(ing: Ingredient) {
  return ing.purchasedQty > 0 ? ing.paidValue / ing.purchasedQty : 0;
}

export const actions = {
  addIngredient(i: Omit<Ingredient, "id" | "currentQty"> & { currentQty?: number }) {
    state.ingredients.push({
      ...i,
      id: crypto.randomUUID(),
      currentQty: i.currentQty ?? i.purchasedQty,
    });
    state.finance.push({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: "out",
      description: `Compra: ${i.name}`,
      amount: i.paidValue,
    });
    save();
  },
  updateIngredient(id: string, patch: Partial<Ingredient>) {
    state.ingredients = state.ingredients.map((x) => (x.id === id ? { ...x, ...patch } : x));
    save();
  },
  /** Nova compra do mesmo ingrediente: soma ao estoque, recalcula custo médio e lança no caixa. */
  restockIngredient(id: string, addedQty: number, paidValue: number) {
    const ing = state.ingredients.find((x) => x.id === id);
    if (!ing || addedQty <= 0) return;
    ing.purchasedQty = ing.purchasedQty + addedQty;
    ing.paidValue = ing.paidValue + paidValue;
    ing.currentQty = ing.currentQty + addedQty;
    state.finance.push({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: "out",
      description: `Compra: ${ing.name}`,
      amount: paidValue,
    });
    save();
  },
  removeIngredient(id: string) {
    state.ingredients = state.ingredients.filter((x) => x.id !== id);
    save();
  },

  addFlavor(f: Omit<Flavor, "id">) {
    state.flavors.push({ ...f, id: crypto.randomUUID() });
    save();
  },
  updateFlavor(id: string, patch: Partial<Flavor>) {
    state.flavors = state.flavors.map((f) => (f.id === id ? { ...f, ...patch } : f));
    save();
  },
  removeFlavor(id: string) {
    state.flavors = state.flavors.filter((f) => f.id !== id);
    save();
  },

  addBatch(batch: {
    empadasQty: number;
    pricePerUnit: number;
    items?: BatchItem[];
    flavorId?: string;
    date?: string;
  }) {
    // If a flavor is provided and no items, derive items from recipe
    let items = batch.items ?? [];
    if ((!items || items.length === 0) && batch.flavorId) {
      const flv = state.flavors.find((f) => f.id === batch.flavorId);
      if (flv) {
        items = flv.recipe.map((r) => ({
          ingredientId: r.ingredientId,
          quantity: r.quantityPerUnit * batch.empadasQty,
        }));
      }
    }

    let totalCost = 0;
    for (const item of items) {
      const ing = state.ingredients.find((i) => i.id === item.ingredientId);
      if (!ing) continue;
      totalCost += unitCostOf(ing) * item.quantity;
      ing.currentQty = Math.max(0, ing.currentQty - item.quantity);
    }
    const revenue = batch.empadasQty * batch.pricePerUnit;
    const newBatch: Batch = {
      id: crypto.randomUUID(),
      date: batch.date ?? new Date().toISOString(),
      empadasQty: batch.empadasQty,
      pricePerUnit: batch.pricePerUnit,
      items,
      totalCost,
      revenue,
      flavorId: batch.flavorId,
    };
    state.batches.push(newBatch);
    // Receita é registrada apenas quando há uma venda real (ver addSale).
    // A fornada guarda receita potencial só para projeção de lucro.
    save();
  },
  removeBatch(id: string) {
    state.batches = state.batches.filter((b) => b.id !== id);
    save();
  },

  /** Venda rápida: registra entrada de caixa, opcionalmente associada a sabor/qtd */
  addSale(input: { flavorId?: string; quantity?: number; amount: number; description?: string; customerName?: string }) {
    const flv = input.flavorId ? state.flavors.find((f) => f.id === input.flavorId) : null;
    const base =
      input.description ||
      (flv && input.quantity
        ? `Venda ${flv.name} (${input.quantity} un)`
        : flv
        ? `Venda ${flv.name}`
        : "Venda");
    const description = input.customerName ? `${base} — ${input.customerName}` : base;
    state.finance.push({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: "in",
      description,
      amount: input.amount,
      flavorId: input.flavorId,
      quantity: input.quantity,
      customerName: input.customerName,
    });
    save();
  },

  addFiado(input: { customerName: string; items: string; amount?: number }) {
    state.fiados.push({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customerName: input.customerName,
      items: input.items,
      amount: input.amount,
      paid: false,
    });
    save();
  },
  updateFiado(id: string, patch: Partial<Pick<FiadoEntry, "customerName" | "items" | "amount">>) {
    state.fiados = state.fiados.map((f) => (f.id === id ? { ...f, ...patch } : f));
    save();
  },
  markFiadoPaid(id: string, registerSale = true) {
    const f = state.fiados.find((x) => x.id === id);
    if (!f) return;
    f.paid = true;
    f.paidAt = new Date().toISOString();
    if (registerSale && f.amount && f.amount > 0) {
      state.finance.push({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: "in",
        description: `Pagamento fiado — ${f.customerName}`,
        amount: f.amount,
        customerName: f.customerName,
      });
    }
    save();
  },
  removeFiado(id: string) {
    state.fiados = state.fiados.filter((f) => f.id !== id);
    save();
  },

  setNotes(text: string) {
    state.notes = text;
    save();
  },
  addNote(title: string) {
    const note: Note = {
      id: crypto.randomUUID(),
      title: title || "Sem título",
      content: "",
      updatedAt: new Date().toISOString(),
    };
    state.noteList = [note, ...state.noteList];
    save();
    return note.id;
  },
  updateNote(id: string, patch: Partial<Pick<Note, "title" | "content">>) {
    state.noteList = state.noteList.map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
    );
    save();
  },
  removeNote(id: string) {
    state.noteList = state.noteList.filter((n) => n.id !== id);
    save();
  },
  addFinance(entry: Omit<FinanceEntry, "id" | "date"> & { date?: string }) {
    state.finance.push({
      ...entry,
      id: crypto.randomUUID(),
      date: entry.date ?? new Date().toISOString(),
    });
    save();
  },
  removeFinance(id: string) {
    state.finance = state.finance.filter((f) => f.id !== id);
    save();
  },
};

export function lowStockIngredients(ings: Ingredient[]) {
  return ings.filter((i) => {
    if (i.minQty && i.minQty > 0) return i.currentQty <= i.minQty;
    return i.purchasedQty > 0 && i.currentQty / i.purchasedQty < 0.2;
  });
}

export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatQty(n: number, unit: IngredientUnit) {
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit}`;
}

/**
 * Unidade amigável para entrada de receita.
 * Ingredientes em kg são digitados em gramas (inteiros), kg internamente.
 */
export function inputUnitFor(unit: IngredientUnit): { label: string; toBase: (n: number) => number; fromBase: (n: number) => number; integer: boolean } {
  switch (unit) {
    case "kg":
      return { label: "g", toBase: (n) => n / 1000, fromBase: (n) => n * 1000, integer: true };
    case "g":
      return { label: "g", toBase: (n) => n, fromBase: (n) => n, integer: true };
    case "un":
      return { label: "un", toBase: (n) => n, fromBase: (n) => n, integer: true };
  }
}

