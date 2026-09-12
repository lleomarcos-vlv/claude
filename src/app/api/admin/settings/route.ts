import { handleError, jsonOk, revalidatePublic } from "@/lib/api";
import { DEFAULT_SETTINGS, getSettings, saveSettings, type Settings } from "@/lib/settings";

export async function GET() {
  try {
    return jsonOk(await getSettings());
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    const values: Partial<Settings> = {};
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      if (raw[key] !== undefined) values[key] = String(raw[key] ?? "");
    }
    await saveSettings(values);
    revalidatePublic();
    return jsonOk(await getSettings());
  } catch (error) {
    return handleError(error);
  }
}
