import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Identidade</p>
        <h1 className="mt-1 font-display text-3xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted">
          Nome, contatos, horários, textos e redes sociais. Tudo sem tocar em código.
        </p>
      </header>

      <SettingsForm initial={settings} />
    </div>
  );
}
