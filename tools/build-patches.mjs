/**
 * Build scripts/content/patches.mjs: the data the system's compendiums only have as text, read from
 * their English rules text (text-rules.mjs, monster-damage.mjs) plus the tables reviewed by hand below.
 *
 *   node tools/build-patches.mjs [lhtrpg system folder]      (default: ../LHTTRPG next to this module)
 *
 * Patches are keyed by compendium uuid ("Compendium.lhtrpg.<pack>.Item.<id>"); monster skills by the
 * monster's uuid and the skill id. The module only fills what a document lacks (see content.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseMonsterDamage } from "../scripts/content/monster-damage.mjs";
import { crLock, itemBonuses, itemFatigue, itemPowers, powerRules, sceneStatuses, targetStatuses } from "./text-rules.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SYSTEM = path.resolve(process.argv[2] ?? path.join(ROOT, "..", "LHTTRPG"));
const PACKS = path.join(SYSTEM, "src", "packs");
const OUT = path.join(ROOT, "scripts", "content", "patches.mjs");
const MODULE_ID = "lhtrpg-automacao";
/** Bump when the data changes, so the GM tool offers to fill documents patched by an older version. */
const VERSION = 2;

/**
 * Damage and healing of character skills that only have them in their text, reviewed one by one.
 * dice / mod may be formulas of the system ("@sr+2", "@int", "@recovery*2+1").
 */
const SKILL_DAMAGE = {
  "Accel Fang": { dice: "@sr+1", type: "physical" },
  "Blood Letter": { dice: 2, type: "physical" },
  "Detection Attack": { dice: 1, type: "physical" },
  "Elegant Act": { dice: "@sr", type: "physical" },
  "Elemental Ray": { dice: "@sr", mod: "@int", type: "penetrating", noPower: true },
  "Extermination": { dice: "@sr+6", type: "physical" },
  "Flare Arrow": { dice: "@sr+2", type: "magical" },
  "Frigid Wind": { dice: "@sr", type: "magical" },
  "Helmet Split": { dice: "@sr+2", type: "physical" },
  "Lightning Nebula": { dice: "@sr+4", type: "magical" },
  "Mystic Spell: Magatama": { dice: "@sr", type: "magical" },
  "Nature's Wrath": { dice: 2, type: "magical" },
  "Saya (Arrow)": { dice: "@sr+1", type: "physical" },
  "Shrike's Thorn": { dice: "@sr", type: "physical" },
  "Taunting Blow": { dice: 1, type: "physical" },
  "Torturing Attack": { dice: 2, type: "physical" },
  // Healing: Recovery Power is added by "recovery" (and Magic Power by the magical type)
  "Heal": { dice: 3, type: "magical", recovery: true },
  "Resurrection": { dice: 0, type: "magical", recovery: true },
  "Healing Prayer": { dice: 0, mod: "@pow.base*2", type: "", recovery: true },
  "Reverse Self": { dice: 0, mod: "@recovery*2+1", type: "", recovery: true, noPower: true }
};

/** Status proposals left out after review: they depend on a condition the text puts elsewhere. */
const SKIP_STATUSES = new Set([
  "Cheap Trick", "Haze Crossing", "Wild Stamp",
  "Abel the Young Noble Vagabond Vampire (Vampire Bohemian Prince)/Blood-sucking Ribcage",
  "Clockwork Saberlion/Aeon Booster", "Goblin Deathcaller/Curse of the Blood Tomb", "Goblin Deathcaller/Death Cry"
]);

/** Items whose "start of the scene" statuses need a choice or a condition. */
const SKIP_SCENE = new Set([
  "R13 M5 Alchemist's Spirit Sword", "R5 Ankurutēpā no toranku", "R5 Reactive Mail", "R6 Aegis Guard",
  "R8 Lightning Protection", "R9 Steel Shell Armor of Andras"
]);

/* -------------------------------------------- */
/*  Trigger powers of items                     */
/* -------------------------------------------- */

