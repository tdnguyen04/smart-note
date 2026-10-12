import type { LucideIcon } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { Tooltip } from "../tooltip";

/**
 * A button that shows only an icon. Its `label` becomes the accessible name and the
 * hover tooltip (unless `hideTooltip`), so an icon is never unnamed.
 *
 * All other props (including a ref and Radix trigger props) land on the <button>,
 * so it can be a Menu trigger or a Tooltip trigger directly.
 */

type IconButtonProps = Omit<ComponentPropsWithRef<"button">, "children" | "className" | "aria-label"> & {
  icon: LucideIcon;
  label: string;
  /** Hit target: sm 28px for dense bars, md 32px for the rail. */
  size?: "sm" | "md";
  variant?: "ghost" | "outline";
  tone?: "default" | "accent";
  shape?: "square" | "round";
  /** On/off buttons (sidebar toggle, active rail item). */
  pressed?: boolean;
  /** Tooltip text when it should say more than the label. */
  tooltip?: ReactNode;
  /** For a button whose meaning is already on screen next to it. */
  hideTooltip?: boolean;
  tooltipSide?: "top" | "right" | "bottom" | "left";
};

const SIZE = { sm: "size-7", md: "size-8" } as const;

const SURFACE = {
  ghost: "hover:bg-surface-hover aria-expanded:bg-surface-hover aria-pressed:bg-surface-selected",
  outline: "border border-line bg-surface hover:bg-surface-hover aria-expanded:bg-surface-hover",
} as const;

const TONE = {
  default: "text-ink-muted hover:text-ink aria-expanded:text-ink aria-pressed:text-ink",
  accent: "text-accent",
} as const;

export function IconButton({
  icon,
  label,
  size = "sm",
  variant = "ghost",
  tone = "default",
  shape = "square",
  pressed,
  tooltip,
  hideTooltip = false,
  tooltipSide = "bottom",
  type = "button",
  ...rest
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={cx(
        "inline-flex shrink-0 items-center justify-center transition-colors disabled:cursor-default disabled:opacity-45",
        SIZE[size],
        SURFACE[variant],
        TONE[tone],
        shape === "round" ? "rounded-full" : "rounded-sm",
      )}
      {...rest}
    >
      <Icon icon={icon} size={size === "md" ? "lg" : "md"} />
    </button>
  );

  if (hideTooltip) {
    return button;
  }
  return (
    <Tooltip content={tooltip ?? label} side={tooltipSide}>
      {button}
    </Tooltip>
  );
}
