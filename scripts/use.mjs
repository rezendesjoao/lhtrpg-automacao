/**
 * Using a skill (Rules II.c READING SKILL BLOCKS, III.b ROUND STRUCTURE).
 *
 * The system posts a skill's card from LHTrpgItem#ItemThrow, which is also where it applies the
 * skill's "when used" effects: that is the moment the skill is used. This wraps it:
 * - before: the Timing against the combat phase (Major / Minor / Move / Instant only in the user's
 *   own Main Process, Setup in the Setup Process…), the action already spent in this Main Process
 *   (one Major, one Minor and one Move), the usage limit (1/Scene, (SR)/Scenario, 1/Round…) and the
 *   Fate cost (the user must have it). An issue asks to go on, or refuses it (see the settings).
 * - after: pay the Hate and Fate costs, count the use and the action, and note it all on the card,
 *   with an Undo button for mistakes.
 *
 * Constant skills are never "used". Hate is only paid in a started combat (it is reset at the start
 * and end of every combat); Fate is always paid. Monsters pay no costs (they have no Hate).
 */
import { L, MODULE_ID, setting } from "./settings.mjs";
import { parseSkillField, skillModifiers } from "./system.mjs";
import { combatantOf, combatOf, confirm, escape, toInt, wrap } from "./util.mjs";
import { counter } from "./scenes.mjs";

/** The action a Timing spends in the Main Process. */
const ACTIONS = { Major: "major", Minor: "minor", Move: "move" };
/** Timings used during the user's own Main Process. */
const OWN_PROCESS = new Set(["Major", "Minor", "Move", "Main Process", "Instant"]);
/** Timings used outside combat. */
const OUT_OF_COMBAT = new Set(["Rest Time", "Pre-Play", "Interlude"]);
/** Usage limit types that are counted. */
const LIMIT_TYPES = ["Scene", "Scenario", "Round"];

/** Call during the `init` hook. */
export function registerUse() {
  wrap(CONFIG.Item.documentClass.prototype, "ItemThrow", async function (original, ...args) {
    if (!tracked(this)) return original.apply(this, args);
    const plan = await planUse(this);
    if (!plan) return null;
    const message = await original.apply(this, args);
    if (message) {
      await commitUse(this, plan, message)
        .catch(err => console.error(`${MODULE_ID} | Could not record the use of ${this.uuid}`, err));
    }
    return message;
  });
  Hooks.on("renderChatMessageHTML", renderUse);
}

const timingOf = item => parseSkillField("timing", item.system.timing).type;

/** Skills whose use is checked and recorded: owned skills that aren't Constant. */
function tracked(item) {
  return (item.type === "skill") && !!item.actor && (timingOf(item) !== "Constant");
}

/* -------------------------------------------- */
/*  Amounts, limits and costs                   */
/* -------------------------------------------- */

/**
 * An amount written in a skill block: "1", "(SR)", "SR+1", "(SRx3)", "2xSR", "[SR]", "CR"…
 * @param {string} text
 * @param {Item} item     The skill (its SR, its owner's CR)
 * @returns {number|null}
 */
