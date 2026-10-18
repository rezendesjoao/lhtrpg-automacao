/**
 * Readers of the compendium's English rules text, used by build-patches.mjs to propose data
 * (the results are reviewed: see the lists printed by the build).
 */
import { plainText } from "../scripts/content/monster-damage.mjs";

/** The part of a skill text that always applies: before the first "(Condition):" rider. */
export function unconditionalPart(html) {
  const text = plainText(html);
  // "(Minor):", "(Fate 1):", "(Target: Hate Top):", "(SR2):", "(CR11):", "[Minor]"… but not "[(SR)D + …]".
  const rider = text.search(/\((?:Minor|Major|Fate|Hate|Target|Self|Critical|Success|Failure|Result|Effect|Extra|Bonus|Fumble)\b[^)]*\)\s*:?|\((?:SR|CR)\s*\d+\)\s*:?|\[(?:Minor|Major|Fate\s*\d|Hate\s*\d|Causal Power\s*\d)\]/i);
  const cut = rider >= 0 ? text.slice(0, rider) : text;
  // Flavor text follows the rules: stop at the first sentence that describes ("A special skill…").
  const flavor = cut.search(/\b(?:A|An)\s+(?:special skill|skill|magic|spell|attack magic|offensive|technique|feat)\b/);
  return (flavor >= 0 ? cut.slice(0, flavor) : cut).trim();
}

/** LH status names in English texts -> status ids of the system. */
const STATUS_IDS = {
  dazed: "dazed", staggered: "staggered", stagged: "staggered", rigor: "rigor", confused: "confused", confusion: "confused",
  decay: "decay", pursuit: "pursuit", afflicted: "afflicted", overconfident: "overconfident", weakness: "weakness"
};
const RATED = new Set(["decay", "pursuit", "weakness"]);

/**
 * A rating written in a skill ("10", "(SRx5)", "[SR x 5]", "(INT Mod) x 2", "[Magic Power]") as a
 * formula of the system ("@sr*5", "@int*2", "@magic"), or null.
 */
export function ratingFormula(text) {
  let expr = String(text ?? "").toLowerCase()
    .replace(/&times;|×/g, "x")
    .replace(/[[\]()]/g, " ")
    .replace(/\bsr\b/g, "@sr").replace(/\bcr\b/g, "@cr")
    .replace(/\b(str|dex|pow|int)\s*mod\b/g, "@$1")
    .replace(/\b(str|dex|pow|int)\s*base\b/g, "@$1.base")
    .replace(/\bbase\s*(str|dex|pow|int)\b/g, "@$1.base")
    .replace(/\bmagic(?:al)?\s*power\b/g, "@magic").replace(/\battack\s*power\b/g, "@attack").replace(/\brecovery(?:\s*power)?\b/g, "@recovery")
    .replace(/\s*x\s*/g, "*").replace(/\s+/g, "");
  if (!expr || !/^[@a-z0-9.+*\-]+$/.test(expr) || /[a-z]/.test(expr.replace(/@(sr|cr|str|dex|pow|int|magic|attack|recovery)(\.base)?/g, ""))) return null;
  return /^\d+$/.test(expr) ? Number(expr) : expr;
}

/**
 * Statuses a skill always gives its target: "The target takes [Dazed]", "target takes [Decay: (SRx5)]",
 * "The target takes [Weakness (Flame): 5]".
 * @returns {{statusId: string, value?: number|string, tag?: string}[]}
 */