/** What a power gives when used: an LH status ("barrier", 60), as the system's compendium skills do. */
const status = (statusId, value, { tag, expires = "endOfScene" } = {}) => ({ statusId, value, tag, expires });
/** What a power gives when used: an effect change (a power, a roll bonus of the system). */
const bonus = (key, value, { expires = "endOfScene", filter } = {}) => ({ key, value, expires, filter });
const RECOVERY = "system.battle-status.power.restoration.mod";
const DAMAGE_MOD = "lhtrpg.roll.damage.mod";
const DAMAGE_DICE = "lhtrpg.roll.damage.dice";
/** Healing / direct damage rolled from the skill's card (only its own value: no power is added). */
const heal = mod => ({ dice: 0, mod, type: "", recovery: true, noPower: true });
const direct = mod => ({ dice: 0, mod, type: "direct", recovery: false, noPower: true });
const SELF = "Self";

/**
 * The trigger powers of the items ("[Trigger: Initiative] You gain [Barrier:60]. Once per scenario."), reviewed
 * one by one. The Timing, the cost in the marker ("& Fate 1"), the limit and the Character Rank lock (〔CR21〕)
 * are read from the text (text-rules.mjs, itemPowers); this table adds, per power in the order of the text:
 *   target / range  the skill's fields: "Self" gives its effects to the user, the others to the user's targets
 *   cost / limit    when the text writes them elsewhere ("Consumes 1 point of [Fate]", "[SR] times per scene")
 *   srOf            the skill whose Skill Rank counts in the limit ("SR/Scene"), by its name in the compendium
 *   effects         what it gives when used (statuses, powers, roll bonuses until the end of the process, round
 *                   or scene); left out when they depend on a choice, a result or a moment the text sets
 *   damage          healing or damage rolled from the skill's card
 *   minHate         the user's Hate must be at least this ("can only be used when your [Hate] is 10 or higher")
 *   whole           the skill's text is all the rules text (the power's own sentence lost its effect)
 * Every power becomes an Item skill: its text, its fields, the use limits and costs (use.mjs) work for all.
 */
