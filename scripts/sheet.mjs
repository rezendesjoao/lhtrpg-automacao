/**
 * The Elder Tale character sheet: the system's sheet logic (LHTrpgActorSheet) with a new template and
 * look. Every selector and data-action the parent class relies on is kept in templates/sheet.hbs
 * (.item[data-item-id], .equip-slot, .inventory-list, .option-field, .rollableSkill, the status panel
 * and tag input partials, the tab groups…), so equipping, rolling, tickets and effects keep working.
 *
 * What this adds on top: the data the template shows (HP bar state, Fate pips, Hate rank, attribute
 * tiles and radar, skill badges, coin purse stacks) and small behaviours (gold adjust popover).
 */
import { L, MODULE_ID, setting } from "./settings.mjs";
import { parseSkillField } from "./system.mjs";
import { LHTrpgActorSheet } from "../../../systems/lhtrpg/module/sheets/actor-sheet.mjs";
import { actorName, escape, toInt } from "./util.mjs";

const TEMPLATE = `modules/${MODULE_ID}/templates/sheet.hbs`;

/** Skill Timing -> badge class (colour) */
const TIMING_CLASS = {
  Major: "major", "Main Process": "major", Minor: "minor", Move: "move", Instant: "instant", Action: "instant",
  Setup: "setup", Initiative: "setup", Cleanup: "cleanup", Constant: "constant",
  "Before Check": "reaction", "After Check": "reaction", "Before Damage": "reaction", "After Damage": "reaction", "Damage Roll": "reaction"
};

const ATTRS = [
  { key: "str", checks: ["athletics", "endurance"] },
  { key: "dex", checks: ["disable", "operation"] },
  { key: "pow", checks: ["perception", "negotiation"] },
  { key: "int", checks: ["knowledge", "analysis"] }
];
const COMBAT_CHECKS = ["accuracy", "evasion", "resistance"];
const ITEM_TYPES = ["weapon", "armor", "shield", "accessory", "bag", "usable", "gear"];

/** "athletics" -> "Athletics" (the key the system's roll-check action localizes) */
const checkName = key => key.charAt(0).toUpperCase() + key.slice(1);

/**
 * Term translators of the lhtrpg-pt-br module (Timing, Target, Range, Cost, Limit, tags), when it is
 * active and showing Portuguese; else the values are shown as the system stores them.
 */
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
const term = (field, value) => (terms?.FIELD_TRANSLATORS?.[field] ? terms.FIELD_TRANSLATORS[field](value) : value);
const tagLabel = tag => (terms?.translateTag ? terms.translateTag(tag) : tag);

/** The number of coins of each pile of the purse: thousands, hundreds, tens and units of the gold. */
function goldStacks(gold) {
  const value = Math.max(0, toInt(gold));
  return [1000, 100, 10, 1].map(unit => {
    const count = Math.min(9, Math.floor((value / unit) % (unit === 1000 ? 1e6 : 10)));
    return { label: unit.toLocaleString(game.i18n.lang), count, coins: Array(count).fill(true) };
  });
}

export class ElderTaleSheet extends LHTrpgActorSheet {

  static DEFAULT_OPTIONS = {
    classes: ["lhauto", "et-sheet-app", "sheet", "actor"],
    position: { width: 900, height: 790 },
    window: { resizable: true }
  };

  static PARTS = {
    sheet: { template: TEMPLATE, scrollable: [".et-main"] }
  };

  /**
   * @override
   * AppV2 joins the `classes` of the whole inheritance chain: without this, the window would also
   * carry the system's "lhtrpg" class and its sheet styles (absolute header, frame artwork…).
   */
  static _initializeApplicationOptions(options) {
    const result = super._initializeApplicationOptions(options);
    result.classes = (result.classes ?? []).filter(c => c !== "lhtrpg");
    return result;
  }

  /* -------------------------------------------- */
  /*  Data                                        */
  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const system = actor.system;
    const et = {};

