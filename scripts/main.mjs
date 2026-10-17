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
 * Each part has its own setting (Game Settings → Configure Settings → this module).
 */
import { MODULE_ID, registerSettings } from "./settings.mjs";
import { registerUse, undoUse } from "./use.mjs";
import { registerHate } from "./hate.mjs";
import { registerRound } from "./round.mjs";
import { registerCards, rollCheck, rollDamage } from "./cards.mjs";
import { registerFate, removeBadStatus, spendFate } from "./fate.mjs";
import { endScene, registerScenes } from "./scenes.mjs";

Hooks.once("init", () => {
  if (game.system.id !== "lhtrpg") return;
  registerSettings();
  registerScenes();
  registerUse();
  registerHate();
  registerRound();
  registerCards();
  registerFate();

  // For macros and other modules.
  game.modules.get(MODULE_ID).api = {
    endScene,
    endScenario: actors => endScene(actors, { scenario: true }),
    rollCheck,
    rollDamage,
    spendFate,
    removeBadStatus,
    undoUse
  };
});