export function amount(text, item) {
  const sr = Math.max(1, toInt(item?.system?.skillRank?.value));
  const actor = item?.actor;
  const cr = Math.max(1, toInt(actor?.system?.infos?.crank ?? actor?.system?.rank));
  const expr = String(text ?? "").toUpperCase()
    .replace(/[\s()[\]]/g, "")
    .replace(/[X×]/g, "*")
    .replace(/SR/g, `(${sr})`)
    .replace(/CR/g, `(${cr})`)
    .replace(/(\d)\(/g, "$1*(")
    .replace(/\)(\d|\()/g, ")*$1");
  if (!expr || !/^[\d+\-*/().]+$/.test(expr)) return null;
  try {
    return Math.floor(Roll.safeEval(expr));
  }
  catch {
    return null;
  }
}

/**
 * The counted usage limit of a skill.
 * @param {Item} item
 * @returns {{type: "Scene"|"Scenario"|"Round", max: number}|null}
 */
export function limitOf(item) {
  const { type, n } = parseSkillField("limit", item.system.limit);
  if (!LIMIT_TYPES.includes(type)) return null;
  const max = amount(n, item);
  return (max > 0) ? { type, max } : null;
}

/** The scene / scenario / round a use counts in (none for a round outside combat). */
function limitKey(type, actor, combat) {
  if (type === "Round") return combat ? `round.${combat.id}.${combat.round}` : null;
  if (type === "Scene") return `scene.${counter(actor, "scene")}`;
  return `scenario.${counter(actor, "scenario")}`;
}

/** Uses of a skill in the current scene / scenario / round. */
function usesOf(item, key) {
  const uses = item.getFlag(MODULE_ID, "uses");
  return (uses?.key === key) ? toInt(uses.n) : 0;
}

/**
 * The cost of a skill: "Hate 2", "Fate 1", "Hate [SR+1]", "H(3) + F(1)", "Hate 1 (Party)"…
 * The Hate cost includes the changes of the user's effects (see the system's skillModifiers).
 * @param {Item} item
 * @param {Actor} actor
 * @returns {{hate: number, fate: number, group: string}|null}
 */
export function costOf(item, actor) {
  const raw = String(item.system.cost ?? "").trim();
  let hate = 0;
  let fate = 0;
  let group = "";
  const both = raw.match(/^H\s*\((.+?)\)\s*\+\s*F\s*\((.+?)\)$/i);
  if (both) {
    hate = amount(both[1], item) ?? 0;
    fate = amount(both[2], item) ?? 0;
  }
  else {
    const { type, n, qual } = parseSkillField("cost", raw);
    if (type === "Hate") hate = amount(n, item) ?? 0;
    else if (type === "Fate") fate = amount(n, item) ?? 0;
    else return null;
    group = qual ?? "";
  }
  const modified = skillModifiers(actor, item).cost;
  if (modified) hate = modified.value;
  hate = Math.max(0, hate);
  fate = Math.max(0, fate);
  return (hate || fate) ? { hate, fate, group } : null;
}

/** Actions the actor spent in its Main Process of this round. */
function spentActions(actor, combat) {
  const key = `${combat.id}.${combat.round}`;
  const saved = actor.getFlag(MODULE_ID, "actions");
  const same = saved?.key === key;
  return {
    key,
    major: same ? toInt(saved.major) : 0,
    minor: same ? toInt(saved.minor) : 0,
    move: same ? toInt(saved.move) : 0
  };
}

/** Whether a skill with this Timing can be used now. */
function timingIssues(timing, combat, combatant) {
  const phase = combat.phase;
  if (OWN_PROCESS.has(timing)) {
    return ((phase === "main") && (combat.progress.active === combatant.id)) ? [] : [L("Use.OutsideProcess")];
  }
  if (timing === "Setup") return (phase === "setup") ? [] : [L("Use.OnlySetup")];
  if (timing === "Cleanup") return (phase === "cleanup") ? [] : [L("Use.OnlyCleanup")];
  if (timing === "Briefing") return [L("Use.OnlyBriefing")];
  if (OUT_OF_COMBAT.has(timing)) return [L("Use.OnlyOutOfCombat")];
  return [];
}

/* -------------------------------------------- */
/*  Before and after the card                   */
/* -------------------------------------------- */

/**
 * Check the use and decide whether it goes on.
 * @param {Item} item
 * @returns {Promise<object|null>}   The plan to record after the card, or null when the use stops.
 */
async function planUse(item) {
  const actor = item.actor;
  const combat = combatOf(actor);
  const combatant = combat ? combatantOf(combat, actor) : null;
  const timing = timingOf(item);
  const issues = [];

  // Timing and action economy (in a started combat)
  let action = null;
  const actionsMode = setting("actions");
  if (combatant && actionsMode && (actionsMode !== "off")) {
    for (const text of timingIssues(timing, combat, combatant)) issues.push({ text, mode: actionsMode });
    action = ACTIONS[timing] ?? null;
    if (action && spentActions(actor, combat)[action]) issues.push({ text: L(`Use.ActionSpent.${action}`), mode: actionsMode });
  }

  // Usage limit
  const limitsMode = setting("limits");
  const limit = (limitsMode && (limitsMode !== "off")) ? limitOf(item) : null;
  const key = limit ? limitKey(limit.type, actor, combat) : null;
  const uses = key ? usesOf(item, key) : 0;
  if (key && (uses >= limit.max)) {
    issues.push({ text: L("Use.LimitReached", { uses, max: limit.max, per: L(`Use.Per.${limit.type}`) }), mode: limitsMode });
  }

  // Costs: the Fate must be there to pay
  const cost = (setting("costs") && (actor.type === "character")) ? costOf(item, actor) : null;
  if (cost?.fate && (cost.group !== "Allies")) {
    const fate = toInt(actor._source.system.fate?.value);
    if (fate < cost.fate) issues.push({ text: L("Use.NoFate", { need: cost.fate, have: fate }), mode: "block" });
  }

  let forced = [];
  if (issues.length) {
    const blocked = issues.filter(i => i.mode === "block");
    if (blocked.length && !game.user.isGM) {
      ui.notifications.warn(L("Use.Blocked", { name: item.name, reasons: blocked.map(i => i.text).join(" ") }));
      return null;
    }
    const list = issues.map(i => `<li>${escape(i.text)}</li>`).join("");
    const ok = await confirm({
      title: L("Use.ConfirmTitle", { name: item.name }),
      content: `<p>${escape(L("Use.ConfirmIntro"))}</p><ul>${list}</ul><p>${escape(L("Use.ConfirmQuestion"))}</p>`,
      yes: L("Use.UseAnyway"),
      no: L("Use.Cancel")
    });
    if (!ok) return null;
    forced = issues.map(i => i.text);
  }
  return { combat, combatant, action, limit, key, uses, cost, forced };
}

/**
 * Pay the costs, count the use and the action, and note it on the card.
 * @param {Item} item
 * @param {object} plan          See planUse
 * @param {ChatMessage} message  The skill's card
 */
async function commitUse(item, plan, message) {
  const actor = item.actor;
  const record = {
    itemUuid: item.uuid, actorUuid: actor.uuid,
    combatId: plan.combat?.id ?? null, round: plan.combat?.round ?? null,
    hate: 0, fate: 0, action: null, limit: null, group: "", forced: plan.forced, undone: false
  };
  const updates = {};

  if (plan.action && plan.combat) {
    const spent = spentActions(actor, plan.combat);
    spent[plan.action] += 1;
    updates[`flags.${MODULE_ID}.actions`] = spent;
    record.action = plan.action;
  }

  const cost = plan.cost;
  if (cost) {
    record.group = cost.group;
    // "(Allies)": only the user's allies pay (by hand: see the card).
    const self = cost.group !== "Allies";
    if (cost.hate && self && plan.combat) {
      const hate = toInt(actor._source.system.infos?.hate);
      updates["system.infos.hate"] = hate + cost.hate;
      record.hate = cost.hate;
      record.hateTotal = hate + cost.hate;
    }
    if (cost.fate && self) {
      const fate = toInt(actor._source.system.fate?.value);
      const paid = Math.min(fate, cost.fate);
      updates["system.fate.value"] = fate - paid;
      record.fate = paid;
      record.fateTotal = fate - paid;
    }
  }
  if (!foundry.utils.isEmpty(updates)) await actor.update(updates);

  if (plan.key) {
    const n = plan.uses + 1;
    await item.setFlag(MODULE_ID, "uses", { key: plan.key, n });
    record.limit = { type: plan.limit.type, max: plan.limit.max, n, key: plan.key };
  }

  if (record.hate || record.fate || record.action || record.limit || record.group || record.forced.length) {
    await message.setFlag(MODULE_ID, "use", record);
  }
}

/**
 * Give back what a use took: Hate, Fate, the counted use and action. The effects the skill applied
 * are not removed.
 * @param {ChatMessage} message
 */
export async function undoUse(message) {
  const record = message.getFlag(MODULE_ID, "use");
  if (!record || record.undone || !message.isOwner) return;
  const actor = fromUuidSync(record.actorUuid);
  const item = fromUuidSync(record.itemUuid);

  if (actor?.isOwner) {
    const updates = {};
    if (record.hate) updates["system.infos.hate"] = Math.max(0, toInt(actor._source.system.infos?.hate) - record.hate);
    if (record.fate) updates["system.fate.value"] = toInt(actor._source.system.fate?.value) + record.fate;
    const spent = actor.getFlag(MODULE_ID, "actions");
    if (record.action && (spent?.key === `${record.combatId}.${record.round}`)) {
      updates[`flags.${MODULE_ID}.actions.${record.action}`] = Math.max(0, toInt(spent[record.action]) - 1);
    }
    if (!foundry.utils.isEmpty(updates)) await actor.update(updates);
  }

  const uses = item?.getFlag(MODULE_ID, "uses");
  if (record.limit && item?.isOwner && (uses?.key === record.limit.key)) {
    await item.setFlag(MODULE_ID, "uses", { key: uses.key, n: Math.max(0, toInt(uses.n) - 1) });
  }
  await message.setFlag(MODULE_ID, "use", { ...record, undone: true });
}

/** The line under a skill's card: what the use cost and counted, and the Undo button. */
function renderUse(message, html) {
  const record = message.getFlag(MODULE_ID, "use");
  if (!record) return;
  const card = html.querySelector(".skill-chat-card") ?? html.querySelector(".message-content");
  if (!card) return;

  const parts = [];
  if (record.action) parts.push(L(`Use.Action.${record.action}`));
  if (record.hate) parts.push(L("Use.Paid.Hate", { n: record.hate, total: record.hateTotal }));
  if (record.fate) parts.push(L("Use.Paid.Fate", { n: record.fate, total: record.fateTotal }));
  if (record.limit) parts.push(L("Use.Uses", { n: record.limit.n, max: record.limit.max, per: L(`Use.Per.${record.limit.type}`) }));
  if (record.group) parts.push(L("Use.Group", { group: record.group }));

  const footer = document.createElement("div");
  footer.className = `lhauto-use${record.undone ? " undone" : ""}`;
  footer.innerHTML = `<span class="lhauto-use-parts"><i class="fa-solid fa-receipt"></i> ${parts.map(escape).join(" · ")}</span>`;
  if (record.forced?.length) {
    const warning = document.createElement("div");
    warning.className = "lhauto-forced";
    warning.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${escape(L("Use.Forced"))}: ${record.forced.map(escape).join(" ")}`;
    footer.append(warning);
  }
  if (record.undone) {
    footer.insertAdjacentHTML("beforeend", `<div class="lhauto-undone">${escape(L("Use.Undone"))}</div>`);
  }
  else if (message.isOwner) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lhauto-undo";
    button.dataset.tooltip = L("Use.UndoHint");
    button.innerHTML = `<i class="fa-solid fa-rotate-left"></i> ${escape(L("Use.Undo"))}`;
    button.addEventListener("click", event => {
      event.preventDefault();
      button.disabled = true;
      undoUse(message).catch(err => console.error(`${MODULE_ID} | Could not undo the use`, err));
    });
    footer.append(button);
  }
  card.append(footer);
}