    // Vitals
    const hp = toInt(system.health?.value), hpMax = Math.max(0, toInt(system.health?.max));
    const hpPct = hpMax ? Math.clamp(Math.round((hp / hpMax) * 100), 0, 100) : 0;
    et.hp = { value: hp, max: hpMax, pct: hpPct, state: (hp <= 0) ? "down" : (hpPct <= 25) ? "low" : (hpPct <= 50) ? "warn" : "ok" };
    const fate = toInt(system.fate?.value), fateMax = Math.clamp(toInt(system.fate?.max), 0, 12);
    et.fate = { value: fate, max: fateMax, pips: Array.from({ length: Math.max(fateMax, fate) }, (_, i) => i < fate) };
    const hate = toInt(system.infos?.hate);
    const rank = actor.statuses.has("hateTop") ? "top" : actor.statuses.has("hateUnder") ? "under" : null;
    et.hate = { value: hate, pct: Math.clamp(hate * 10, 0, 100), rank, rankLabel: rank ? L(`Sheet.Hate.${rank}`) : "" };

    // Active statuses (header chips)
    et.statuses = (context.statusPanel ?? []).flatMap(group => group.statuses.filter(s => s.active));
    const fatigue = toInt(system.infos?.fatigue);
    if (fatigue > 0) et.statuses.unshift({ id: "fatigue", label: `${game.i18n.localize("LHTRPG.StatusEffect.fatigue")} ${fatigue}`, img: "systems/lhtrpg/assets/ui/status/fatigue.svg" });

