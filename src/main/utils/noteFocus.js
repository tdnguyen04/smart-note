const fs = require("fs/promises");

const CAPTURE_NAME =
  /^(\d{4})-(\d{2})-(\d{2}) (\d{2})\.(\d{2}) Note(?: \((\d+)\))?\.md$/;
const PEEK_BYTES = 1024;

/**
 * Focus id from a capture note's frontmatter, or null when the file is not tagged.
 * Only the head of the file is read.
 * @param {string} filePath
 * @param {string} fileName
 * @returns {Promise<string | null>}
 */
async function peekCaptureFocus(filePath, fileName) {
  if (!CAPTURE_NAME.test(fileName)) {
    return null;
  }

  let handle;
  try {
    handle = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(PEEK_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, PEEK_BYTES, 0);
    return parseFocusId(buffer.toString("utf8", 0, bytesRead));
  } catch {
    return null;
  } finally {
    if (handle) {
      await handle.close();
    }
  }
}

/**
 * @param {string} head
 * @returns {string | null}
 */
function parseFocusId(head) {
  const lines = head.split(/\r?\n/);
  if ((lines[0] || "").trim() !== "---") {
    return null;
  }

  let focus = null;
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === "---") {
      return focus;
    }
    const match = /^focus:\s*([A-Za-z0-9-]+)\s*$/.exec(line);
    if (match) {
      focus = match[1];
    }
  }
  return null;
}

module.exports = { peekCaptureFocus };
