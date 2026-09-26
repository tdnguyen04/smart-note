import { mountShell } from "./shell.js";
import { restoreSavedSession } from "./transactions/vaultSession.js";
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
mountShell();
await restoreSavedSession();
