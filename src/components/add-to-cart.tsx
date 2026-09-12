"use client";

import { useState } from "react";
import { useCart, type CartItem } from "./cart-context";

type Props = {
  item: Omit<CartItem, "quantity">;
  label?: string;
  full?: boolean;
  variant?: "gold" | "primary" | "outline";
  withQuantity?: boolean;
  disabled?: boolean;
};

export function AddToCart({
  item,
  label = "Adicionar",
  full = false,
  variant = "gold",
  withQuantity = false,
  disabled = false,
}: Props) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [done, setDone] = useState(false);

  function handleAdd() {
    add(item, quantity);
    setDone(true);
    window.setTimeout(() => setDone(false), 1400);
  }

  const buttonClass = `btn btn-${variant === "gold" ? "gold" : variant} ${full ? "w-full" : ""}`;

  if (!withQuantity) {
    return (
      <button type="button" onClick={handleAdd} className={buttonClass} disabled={disabled}>
        {done ? "Adicionado ✓" : label}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${full ? "w-full" : ""}`}>
      <div className="flex items-center rounded-full border border-line bg-white">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          className="h-11 w-11 text-lg text-muted transition hover:text-espresso"
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          className="h-11 w-11 text-lg text-muted transition hover:text-espresso"
          onClick={() => setQuantity((value) => Math.min(99, value + 1))}
        >
          +
        </button>
      </div>
      <button type="button" onClick={handleAdd} className={`${buttonClass} flex-1`} disabled={disabled}>
        {done ? "Adicionado ✓" : label}
      </button>
    </div>
  );
}
