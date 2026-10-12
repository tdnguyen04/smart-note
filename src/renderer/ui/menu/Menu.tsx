import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ReactElement, ReactNode } from "react";

/**
 * Dropdown menus (settings, more tags). Radix supplies arrow keys, typeahead, Escape,
 * outside-click and focus return; this file only supplies the look.
 *
 * `modal={false}` keeps the rest of the window interactive and skips Radix's scroll lock
 * and pointer-events overlay, which are not needed for a small menu and cost a reflow.
 */

const OFFSET_PX = 4;
const EDGE_PADDING_PX = 8;

type MenuProps = {
  /** Exactly one button; it receives the trigger props and aria-expanded. */
  trigger: ReactElement;
  children: ReactNode;
  align?: "start" | "end";
};

export function Menu({ trigger, children, align = "end" }: MenuProps) {
  return (
    <MenuPrimitive.Root modal={false}>
      <MenuPrimitive.Trigger asChild>{trigger}</MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Content
          align={align}
          sideOffset={OFFSET_PX}
          collisionPadding={EDGE_PADDING_PX}
          className="z-50 min-w-44 animate-fade-in rounded-md border border-line bg-surface p-1 shadow-popover"
        >
          {children}
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

type MenuItemProps = {
  onSelect: () => void;
  children: ReactNode;
};

/** One row. Put an <Icon> or a dot first, then the label. */
export function MenuItem({ onSelect, children }: MenuItemProps) {
  return (
    <MenuPrimitive.Item
      onSelect={onSelect}
      className="flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm text-ink outline-none select-none data-highlighted:bg-surface-hover"
    >
      {children}
    </MenuPrimitive.Item>
  );
}