const POWERS = {
  "Clockwork Bird": [{}],
  "Magic Lantern": [{ target: "Wide 20 (A)", range: "Close" }],
  "Memory Crystal Ball": [{ range: "4Sq" }, {}],
  "R10 Dream Witch's Chain": [{ target: SELF, effects: [status("pursuit", 20)] }],
  "R10 Gale Guard": [{}],
  "R10 Hikari no kōshi": [{ target: SELF, effects: [status("barrier", 60)] }],
  "R10 M5 Bakukon no ō shaku": [{ target: SELF }],
  "R10 M5 Escape Anchor": [{ target: SELF }],
  "R10 M6 Crusher of Minos": [{ target: "Single", effects: [status("weakness", 7, { tag: "Physical" })] }],
  "R10 Otune's Vault": [{ target: SELF }],
  "R10 Prismatic Mail": [{ target: SELF }],
  "R11 M6 Meikyū-ju no kagi": [{}],
  "R12 M4 Offyuka Whip": [{}, { target: SELF }],
  "R12 M5 Certainty Bow Alva": [{}, { target: "Single" }],
  "R13 M5 Alchemist's Spirit Sword": [{ target: SELF }],
  "R13 M5 Hayate no kirifuda": [{ target: SELF }],
  "R14 Armlet of Apeiron": [{ target: SELF }],
  "R14 Boots of Middle Pine": [{ target: SELF }],
  "R15 Epicurean Bag": [{
    target: SELF, effects: [status("cancel", 40, { tag: "Poison" }), status("cancel", 40, { tag: "Radiance" })]
  }],
  "R15 Grail Knight Armor": [{ target: SELF, minHate: 10, damage: heal(100) }],
  "R15 M6 Celebratory Sword: Ceremonial Bite": [{
    target: "Single", limit: "SR/Scene", srOf: "Summon Shikigami", effects: [status("pursuit", 20)]
  }],
  "R16 M4 Guardian Staff: Fate Guarder": [{ range: "20Sq" }],
  "R16 Phoenix Dance Vest": [{ target: SELF, effects: [status("flying")] }],
  "R16 Warding Cloak": [{ target: SELF, minHate: 6, effects: [status("hidden")] }],
  "R18 Lighthouse Armor": [{ target: SELF, effects: [bonus(DAMAGE_DICE, 2)] }],
  "R18 M5 Quartet Freccia": [{ target: "Single", effects: Array.from({ length: 4 }, () => status("pursuit", 15)) }],
  "R18 M6 Clock Upper": [{}],
  // [Dazed] "after that Main Process ends": given now, it would end with that same Main Process.
  "R19 Circular Shield of the Sun": [{ target: "Single" }],
  "R19 Ring of Da Squeuin": [{ target: SELF }],
  "R1 Boots of earth": [{ target: SELF, effects: [bonus(RECOVERY, 5, { expires: "endOfRound" })] }],
  "R1 New wife's apron dress": [{ target: SELF }],
  "R1 Yellow Twin Egg Bag": [{ target: SELF }],
  "R20 Black Mami Lucky Bag": [{ target: SELF }],
  "R20 M6 Harpoon bow": [{ target: SELF, range: "8Sq" }],
  "R20 Zauberflete": [{ target: SELF, whole: true }],
  "R2 Coat of arms double ring": [{}],
  "R2 Lion Armor": [{ target: "Single", range: "4Sq" }],
  "R2 M5 Big Shot": [{ target: SELF, minHate: 7, effects: [status("barrier", 20)] }],
  "R2 M6 Longbow of the Guardian Star": [{ target: "Wide 1 (P)", range: "Close", effects: [status("barrier", "@pow.base+5")] }],
  // "Your next damage roll": until the end of the round.
  "R3 Berserk Hide": [{
    target: SELF, effects: [bonus(DAMAGE_MOD, 5, { expires: "endOfRound" }), status("weakness", 10, { expires: "endOfRound" })]
  }],
  "R3 M4 Harvester": [{ target: SELF, effects: [bonus(RECOVERY, 6)] }],
  "R3 Rucksack With Wings": [{ target: SELF, effects: [status("flying")] }],
  "R4 Armor of Bloody Oath": [{}],
  "R4 Girdle of the Earth Spirit": [{ target: SELF }],
  "R4 M4 Evil Star": [{}],
  "R4 M4 Lightning Blaster": [{ target: SELF, effects: [bonus(DAMAGE_MOD, 10, { expires: "endOfProcess" })] }],
  "R4 M6 Agastya's Forbidden Staff": [{ target: "Single", range: "4Sq" }],
  // The target of "Heal" adds the user's Recovery Power to its next damage roll (until the end of the round).
  "R4 Shito no bōshi": [{ target: "Single", effects: [bonus(DAMAGE_MOD, "@recovery", { expires: "endOfRound" })] }],
  "R4 Trick Gloves": [{ target: SELF }, { target: SELF }],
  "R5 Heartbeat Ring": [{ target: "Single" }],
  "R5 M4 Afterglow Eater": [{ target: SELF }],
  "R5 M5 Moon Crystal Guardian Sword": [{ target: "Single", range: "2Sq" }],
  "R5 Reactive Mail": [{ target: SELF }],
  "R6 Aegis Guard": [{ target: SELF }],
  "R6 M4 Kodama Wand": [{
    target: SELF, effects: [bonus(DAMAGE_MOD, 6, { expires: "endOfProcess", filter: { skillTags: ["Magic Attack"] } })]
  }],
  "R6 M6Blue Maelstrom Ax": [{ target: "Wide 2 (P)", range: "Close", effects: [status("swimming", undefined, { expires: "endOfRound" })] }],
  "R6 M6 Medusa Gaze": [{ target: "Single", range: "4Sq", effects: [status("rigor")] }],
  "R6 Mist Kasumi Uchikake": [{ target: SELF, range: "2Sq" }],
  "R6 Shikigami Repeat Haori": [{ target: SELF, limit: "SR/Scene", srOf: "Summon Shikigami" }],
  "R7 Banshiki no kēpu": [{ target: "Area (P)", range: "Close", effects: [status("dazed")] }],
  "R7 Battle Maiden Breastplate": [{ target: SELF }, { target: SELF }],
  "R7 Full moon feldspar bangle": [{ target: SELF, whole: true }],
  "R7 M5 Hoisting Spear": [{ target: "Single", range: "2Sq" }],
  "R7 Void": [{}],
  "R8 Dazanek's Magic Bag": [{ target: SELF }],
  "R8 M5 Labrin's Thorny Chainlash": [{ target: "Single", range: "2Sq", effects: [status("decay", 5)] }],
  "R8 M6 Hungry Fang": [{}],
  "R8 True Emerald": [{ whole: true }],
  "R8 Type 39 Magical Armor (Heavy)": [{ target: SELF }],
  "R8 Type 39 Magical Armor  (light)": [{ target: SELF }],
  "R9 Black Eagle Boots": [{ target: SELF }],
  "R9 M5 Haunting Flame": [{ target: "Wide 2 (P)", range: "Close" }],
  "R9 M5 Kōryū no tsume": [{
    target: "Single", range: "2Sq", damage: direct("@str.base"), limit: "SR/Scenario", srOf: "Kung-fu Action"
  }],
  "R9 M6 Mamorugatana Hitorishizuka": [{ target: SELF, effects: [status("barrier", 40)] }],
  "R9 Steel Shell Armor of Andras": [{ target: SELF, effects: [bonus(DAMAGE_MOD, 5, { expires: "endOfRound" })] }],
  "Rapid Command": [{}],
  "Reverberant": [{}],
  "Riot Edge": [{ target: SELF, effects: [status("regen", 10)] }],
  "Sealing Sword: Yozakura": [{ target: SELF }],
  "Shōsō no shajiku": [{ target: SELF }],
  "Side Winder": [{ cost: "Fate 1" }],
  "Silver Shooting Star": [{}],
  "Spirit Rod": [{ target: "Single", range: "4Sq", damage: direct(10) }],
  "Strong Bow: Beat Claw": [{ target: SELF }],
  "Suigetsu": [{ range: "2Sq" }],
  "Sword of Adversity": [{ target: "Wide 20 (P)", range: "Close" }],
  "Toge o no nigiri-te": [{ target: "Single", damage: direct(15) }],
  "Twin Star Crossbow": [{ target: "Single", cost: "Fate 1", effects: [status("pursuit", 10)] }],
  "Vacuum fan": [{ target: "Single", range: "6Sq" }],
  "Victor's Glory": [{ target: SELF }]
};

