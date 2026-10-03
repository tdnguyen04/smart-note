import { selectFile } from "../../commands.js";
import { getState, subscribe } from "../../state.js";
import { focusById } from "../../utils/captureFocuses.js";

const CAPTURE_NAME =
  /^(\d{4})-(\d{2})-(\d{2}) (\d{2})\.(\d{2}) Note(?: \((\d+)\))?\.md$/;

/**
 * Mounts the file tree into root.
 * Dated capture notes are grouped by day, newest first. Other rows stay as they are.
 */
export function mountSidebar(root) {
  root.classList.add("sidebar");
  root.replaceChildren();

  const treeRoot = document.createElement("ul");
  treeRoot.className = "sidebar__tree";
  root.append(treeRoot);

  let selectedPath = null;
  const expandedPaths = new Set();
  /** @type {Map<string, boolean>} */
  const dayOpen = new Map();
  let nodes = [];
  let loadToken = 0;

  function paint() {
    treeRoot.replaceChildren();
    renderContents(nodes, getState().vaultPath || "", 0, treeRoot);
  }

  function clearTree() {
    nodes = [];
    expandedPaths.clear();
    dayOpen.clear();
    selectedPath = null;
    paint();
  }

  function renderContents(children, parentPath, depth, listEl) {
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

  function renderDir(node, depth) {
    const item = document.createElement("li");
    item.className = "sidebar__item sidebar__item--dir";
    item.dataset.path = node.path;
    item.dataset.type = node.type;
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

    if (isExpanded && Array.isArray(node.children)) {
      const childList = document.createElement("ul");
      childList.className = "sidebar__tree";
      renderContents(node.children, node.path, depth + 1, childList);
      item.append(childList);
    }

    return item;
  }

  function renderDay(day, parentPath, depth) {
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
        const labelText = `${formatTime(note.hours, note.minutes)}${suffix}`;
        childList.append(renderFile(note.node, depth + 1, labelText));
      }
      item.append(childList);
    }

    return item;
  }

  function renderFile(node, depth, labelText) {
    const item = document.createElement("li");
    item.className = "sidebar__item sidebar__item--file";
    item.dataset.path = node.path;
    item.dataset.type = node.type;
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
    label.textContent = labelText;
    row.append(label);

    row.addEventListener("click", () => {
      selectFile(node.path);
    });

    item.append(row);
    return item;
  }

  function dayStateKey(parentPath, dateKey) {
    return `${parentPath}\0${dateKey}`;
  }

  function isDayOpen(parentPath, dateKey) {
    const key = dayStateKey(parentPath, dateKey);
    if (dayOpen.has(key)) {
      return dayOpen.get(key);
    }
    return dateKey === todayKey();
  }

  function setDayOpen(parentPath, dateKey, open) {
    dayOpen.set(dayStateKey(parentPath, dateKey), open);
  }

  async function loadTree(vaultPath, { resetExpansion }) {
    const token = ++loadToken;
    if (!vaultPath) {
      clearTree();
      return;
    }

    try {
      const tree = await window.smartnote.getTree(vaultPath);
      if (token !== loadToken) {
        return;
      }
      nodes = Array.isArray(tree) ? tree : [];
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

  subscribe((s) => s.vaultPath, (vaultPath) => {
    void loadTree(vaultPath, { resetExpansion: true });
  });

  subscribe((s) => s.treeEpoch, () => {
    const vaultPath = getState().vaultPath;
    if (!vaultPath) {
      return;
    }
    void loadTree(vaultPath, { resetExpansion: false });
  });

  subscribe((s) => s.selectedFilePath, (filePath) => {
    selectedPath = filePath;
    paint();
  });
}

/**
 * Splits a directory into folders, dated capture notes, and other files.
 * Notes are newest day, then newest time, then highest (n) suffix.
 * @param {Array<{ type: string, name: string, path: string, children?: unknown[] }>} children
 */
function groupForDisplay(children) {
  const dirs = [];
  const others = [];
  /** @type {Map<string, Array<ReturnType<typeof parseCaptureName> & { node: object }>>} */
  const byDay = new Map();

  for (const node of children || []) {
    if (node.type === "dir") {
      dirs.push(node);
      continue;
    }
    const parsed = parseCaptureName(node.name);
    if (!parsed) {
      others.push(node);
      continue;
    }
    if (!byDay.has(parsed.dateKey)) {
      byDay.set(parsed.dateKey, []);
    }
    byDay.get(parsed.dateKey).push({ node, ...parsed });
  }

  const days = [...byDay.keys()]
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .map((dateKey) => ({
      dateKey,
      notes: byDay.get(dateKey).sort((a, b) => {
        if (b.timeValue !== a.timeValue) {
          return b.timeValue - a.timeValue;
        }
        return b.suffix - a.suffix;
      }),
    }));

  return { dirs, days, others };
}

/**
 * Reads a capture filename. Returns null for any other file.
 * @param {string} name
 */
function parseCaptureName(name) {
  const match = CAPTURE_NAME.exec(name);
  if (!match) {
    return null;
  }
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  return {
    dateKey: `${match[1]}-${match[2]}-${match[3]}`,
    hours,
    minutes,
    timeValue: hours * 60 + minutes,
    suffix: match[6] ? Number(match[6]) : 0,
  };
}

function todayKey() {
  return dateKey(new Date());
}

function dateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDayLabel(dateKeyValue) {
  if (dateKeyValue === todayKey()) {
    return "Today";
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKeyValue === dateKey(yesterday)) {
    return "Yesterday";
  }
  const [year, month, day] = dateKeyValue.split("-").map(Number);
  const shown = new Date(year, month - 1, day);
  const sameYear = year === new Date().getFullYear();
  return shown.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

function formatTime(hours, minutes) {
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const minuteText = String(minutes).padStart(2, "0");
  return `${hour12}:${minuteText} ${period}`;
}
