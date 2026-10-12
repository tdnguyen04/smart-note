#!/bin/bash
# Stop hook: Claude cannot end its turn while `npm run check` fails.
# Exit 2 sends stderr back to Claude and keeps it working.

input=$(cat)

# If Claude is already continuing because of this hook, let it stop
# after reporting, so an unfixable error cannot loop forever.
if [ "$(echo "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

# Only run when source files changed, so chat-only turns stay fast.
if git -C "$CLAUDE_PROJECT_DIR" diff --quiet HEAD -- src 2>/dev/null \
   && [ -z "$(git -C "$CLAUDE_PROJECT_DIR" ls-files --others --exclude-standard -- src)" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0
output=$(npm run check 2>&1)
if [ $? -ne 0 ]; then
  echo "npm run check failed. Fix these errors before finishing. Do not suppress them." >&2
  echo "$output" | tail -n 60 >&2
  exit 2
fi
exit 0
