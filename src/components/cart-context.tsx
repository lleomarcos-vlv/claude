"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  priceCents: number;
  unit: string;
  quantity: number;
  imageUrl: string | null;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  totalCents: number;
  ready: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "villa-reis:carrinho:v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter((item) => item?.productId));
      }
    } catch {
      /* armazenamento indisponivel (aba anonima): segue com carrinho vazio */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignora */
    }
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalCents = items.reduce((sum, item) => sum + item.quantity * item.priceCents, 0);

    return {
      items,
      count,
      totalCents,
      ready,
      add: (item, quantity = 1) =>
        setItems((current) => {
          const found = current.find((entry) => entry.productId === item.productId);
          if (found) {
            return current.map((entry) =>
              entry.productId === item.productId
                ? { ...entry, quantity: Math.min(entry.quantity + quantity, 99) }
                : entry,
            );
          }
          return [...current, { ...item, quantity }];
        }),
      setQuantity: (productId, quantity) =>
        setItems((current) =>
          quantity <= 0
            ? current.filter((entry) => entry.productId !== productId)
            : current.map((entry) =>
                entry.productId === productId
                  ? { ...entry, quantity: Math.min(quantity, 99) }
                  : entry,
              ),
        ),
      remove: (productId) =>
        setItems((current) => current.filter((entry) => entry.productId !== productId)),
      clear: () => setItems([]),
    };
  }, [items, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return context;
}