/* -------------------------------------------- */
/*  Consumables                                 */
/* -------------------------------------------- */

/** Damage of usable items that only have it in their text (the Use card's Damage button rolls it). */
const USABLE_DAMAGE = {
  "Curse Poison I": { dice: 2, mod: 2, type: "magical" },
  "Curse Poison II": { dice: 2, mod: 17, type: "magical" },
  "Curse Poison III": { dice: 2, mod: 41, type: "magical" },
  "Curse Poison IV": { dice: 2, mod: 71, type: "magical" },
  "Demonic Cold Air Light Sand I": { dice: 2, mod: 5, type: "magical" },
  "Demonic Cold Air Light Sand II": { dice: 2, mod: 35, type: "magical" },
  "Demonic Cold Air Light Sand III": { dice: 2, mod: 65, type: "magical" },
  "Demonic Electric Shock Light Sand II": { dice: 2, mod: 35, type: "magical" },
  "Demonic Electric Shock Light Sand III": { dice: 2, mod: 65, type: "magical" },
  "Demonic Flame Light Sand II": { dice: 2, mod: 35, type: "magical" },
  "Demonic Flame Light Sand III": { dice: 2, mod: 65, type: "magical" },
  "Holy Water I": { dice: 1, mod: 0, type: "penetrating" },
  "Holy Water II": { dice: 1, mod: 3, type: "penetrating" },
  "Holy Water III": { dice: 1, mod: 8, type: "penetrating" },
  "Holy Water IV": { dice: 1, mod: 14, type: "penetrating" },
  "Self-Destruct Device": { dice: 0, mod: 25, type: "direct" },
  "Moonlight Elixir": { dice: 0, mod: 40, type: "direct" }
};

