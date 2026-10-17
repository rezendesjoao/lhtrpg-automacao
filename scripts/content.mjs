/**
 * Content: the data the system's compendiums only have as text.
 *
 * - content/patches.mjs (built by tools/build-patches.mjs): the damage / healing of skills, the
 *   statuses skills and monster attacks give, items' constant bonuses, the statuses items give at the
 *   start of every scene and the Fatigue food removes, keyed by compendium uuid.
 * - Documents created from the system compendiums get the data they lack as they are created. The
 *   GM tool fills those already in the world; for monsters made by hand (or older copies) it reads
 *   the damage of their attacks from their text (content/monster-damage.mjs, English or Portuguese).
 * - Statuses "at the start of the scene": given by the equipped items when a combat starts.
 * - Food: using it removes Fatigue from whoever eats it (the user, or the targeted characters).
 *
 * Only missing data is filled: what a GM edited by hand is never replaced.
 */
import PATCHES from "./content/patches.mjs";
import { parseMonsterDamage } from "./content/monster-damage.mjs";
import { L, MODULE_ID, setting } from "./settings.mjs";
import { canonicalTag, registerHandler, request } from "./system.mjs";
import { actorName, combatActors, escape, toInt } from "./util.mjs";

const EQUIPMENT = ["weapon", "armor", "shield", "accessory", "bag"];

/** Call during the `init` hook. */
export function registerContent() {
  Hooks.on("preCreateItem", onPreCreateItem);
  Hooks.on("preCreateActor", onPreCreateActor);
  Hooks.on("combatStart", combat => {
    if (setting("content")) sceneStatuses(combat).catch(err => console.error(`${MODULE_ID} | Scene statuses failed`, err));
  });
  Hooks.on("createChatMessage", onCreateMessage);
  Hooks.on("renderChatMessageHTML", renderFood);
  registerHandler("lhautoFood", onFoodRequest);
}

/* -------------------------------------------- */
/*  Patches                                     */
/* -------------------------------------------- */

/** Whether damage data is set (a number, a formula or a type). */
function hasDamage(damage) {
  const set = value => !!value && (String(value).trim() !== "0");
  return !!damage && (set(damage.dice) || set(damage.mod) || !!damage.type);
}

/** The compendium entry a document was made from. */
const sourceOf = data => data?._stats?.compendiumSource ?? data?.flags?.core?.sourceId ?? null;

/** A patch read from a monster attack's text: its damage. */
function textPatch(itemSource) {
  if ((itemSource?.type !== "skill") || hasDamage(itemSource.system?.damage)) return null;
  const damage = parseMonsterDamage(itemSource.system?.description, { tags: itemSource.system?.tags });
  return damage ? { damage: { ...damage, recovery: false, noPower: false } } : null;
}

/** Patches of the system compendium entries by name (documents that lost their source), built once. */
let byName = null;
function patchByName(item) {
  if (!byName) {
    byName = new Map();
    for (const [uuid, patch] of Object.entries(PATCHES.items)) {
      const entry = fromUuidSync(uuid);
      if (entry?.name) byName.set(`${entry.type}|${entry.name.toLowerCase()}`, patch);
      byName.set(`${entry?.type}|${patch.name.toLowerCase()}`, patch);
    }
  }
  return byName.get(`${item.type}|${String(item.name).toLowerCase()}`) ?? null;
}

/**
 * What an item lacks from its patch.
 * @param {object} source   The item's source data
 * @param {object} patch
 * @returns {{update: object, effects: object[]}}
 */
function itemChanges(source, patch) {
  const update = {};
  if (patch.damage && !hasDamage(source.system?.damage)) update["system.damage"] = { ...patch.damage };

  const effects = [];
  if (patch.effects?.length) {
    const existing = source.effects ?? [];
    const transfer = patch.effects[0].transfer !== false;
    const already = existing.some(e => e.flags?.[MODULE_ID]?.patch)
      || existing.some(e => transfer ? (e.transfer !== false) : (e.transfer === false));
    if (!already) effects.push(...patch.effects.map(e => foundry.utils.deepClone(e)));
  }

  for (const [key, value] of Object.entries(patch.flags ?? {})) {
    if (source.flags?.[MODULE_ID]?.[key] === undefined) update[`flags.${MODULE_ID}.${key}`] = foundry.utils.deepClone(value);
  }
  return { update, effects };
}

