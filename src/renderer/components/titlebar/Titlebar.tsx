import { PanelLeft } from "lucide-react";
import { memo } from "react";
import { APP, COPY } from "../../../shared/globals";
import { toggleSidebar } from "../../commands";
import { useAppState } from "../../state";
import { IconButton } from "../../ui/button";

/**
 * The custom title bar: logo, sidebar toggle, app name. The whole bar drags the window;
 * controls opt out with `no-drag`. The right edge leaves room for the native window buttons.
 */

export const Titlebar = memo(function Titlebar() {
  const inWorkspace = useAppState((s) => s.mode === "home" || s.mode === "organize");
  const sidebarOpen = useAppState((s) => s.sidebarOpen);

  return (
    <>
      <header className="relative flex h-titlebar shrink-0 items-center bg-surface pr-window-controls pl-2 select-none [-webkit-app-region:drag]">
        <div className="z-10 flex items-center gap-1 [-webkit-app-region:no-drag]">
          <Logo />
          {inWorkspace && (
            <IconButton
              icon={PanelLeft}
              label={sidebarOpen ? COPY.titlebar.hideSidebar : COPY.titlebar.showSidebar}
              pressed={sidebarOpen}
              onClick={toggleSidebar}
            />
          )}
        </div>
        <div className="pointer-events-none absolute left-1/2 max-w-[40%] -translate-x-1/2 truncate text-sm font-semibold">
          {APP.name}
        </div>
      </header>
      {/* A separate hairline: Windows clips borders on drag regions. */}
      <div aria-hidden="true" className="h-px shrink-0 bg-line" />
    </>
  );
});

/** The Folio mark, drawn in currentColor so it follows the theme (assets/icon.svg is for the installer). */
function Logo() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mx-2 size-4 shrink-0 text-ink">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