/**
 * Healing the module applies when the item is used (content.mjs): to the target's Character Rank plus `mod`;
 * `healer`: only a target of the Healer archetype. (Items whose damage is a fixed healing, such as the Healing
 * Potions, heal with it: they need no entry.)
 */
const USABLE_HEAL = {
  "Jewel of Rebirth I": { mod: 0, targetCr: true },
  "Jewel of Rebirth II": { mod: 10, targetCr: true },
  "Jewel of Rebirth III": { mod: 20, targetCr: true },
  "Life-Calling Jewel I": { mod: 0, targetCr: true, healer: true },
  "Life-Calling Jewel II": { mod: 10, targetCr: true, healer: true },
  "Life-Calling Jewel III": { mod: 20, targetCr: true, healer: true }
};

/** Statuses usable items give when used ("The target gains [Regen: 15]"). */
const USABLE_STATUSES = {
  "Regen Potion I": [status("regen", 5)],
  "Regen Potion II": [status("regen", 10)],
  "Regen Potion III": [status("regen", 15)],
  "Barrier Jewel I": [status("barrier", 15)],
  "Bisen Peach Medicine": [status("barrier", 30), status("flying")]
};

const SKILL_PACKS = ["skills-class", "skills-archetype", "skills-common", "skills-racial", "skills-mounts", "skills-basic"];
const EQUIPMENT = ["weapon", "armor", "shield", "accessory", "bag"];
/** Item types whose trigger powers become skills (gear is carried, never equipped). */
const POWER_TYPES = [...EQUIPMENT, "gear"];

const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith(".json") ? [path.join(dir, e.name)] : []));
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));

const hasDamage = damage => !!(damage && ((damage.dice && (damage.dice !== "0")) || (damage.mod && (damage.mod !== "0")) || damage.type));
const damageData = ({ dice = 0, mod = 0, type = "", recovery = false, noPower = false }) => ({ dice, mod, type, recovery, noPower });

/** An effect "when used" giving one LH status to the target (as the system's compendium skills do). */
function statusEffect(doc, { statusId, value, tag }) {
  const statusData = { statusId };
  if (value !== undefined) statusData.value = value;
  if (tag) statusData.tag = tag;
  return {
    name: doc.name,
    img: doc.img,
    type: "base",
    transfer: false,
    disabled: false,
    statuses: [statusId],
    system: { changes: [] },
    flags: { lhtrpg: { expires: "endOfScene", statusData }, [MODULE_ID]: { patch: VERSION } }
  };
}

/**
 * An effect "when used" from a status(…) / bonus(…) entry of the tables above (copied to the user or the
 * targets by the system when the skill or the item is used).
 */
function useEffect(doc, spec) {
  const effect = {
    name: doc.name,
    img: doc.img,
    type: "base",
    transfer: false,
    disabled: false,
    statuses: [],
    system: { changes: [] },
    flags: { lhtrpg: { expires: spec.expires }, [MODULE_ID]: { patch: VERSION } }
  };
  if (spec.statusId) {
    const statusData = { statusId: spec.statusId };
    if (spec.value !== undefined) statusData.value = spec.value;
    if (spec.tag) statusData.tag = spec.tag;
    effect.statuses = [spec.statusId];
    effect.flags.lhtrpg.statusData = statusData;
  }
  else {
    effect.system.changes = [{ key: spec.key, type: "add", value: spec.value, phase: "initial", priority: null }];
    if (spec.filter) effect.flags.lhtrpg.rollFilter = spec.filter;
  }
  return effect;
}

/** A Constant effect with an item's bonuses (works while the item is equipped). */
function bonusEffect(doc, changes) {
  return {
    name: doc.name,
    img: doc.img,
    type: "base",
    transfer: true,
    disabled: false,
    statuses: [],
    system: { changes: changes.map(c => ({ key: c.key, type: "add", value: c.value, phase: "initial", priority: null })) },
    flags: { [MODULE_ID]: { patch: VERSION } }
  };
}

