/**
 * The parchment character sheet: the system's sheet logic (LHTrpgActorSheet) with new templates, laid
 * out like the Pathfinder 2e character sheet. A green banner on the left keeps what is used in play
 * (HP, Barrier, Hate, Fatigue, defenses, combat checks, statuses); the header has the name, Fate and
 * the CR; the tabs hold the character, the checks, the skills, the inventory, the effects and the bio.
 *
 * Every selector and data-action the parent class relies on is kept in templates/sheet/
 * (.item[data-item-id], .equip-slot, .inventory-list, .option-field, the status panel, tag input and
 * ticket partials, the tab groups…), so equipping, rolling, tickets and effects keep working.
 */
import { L, MODULE_ID } from "./settings.mjs";
import { parseSkillField } from "./system.mjs";
import { removeBadStatus } from "./fate.mjs";
import { actorName, escape, toInt } from "./util.mjs";
import { LHTrpgActorSheet } from "../../../systems/lhtrpg/module/sheets/actor-sheet.mjs";
import { allocateBonusPoints } from "../../../systems/lhtrpg/module/apps/stat-allocation.mjs";

const DIR = `modules/${MODULE_ID}/templates/sheet`;
const PARTIALS = ["sidebar", "character", "checks", "skills", "inventory", "effects", "biography"];

const TABS = [
  { id: "character", icon: "fa-solid fa-address-card" },
  { id: "checks", icon: "fa-solid fa-dice-d6" },
  { id: "skills", icon: "fa-solid fa-wand-sparkles" },
  { id: "inventory", icon: "fa-solid fa-backpack" },
  { id: "effects", icon: "fa-solid fa-person-rays" },
  { id: "biography", icon: "fa-solid fa-book-open-reader" }
];

/** Groups of the skills tab by Timing (as parseSkillField reads it), in display order. */
const TIMING_GROUPS = [
  { id: "major", timings: ["Major", "Main Process"] },
  { id: "minor", timings: ["Minor"] },
  { id: "move", timings: ["Move"] },
  { id: "instant", timings: ["Instant", "Action"] },
  { id: "reaction", timings: ["Before Check", "After Check", "Damage Roll", "Before Damage", "After Damage"] },
  { id: "setup", timings: ["Setup", "Initiative"] },
  { id: "cleanup", timings: ["Cleanup"] },
  { id: "constant", timings: ["Constant"] },
  { id: "downtime", timings: ["Pre-Play", "Interlude", "Briefing", "Rest Time"] },
  { id: "other", timings: [] }
];

const ATTRIBUTES = [
  { key: "str", checks: ["athletics", "endurance"] },
  { key: "dex", checks: ["disable", "operation"] },
  { key: "pow", checks: ["perception", "negotiation"] },
  { key: "int", checks: ["knowledge", "analysis"] }
];
const COMBAT_CHECKS = ["accuracy", "evasion", "resistance"];
const ITEM_TYPES = ["weapon", "armor", "shield", "accessory", "bag", "usable", "gear"];

/**
 * Paper doll of the inventory tab (templates/sheet/inventory.hbs): a 480×300 stage with the figure in the
 * middle 160px, the slot cards (160×44) in the side columns, and a line from each card to the body part it
 * stands for: accessories on the head, the neck and the shoulders, armor on the chest, the bag on the hip,
 * the weapons in the hands.
 */
const DOLL = {
  acc0: { side: "left", top: 6, point: [228, 30] },
  acc1: { side: "left", top: 62, point: [239, 51] },
  acc2: { side: "left", top: 118, point: [205, 70] },
  main: { side: "left", top: 180, point: [193.5, 166] },
  armor: { side: "right", top: 72, point: [255, 102] },
  bag: { side: "right", top: 126, point: [261, 147] },
  off: { side: "right", top: 180, point: [286.5, 166] }
};
const CARD = { width: 160, height: 44, elbow: 12 };

/** Where a doll slot's card sits and the polyline from the card to its body point. */
function dollPlace(pos) {
  const { side, top, point: [x, y] } = DOLL[pos];
  const cy = top + (CARD.height / 2);
  const edge = (side === "left") ? CARD.width : 480 - CARD.width;
  const knee = (side === "left") ? edge + CARD.elbow : edge - CARD.elbow;
  return { side, top, x, y, line: `${edge},${cy} ${knee},${cy} ${x},${y}` };
}

