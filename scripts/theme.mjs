/**
 * Parchment theme of the system's character sheet (styles/theme.css): the sheet keeps its own layout
 * and frame; this marks the page so the theme's CSS applies, points the tab icons at the recoloured
 * artwork, and adds a few readings the layout had no room for: the HP bar under the HP, the Fate
 * stars, the body of the equipment slots (paper doll) and the coin piles of the purse.
 *
 * Everything is added to the rendered DOM and never submitted with the form.
 */
import { L, MODULE_ID, setting } from "./settings.mjs";
import { toInt } from "./util.mjs";

const ASSETS = `modules/${MODULE_ID}/assets/ui`;

/** Call during the `init` hook. */
export function registerTheme() {
  Hooks.once("ready", () => document.body.classList.toggle("lhauto-theme", setting("sheetTheme") !== false));
  Hooks.on("renderLHTrpgActorSheet", (app, element) => {
    if (setting("sheetTheme") === false) return;
    try {
      decorate(app, element);
    }
    catch (err) {
      console.error(`${MODULE_ID} | Could not decorate the sheet`, err);
    }
  });
}

function decorate(app, root) {
  const actor = app.actor ?? app.document;
  if (!actor || (actor.type !== "character")) return;
  root.classList.add("lhauto-parchment");

  // Tab icons: the recoloured artwork
  for (const img of root.querySelectorAll(".sheet-tabs img[src*='assets/ui/navigation/']")) {
    img.src = `${ASSETS}/navigation/${img.getAttribute("src").split("/").pop()}`;
  }

  hpBar(root, actor);
  fateStars(root, actor);
  paperDoll(root);
  purse(root, actor);
}

/** A thin bar under the HP numbers, coloured by what is left. */
function hpBar(root, actor) {
  const hp = root.querySelector(".battle-status .hp");
  if (!hp || hp.querySelector(".lhauto-bar")) return;
  const value = toInt(actor.system.health?.value), max = Math.max(0, toInt(actor.system.health?.max));
  const pct = max ? Math.clamp(Math.round((value / max) * 100), 0, 100) : 0;
  const state = (value <= 0) ? "down" : (pct <= 25) ? "low" : (pct <= 50) ? "warn" : "ok";
  const bar = document.createElement("div");
  bar.className = `lhauto-bar lhauto-bar--${state}`;
  bar.innerHTML = `<i style="width:${pct}%"></i>`;
  hp.append(bar);
}

/** Fate as stars under the Fate numbers (lit = current). */
function fateStars(root, actor) {
  const fate = root.querySelector(".battle-status .fate");
  if (!fate || fate.querySelector(".lhauto-stars")) return;
  const value = toInt(actor.system.fate?.value), max = Math.clamp(toInt(actor.system.fate?.max), 0, 10);
  const stars = document.createElement("div");
  stars.className = "lhauto-stars";
  stars.innerHTML = Array.from({ length: Math.max(max, Math.min(value, 10)) }, (_, i) =>
    `<i class="fa-solid fa-star${i < value ? " on" : ""}"></i>`).join("");
  fate.append(stars);
}

/**
 * The body behind the equipment slots: an ink figure with a point for each slot. The slots are the
 * system's own elements, placed around it by the theme's CSS.
 */
function paperDoll(root) {
  const grid = root.querySelector(".equip-slots-grid");
  if (!grid || grid.querySelector(".lhauto-doll")) return;
  const filled = sel => grid.querySelector(`${sel} .item`) ? " filled" : "";
  const link = (cls, points, cx, cy) =>
    `<g class="lhauto-link${filled(cls)}"><polyline points="${points}"></polyline><circle cx="${cx}" cy="${cy}" r="3"></circle></g>`;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "lhauto-doll");
  svg.setAttribute("viewBox", "0 0 210 290");
  svg.setAttribute("aria-hidden", "true");
  // Slots (52px) at: main (0,0) off (158,0) | accessory 0 (0,94) armor (158,94) | accessory 2 (0,187)
  // accessory 1 (158,187) | bag (79,230). Each link leaves its slot and ends on the figure.
  svg.innerHTML = `
    <g class="lhauto-body">
      <ellipse cx="105" cy="30" rx="13" ry="15"></ellipse>
      <rect x="100" y="44" width="10" height="8" rx="3"></rect>
      <path d="M105 52 C118 52 132 54 140 60 C148 66 150 92 150 124 L142 126 C141 108 139 96 134 86 L132 130 C132 150 129 170 127 186 L126 222 L112 222 L109 160 L101 160 L98 222 L84 222 L83 186 C81 170 78 150 78 130 L76 86 C71 96 69 108 68 126 L60 124 C60 92 62 66 70 60 C78 54 92 52 105 52 Z"></path>
    </g>
    ${link('[data-hand="main"]', "52,26 57,26 57,118 64,124", 64, 124)}
    ${link('[data-slot-type="accessory"][data-slot-index="0"]', "52,120 60,120 93,33", 93, 33)}
    ${link('[data-slot-type="accessory"][data-slot-index="2"]', "52,213 60,213 90,206", 90, 206)}
    ${link('[data-hand="off"]', "158,26 153,26 153,118 146,124", 146, 124)}
    ${link('[data-slot-type="armor"]', "158,120 150,120 112,90", 112, 90)}
    ${link('[data-slot-type="accessory"][data-slot-index="1"]', "158,213 150,213 124,136", 124, 136)}
    ${link('[data-slot-type="bag"]', "105,230 105,222 116,150", 116, 150)}`;
  grid.prepend(svg);
}

/** Coin piles by decimal place next to the gold field, and the formatted total as a tooltip. */
function purse(root, actor) {
  const gold = root.querySelector(".inventory-gold");
  if (!gold || gold.querySelector(".lhauto-stacks")) return;
  const value = Math.max(0, toInt(actor._source.system.inventory?.gold));
  const stacks = document.createElement("span");
  stacks.className = "lhauto-stacks";
  stacks.dataset.tooltip = `${value.toLocaleString(game.i18n.lang)} G`;
  stacks.innerHTML = [1000, 100, 10, 1].map(unit => {
    const count = Math.min(9, Math.floor((value / unit) % (unit === 1000 ? 1e6 : 10)));
    return `<span class="lhauto-stack${count ? "" : " empty"}">${"<i></i>".repeat(count)}</span>`;
  }).join("");
  gold.prepend(stacks);
  gold.dataset.tooltip = L("Sheet.Gold", { total: value.toLocaleString(game.i18n.lang) });
}
