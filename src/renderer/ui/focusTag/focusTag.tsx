import type { CSSProperties } from "react";
import type { Focus } from "../../../shared/focus";
import { cx } from "../cx";

/**
 * Focus tag colors come from FOCUSES (they are data stored in notes, not design tokens).
 * A component hands both theme variants to CSS, and the `tag-color` utility in app.css
 * picks one, so nothing in TypeScript needs to know the current theme.
 */

/** Style for any element that uses `tag-color` (and so `var(--tag)`) on itself or a child. */
export function focusTagStyle(focus: Focus): CSSProperties {
  return { "--tag-light": focus.color, "--tag-dark": focus.colorDark };
}

/** The small colored dot that marks a note's focus. */
export function FocusDot({ focus, size = "sm" }: { focus: Focus; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      style={focusTagStyle(focus)}
      className={cx("tag-color inline-block shrink-0 rounded-full bg-(--tag)", size === "sm" ? "size-1.5" : "size-2")}
    />
  );
}