/** "athletics" -> "Athletics" (the key the system's roll-check action localizes) */
const checkName = key => key.charAt(0).toUpperCase() + key.slice(1);
const signed = n => (n >= 0 ? `+${n}` : `${n}`);
const isEmpty = value => !value || /^[\p{Pd}−\s]*$/u.test(String(value));

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

export class LHAutoCharacterSheet extends LHTrpgActorSheet {

  static DEFAULT_OPTIONS = {
    classes: ["lhauto", "lhpf", "character", "themed", "theme-light"],
    position: { width: 750, height: 750 },
    window: { resizable: true },
    actions: {
      "lhauto-summary": LHAutoCharacterSheet.#onSummary,
      "lhauto-fate": LHAutoCharacterSheet.#onFate,
      "lhauto-remove-bad": LHAutoCharacterSheet.#onRemoveBad,
      "lhauto-allocate": LHAutoCharacterSheet.#onAllocate,
      "lhauto-gold": LHAutoCharacterSheet.#onGold,
      "lhauto-delete": LHAutoCharacterSheet.#onDelete
    }
  };

  static PARTS = {
    sheet: {
      template: `${DIR}/sheet.hbs`,
      scrollable: [".sidebar", ...TABS.map(t => `.tab[data-tab="${t.id}"] > .tab-content`),
        ...["basic", "general", "combat"].map(t => `.tab[data-group="skills"][data-tab="${t}"] > .tab-content`),
        ".tab[data-group='effects'][data-tab='list'] > .tab-content", ".tab[data-group='effects'][data-tab='status'] > .tab-content"]
    }
  };

  /** Tab group states (survive re-renders). */
  tabGroups = { primary: "character", skills: "basic", effects: "list", bio: "bio" };

  /** Items whose summary is open (kept open across re-renders). */
  #expanded = new Set();

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
    const source = context.source;
    const battle = system["battle-status"] ?? {};
    const lh = {};

    // Tabs
    lh.tabs = TABS.map(t => ({ ...t, label: L(`Sheet.Tab.${t.id}`) }));
    lh.tabLabel = L(`Sheet.Tab.${this.tabGroups.primary}`);

    // Sidebar: HP, Barrier, Hate, Fatigue
    const hp = toInt(system.health?.value), hpMax = Math.max(0, toInt(system.health?.max));
    const pct = hpMax ? Math.clamp(Math.round((hp / hpMax) * 100), 0, 100) : 0;
    lh.hp = { value: hp, max: hpMax, pct };
    lh.barrier = toInt(source["bad-status"]?.barrier);
    lh.hateRank = actor.statuses.has("hateTop") ? "top" : actor.statuses.has("hateUnder") ? "under" : null;
    if (lh.hateRank) lh.hateRankLabel = game.i18n.localize(`LHTRPG.StatusEffect.${lh.hateRank === "top" ? "hateTop" : "hateUnder"}`);

    // Hate and Fatigue boxes fill up: Hate a tenth per point (full at 10), Fatigue by the share of the
    // maximum HP it takes away. A little fill shows as soon as there is any.
    const fill = share => ((share > 0) ? Math.clamp(Math.round(share * 100), 8, 100) : 0);
    const hate = toInt(source.infos?.hate), fatigue = toInt(source.infos?.fatigue);
    lh.hate = {
      fill: fill(hate / 10),
      tooltip: [L("Sheet.HateBox", { value: hate }), lh.hateRankLabel].filter(Boolean).join(" · ")
    };
    lh.fatigue = {
      fill: fill(fatigue / Math.max(1, hpMax + fatigue)),
      tooltip: L("Sheet.FatigueBox", { value: fatigue })
    };

    // Header: Fate as stars
    const fate = toInt(source.fate?.value), fateMax = Math.max(0, toInt(system.fate?.max));
    lh.fate = {
      pips: Array.from({ length: Math.clamp(Math.max(fateMax, fate), 0, 10) }, (_, i) => i < fate),
      tooltip: L("Sheet.FateHint", { value: fate, max: fateMax })
    };

    // Defenses, initiative, speed, power
    const total = path => toInt(foundry.utils.getProperty(battle, `${path}.total`));
    lh.defense = { phys: total("defense.phys"), magic: total("defense.magic") };
    lh.initiative = total("initiative");
    lh.speed = total("speed");
    lh.power = [
      { id: "attack", icon: "fa-solid fa-sword", label: L("Sheet.Attack"), tooltip: "LHTRPG.Tooltip.AttackPower", value: total("power.attack") },
      { id: "magic", icon: "fa-solid fa-wand-magic-sparkles", label: L("Sheet.Magic"), tooltip: "LHTRPG.Tooltip.MagicPower", value: total("power.magic") },
      { id: "recovery", icon: "fa-solid fa-hand-holding-heart", label: L("Sheet.Recovery"), tooltip: "LHTRPG.Tooltip.RestorationPower", value: total("power.restoration") }
    ];

