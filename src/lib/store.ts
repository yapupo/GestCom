import { useEffect, useState } from "react";

export type IngredientUnit = "kg" | "g" | "un";

export interface Ingredient {
  id: string;
  name: string;
  unit: IngredientUnit;
  purchasedQty: number;
  paidValue: number;
  currentQty: number;
}

export interface BatchItem {
  ingredientId: string;
  quantity: number;
}

export interface Batch {
  id: string;
  date: string;
  empadasQty: number;
  pricePerUnit: number;
  items: BatchItem[];
  totalCost: number;
  revenue: number;
}

export interface FinanceEntry {
  id: string;
  date: string;
  type: "in" | "out";
  description: string;
  amount: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

interface AppState {
  ingredients: Ingredient[];
  batches: Batch[];
  finance: FinanceEntry[];
  notes: string;
  noteList: Note[];
}

const KEY = "empadas-app-v1";

const defaultState: AppState = {
  ingredients: [],
  batches: [],
  finance: [],
  notes: "",
  noteList: [],
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
  removeIngredient(id: string) {
    state.ingredients = state.ingredients.filter((x) => x.id !== id);
    save();
  },
  addBatch(batch: Omit<Batch, "id" | "totalCost" | "revenue" | "date"> & { date?: string }) {
    let totalCost = 0;
    for (const item of batch.items) {
      const ing = state.ingredients.find((i) => i.id === item.ingredientId);
      if (!ing) continue;
      const unitCost = ing.purchasedQty > 0 ? ing.paidValue / ing.purchasedQty : 0;
      totalCost += unitCost * item.quantity;
      ing.currentQty = Math.max(0, ing.currentQty - item.quantity);
    }
    const revenue = batch.empadasQty * batch.pricePerUnit;
    const newBatch: Batch = {
      ...batch,
      id: crypto.randomUUID(),
      date: batch.date ?? new Date().toISOString(),
      totalCost,
      revenue,
    };
    state.batches.push(newBatch);
    if (revenue > 0) {
      state.finance.push({
        id: crypto.randomUUID(),
        date: newBatch.date,
        type: "in",
        description: `Venda da fornada (${batch.empadasQty} empadas)`,
        amount: revenue,
      });
    }
    save();
  },
  removeBatch(id: string) {
    state.batches = state.batches.filter((b) => b.id !== id);
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

export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatQty(n: number, unit: IngredientUnit) {
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit}`;
}
