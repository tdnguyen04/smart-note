import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";
import { TIMINGS_MS } from "../../../shared/globals";

/**
 * Short labels that appear on hover or keyboard focus. Built on Radix for correct
 * focus, Escape and screen-reader wiring.
 *
 * Cost: one Provider for the whole app, and the bubble is only mounted while open,
 * so a hundred tooltips cost a hundred lightweight trigger wrappers and nothing else.
 */

const OFFSET_PX = 6;
const EDGE_PADDING_PX = 8;

/** Mount once at the root. Moving between tooltips within TIMINGS_MS.tooltipSkipDelay opens the next instantly. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={TIMINGS_MS.tooltipDelay} skipDelayDuration={TIMINGS_MS.tooltipSkipDelay}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

type TooltipProps = {
  content: ReactNode;
  /** Exactly one focusable element; it receives the trigger props. */
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  /** Controlled mode, for a tooltip that opens itself (the onboarding tip). */
  control?: { open: boolean; onOpenChange: (open: boolean) => void };
};

export function Tooltip({ content, children, side = "bottom", control }: TooltipProps) {
  return (
    <TooltipPrimitive.Root {...control}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={OFFSET_PX}
          collisionPadding={EDGE_PADDING_PX}
          className="z-50 max-w-60 animate-fade-in rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-muted shadow-popover"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