    // Attributes, checks and the radar
    const check = key => {
      const c = system.checks?.[key] ?? {};
      return { key, name: checkName(key), label: game.i18n.localize(`LHTRPG.Check.${checkName(key)}`), dice: toInt(c.dice) || 0, total: toInt(c.total) };
    };
    et.attrs = ATTRS.map(({ key, checks }) => ({
      key,
      label: L(`Sheet.Attr.${key}`),
      base: toInt(system.attributes?.[key]?.total),
      mod: toInt(system.attributes?.[key]?.mod),
      checks: checks.map(check)
    }));
    et.combatChecks = COMBAT_CHECKS.map(check);
    const mods = Object.fromEntries(et.attrs.map(a => [a.key, a.mod]));
    const scale = Math.max(6, ...Object.values(mods));
    const radius = key => 10 + (Math.max(0, mods[key]) / scale) * 54;
    const dots = [
      { x: 80, y: 80 - radius("str") }, { x: 80 + radius("dex"), y: 80 },
      { x: 80, y: 80 + radius("pow") }, { x: 80 - radius("int"), y: 80 }
    ];
    et.radar = { points: dots.map(d => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(" "), dots, labels: Object.fromEntries(et.attrs.map(a => [a.key, a.label])) };

    // Skills: badges, pips and the short meta
    const enrich = item => {
      const s = item.system;
      const timing = parseSkillField("timing", s.timing).type;
      const max = Math.clamp(toInt(s.skillRank?.max), 0, 10), value = toInt(s.skillRank?.value);
      const dash = v => (!v || /^[\p{Pd}−]*$/u.test(String(v))) ? "" : String(v);
      item.et = {
        timing: { cls: TIMING_CLASS[timing] ?? "other", label: dash(term("timing", s.timing)) || "—" },
        rank: { value, max, pips: Array.from({ length: max }, (_, i) => i < value) },
        cost: dash(term("cost", s.cost)), limit: dash(term("limit", s.limit)),
        target: dash(term("target", s.target)), range: dash(term("range", s.range))
      };
      return item;
    };
    const browse = context.skillBrowse ?? {};
    et.skillTabs = [
      { id: "basic", subtype: "Basic", skills: context.skills.basic.map(enrich), browse: browse.Basic },
      { id: "general", subtype: "General", skills: context.skills.general.map(enrich), browse: browse.General },
      { id: "combat", subtype: "Combat", skills: context.skills.combat.map(enrich), browse: browse.Combat }
    ];

    // Inventory
    const space = toInt(system.inventory?.space), maxSpace = toInt(system.inventory?.maxSpace);
    et.space = { value: space, max: maxSpace, pct: maxSpace ? Math.clamp(Math.round((space / maxSpace) * 100), 0, 100) : 0 };
    et.itemTypes = ITEM_TYPES.map(type => ({ type, label: game.i18n.localize(`TYPES.Item.${type}`) }));
    const gold = toInt(context.source.inventory?.gold);
    et.gold = { value: gold, pretty: gold.toLocaleString(game.i18n.lang), stacks: goldStacks(gold) };

    // Bio
    const withTags = items => items.map(item => ({ ...item, et: { tags: (item.system?.tags ?? []).map(tagLabel) } }));
    et.socialTabs = [
      { id: "connections", type: "connection", items: withTags(context.social.connections) },
      { id: "unions", type: "union", items: withTags(context.social.unions) }
    ];

    context.et = et;
    return context;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element;
    root.classList.remove("lhtrpg");

    // Bars fill after the first paint, so the width animates.
    requestAnimationFrame(() => root.querySelectorAll(".et-bar-fill").forEach(el => el.classList.add("ready")));

    // Gold: + / − open a small amount field; confirming changes the gold and notes it in the chat.
    const pop = root.querySelector(".et-gold-pop");
    if (pop) {
      const input = pop.querySelector("input");
      let sign = 1;
      for (const button of root.querySelectorAll(".et-gold-adjust")) {
        button.addEventListener("click", event => {
          event.preventDefault();
          const next = Number(button.dataset.sign) || 1;
          if (!pop.hidden && (sign === next)) return pop.hidden = true;
          sign = next;
          pop.querySelector(".et-gold-pop-sign").textContent = sign > 0 ? "+" : "−";
          pop.hidden = false;
          input.value = "";
          input.focus();
        });
      }
      pop.addEventListener("submit", event => {
        event.preventDefault();
        event.stopPropagation();
        const amount = Math.floor(Math.abs(Number(input.value)) || 0);
        pop.hidden = true;
        if (amount > 0) this.#adjustGold(sign * amount).catch(err => console.error(`${MODULE_ID} | Gold change failed`, err));
      });
      input.addEventListener("keydown", event => { if (event.key === "Escape") pop.hidden = true; });
    }

    // Enter in a vital field blurs it (submits), instead of staying focused.
    for (const field of root.querySelectorAll(".et-vital-input, .et-rank-input, .et-gold-input")) {
      field.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); field.blur(); } });
    }
  }

  /** Add or spend gold, and keep a note of it in the chat (the table's economy log). */
  async #adjustGold(delta) {
    const before = toInt(this.actor._source.system.inventory?.gold);
    const after = Math.max(0, before + delta);
    if (after === before) return;
    await this.actor.update({ "system.inventory.gold": after });
    const key = delta > 0 ? "Sheet.GoldGained" : "Sheet.GoldSpent";
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="lhtrpg chat-card lhauto-card lhauto-gold-card"><p><i class="fa-solid fa-coins"></i> ${escape(L(key, {
        name: actorName(this.actor), amount: Math.abs(delta).toLocaleString(game.i18n.lang), total: after.toLocaleString(game.i18n.lang)
      }))}</p></div>`
    });
  }
}

/** Call during the `init` hook. */
export function registerSheet() {
  foundry.applications.handlebars.loadTemplates([TEMPLATE]);
  // An effect without an origin has the localized "None" as its source: shown as nothing.
  Handlebars.registerHelper("etSource", value => ((value === game.i18n.localize("None")) ? "" : value));
  Hooks.once("ready", () => loadTerms());
  foundry.documents.collections.Actors.registerSheet(MODULE_ID, ElderTaleSheet, {
    types: ["character"],
    makeDefault: setting("sheetDefault") !== false,
    label: "LHAUTO.Sheet.Label"
  });
}
