import { APP } from "../shared/globals";
import { mountShell } from "./shell";
import { restoreSavedSession } from "./transactions/vaultSession";

document.title = APP.name;
mountShell();
await restoreSavedSession();
