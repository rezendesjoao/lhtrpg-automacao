/**
 * Module settings: one switch per automation, so a table can turn off what it doesn't want.
 * They are read when the automation runs, so changing them needs no reload.
 */
export const MODULE_ID = "lhtrpg-automacao";

/** How a rules check reacts to an issue: off, warn (ask to go on) or block (the GM may still go on). */
const MODES = {
  off: "LHAUTO.Settings.Mode.off",
  warn: "LHAUTO.Settings.Mode.warn",
  block: "LHAUTO.Settings.Mode.block"
};

/** Call during the `init` hook. */
export function registerSettings() {
  const toggle = (key, value = true) => game.settings.register(MODULE_ID, key, {
    name: `LHAUTO.Settings.${key}.Name`,
    hint: `LHAUTO.Settings.${key}.Hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: value
  });
  const mode = (key, value) => game.settings.register(MODULE_ID, key, {
    name: `LHAUTO.Settings.${key}.Name`,
    hint: `LHAUTO.Settings.${key}.Hint`,
    scope: "world",
    config: true,
    type: String,
    choices: MODES,
    default: value
  });

  toggle("costs");
  mode("limits", "warn");
  mode("actions", "warn");
  toggle("hatePerCombat");
  toggle("cleanup");
  toggle("endOfProcess");
  toggle("incapacitated");
  toggle("endOfScene");
  toggle("revive");
  toggle("cards");
  toggle("fate");
  toggle("content");
  toggle("chatTheme");
}

/** A setting's value (null before the settings exist). */
export function setting(key) {
  try {
    return game.settings.get(MODULE_ID, key);
  }
  catch {
    return null;
  }
}

/** Localized text of this module ("LHAUTO.<key>"). */
export const L = (key, data) => data ? game.i18n.format(`LHAUTO.${key}`, data) : game.i18n.localize(`LHAUTO.${key}`);
