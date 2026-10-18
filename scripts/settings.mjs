/**
 * Module settings: one switch per automation, so a table can turn off what it doesn't want.
 * They are read when the automation runs, so changing them needs no reload.
 * The world settings come first, by theme; the client ones (HUD, turn helpers) are each player's.
 * Headers split them in Configure Settings.
 */
export const MODULE_ID = "lhtrpg-automacao";

/** How a rules check reacts to an issue: off, warn (ask to go on) or block (the GM may still go on). */
const MODES = {
  off: "LHAUTO.Settings.Mode.off",
  warn: "LHAUTO.Settings.Mode.warn",
  block: "LHAUTO.Settings.Mode.block"
};

/** The first setting of each section of Configure Settings, and its header. */
const SECTIONS = {
  costs: "rules",
  cards: "chat",
  content: "content",
  chatTheme: "look",
  hud: "hud",
  turnNotice: "turn"
};

/** Call during the `init` hook. */
export function registerSettings() {
  const toggle = (key, value = true, scope = "world") => game.settings.register(MODULE_ID, key, {
    name: `LHAUTO.Settings.${key}.Name`,
    hint: `LHAUTO.Settings.${key}.Hint`,
    scope,
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

  // Rules of use and combat
  toggle("costs");
  mode("limits", "warn");
  mode("actions", "warn");
  toggle("hatePerCombat");
  toggle("cleanup");
  toggle("endOfProcess");
  toggle("incapacitated");
  toggle("endOfScene");
  toggle("revive");
  toggle("closeReach");
  // Cards and chat
  toggle("cards");
  toggle("fate");
  toggle("statusLinks");
  toggle("quickEffect");
  // Content and house rules
  toggle("content");
  toggle("kuden");
  // Look
  toggle("chatTheme");
  game.settings.register(MODULE_ID, "windowTheme", {
    name: "LHAUTO.Settings.windowTheme.Name",
    hint: "LHAUTO.Settings.windowTheme.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });
}

/** The turn helpers (turn.mjs): each player's, after the HUD settings (hud.mjs). Call during `init`. */
export function registerClientSettings() {
  const toggle = (key, value) => game.settings.register(MODULE_ID, key, {
    name: `LHAUTO.Settings.${key}.Name`,
    hint: `LHAUTO.Settings.${key}.Hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: value
  });
  toggle("turnNotice", true);
  toggle("turnSelect", false);
  toggle("turnPan", false);
  toggle("turnUntarget", true);
  // The release notice already seen (notice.mjs).
  game.settings.register(MODULE_ID, "noticeSeen", { scope: "client", config: false, type: String, default: "" });

  Hooks.on("renderSettingsConfig", addSectionHeaders);
}

/** Headers before the first setting of each section of this module in Configure Settings. */
function addSectionHeaders(app, html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  for (const [key, section] of Object.entries(SECTIONS)) {
    const group = root.querySelector(`[name="${MODULE_ID}.${key}"]`)?.closest(".form-group");
    if (!group || group.previousElementSibling?.classList.contains("lhauto-settings-section")) continue;
    const header = document.createElement("h4");
    header.className = "lhauto-settings-section";
    header.textContent = game.i18n.localize(`LHAUTO.Settings.Section.${section}`);
    group.before(header);
  }
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
