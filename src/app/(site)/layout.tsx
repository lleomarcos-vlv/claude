import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { StructuredData } from "@/components/structured-data";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <SiteHeader brandName={settings.brandName} />
      <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      <SiteFooter settings={settings} />
      <MobileTabBar />
      <WhatsAppFab phone={settings.whatsapp} brandName={settings.brandName} />
      <StructuredData settings={settings} />
    </div>
  );
}
