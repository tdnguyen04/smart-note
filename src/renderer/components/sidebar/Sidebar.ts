import { parseCaptureName } from "../../../shared/captureName";
import { formatEntryTitle } from "../../../shared/entryTitle";
import { focusById } from "../../../shared/focus";
import type { FileNode, TreeNode } from "../../../shared/ipc";
import { selectFile } from "../../commands";
import { getState, subscribe } from "../../state";

type CaptureFields = {
  dateKey: string;
  hours: number;
  minutes: number;
  timeValue: number;
  suffix: number;
};

type DayGroup = {
  dateKey: string;
  notes: Array<CaptureFields & { node: FileNode }>;
};

export function mountSidebar(root: HTMLElement): void {
  root.classList.add("sidebar");
  root.replaceChildren();

  const treeRoot = document.createElement("ul");
  treeRoot.className = "sidebar__tree";
  root.append(treeRoot);

  let selectedPath: string | null = null;
  const expandedPaths = new Set<string>();
  const dayOpen = new Map<string, boolean>();
  let nodes: TreeNode[] = [];
  let loadToken = 0;

  function paint(): void {
    treeRoot.replaceChildren();
    renderContents(nodes, getState().vaultPath || "", 0, treeRoot);
  }

  function clearTree(): void {
    nodes = [];
    expandedPaths.clear();
    dayOpen.clear();
    selectedPath = null;
    paint();
  }

  function renderContents(children: TreeNode[], parentPath: string, depth: number, listEl: HTMLElement): void {
    const { dirs, days, others } = groupForDisplay(children);
    for (const dir of dirs) {
      listEl.append(renderDir(dir, depth));
    }
    for (const day of days) {
      listEl.append(renderDay(day, parentPath, depth));
    }
    for (const file of others) {
      listEl.append(renderFile(file, depth, file.name));
    }
  }

  function renderDir(node: Extract<TreeNode, { type: "dir" }>, depth: number): HTMLLIElement {
    const item = document.createElement("li");
    item.className = "sidebar__item sidebar__item--dir";
    item.dataset["path"] = node.path;
    item.dataset["type"] = node.type;
    item.style.setProperty("--depth", String(depth));

    const isExpanded = expandedPaths.has(node.path);
    item.classList.toggle("is-expanded", isExpanded);

    const row = document.createElement("button");
    row.type = "button";
    row.className = "sidebar__row";

    const twisty = document.createElement("span");
    twisty.className = "sidebar__twisty";
    twisty.textContent = isExpanded ? "▾" : "▸";
    row.append(twisty);

    const label = document.createElement("span");
    label.className = "sidebar__label";
    label.textContent = node.name;
    row.append(label);

    row.addEventListener("click", () => {
      if (expandedPaths.has(node.path)) {
        expandedPaths.delete(node.path);
      } else {
        expandedPaths.add(node.path);
      }
      paint();
    });

    item.append(row);

    if (isExpanded) {
      const childList = document.createElement("ul");
      childList.className = "sidebar__tree";
      renderContents(node.children, node.path, depth + 1, childList);
      item.append(childList);
    }

    return item;
  }

  function renderDay(day: DayGroup, parentPath: string, depth: number): HTMLLIElement {
    const open = isDayOpen(parentPath, day.dateKey);
    const item = document.createElement("li");
    item.className = "sidebar__item sidebar__item--day";
    item.classList.toggle("is-expanded", open);
    item.style.setProperty("--depth", String(depth));

    const row = document.createElement("button");
    row.type = "button";
    row.className = "sidebar__row";

    const twisty = document.createElement("span");
    twisty.className = "sidebar__twisty";
    twisty.textContent = open ? "▾" : "▸";
    row.append(twisty);

    const label = document.createElement("span");
    label.className = "sidebar__label";
    label.textContent = formatDayLabel(day.dateKey);
    row.append(label);

    row.addEventListener("click", () => {
      setDayOpen(parentPath, day.dateKey, !open);
      paint();
    });

    item.append(row);

    if (open) {
      const childList = document.createElement("ul");
      childList.className = "sidebar__tree";
      for (const note of day.notes) {
        const suffix = note.suffix > 0 ? ` (${note.suffix})` : "";
        childList.append(
          renderFile(
            note.node,
            depth + 1,
            formatEntryTitle(note.node.preview ?? "") || "Untitled",
            `${formatTime(note.hours, note.minutes)}${suffix}`,
          ),
        );
      }
      item.append(childList);
    }

    return item;
  }

  function renderFile(node: FileNode, depth: number, labelText: string, metaText?: string): HTMLLIElement {
    const item = document.createElement("li");
    item.className = "sidebar__item sidebar__item--file";
    item.dataset["path"] = node.path;
    item.dataset["type"] = node.type;
    item.style.setProperty("--depth", String(depth));
    if (selectedPath === node.path) {
      item.classList.add("is-selected");
    }

    const row = document.createElement("button");
    row.type = "button";
    row.className = "sidebar__row";
    row.title = node.name;

    const spacer = document.createElement("span");
    spacer.className = "sidebar__twisty sidebar__twisty--spacer";
    row.append(spacer);

    const focus = focusById(node.focus);
    if (focus) {
      const mark = document.createElement("span");
      mark.className = "sidebar__focus";
      mark.style.background = focus.color;
      mark.title = focus.label;
      mark.setAttribute("aria-hidden", "true");
      row.append(mark);
      row.title = `${focus.label} · ${node.name}`;
    }

    const label = document.createElement("span");
    label.className = "sidebar__label";
    if (metaText) {
      label.classList.add("sidebar__label--title");
    }
    label.textContent = labelText;
    row.append(label);

    if (metaText) {
      const meta = document.createElement("span");
      meta.className = "sidebar__meta";
      meta.textContent = metaText;
      row.append(meta);
    }

    row.addEventListener("click", () => {
      selectFile(node.path);
    });

    item.append(row);
    return item;
  }

  function dayStateKey(parentPath: string, dateKeyValue: string): string {
    return `${parentPath}\0${dateKeyValue}`;
  }

  function isDayOpen(parentPath: string, dateKeyValue: string): boolean {
    const key = dayStateKey(parentPath, dateKeyValue);
    if (dayOpen.has(key)) {
      return dayOpen.get(key) === true;
    }
    return dateKeyValue === todayKey();
  }

  function setDayOpen(parentPath: string, dateKeyValue: string, open: boolean): void {
    dayOpen.set(dayStateKey(parentPath, dateKeyValue), open);
  }

  async function loadTree(vaultPath: string | null, resetExpansion: boolean): Promise<void> {
    loadToken += 1;
    const token = loadToken;
    if (!vaultPath) {
      clearTree();
      return;
    }

    try {
      const tree = await window.smartnote.getTree(vaultPath);
      if (token !== loadToken) {
        return;
      }
      nodes = tree;
      await attachCaptureTitles(nodes);
      if (token !== loadToken) {
        return;
      }
      if (resetExpansion) {
        expandedPaths.clear();
        dayOpen.clear();
      }
      paint();
    } catch (error) {
      if (token !== loadToken) {
        return;
      }
      console.error(error);
      clearTree();
    }
  }

  subscribe(
    (s) => s.vaultPath,
    (vaultPath) => {
      void loadTree(vaultPath, true);
    },
  );

  subscribe(
    (s) => s.treeEpoch,
    () => {
      const vaultPath = getState().vaultPath;
      if (!vaultPath) {
        return;
      }
      void loadTree(vaultPath, false);
    },
  );

  subscribe(
    (s) => s.selectedFilePath,
    (filePath) => {
      selectedPath = filePath;
      paint();
    },
  );
}

