import type { ComponentPropsWithRef } from "react";
import { cx } from "../cx";

/**
 * Text buttons. Folio has one strong action per screen (Save, Choose folder), so there is
 * one filled style; quieter actions are IconButtons or inline links in their region.
 */

type ButtonProps = Omit<ComponentPropsWithRef<"button">, "className"> & {
  /** Briefly turns the button green after the action it names has finished. */
  success?: boolean;
  size?: "md" | "lg";
};

const SIZE = {
  md: "px-4 py-1.5",
  lg: "px-5 py-2",
} as const;

export function Button({ success = false, size = "md", type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-sm border text-base font-medium transition-colors",
        "disabled:cursor-default",
        SIZE[size],
        success
          ? "border-success bg-success text-surface"
          : "border-ink bg-ink text-surface hover:border-ink-muted hover:bg-ink-muted disabled:opacity-45 disabled:hover:border-ink disabled:hover:bg-ink",
      )}
      {...rest}
    />
  );
}
