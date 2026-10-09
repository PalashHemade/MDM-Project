import { cookies } from "next/headers";
import { dictionaries, UI_LANG_COOKIE, type UiLanguage } from "./dictionaries";

/** Defaults to simplified German inside the authenticated product (see PLANNING.md section 12). */
export async function getUiLanguage(): Promise<UiLanguage> {
  const cookieStore = await cookies();
  const value = cookieStore.get(UI_LANG_COOKIE)?.value;
  return value === "en" ? "en" : "de";
}

export async function getDictionary() {
  const lang = await getUiLanguage();
  return { lang, t: dictionaries[lang] };
}
