/**
 * Chat theme: the system's cards, the dice and the message frame in the Elder Tale look
 * (styles/chat.css). The hook only marks the DOM; the look is all CSS.
 *
 * - Messages with a Log Horizon card or a roll get the `et-msg` class; their header gets the
 *   speaker's portrait.
 * - A skill card gets `data-timing` (its colour) read from the skill it came from.
 * - The dice of a roll get `et-die` with `max` / `min` on sixes and ones.
 */
import { MODULE_ID, setting } from "./settings.mjs";
import { parseSkillField } from "./system.mjs";

const TIMING_CLASS = {
  Major: "major", "Main Process": "major", Minor: "minor", Move: "move", Instant: "instant", Action: "instant",
  Setup: "setup", Initiative: "setup", Cleanup: "cleanup", Constant: "constant",
  "Before Check": "reaction", "After Check": "reaction", "Before Damage": "reaction", "After Damage": "reaction", "Damage Roll": "reaction"
};

/** Call during the `init` hook. */
export function registerChat() {
  Hooks.on("renderChatMessageHTML", onRender);
}

function onRender(message, html) {
  if (!setting("chatTheme")) return;
  const card = html.querySelector(".lhtrpg.chat-card, .lhauto-card, .dice-roll");
  if (!card) return;
  html.classList.add("et-msg");

  // Speaker portrait in the header
  const header = html.querySelector(".message-header");
  const actor = ChatMessage.getSpeakerActor(message.speaker);
  const img = actor?.img ?? (message.speaker?.token ? null : message.author?.avatar);
  if (header && img && !header.querySelector(".et-msg-portrait")) {
    const portrait = document.createElement("img");
    portrait.className = "et-msg-portrait";
    portrait.src = img;
    portrait.alt = "";
    header.prepend(portrait);
  }

  // Skill card colour by Timing
  const skillCard = html.querySelector(".skill-chat-card[data-item-uuid]");
  if (skillCard) {
    const item = fromUuidSync(skillCard.dataset.itemUuid);
    if (item?.system?.timing) {
      const timing = parseSkillField("timing", item.system.timing).type;
      skillCard.dataset.timing = TIMING_CLASS[timing] ?? "other";
    }
  }

  // Dice faces
  for (const die of html.querySelectorAll(".dice-rolls .roll.die")) {
    die.classList.add("et-die");
    const value = Number(die.textContent.trim());
    if (die.classList.contains("d6")) {
      if (value === 6) die.classList.add("et-die--max");
      if (value === 1) die.classList.add("et-die--min");
    }
  }
}