/** Apply a patch to a source object (a document being created). */
function patchSource(source, patch) {
  const { update, effects } = itemChanges(source, patch);
  if (foundry.utils.isEmpty(update) && !effects.length) return null;
  const copy = foundry.utils.deepClone(source);
  for (const [key, value] of Object.entries(update)) foundry.utils.setProperty(copy, key, value);
  if (effects.length) copy.effects = [...(copy.effects ?? []), ...effects];
  return copy;
}

/** An item created from a system compendium (or a skill given to a monster) gets the data it lacks. */
function onPreCreateItem(item, data) {
  if (!setting("content")) return;
  const patch = PATCHES.items[sourceOf(item._source) ?? sourceOf(data)]
    ?? ((item.parent?.type === "monster") ? textPatch(item._source) : null);
  if (!patch) return;
  const next = patchSource(item._source, patch);
  if (next) item.updateSource({ system: next.system, effects: next.effects, flags: next.flags });
}

/** A monster created from the bestiary (or by hand) gets the damage and statuses of its attacks. */
function onPreCreateActor(actor, data) {
  if (!setting("content") || (actor.type !== "monster")) return;
  const monster = PATCHES.monsters[sourceOf(actor._source) ?? sourceOf(data)];
  let changed = false;
  const items = (actor._source.items ?? []).map(item => {
    if (item.type !== "skill") return item;
    const patch = monster?.skills?.[item._id] ?? textPatch(item);
    const next = patch && patchSource(item, patch);
    if (!next) return item;
    changed = true;
    return next;
  });
  if (changed) actor.updateSource({ items });
}

/**
 * Fill the documents already in the world: world items, actors and unlinked tokens.
 * @param {object} [options]
 * @param {boolean} [options.dryRun]   Only count.
 * @returns {Promise<{documents: number, damage: number, effects: number, flags: number}>}
 */
export async function fillWorld({ dryRun = false } = {}) {
  const counts = { documents: 0, damage: 0, effects: 0, flags: 0 };
  // World actors with all their items; unlinked tokens only with the items they change (the others
  // come from their actor, filled with it).
  const owners = game.actors.map(actor => [actor, [...actor.items]]);
  for (const scene of game.scenes) {
    for (const token of scene.tokens) {
      if (token.actorLink || !token.actor) continue;
      // The delta's source holds only the items the token overrides (its collection also lists the inherited ones).
      const own = (token.delta?._source?.items ?? []).map(i => token.actor.items.get(i._id)).filter(Boolean);
      if (own.length) owners.push([token.actor, own]);
    }
  }
  const fill = async (item, monster) => {
    const patch = PATCHES.items[sourceOf(item._source)] ?? monster?.skills?.[item.id] ?? patchByName(item)
      ?? ((item.parent?.type === "monster") ? textPatch(item._source) : null);
    if (!patch) return;
    const { update, effects } = itemChanges(item._source, patch);
    if (foundry.utils.isEmpty(update) && !effects.length) return;
    counts.documents++;
    if (update["system.damage"]) counts.damage++;
    if (effects.length) counts.effects++;
    if (Object.keys(update).some(k => k.startsWith("flags."))) counts.flags++;
    if (dryRun) return;
    if (!foundry.utils.isEmpty(update)) await item.update(update);
    if (effects.length) await item.createEmbeddedDocuments("ActiveEffect", effects);
  };
  for (const item of game.items) await fill(item, null);
  for (const [actor, items] of owners) {
    const monster = (actor.type === "monster") ? PATCHES.monsters[sourceOf(actor._source)] : null;
    for (const item of items) {
      try {
        await fill(item, monster);
      }
      catch (err) {
        console.error(`${MODULE_ID} | Could not fill ${item.uuid}`, err);
      }
    }
  }
  return counts;
}

/* -------------------------------------------- */
/*  Statuses at the start of the scene          */
/* -------------------------------------------- */

/**
 * A combat starts: each character gets the statuses of its equipped items ("You gain [Cancel (Cold): 15]
 * at the start of the scene"). Statuses it already has with that Rating aren't added twice.
 * @param {Combat} combat
 */
