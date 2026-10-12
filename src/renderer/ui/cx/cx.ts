/**
 * Joins class names and drops falsy parts: `cx("row", selected && "bg-surface-selected")`.
 * It does not resolve Tailwind conflicts, so components expose variants as props
 * instead of accepting classes that override their own.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
