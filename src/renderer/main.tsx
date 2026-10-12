/**
 * Boot only: load styles, mount the app, restore the last vault.
 * Feature work never goes here; it goes in a region, a command or a transaction.
 */
import "./styles/app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { restoreSavedSession } from "./transactions/vaultSession";

const container = document.getElementById("root");
if (!container) {
  throw new Error("index.html is missing #root");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

await restoreSavedSession();
