/// <reference types="vite/client" />
import type { SmartnoteApi } from "../shared/ipc";

declare global {
  interface Window {
    smartnote: SmartnoteApi;
  }
}

/** The CSS variables components may set inline. Anything else belongs in tokens.css. */
declare module "react" {
  interface CSSProperties {
    "--tag-light"?: string;
    "--tag-dark"?: string;
  }
}

export {};
