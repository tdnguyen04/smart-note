/**
 * Debounced saving for the open note, independent of React and CodeMirror.
 *
 * - `schedule` restarts the delay on every edit; only the last content is written.
 * - Content is passed as a function and read when the write happens, so a burst of
 *   keystrokes costs one string build, not one per key.
 * - `flush` writes anything pending and waits for an in-flight write. Call it before
 *   switching notes so the old note is never written with the new note's text.
 * - A write is skipped when the content equals what is known to be on disk.
 */

type WriteResult = { ok: boolean };

export type Autosave = {
  schedule: (path: string, readContent: () => string) => void;
  flush: () => Promise<void>;
  /** Records what is on disk right now (after opening a note). */
  markSaved: (content: string) => void;
  cancel: () => void;
};

export function createAutosave(write: (path: string, content: string) => Promise<WriteResult>, delayMs: number): Autosave {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { path: string; readContent: () => string } | null = null;
  let inFlight: Promise<void> | null = null;
  let savedContent: string | null = null;

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  async function writePending(): Promise<void> {
    const job = pending;
    pending = null;
    if (!job) {
      return;
    }
    const content = job.readContent();
    if (content === savedContent) {
      return;
    }
    const result = await write(job.path, content);
    if (result.ok) {
      savedContent = content;
    }
  }

  function start(): Promise<void> {
    const previous = inFlight ?? Promise.resolve();
    const run = previous.then(writePending).finally(() => {
      if (inFlight === run) {
        inFlight = null;
      }
    });
    inFlight = run;
    return run;
  }

  return {
    schedule(path, readContent) {
      pending = { path, readContent };
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        start().catch((error: unknown) => {
          console.error(error);
        });
      }, delayMs);
    },
    async flush() {
      clearTimer();
      await start();
    },
    markSaved(content) {
      savedContent = content;
    },
    cancel() {
      clearTimer();
      pending = null;
    },
  };
}
