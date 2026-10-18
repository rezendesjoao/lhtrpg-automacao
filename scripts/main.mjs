/**
 * Log Horizon TRPG — Automação
 *
 * Extra automation on top of the lhtrpg system (2.1.x), for big tables with simultaneous combats:
 * - use.mjs     skill use: Hate and Fate costs, usage limits, Timing and action economy, undo.
 * - hate.mjs    [Hate Top] / [Hate Under] worked out per combat.
 * - round.mjs   Cleanup Process (Regen, Decay), statuses that end with the Main Process,
 *               Incapacitated, skipped turns and the end of the scene.
 * - cards.mjs   attack / damage cards: damage tied to its attack, Apply guard, private modes.
 * - fate.mjs    Fate Points: +1D, rerolls, removing a Bad Status.
 * - scenes.mjs  scene / scenario counters and the GM tools.
 * - content.mjs data the compendiums only have as text: monster damage, skill damage and statuses,
 *               item bonuses, statuses at the start of the scene, food, healing items, and the
 *               skills of the items' trigger powers.
 * - sheet.mjs   the parchment character sheet; monster-sheet.mjs the monster sheet in the same layout;
 *               chat.mjs the chat cards; windows.mjs the other windows.
 * - kuden/      the Kuden house rule: signature pieces paid with the skill picks, Resources, scene
 *               environment and new effect conditions.
 * - hud/        the action HUD above the hotbar: checks, skills, Kuden, items, statuses, turn, dodges.
 * - turn.mjs    turn helpers: notice, select, pan, clear the targets.
 * - status-links.mjs  statuses written in the chat applied with a click; quick-effect.mjs effects
 *               created from a chat card; notice.mjs the news of the release.
 * - tokens.mjs  the HP bar, the Fate diamonds and the nameplate of the tokens in the style of the sheet.
 * Each part has its own setting (Game Settings → Configure Settings → this module).
 */
import { MODULE_ID, registerClientSettings, registerSettings } from "./settings.mjs";
import { registerUse, undoUse } from "./use.mjs";
import { registerHate } from "./hate.mjs";
import { registerRound } from "./round.mjs";
import { registerCards, rollCheck, rollDamage } from "./cards.mjs";
import { registerFate, removeBadStatus, spendFate } from "./fate.mjs";
import { endScene, registerScenes } from "./scenes.mjs";
import { fillWorld, registerContent, syncItemSkills } from "./content.mjs";
import { parseMonsterDamage } from "./content/monster-damage.mjs";
import { registerTerms } from "./terms.mjs";
import { registerSheet } from "./sheet.mjs";
import { registerMonsterSheet } from "./monster-sheet.mjs";
import { registerChat } from "./chat.mjs";
import { registerWindows } from "./windows.mjs";
import { registerReach } from "./reach.mjs";
import { registerKuden } from "./kuden/index.mjs";
import { ledgerOf, resourceOf, setResource, settle } from "./kuden/pieces.mjs";
import { sceneEnv } from "./kuden/env.mjs";
import { actionHud, registerHud, rollActorCheck } from "./hud/hud.mjs";
import { registerTurn } from "./turn.mjs";
import { giveEffects, registerStatusLinks, statusEffectData } from "./status-links.mjs";
import { registerQuickEffect } from "./quick-effect.mjs";
import { registerNotice } from "./notice.mjs";
import { registerTokens } from "./tokens.mjs";

Hooks.once("init", () => {
  if (game.system.id !== "lhtrpg") return;
  registerSettings();
  registerTokens();
  registerScenes();
  registerUse();
  registerHate();
  registerRound();
  registerCards();
  registerFate();
  registerContent();
  registerTerms();
  registerSheet();
  registerMonsterSheet();
  registerChat();
  registerWindows();
  registerReach();
  registerKuden();
  registerHud();
  registerClientSettings();
  registerTurn();
  registerStatusLinks();
  registerQuickEffect();
  registerNotice();

  // For macros and other modules.
  game.modules.get(MODULE_ID).api = {
    endScene,
    endScenario: actors => endScene(actors, { scenario: true }),
    fillWorld,
    parseMonsterDamage,
    rollCheck,
    rollDamage,
    rollActorCheck,
    spendFate,
    removeBadStatus,
    syncItemSkills,
    undoUse,
    applyStatus: (actor, id, { value = null, tag = "", expires = "endOfScene" } = {}) =>
      giveEffects(actor, [statusEffectData(id, value, tag, { expires })]),
    hud: actionHud,
    kuden: { ledgerOf, resourceOf, setResource, settle, sceneEnv }
  };
});