const items = {};
const monsters = {};
const report = {
  damage: [], statuses: [], bonuses: [], scene: [], fatigue: [], monsterDamage: 0, monsterStatuses: 0,
  powers: [], usableDamage: [], usableHeal: [], usableStatuses: [], crLocks: 0
};
/** Compendium uuids of the character skills, by name (skills named in POWERS). */
const skillUuids = {};

// Character skills: damage / healing (table above) and the statuses they give
for (const pack of SKILL_PACKS) {
  for (const file of walk(path.join(PACKS, pack))) {
    const doc = read(file);
    if (doc.type !== "skill") continue;
    skillUuids[doc.name] ??= `Compendium.lhtrpg.${pack}.Item.${doc._id}`;
    const patch = {};
    const damage = SKILL_DAMAGE[doc.name];
    if (damage && !hasDamage(doc.system.damage)) {
      patch.damage = damageData(damage);
      report.damage.push(doc.name);
    }
    if (!(doc.effects ?? []).some(e => e.transfer === false) && !SKIP_STATUSES.has(doc.name)) {
      const statuses = targetStatuses(doc.system.description);
      if (statuses.length) {
        patch.effects = statuses.map(s => statusEffect(doc, s));
        report.statuses.push(`${doc.name}: ${statuses.map(s => s.statusId).join(", ")}`);
      }
    }
    if (Object.keys(patch).length) items[`Compendium.lhtrpg.${pack}.Item.${doc._id}`] = { name: doc.name, ...patch };
  }
}
for (const name of Object.keys(SKILL_DAMAGE)) {
  if (!report.damage.includes(name)) console.warn(`! ${name}: not found, or already has damage data`);
}

/** The system's own reader of the skill fields, to check the fields written in POWERS. */
const { parseSkillField } = await import(pathToFileURL(path.join(SYSTEM, "module", "helpers", "skill-fields.mjs")).href);
const reviewedPowers = new Set();

/**
 * The skills an item's trigger powers become (see POWERS): their fields, text (the skill gets the power's text
 * from the item's own description when it is created, in the language of the world: this is the fallback),
 * effects, damage and conditions.
 */
function powerData(doc, powers) {
  const reviewed = POWERS[doc.name];
  if (!reviewed) console.warn(`! ${doc.name}: trigger powers not reviewed (see POWERS)`);
  else if (reviewed.length !== powers.length) console.warn(`! ${doc.name}: ${powers.length} powers in the text, ${reviewed.length} in POWERS`);
  reviewedPowers.add(doc.name);
  return powers.map((power, i) => {
    const r = reviewed?.[i] ?? {};
    const data = {
      timing: power.timing,
      target: r.target ?? "-",
      range: r.range ?? "-",
      cost: r.cost ?? power.cost,
      limit: r.limit ?? power.limit,
      text: r.whole ? powerRules(doc.system.description) : power.text
    };
    for (const field of ["timing", "target", "range", "cost", "limit"]) {
      const custom = (parseSkillField(field, data[field]).type === "custom") && !/magic catalyst/i.test(data[field]);
      if (custom) console.warn(`! ${doc.name} (${i + 1}): ${field} "${data[field]}" isn't one of the system's`);
    }
    if (r.whole) data.whole = true;
    if (power.crLock) data.crLock = power.crLock;
    if (r.minHate) data.minHate = r.minHate;
    // "[Trigger: Initiative & Self: Not Acted]": only before the user's Main Process of the round.
    if (/not acted/i.test(power.condition)) data.notActed = true;
    else if (power.condition) console.warn(`! ${doc.name}: condition "${power.condition}" not checked`);
    if (r.srOf) {
      if (!skillUuids[r.srOf]) console.warn(`! ${doc.name}: no skill named "${r.srOf}"`);
      data.srOf = { uuid: skillUuids[r.srOf] ?? "", name: r.srOf };
    }
    if (r.damage) data.damage = damageData(r.damage);
    if (r.effects?.length) data.effects = r.effects.map(spec => useEffect(doc, spec));
    return data;
  });
}

