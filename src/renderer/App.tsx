import type { ReactNode } from "react";
import { COPY, type Mode } from "../shared/globals";
import { Editor } from "./components/editor";
import { Home } from "./components/home";
import { Onboarding } from "./components/onboarding";
import { Rail } from "./components/rail";
import { Sidebar } from "./components/sidebar";
import { Titlebar } from "./components/titlebar";
import { Toolbar } from "./components/toolbar";
import { useAppState } from "./state";
import { TooltipProvider } from "./ui/tooltip";

/**
 * The frame: which regions exist and when they show. This is the only file that knows
 * the layout; regions never place themselves or each other.
 *
 * Every region is memoized and takes no props, so a re-render here (mode or sidebar
 * changes) re-renders only the wrappers, not the regions inside them.
 */
export function App() {
  const mode = useAppState((s) => s.mode);
  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        <Titlebar />
        {frameFor(mode)}
      </div>
    </TooltipProvider>
  );
}

function frameFor(mode: Mode | null): ReactNode {
  switch (mode) {
    case null:
      // Booting: restoreSavedSession decides between onboarding and the workspace.
      return null;
    case "onboarding":
      return <Onboarding />;
    case "home":
    case "organize":
      return <Workspace />;
    default: {
      const unhandled: never = mode;
      throw new Error(`Unhandled mode: ${String(unhandled)}`);
    }
  }
}

/**
 * Rail | sidebar column | main pane. Home, the tree and the editor stay mounted and are
 * hidden instead of unmounted, so a draft, the tree's expansion and the CodeMirror view
 * all survive switching between Compose and Organize, and switching costs no rebuild.
 */
function Workspace() {
  const organizing = useAppState((s) => s.mode === "organize");
  const sidebarOpen = useAppState((s) => s.sidebarOpen);

  return (
    <div className="flex min-h-0 flex-1">
      <Rail />
      <aside
        hidden={!sidebarOpen}
        aria-label={COPY.sidebarRegion}
        className="flex w-sidebar min-w-40 shrink-0 flex-col border-r border-line bg-surface-muted"
      >
        <Toolbar />
        <div hidden={!organizing} className="min-h-0 flex-1 overflow-y-auto">
          <Sidebar />
        </div>
        {!organizing && <p className="m-auto p-4 text-center text-ink-subtle">{COPY.sidebarEmpty}</p>}
      </aside>
      <main className="flex min-w-0 flex-1 flex-col bg-surface">
        <div hidden={organizing} className="flex min-h-0 flex-1">
          <Home />
        </div>
        <div hidden={!organizing} className="min-h-0 flex-1">
          <Editor />
        </div>
      </main>
    </div>
  );
}