async function sceneStatuses(combat) {
  for (const actor of combatActors(combat)) {
    const entries = actor.items
      .filter(item => EQUIPMENT.includes(item.type) && (item.system.equipped !== false))
      .flatMap(item => item.getFlag(MODULE_ID, "sceneStatuses") ?? []);
    if (!entries.length) continue;

    const bad = actor._source.system?.["bad-status"] ?? {};
    const lists = { cancel: [...(bad.cancels ?? [])], weakness: [...(bad.weaknesses ?? [])] };
    const updates = {};
    for (const entry of entries) {
      if (lists[entry.status]) {
        const list = lists[entry.status];
        for (const raw of (entry.tags?.length ? entry.tags : [""])) {
          const tag = raw ? canonicalTag(raw) : "";
          const same = list.some(e => (String(e?.tag ?? "") === tag) && (toInt(e?.value ?? e) >= entry.value));
          if (!same) list.push({ value: entry.value, tag });
        }
      }
      else if (["barrier", "regen"].includes(entry.status)) {
        const key = `system.bad-status.${entry.status}`;
        updates[key] = Math.max(toInt(bad[entry.status]), toInt(updates[key]), entry.value);
      }
    }
    if (lists.cancel.length !== (bad.cancels ?? []).length) updates["system.bad-status.cancels"] = lists.cancel;
    if (lists.weakness.length !== (bad.weaknesses ?? []).length) updates["system.bad-status.weaknesses"] = lists.weakness;
    if (!foundry.utils.isEmpty(updates)) await actor.update(updates);
  }
}

/* -------------------------------------------- */
/*  Food                                        */
/* -------------------------------------------- */

/** The Fatigue a used item removes (its use card keeps a copy of the item). */
const foodOf = message => toInt(message.getFlag("lhtrpg", "use")?.item?.flags?.[MODULE_ID]?.fatigue);

/** Someone used a food: whoever eats it loses that much Fatigue. */
function onCreateMessage(message, options, userId) {
  if ((userId !== game.user.id) || !setting("content") || !foodOf(message)) return;
  eat(message).catch(err => console.error(`${MODULE_ID} | Food failed`, err));
}

async function eat(message) {
  const use = message.getFlag("lhtrpg", "use");
  const user = fromUuidSync(use.actorUuid);
  const targets = use.self ? [user] : [...game.user.targets].map(t => t.actor);
  const eaters = [...new Set((targets.length ? targets : [user]).filter(a => a?.type === "character"))];
  const fed = [];
  for (const actor of eaters) {
    const result = actor.isOwner ? await feed(actor, foodOf(message))
      : await request("lhautoFood", { messageId: message.id, actorUuid: actor.uuid });
    if (result?.ok) fed.push(`${actorName(actor)} ${result.before} → ${result.after}`);
  }
  if (fed.length) await message.setFlag(MODULE_ID, "fed", fed);
}

async function feed(actor, amount) {
  const before = toInt(actor._source.system.infos?.fatigue);
  const after = Math.max(0, before - amount);
  if (after !== before) await actor.update({ "system.infos.fatigue": after });
  return { ok: true, before, after };
}

/** GM side: feed a character the user doesn't own, from that user's own food card, once each. */
async function onFoodRequest({ messageId, actorUuid }, user) {
  const message = game.messages.get(messageId);
  const actor = await fromUuid(actorUuid);
  if (!message || (message.author?.id !== user.id) || !foodOf(message) || (actor?.type !== "character")) return { ok: false };
  const done = message.getFlag(MODULE_ID, "fedActors") ?? [];
  if (done.includes(actor.uuid)) return { ok: false };
  await message.setFlag(MODULE_ID, "fedActors", [...done, actor.uuid]);
  return feed(actor, foodOf(message));
}

/** The use card says who ate it and their Fatigue. */
function renderFood(message, html) {
  const fed = message.getFlag(MODULE_ID, "fed");
  if (!fed?.length) return;
  const card = html.querySelector(".chat-card") ?? html.querySelector(".message-content");
  card?.insertAdjacentHTML("beforeend",
    `<div class="lhauto-use"><span><i class="fa-solid fa-utensils"></i> ${escape(L("Content.Fed", { amount: foodOf(message), names: fed.join(", ") }))}</span></div>`);
}