/** One line of the report per power. */
function powerLine(power) {
  const parts = [power.timing, power.target !== "-" ? power.target : "", power.range !== "-" ? power.range : "",
    power.cost, power.limit, power.crLock ? `CR${power.crLock}` : "", power.minHate ? `Hate ${power.minHate}+` : "", power.notActed ? "not acted" : ""];
  const effects = (power.effects ?? []).map(e => {
    const s = e.flags.lhtrpg.statusData;
    if (s) return `${s.statusId}${s.tag ? ` (${s.tag})` : ""}${s.value !== undefined ? ` ${s.value}` : ""}`;
    const c = e.system.changes[0];
    return `${c.key.split(".").slice(-2).join(".")} +${c.value}`;
  });
  if (power.damage) effects.push(`${power.damage.recovery ? "heal" : power.damage.type} ${power.damage.dice ? `${power.damage.dice}D+` : ""}${power.damage.mod}`);
  return `${parts.filter(Boolean).join(" · ")}${effects.length ? ` → ${effects.join(", ")}` : ""}`;
}

// Items: constant bonuses, statuses at the start of each scene, food against Fatigue, trigger powers, and the
// damage, healing, statuses and Character Rank locks of the usable items
for (const file of walk(path.join(PACKS, "items"))) {
  const doc = read(file);
  if (!doc.system) continue;
  const patch = {};
  const flags = {};
  const text = doc.system.description;
  const hasEffects = !!(doc.effects ?? []).length;
  if (EQUIPMENT.includes(doc.type) && !hasEffects) {
    const bonuses = itemBonuses(text);
    if (bonuses.length) {
      patch.effects = [bonusEffect(doc, bonuses)];
      report.bonuses.push(`${doc.name}: ${bonuses.map(b => `${b.key.split(".").slice(-2).join(".")} +${b.value}`).join(", ")}`);
    }
    const scene = SKIP_SCENE.has(doc.name) ? [] : sceneStatuses(text);
    if (scene.length) {
      flags.sceneStatuses = scene;
      report.scene.push(`${doc.name}: ${scene.map(s => `${s.status} ${s.value}${s.tags.length ? ` (${s.tags.join(", ")})` : ""}`).join("; ")}`);
    }
  }
  if (POWER_TYPES.includes(doc.type)) {
    const powers = itemPowers(text);
    if (powers.length) {
      patch.powers = powerData(doc, powers);
      report.powers.push(`${doc.name}: ${patch.powers.map(powerLine).join(" | ")}`);
    }
  }
  if (doc.type === "usable") {
    if (!hasEffects && (doc.system.tags ?? []).includes("Food")) {
      const fatigue = itemFatigue(text);
      if (fatigue) {
        flags.fatigue = fatigue;
        report.fatigue.push(`${doc.name}: -${fatigue}`);
      }
    }
    const damage = USABLE_DAMAGE[doc.name];
    if (damage) {
      if (hasDamage(doc.system.damage)) console.warn(`! ${doc.name}: already has damage data`);
      else {
        patch.damage = damageData(damage);
        report.usableDamage.push(`${doc.name}: ${damage.dice ? `${damage.dice}D+` : ""}${damage.mod} ${damage.type}`);
      }
    }
    if (USABLE_HEAL[doc.name]) {
      flags.heal = USABLE_HEAL[doc.name];
      report.usableHeal.push(`${doc.name}: CR+${flags.heal.mod}${flags.heal.healer ? " (Healer)" : ""}`);
    }
    else if (doc.system.damage?.recovery && hasDamage(doc.system.damage)) {
      report.usableHeal.push(`${doc.name}: ${doc.system.damage.dice ? `${doc.system.damage.dice}D+` : ""}${doc.system.damage.mod} (its damage)`);
    }
    const statuses = USABLE_STATUSES[doc.name];
    if (statuses) {
      if (hasEffects) console.warn(`! ${doc.name}: already has effects`);
      else {
        patch.effects = statuses.map(spec => useEffect(doc, spec));
        report.usableStatuses.push(`${doc.name}: ${statuses.map(s => `${s.statusId}${s.value !== undefined ? ` ${s.value}` : ""}`).join(", ")}`);
      }
    }
    const lock = crLock(text);
    if (lock) {
      flags.crLock = lock;
      report.crLocks++;
    }
  }
  if (Object.keys(flags).length) patch.flags = flags;
  if (Object.keys(patch).length) items[`Compendium.lhtrpg.items.Item.${doc._id}`] = { name: doc.name, ...patch };
}
for (const name of Object.keys(POWERS)) {
  if (!reviewedPowers.has(name)) console.warn(`! ${name}: in POWERS, but no item with trigger powers has this name`);
}
for (const table of [USABLE_DAMAGE, USABLE_HEAL, USABLE_STATUSES]) {
  for (const name of Object.keys(table)) {
    if (!Object.values(items).some(i => i.name === name)) console.warn(`! ${name}: not found among the usable items`);
  }
}

