import { Ellipsis } from "lucide-react";
import { COPY, FOCUSES, type FocusId } from "../../../shared/globals";
import { focusById } from "../../../shared/focus";
import { IconButton } from "../../ui/button";
import { cx } from "../../ui/cx";
import { FocusDot, focusTagStyle } from "../../ui/focusTag";
import { Menu, MenuItem } from "../../ui/menu";

/**
 * The focus chips above the capture box. A few show as chips; the rest sit in a "more"
 * menu, and picking one from there swaps it into the last chip slot.
 *
 * While the hint's "another question" button is hovered or focused, the chips light up
 * to say "pick one of these for a better question". That is pure CSS: the button carries
 * `data-topic-hint` and the capture area is `group/capture` (see Home).
 */

type FocusTagsProps = {
  visibleIds: readonly FocusId[];
  selectedId: FocusId | null;
  disabled: boolean;
  onToggle: (id: FocusId) => void;
  onPickFromMore: (id: FocusId) => void;
};

const HINTED =
  "group-has-[[data-topic-hint]:hover]/capture:bg-surface-hover group-has-[[data-topic-hint]:hover]/capture:ring-2 group-has-[[data-topic-hint]:focus-visible]/capture:ring-2 ring-surface-selected";

export function FocusTags({ visibleIds, selectedId, disabled, onToggle, onPickFromMore }: FocusTagsProps) {
  const rest = FOCUSES.filter((focus) => !visibleIds.includes(focus.id));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleIds.map((id) => {
        const focus = focusById(id);
        if (!focus) {
          return null;
        }
        const selected = selectedId === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            style={focusTagStyle(focus)}
            onClick={() => {
              onToggle(id);
            }}
            className={cx(
              "tag-color inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors disabled:opacity-45",
              selected ? "tag-tint border-(--tag) text-ink" : cx("border-line text-ink-muted hover:bg-surface-hover", HINTED),
            )}
          >
            <FocusDot focus={focus} />
            {focus.label}
          </button>
        );
      })}

      {rest.length > 0 && (
        <Menu
          align="start"
          trigger={<IconButton icon={Ellipsis} label={COPY.home.moreTags} shape="round" disabled={disabled} />}
        >
          {rest.map((focus) => (
            <MenuItem
              key={focus.id}
              onSelect={() => {
                onPickFromMore(focus.id);
              }}
            >
              <FocusDot focus={focus} size="md" />
              {focus.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </div>
  );
}
