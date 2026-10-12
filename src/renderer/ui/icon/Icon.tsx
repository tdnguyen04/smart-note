import type { LucideIcon } from "lucide-react";
import { cx } from "../cx";

/**
 * Every icon in Folio goes through here, so size and stroke stay on one scale.
 * Icons are decorative by default: the button or text next to one carries the name.
 */

const ICON_PX = { sm: 14, md: 16, lg: 18 } as const;

/** Stroke stays 1.75px at every size (nonScalingStroke), so small icons don't look heavier. */
const STROKE = 1.75;

type IconProps = {
  icon: LucideIcon;
  size?: keyof typeof ICON_PX;
  className?: string;
};

export function Icon({ icon: Glyph, size = "md", className }: IconProps) {
  return (
    <Glyph
      size={ICON_PX[size]}
      strokeWidth={STROKE}
      nonScalingStroke
      aria-hidden="true"
      focusable="false"
      className={cx("shrink-0", className)}
    />
  );
}