    // Attributes and checks
    const check = (key, attr) => {
      const c = system.checks?.[key] ?? {};
      const dice = toInt(c.dice) || 2, value = toInt(c.total);
      return {
        key, attr, name: checkName(key), label: game.i18n.localize(`LHTRPG.Check.${checkName(key)}`),
        dice, total: value, mod: signed(value), tier: Math.clamp(dice - 1, 1, 5)
      };
    };
    lh.attributes = ATTRIBUTES.map(({ key }) => ({
      key,
      abbr: L(`Sheet.Attr.${key}.abbr`),
      label: L(`Sheet.Attr.${key}.name`),
      base: toInt(system.attributes?.[key]?.total),
      mod: toInt(system.attributes?.[key]?.mod)
    }));
    lh.checks = ATTRIBUTES.flatMap(({ key, checks }) => checks.map(c => check(c, L(`Sheet.Attr.${key}.abbr`))));
    lh.combatChecks = COMBAT_CHECKS.map(c => check(c));

    // Active statuses (sidebar tags)
    const entry = v => ((v && typeof v === "object") ? [v.tag, v.value].filter(x => x !== undefined && x !== "").join(" ") : String(v));
    lh.statuses = (context.statusPanel ?? []).flatMap(group => group.statuses.filter(s => s.active).map(s => {
      let detail = "";
      if (s.list && Array.isArray(s.value) && s.value.length) detail = s.value.map(entry).join(", ");
      else if (s.rated && toInt(s.value)) detail = String(toInt(s.value));
      return { id: s.id, img: s.img, label: detail ? `${s.label} ${detail}` : s.label };
    }));

    // Skills: by subtype, then by Timing
    const enrich = item => {
      const s = item.system;
      const max = Math.clamp(toInt(s.skillRank?.max), 0, 10), value = toInt(s.skillRank?.value);
      item.lh = {
        timing: parseSkillField("timing", s.timing).type,
        sr: max ? `${value}/${max}` : "",
        cost: isEmpty(s.cost) ? "" : term("cost", s.cost),
        limit: isEmpty(s.limit) ? "" : term("limit", s.limit)
      };
      return item;
    };
    const group = skills => {
      const groups = TIMING_GROUPS.map(g => ({ id: g.id, label: L(`Sheet.Timing.${g.id}`), skills: [] }));
      for (const item of skills.map(enrich)) {
        const index = TIMING_GROUPS.findIndex(g => g.timings.includes(item.lh.timing));
        groups[index >= 0 ? index : groups.length - 1].skills.push(item);
      }
      return groups.filter(g => g.skills.length);
    };
    const browse = context.skillBrowse ?? {};
    lh.skillTabs = [
      { id: "basic", subtype: "Basic", skills: context.skills.basic },
      { id: "general", subtype: "General", skills: context.skills.general },
      { id: "combat", subtype: "Combat", skills: context.skills.combat }
    ].map(tab => ({
      ...tab, groups: group(tab.skills), count: tab.skills.length,
      browse: browse[tab.subtype], pending: toInt(browse[tab.subtype]?.pending)
    }));