// Monsters: the damage of their attacks and the statuses they give
for (const file of walk(path.join(PACKS, "bestiary"))) {
  const doc = read(file);
  if (doc.type !== "monster") continue;
  const skills = {};
  for (const item of doc.items ?? []) {
    if (item.type !== "skill") continue;
    const patch = {};
    if (!hasDamage(item.system.damage)) {
      const damage = parseMonsterDamage(item.system.description, { tags: item.system.tags });
      if (damage) {
        patch.damage = damageData(damage);
        report.monsterDamage++;
      }
    }
    if (!(item.effects ?? []).length && !SKIP_STATUSES.has(`${doc.name}/${item.name}`)) {
      const statuses = targetStatuses(item.system.description);
      if (statuses.length) {
        patch.effects = statuses.map(s => statusEffect(item, s));
        report.monsterStatuses++;
      }
    }
    if (Object.keys(patch).length) skills[item._id] = { name: item.name, ...patch };
  }
  if (Object.keys(skills).length) monsters[`Compendium.lhtrpg.bestiary.Actor.${doc._id}`] = { name: doc.name, skills };
}

const data = { version: VERSION, items, monsters };
fs.writeFileSync(OUT, `// Generated by tools/build-patches.mjs from the lhtrpg compendium sources: don't edit by hand.\nexport default ${JSON.stringify(data, null, 1)};\n`);

console.log(`Skill damage / healing (${report.damage.length}): ${report.damage.join(", ")}`);
console.log(`\nSkill statuses (${report.statuses.length}):\n  ${report.statuses.join("\n  ")}`);
console.log(`\nItem bonuses (${report.bonuses.length}):\n  ${report.bonuses.join("\n  ")}`);
console.log(`\nItem statuses at the start of the scene (${report.scene.length}):\n  ${report.scene.join("\n  ")}`);
console.log(`\nFood against Fatigue: ${report.fatigue.length}`);
const powerCount = Object.values(items).reduce((n, i) => n + (i.powers?.length ?? 0), 0);
console.log(`\nItem trigger powers (${report.powers.length} items, ${powerCount} powers):\n  ${report.powers.join("\n  ")}`);
console.log(`\nUsable items: damage (${report.usableDamage.length}):\n  ${report.usableDamage.join("\n  ")}`);
console.log(`Healing when used (${report.usableHeal.length}):\n  ${report.usableHeal.join("\n  ")}`);
console.log(`Statuses when used (${report.usableStatuses.length}):\n  ${report.usableStatuses.join("\n  ")}`);
console.log(`Character Rank locks: ${report.crLocks}`);
console.log(`\nMonster skills: ${report.monsterDamage} with damage, ${report.monsterStatuses} with statuses`);
console.log(`\n${path.relative(ROOT, OUT)}: ${Object.keys(items).length} items/skills, ${Object.keys(monsters).length} monsters, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
