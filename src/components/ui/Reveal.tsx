"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Atraso em ms, para escalonar itens de uma lista. */
  delay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Anima o conteúdo quando ele entra na viewport.
 *
 * Usa IntersectionObserver (não roda no scroll) e desconecta após a primeira
 * aparição. Quem prefere menos movimento recebe o conteúdo já visível — o CSS
 * neutraliza a animação em `prefers-reduced-motion`.
 */
export function Reveal({ children, delay = 0, as: Tag = "div", className = "" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Já visível na carga inicial (above the fold): mostra sem esperar o observer.
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