export function targetStatuses(html) {
  const text = unconditionalPart(html);
  const statuses = [];
  // "takes [A] and [B]", "takes [Decay: 5]", "gains [Dazed]"
  for (const clause of text.matchAll(/(?:target|targets)\s+(?:also\s+)?(?:takes?|becomes?|gets?|is put in(?:to)?)\s+((?:\[[^\]]+\](?:\s*(?:and|,)\s*)?)+)/gi)) {
    for (const [, inner] of clause[1].matchAll(/\[([^\]]+)\]/g)) {
      const m = inner.match(/^\s*([a-z]+)\s*(?:\(([^)]*)\))?\s*(?::\s*(.+))?$/i);
      const id = m && STATUS_IDS[m[1].toLowerCase()];
      if (!id) continue;
      const entry = { statusId: id };
      if (RATED.has(id)) {
        const value = ratingFormula(m[3]);
        if (value === null || value === undefined) continue;
        entry.value = value;
      }
      if ((id === "weakness") && m[2]) entry.tag = tagName(m[2]);
      statuses.push(entry);
    }
  }
  return statuses;
}

/**
 * The part of an item text that always applies: before its first triggered or conditional power
 * ("[Trigger: …]", "[Self: Hate Top]", "[You: …]").
 */
export function alwaysPart(html) {
  return plainText(html).split(/\[(?:Trigger|Self|You)\b/i)[0];
}

/** Tags written differently in the item texts -> the system's tags. */
const TAG_NAMES = {
  lightning: "Shock", fire: "Flame", "magic attacks": "Magic Attack", "shooting attack": "Ranged Attack",
  "physical damage": "Physical", "magic damage": "Magic", "magical damage": "Magic"
};
export const tagName = tag => TAG_NAMES[String(tag).trim().toLowerCase()] ?? String(tag).trim();

/** Check names in English texts -> keys of `system.checks`. */
const CHECKS = {
  athletics: "athletics", endurance: "endurance", disable: "disable", operation: "operation", operate: "operation",
  perception: "perception", negotiation: "negotiation", knowledge: "knowledge", analysis: "analysis", analyze: "analysis",
  evasion: "evasion", resistance: "resistance", accuracy: "accuracy"
};
const POWERS = [
  [/attack(?:\s*power)?/i, "system.battle-status.power.attack.mod"],
  [/magic(?:al)?\s*power/i, "system.battle-status.power.magic.mod"],
  [/recovery(?:\s*power)?/i, "system.battle-status.power.restoration.mod"],
  [/physical\s*defen[cs]e/i, "system.battle-status.defense.phys.mod"],
  [/magic(?:al)?\s*defen[cs]e/i, "system.battle-status.defense.magic.mod"],
  [/initiative/i, "system.battle-status.initiative.mod"]
];

/**
 * Constant bonuses of an item: "+2 to your [Attack]", "Your [Recovery] increases by +6", "[Magic Power]+3",
 * "+1 bonus to Analysis", "+1 to your [Perception] and [Analysis]". Sentences with a condition (when,
 * while, if, trigger, once per…) are left out.
 * @returns {{key: string, value: number}[]}
 */
export function itemBonuses(html) {
  const text = alwaysPart(html);
  const changes = [];
  for (const sentence of text.split(/(?<=\.)\s+|\[Trigger/)) {
    if (/\b(when|while|whenever|if|once per|until|during|after|before|exclusive to|only when)\b|trigger|use this|used when|\(cr|treated as/i.test(sentence)) continue;
    const s = sentence.replace(/[[\]]/g, "");
    // "+N to your X [and Y]" / "+N bonus to X" / "Add +N to your X"
    for (const m of s.matchAll(/\+\s*(\d+)\s*(?:bonus\s*)?(?:to|on|in)\s*(?:your\s*|this\s*\w+'s\s*)?([A-Za-z ]+?)(?:\s+and\s+([A-Za-z ]+?))?(?=[.,;]|$|\s+checks?\b)/gi)) {
      for (const name of [m[2], m[3]].filter(Boolean)) addBonus(changes, name.trim(), Number(m[1]));
    }
    // "X increases by +N" / "X +N" / "X: +N"
    for (const m of s.matchAll(/(?:your\s*|this\s*\w+'s\s*)?([A-Za-z ]+?)\s*(?:increases? by|:)?\s*\+\s*(\d+)/gi)) {
      addBonus(changes, m[1].trim(), Number(m[2]));
    }
  }
  // One change per key (a sentence may match both patterns)
  const seen = new Set();
  return changes.filter(c => !seen.has(c.key) && seen.add(c.key));
}

function addBonus(changes, name, value) {
  const lower = name.toLowerCase().replace(/\s+check$/, "");
  const check = CHECKS[lower];
  if (check) return changes.push({ key: `system.checks.${check}.mod`, value });
  const power = POWERS.find(([pattern]) => pattern.test(lower) && (lower.replace(pattern, "").trim() === ""));
  if (power) changes.push({ key: power[1], value });
}

/**
 * Statuses an item gives at the start of every scene (or always): "You gain [Mitigation (Poison): 60] at
 * the start of the scene", "You gain [Cancel (Flight, Aquatic): 50]".
 * @returns {{status: string, value: number, tags: string[]}[]}
 */
export function sceneStatuses(html) {
  const text = alwaysPart(html);
  const sentences = text.split(/(?<=\.)\s+/);
  const found = [];
  for (const sentence of sentences) {
    if (/trigger|when you|while|if you|use this|once per/i.test(sentence)) continue;
    if (!/\b(?:you|the wearer)\s+(?:always\s+)?(?:gain|receive|have)\b/i.test(sentence)) continue;
    for (const m of sentence.matchAll(/\[(Mitigation|Cancel|Reduction|Barrier|Regen|Weakness)\s*(?:\(([^)]*)\))?\s*:\s*(\d+)\]/gi)) {
      const status = /barrier/i.test(m[1]) ? "barrier" : /regen/i.test(m[1]) ? "regen" : /weakness/i.test(m[1]) ? "weakness" : "cancel";
      const tags = (m[2] ?? "").split(/,|\band\b/).map(t => t.trim()).filter(Boolean).map(tagName);
      found.push({ status, value: Number(m[3]), tags });
    }
  }
  return found;
}

/** HP recovered by a consumable: "Recovers 25 points of target's [HP]". */
export function itemHeal(html) {
  const m = plainText(html).match(/recovers?\s+(?:\[?(\d+)D\s*\+\s*)?(\d+)\]?\s*(?:points of\s+)?(?:the\s+)?(?:target's\s+)?\[?HP/i);
  return m ? { dice: Number(m[1] ?? 0), mod: Number(m[2]) } : null;
}

/** Fatigue a food removes: "-35 to the strength of the target's [Fatigue]", "Reduces target's [Fatigue] strength by -6". */
export function itemFatigue(html) {
  const text = plainText(html);
  const m = text.match(/-\s*(\d+)\s*(?:to\s+)?(?:the\s+)?(?:strength|intensity)?[^.]{0,30}\[?Fatigue/i)
    ?? text.match(/Fatigue\]?\s*(?:strength|intensity|status)?[^.]{0,20}?(?:reduced|reduces?)?\s*(?:by\s*)?-\s*(\d+)/i)
    ?? text.match(/Fatigue\]?\s*is reduced by\s*-?\s*(\d+)/i);
  return m ? Number(m[1]) : null;
}

/* -------------------------------------------- */
/*  Trigger powers of items                     */
/* -------------------------------------------- */

/** The marker of an item power: "[Trigger: Initiative]", "[Trigger: Action & Fate 1]:", "[Act: Instant]". */
const POWER_MARKER = /\[(?:Trigger|Act)\s*:\s*([^\]]+)\]\s*:?/gi;

/** Trigger words -> the system's Timings ("Text" and "Body" are the rules' "Refer": see the text). */
const POWER_TIMINGS = [
  [/^immediately after (?:the )?damage/i, "After Damage"],
  [/^immediately after (?:the )?check/i, "After Check"],
  [/^damage roll/i, "Damage Roll"],
  [/^pre-?play/i, "Pre-Play"],
  [/^rest time/i, "Rest Time"],
  [/^(?:text|body|refer)\b/i, "Refer"],
  [/^action\b/i, "Action"],
  [/^setup\b/i, "Setup"],
  [/^initiative\b/i, "Initiative"],
  [/^instant\b/i, "Instant"],
  [/^move\b/i, "Move"],
  [/^minor\b/i, "Minor"],
  [/^major\b/i, "Major"],
  [/^cleanup\b/i, "Cleanup"]
];

/**
 * What a power's marker says: its Timing, its cost ("Fate 1", "Hate 2", "Magic Catalyst 1") and a
 * condition ("Self: Not Acted").
 * @param {string} header   The inside of "[Trigger: …]"
 * @returns {{timing: string, cost: string, condition: string}}
 */
export function parseTrigger(header) {
  const [first = "", ...rest] = String(header).split("&").map(s => s.trim()).filter(Boolean);
  const timing = POWER_TIMINGS.find(([pattern]) => pattern.test(first))?.[1] ?? first;
  let cost = "";
  let condition = "";
  for (const part of rest) {
    const m = part.match(/^(fate|hate)\s*(\d+)$/i);
    if (m) cost = `${m[1].charAt(0).toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2]}`;
    else if (/magic catalyst/i.test(part)) cost = part.replace(/\s+/g, " ");
    else condition = part;
  }
  return { timing, cost, condition };
}

/**
 * The usage limit a power's text writes, as a skill Limit: "Once per scenario" -> "1/Scenario",
 * "1Once per scene" -> "1/Scene", "2 times per scenario" -> "2/Scenario". "" when it writes none.
 */
export function powerLimit(text) {
  const t = String(text ?? "");
  let m = t.match(/(once|twice|\d+)\s*(?:times?\s*)?(?:per|\/|in an?)\s*(scene|scenario)\b/i);
  let n;
  let type;
  if (m) [, n, type] = m;
  else if ((m = t.match(/\b(scene|scenario)\s+can be used\s+(once|twice|\d+)/i))) [, type, n] = m;
  else return "";
  const count = { once: 1, twice: 2 }[n.toLowerCase()] ?? Number(n);
  return `${count}/${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()}`;
}

/**
 * The Character Rank from which an item no longer works: "〔CR21〕This item's effect cannot be used",
 * "[CR12] The effect of this item cannot be activated", "(CR11): This item has no effect". 0 if none.
 */
export function crLock(text) {
  const m = plainText(text).match(/[〔[(]\s*CR\s*(\d+)\s*[〕\])]\s*:?\s*(?:this item|the effect)/i);
  return m ? Number(m[1]) : 0;
}

/**
 * The trigger powers of an item, in the order of its text. Each power runs from its marker to the next
 * one, or to the end of its line: the item's flavor text and crafting recipe come after.
 * @param {string} html   The item's description
 * @returns {{timing: string, cost: string, condition: string, text: string, body: string, limit: string,
 *   crLock: number}[]}   `text` is the whole power with its marker, `body` without it.
 */
export function itemPowers(html) {
  const text = String(html ?? "").split(/<hr\s*\/?>/i)[0]
    .split(/<\/p>|<br\s*\/?>|\n/i).map(plainText).join("\n");
  const marks = [...text.matchAll(POWER_MARKER)];
  return marks.map((m, i) => {
    const end = marks[i + 1]?.index ?? text.length;
    const power = text.slice(m.index, end).split("\n")[0].trim();
    const body = power.slice(m[0].length).trim();
    return { ...parseTrigger(m[1]), text: power, body, limit: powerLimit(body), crLock: crLock(body) };
  });
}

/** The rules text of an item with trigger powers: every line up to the one with its last power. */
export function powerRules(html) {
  const lines = String(html ?? "").split(/<hr\s*\/?>/i)[0].split(/<\/p>|<br\s*\/?>|\n/i).map(plainText);
  const last = lines.findLastIndex(line => /\[(?:Trigger|Act)\s*:/i.test(line));
  return lines.slice(0, last + 1).filter(Boolean).join(" ");
}
