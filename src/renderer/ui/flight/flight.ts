import { TIMINGS_MS } from "../../../shared/globals";

/**
 * The "your note went there" animation: a small card with the note's text glides
 * from where it was written to a landing spot elsewhere in the frame, which then
 * gives a little bounce.
 *
 * Runs on the Web Animations API with a throwaway element, outside React, so it
 * costs no renders. Regions stay decoupled: the landing spot is any element marked
 * `data-flight-target="<name>"` (the rail marks Organize), found at flight time.
 *
 * Skipped entirely under "reduce motion", or when the landing spot is not on screen.
 */

export type FlightTarget = "organize";

const CARD_CLASS =
  "pointer-events-none fixed z-50 line-clamp-3 w-60 rounded-md border border-line bg-surface px-3 py-2 font-serif text-sm text-ink shadow-popover";

/** How much of the note rides on the card (three lines at most are shown). */
const CARD_TEXT_CHARS = 160;
/** Where the card appears, relative to the top-left of the box the text came from. */
const PEEL_OFFSET_PX = { x: 12, y: 10 };
/** The card rises this far above the straight line, so the path reads as a toss, not a slide. */
const ARC_LIFT_PX = 40;
const EASE_OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const EASE_IN_OUT = "cubic-bezier(0.45, 0, 0.25, 1)";
const EASE_IN = "cubic-bezier(0.55, 0, 1, 0.45)";

/** Resolves when the card has landed (immediately when there is no flight). */
export async function flyNote(options: { from: DOMRect; text: string; to: FlightTarget }): Promise<void> {
  const target = document.querySelector<HTMLElement>(`[data-flight-target="${options.to}"]`);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!target || reduceMotion || target.getClientRects().length === 0) {
    return;
  }

  // The card is born at a readable size where the text was, so the words stay legible in flight.
  const card = document.createElement("div");
  card.className = CARD_CLASS;
  card.setAttribute("aria-hidden", "true");
  card.textContent = options.text.slice(0, CARD_TEXT_CHARS);
  Object.assign(card.style, {
    left: `${options.from.left + PEEL_OFFSET_PX.x}px`,
    top: `${options.from.top + PEEL_OFFSET_PX.y}px`,
    transformOrigin: "center",
  });
  document.body.append(card);

  // Travel from the card's center to the target's center, ending at the target's size.
  const start = card.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const dx = to.left + to.width / 2 - (start.left + start.width / 2);
  const dy = to.top + to.height / 2 - (start.top + start.height / 2);
  const endScale = to.width / start.width;

  // Three beats: peel up out of the box, glide along an arc toward the target,
  // then drop in and vanish. Each segment has its own easing.
  const flight = card.animate(
    [
      { transform: "translate(0, 6px) scale(0.96)", opacity: 0, easing: EASE_OUT },
      { transform: "translate(0, -6px) scale(1)", opacity: 1, offset: 0.18, easing: EASE_IN_OUT },
      {
        transform: `translate(${dx * 0.82}px, ${dy * 0.82 - ARC_LIFT_PX}px) scale(0.6)`,
        opacity: 1,
        offset: 0.8,
        easing: EASE_IN,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(${endScale})`, opacity: 0 },
    ],
    { duration: TIMINGS_MS.noteFlight, fill: "forwards" },
  );

  try {
    await flight.finished;
  } catch {
    // Cancelled (window closed or element removed): nothing to clean beyond the card.
  } finally {
    card.remove();
  }

  target.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(0.96)" }, { transform: "scale(1)" }],
    { duration: TIMINGS_MS.noteFlight / 2, easing: "ease-out" },
  );
}