async function attachCaptureTitles(list: TreeNode[]): Promise<void> {
  const pending: FileNode[] = [];
  function walk(items: TreeNode[]): void {
    for (const node of items) {
      if (node.type === "dir") {
        walk(node.children);
        continue;
      }
      if (parseCaptureName(node.name) && !formatEntryTitle(node.preview ?? "")) {
        pending.push(node);
      }
    }
  }
  walk(list);
  await Promise.all(
    pending.map(async (node) => {
      try {
        const result = await window.smartnote.readFile(node.path);
        if (result.ok) {
          node.preview = result.content;
        }
      } catch {
        // Leave the row untitled when the note cannot be read.
      }
    }),
  );
}

function groupForDisplay(children: TreeNode[]): {
  dirs: Array<Extract<TreeNode, { type: "dir" }>>;
  days: DayGroup[];
  others: FileNode[];
} {
  const dirs: Array<Extract<TreeNode, { type: "dir" }>> = [];
  const others: FileNode[] = [];
  const byDay = new Map<string, Array<CaptureFields & { node: FileNode }>>();

  for (const node of children) {
    if (node.type === "dir") {
      dirs.push(node);
      continue;
    }
    const parsed = captureFields(node.name);
    if (!parsed) {
      others.push(node);
      continue;
    }
    const bucket = byDay.get(parsed.dateKey) ?? [];
    bucket.push({ node, ...parsed });
    byDay.set(parsed.dateKey, bucket);
  }

  const days = [...byDay.keys()]
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .map((dateKeyValue) => ({
      dateKey: dateKeyValue,
      notes: (byDay.get(dateKeyValue) ?? []).sort((a, b) => {
        if (b.timeValue !== a.timeValue) {
          return b.timeValue - a.timeValue;
        }
        return b.suffix - a.suffix;
      }),
    }));

  return { dirs, days, others };
}

function captureFields(name: string): CaptureFields | null {
  const parsed = parseCaptureName(name);
  if (!parsed) {
    return null;
  }
  const hours = parsed.date.getHours();
  const minutes = parsed.date.getMinutes();
  return {
    dateKey: dateKey(parsed.date),
    hours,
    minutes,
    timeValue: hours * 60 + minutes,
    suffix: parsed.dup,
  };
}

function todayKey(): string {
  return dateKey(new Date());
}

function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDayLabel(dateKeyValue: string): string {
  if (dateKeyValue === todayKey()) {
    return "Today";
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKeyValue === dateKey(yesterday)) {
    return "Yesterday";
  }
  const [yearText, monthText, dayText] = dateKeyValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const shown = new Date(year, month - 1, day);
  const sameYear = year === new Date().getFullYear();
  const format: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  if (!sameYear) {
    format.year = "numeric";
  }
  return shown.toLocaleDateString(undefined, format);
}

function formatTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const minuteText = String(minutes).padStart(2, "0");
  return `${hour12}:${minuteText} ${period}`;
}
