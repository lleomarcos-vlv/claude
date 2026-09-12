import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout-client";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Seu pedido",
  description: "Revise os itens, informe seus dados e envie o pedido pelo WhatsApp.",
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <CheckoutClient
      brandName={settings.brandName}
      deliveryEnabled={settings.deliveryEnabled === "true"}
      deliveryNote={settings.deliveryNote}
      orderingEnabled={settings.orderingEnabled === "true"}
    />
  );
}
