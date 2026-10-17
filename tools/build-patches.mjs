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
import { fileURLToPath } from "node:url";
import { parseMonsterDamage } from "../scripts/content/monster-damage.mjs";
import { itemBonuses, itemFatigue, sceneStatuses, targetStatuses } from "./text-rules.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SYSTEM = path.resolve(process.argv[2] ?? path.join(ROOT, "..", "LHTTRPG"));
const PACKS = path.join(SYSTEM, "src", "packs");
const OUT = path.join(ROOT, "scripts", "content", "patches.mjs");
const MODULE_ID = "lhtrpg-automacao";
/** Bump when the data changes, so the GM tool offers to fill documents patched by an older version. */
const VERSION = 1;

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

const SKILL_PACKS = ["skills-class", "skills-archetype", "skills-common", "skills-racial", "skills-mounts", "skills-basic"];
const EQUIPMENT = ["weapon", "armor", "shield", "accessory", "bag"];

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
const report = { damage: [], statuses: [], bonuses: [], scene: [], fatigue: [], monsterDamage: 0, monsterStatuses: 0 };

// Character skills: damage / healing (table above) and the statuses they give
for (const pack of SKILL_PACKS) {
  for (const file of walk(path.join(PACKS, pack))) {
    const doc = read(file);
    if (doc.type !== "skill") continue;
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

// Items: constant bonuses, statuses at the start of each scene, food against Fatigue
for (const file of walk(path.join(PACKS, "items"))) {
  const doc = read(file);
  if (!doc.system || (doc.effects ?? []).length) continue;
  const patch = {};
  const flags = {};
  const text = doc.system.description;
  if (EQUIPMENT.includes(doc.type)) {
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
  if ((doc.type === "usable") && (doc.system.tags ?? []).includes("Food")) {
    const fatigue = itemFatigue(text);
    if (fatigue) {
      flags.fatigue = fatigue;
      report.fatigue.push(`${doc.name}: -${fatigue}`);
    }
  }
  if (Object.keys(flags).length) patch.flags = flags;
  if (Object.keys(patch).length) items[`Compendium.lhtrpg.items.Item.${doc._id}`] = { name: doc.name, ...patch };
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
console.log(`Monster skills: ${report.monsterDamage} with damage, ${report.monsterStatuses} with statuses`);
console.log(`\n${path.relative(ROOT, OUT)}: ${Object.keys(items).length} items/skills, ${Object.keys(monsters).length} monsters, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