    // Inventory: equipment slots, carried items, space, gold
    const eq = context.items.equipped, hands = context.hands;
    lh.slots = [
      { pos: "main", type: "hand", hand: "main", index: 0, icon: "weapon", label: "LHTRPG.Hands.Main", item: hands.main, swap: hands.canSwap },
      { pos: "off", type: "hand", hand: "off", index: 0, icon: "shield", label: "LHTRPG.Hands.Off", item: hands.off, locked: hands.locked },
      { pos: "armor", type: "armor", index: 0, icon: "armor", label: "TYPES.Item.armor", item: eq.armors[0] },
      { pos: "bag", type: "bag", index: 0, icon: "bag", label: "TYPES.Item.bag", item: eq.bags[0] },
      { pos: "acc0", type: "accessory", index: 0, icon: "accessory", label: "TYPES.Item.accessory", item: eq.accessories[0] },
      { pos: "acc1", type: "accessory", index: 1, icon: "accessory", label: "TYPES.Item.accessory", item: eq.accessories[1] },
      { pos: "acc2", type: "accessory", index: 2, icon: "accessory", label: "TYPES.Item.accessory", item: eq.accessories[2] }
    ].map(slot => ({ ...slot, doll: dollPlace(slot.pos), filled: !!(slot.item || slot.locked) }));
    const items = context.items;
    const space = toInt(system.inventory?.space), maxSpace = toInt(system.inventory?.maxSpace);
    lh.carried = [].concat(items.weapons, items.armors, items.shields, items.accessories, items.bags, items.usables, items.gear)
      .map((item, i) => Object.assign(item, {
        typeLabel: game.i18n.localize(`TYPES.Item.${item.type}`),
        over: i >= maxSpace
      }));
    lh.space = { value: space, max: maxSpace, pct: maxSpace ? Math.clamp(Math.round((space / maxSpace) * 100), 0, 100) : 100, over: space > maxSpace };
    lh.itemTypes = ITEM_TYPES.map(type => ({ type, label: game.i18n.localize(`TYPES.Item.${type}`) }));
    lh.gold = toInt(source.inventory?.gold).toLocaleString(game.i18n.lang);

    // Bio: connections and unions with their tags
    const withTags = list => list.map(item => ({ ...item, lhTags: (item.system?.tags ?? []).map(tagLabel) }));
    lh.social = [
      { id: "connections", type: "connection", label: L("Sheet.Connections"), items: withTags(context.social.connections) },
      { id: "unions", type: "union", label: L("Sheet.Unions"), items: withTags(context.social.unions) }
    ];

    context.lh = lh;
    return context;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @override */
  changeTab(tab, group, options = {}) {
    super.changeTab(tab, group, options);
    if (group !== "primary") return;
    const title = this.element.querySelector(".lhpf-nav .panel-title");
    if (title) title.textContent = L(`Sheet.Tab.${tab}`);
  }

  /** @override */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    // Close the "add item" menu when clicking elsewhere (the window element outlives the renders).
    this.element.addEventListener("pointerdown", event => {
      if (!event.target.closest(".addItem")) this.element.querySelector(".addItem .dropdown-content")?.classList.remove("show");
    });
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element;
    root.classList.remove("lhtrpg");

    // The band's title follows the open tab (a render prepared before a tab change would show the old one).
    const title = root.querySelector(".lhpf-nav .panel-title");
    if (title) title.textContent = L(`Sheet.Tab.${this.tabGroups.primary}`);

    // Barrier: its own field is also in the status panel, so this copy saves by itself (no form name).
    const barrier = root.querySelector(".lhpf-barrier");
    barrier?.addEventListener("change", event => {
      event.stopPropagation();
      const value = Math.max(0, Math.floor(Number(event.currentTarget.value) || 0));
      this.actor.update({ "system.bad-status.barrier": value });
    });

    // Fate stars: click +1 (data-action), right click −1.
    root.querySelector(".lhpf-header .pips")?.addEventListener("contextmenu", event => {
      event.preventDefault();
      this.#setFate(-1);
    });

