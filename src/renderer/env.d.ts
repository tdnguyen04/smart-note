import type { SmartnoteApi } from "../shared/ipc";

declare global {
  interface Window {
    smartnote: SmartnoteApi;
  }
}

export {};
