import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, LanguageSupport, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  type ViewUpdate,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * CodeMirror setup for notes: soft-wrapped serif text, line numbers, quiet markdown.
 * Colors and fonts are the CSS variables from tokens.css, so the editor follows light
 * and dark with the rest of the app and has no palette of its own.
 *
 * CodeMirror renders only the lines in view and patches the DOM per keystroke itself;
 * React never sees typing (see Editor.tsx).
 */

const theme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--color-surface)",
    color: "var(--color-ink)",
    fontSize: "var(--text-md)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-serif)",
    lineHeight: "1.7",
  },
  // Keep lines under ~75 characters: easier to read than a full-width column.
  ".cm-content": {
    maxWidth: "44rem",
    padding: "1.25rem 0 40vh",
    caretColor: "var(--color-ink)",
  },
  ".cm-line": { padding: "0 1.5rem 0 1.25rem" },
  ".cm-gutters": {
    backgroundColor: "var(--color-surface)",
    color: "var(--color-ink-subtle)",
    border: "none",
    borderRight: "1px solid var(--color-line)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
  },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 0.75rem 0 1rem" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--color-surface-hover) 45%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--color-ink-muted)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--color-ink)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "var(--color-surface-selected)",
  },
});

/** Markdown shows its structure without turning into a code editor: no syntax colors. */
const quietMarkdown = HighlightStyle.define([
  { tag: tags.heading1, fontSize: "1.35em", fontWeight: "600" },
  { tag: tags.heading2, fontSize: "1.18em", fontWeight: "600" },
  { tag: [tags.heading3, tags.heading4, tags.heading5, tags.heading6], fontWeight: "600" },
  { tag: tags.strong, fontWeight: "600" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.quote, color: "var(--color-ink-muted)", fontStyle: "italic" },
  { tag: tags.link, textDecoration: "underline" },
  { tag: tags.url, color: "var(--color-ink-subtle)" },
  { tag: tags.monospace, fontFamily: "var(--font-mono)", fontSize: "0.88em" },
  // The markup characters themselves (#, *, >, -) recede.
  { tag: [tags.processingInstruction, tags.punctuation, tags.contentSeparator], color: "var(--color-ink-subtle)" },
]);

/**
 * Everything a note editor needs. `onChange` runs for edits only, never for
 * loading a note (loading replaces the whole state; see Editor.tsx).
 */
export function noteExtensions(options: { label: string; onChange: (update: ViewUpdate) => void }): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    // The bare language, not markdown(): that helper also bundles HTML, CSS and JavaScript
    // parsers (~180 KB) to highlight code blocks, which quiet notes don't color anyway.
    new LanguageSupport(markdownLanguage),
    syntaxHighlighting(quietMarkdown),
    theme,
    EditorView.contentAttributes.of({ "aria-label": options.label, spellcheck: "false" }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        options.onChange(update);
      }
    }),
  ];
}
