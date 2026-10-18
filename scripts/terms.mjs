/**
 * Term translators of the lhtrpg-pt-br module (Timing, Target, Range, Cost, Limit, tags), when it is active
 * and showing Portuguese; else the values are shown as the system stores them. The character sheet and the
 * action HUD show the skill fields through them.
 */
import { MODULE_ID } from "./settings.mjs";

let terms = null;

async function loadTerms() {
  const ptbr = game.modules.get("lhtrpg-pt-br");
  if (!ptbr?.active || (game.i18n.lang !== "pt-BR")) return;
  try {
    if (game.settings.get("lhtrpg-pt-br", "display") === false) return;
  }
  catch { /* the setting may not exist in older versions: translate anyway */ }
  try {
    terms = await import("/modules/lhtrpg-pt-br/scripts/terms.mjs");
  }
  catch (err) {
    console.warn(`${MODULE_ID} | lhtrpg-pt-br terms not available`, err);
  }
}

/** A skill field as the table reads it ("Hate 2" → "Ódio 2"). */
export const term = (field, value) => (terms?.FIELD_TRANSLATORS?.[field] ? terms.FIELD_TRANSLATORS[field](value) : value);

/** A tag as the table reads it. */
export const tagLabel = tag => (terms?.translateTag ? terms.translateTag(tag) : tag);

/** Whether a skill field is empty ("", "-", "—"). */
export const isEmpty = value => !value || /^[\p{Pd}−\s]*$/u.test(String(value));

/** Call during the `init` hook. */
export function registerTerms() {
  Hooks.once("ready", () => loadTerms());
}
