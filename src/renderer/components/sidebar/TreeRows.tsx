import { ChevronRight } from "lucide-react";
import { memo, type CSSProperties, type ReactNode } from "react";
import { focusById } from "../../../shared/focus";
import type { FileNode } from "../../../shared/ipc";
import { selectFile } from "../../commands";
import { useAppState } from "../../state";
import { cx } from "../../ui/cx";
import { FocusDot } from "../../ui/focusTag";
import { Icon } from "../../ui/icon";

/**
 * One component per row kind. Each is memoized and receives only primitives, a node whose
 * identity survives refreshes (mergeTree), and stable callbacks, so React skips every row
 * whose content did not change. Selection is read per row, not passed down: changing the
 * open note re-renders exactly the old and the new row.
 */

/** Rows indent 1rem per level, starting at 0.5rem. */
function indent(depth: number): CSSProperties {
  return { paddingInlineStart: `${0.5 + depth}rem` };
}

const ROW = "flex w-full items-start gap-1.5 rounded-sm py-1 pr-2 text-left text-sm transition-colors";

function Twisty({ open }: { open: boolean }) {
  return (
    <Icon
      icon={ChevronRight}
      size="sm"
      className={cx("mt-0.5 text-ink-subtle transition-transform", open && "rotate-90")}
    />
  );
}

type ToggleRowProps = { rowKey: string; depth: number; open: boolean; onToggle: (key: string, open: boolean) => void };

export const DirRow = memo(function DirRow({ rowKey, depth, name, open, onToggle }: ToggleRowProps & { name: string }) {
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        title={name}
        style={indent(depth)}
        className={cx(ROW, "text-ink hover:bg-surface-hover")}
        onClick={() => {
          onToggle(rowKey, !open);
        }}
      >
        <Twisty open={open} />
        <span className="min-w-0 truncate">{name}</span>
      </button>
    </li>
  );
});

export const DayRow = memo(function DayRow({ rowKey, depth, label, open, onToggle }: ToggleRowProps & { label: string }) {
  return (
    <li className="mt-1 first:mt-0">
      <button
        type="button"
        aria-expanded={open}
        style={indent(depth)}
        className={cx(ROW, "text-xs font-semibold text-ink-subtle hover:text-ink")}
        onClick={() => {
          onToggle(rowKey, !open);
        }}
      >
        <Twisty open={open} />
        <span>{label}</span>
      </button>
    </li>
  );
});

type FileRowProps = { depth: number; node: FileNode; captured: boolean; title: string; meta: string | null };

export const FileRow = memo(function FileRow({ depth, node, captured, title, meta }: FileRowProps) {
  const selected = useAppState((s) => s.selectedFilePath === node.path);
  const focus = focusById(node.focus);

  return (
    <li>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        title={focus ? `${focus.label}, ${node.name}` : node.name}
        style={indent(depth)}
        className={cx(ROW, selected ? "bg-surface-selected" : "hover:bg-surface-hover")}
        onClick={() => {
          selectFile(node.path);
        }}
      >
        {/* Keeps file labels aligned with folder labels, which have a chevron here. */}
        <span aria-hidden="true" className="w-3.5 shrink-0" />
        {focus && (
          <span className="mt-1.5 flex shrink-0">
            <FocusDot focus={focus} />
          </span>
        )}
        <Label captured={captured} selected={selected}>
          {title}
        </Label>
        {meta && <span className="ml-auto shrink-0 pt-px text-2xs text-ink-subtle tabular-nums">{meta}</span>}
      </button>
    </li>
  );
});

function Label({ captured, selected, children }: { captured: boolean; selected: boolean; children: ReactNode }) {
  if (captured) {
    return (
      <span className={cx("min-w-0 flex-1 break-words text-ink", selected ? "font-semibold" : "font-medium")}>
        {children}
      </span>
    );
  }
  return <span className={cx("min-w-0 truncate", selected ? "text-ink" : "text-ink-muted")}>{children}</span>;
}