    // Enter in a number field saves it (blur) instead of keeping the focus.
    for (const field of root.querySelectorAll(".lhpf-sidebar input, .lhpf-header input, .gold-input")) {
      field.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); field.blur(); } });
    }

    // Summaries left open before this render.
    for (const id of this.#expanded) {
      const row = root.querySelector(`.item[data-item-id="${id}"]`);
      if (row) this.#openSummary(row, { animate: false });
      else this.#expanded.delete(id);
    }
  }

  /* -------------------------------------------- */
  /*  Summaries                                   */
  /* -------------------------------------------- */

  /** The summary of a skill or item: its fields and its text. */
  async #summaryHTML(item) {
    const s = item.system;
    const fields = [
      ["LHTRPG.Item.Label.Timing", "timing"], ["LHTRPG.Item.Label.Check", "checkType"],
      ["LHTRPG.Item.Label.Target", "target"], ["LHTRPG.Item.Label.Range", "range"],
      ["LHAUTO.Sheet.Cost", "cost"], ["LHAUTO.Sheet.Limit", "limit"]
    ].filter(([, key]) => !isEmpty(s[key])).map(([label, key]) =>
      `<span class="field"><b>${escape(game.i18n.localize(label))}</b> ${escape(term(key === "checkType" ? "check" : key, s[key]))}</span>`);
    const tags = (s.tags ?? []).map(t => `<li class="tag">${escape(tagLabel(t))}</li>`).join("");
    const text = await foundry.applications.ux.TextEditor.implementation.enrichHTML(s.description ?? "", {
      relativeTo: item, rollData: item.getRollData?.() ?? {}, secrets: item.isOwner
    });
    return `${tags ? `<ul class="tags">${tags}</ul>` : ""}
      ${fields.length ? `<div class="fields">${fields.join("")}</div>` : ""}
      <div class="description">${text || `<p class="empty">${escape(L("Sheet.NoDescription"))}</p>`}</div>`;
  }

  async #openSummary(row, { animate = true } = {}) {
    const item = this.actor.items.get(row.dataset.itemId);
    const summary = row.querySelector(":scope > .item-summary");
    if (!item || !summary) return;
    summary.innerHTML = await this.#summaryHTML(item);
    summary.hidden = false;
    row.classList.add("expanded");
    if (animate) summary.animate([{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], { duration: 160, easing: "ease-out" });
  }

  static async #onSummary(event, target) {
    const row = target.closest(".item[data-item-id]");
    if (!row) return;
    const summary = row.querySelector(":scope > .item-summary");
    if (!summary) return;
    if (!summary.hidden) {
      summary.hidden = true;
      row.classList.remove("expanded");
      this.#expanded.delete(row.dataset.itemId);
      return;
    }
    this.#expanded.add(row.dataset.itemId);
    await this.#openSummary(row);
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  async #setFate(delta) {
    if (!this.isEditable) return;
    const value = toInt(this.actor._source.system.fate?.value), max = toInt(this.actor.system.fate?.max);
    const next = Math.max(0, value + delta);
    if ((delta > 0) && max && (next > max)) return;
    if (next !== value) await this.actor.update({ "system.fate.value": next });
  }

  static #onFate() {
    return this.#setFate(1);
  }

  static #onRemoveBad() {
    return removeBadStatus(this.actor);
  }

  /** Delete an item after a confirmation (connections and unions). */
  static #onDelete(event, target) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    return item?.deleteDialog({ classes: ["lhauto-dialog"] });
  }

  static #onAllocate() {
    if (this.isEditable) return allocateBonusPoints(this.actor);
  }

  /** Add or spend gold, with a note in the chat (the table's economy log). */
  static async #onGold(event, target) {
    if (!this.isEditable) return;
    const sign = Number(target.dataset.sign) || 1;
    const amount = await foundry.applications.api.DialogV2.prompt({
      window: { title: L(sign > 0 ? "Sheet.GoldAdd" : "Sheet.GoldSpend"), icon: "fa-solid fa-coins" },
      classes: ["lhauto-dialog"],
      content: `<div class="form-group"><label>${escape(L("Sheet.GoldAmount"))}</label>
        <input type="number" name="amount" min="1" step="1" autofocus></div>`,
      ok: { label: L(sign > 0 ? "Sheet.GoldAdd" : "Sheet.GoldSpend"), callback: (ev, button) => Math.floor(Math.abs(Number(button.form.elements.amount.value)) || 0) },
      rejectClose: false
    });
    if (!amount) return;
    const before = toInt(this.actor._source.system.inventory?.gold);
    const after = Math.max(0, before + sign * amount);
    if (after === before) return;
    await this.actor.update({ "system.inventory.gold": after });
    const fmt = n => n.toLocaleString(game.i18n.lang);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="lhtrpg chat-card lhauto-card lhauto-gold-card"><p><i class="fa-solid fa-coins"></i> ${escape(L(sign > 0 ? "Sheet.GoldGained" : "Sheet.GoldSpent", {
        name: actorName(this.actor), amount: fmt(Math.abs(after - before)), total: fmt(after)
      }))}</p></div>`
    });
  }
}

/** Call during the `init` hook. */
export function registerSheet() {
  foundry.applications.handlebars.loadTemplates([`${DIR}/sheet.hbs`, ...PARTIALS.map(p => `${DIR}/${p}.hbs`)]);
  // An effect without an origin has the localized "None" as its source: shown as nothing.
  Handlebars.registerHelper("lhautoSource", value => ((value === game.i18n.localize("None")) ? "" : value));
  Hooks.once("ready", () => loadTerms());
  foundry.documents.collections.Actors.registerSheet(MODULE_ID, LHAutoCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "LHAUTO.Sheet.Label"
  });
}
