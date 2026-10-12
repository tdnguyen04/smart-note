import { Lightbulb, RefreshCw, X } from "lucide-react";
import { COPY } from "../../../shared/globals";
import { IconButton } from "../../ui/button";
import { Icon } from "../../ui/icon";

/**
 * The writing prompt inside the capture box: a bulb button when closed, a bar with the
 * question when open. Questions come from shared/focus `pickPrompt`, chosen by Home.
 */

type HintBarProps = {
  question: string;
  focusChosen: boolean;
  disabled: boolean;
  onShuffle: () => void;
  onClose: () => void;
};

export function HintBar({ question, focusChosen, disabled, onShuffle, onClose }: HintBarProps) {
  return (
    <div className="m-1.5 mb-0 flex animate-fade-in items-start gap-2 rounded-md bg-surface-muted py-1.5 pr-1 pl-2.5 text-xs text-ink-muted">
      <Icon icon={Lightbulb} size="sm" className="mt-1 text-accent" />
      <p className="min-w-0 flex-1 py-1">
        <span className="font-semibold text-ink">{COPY.home.hintLabel}</span>
        {question}
      </p>
      <IconButton
        icon={RefreshCw}
        label={COPY.home.anotherQuestion}
        tooltip={focusChosen ? COPY.home.hintFollowsTopic : COPY.home.hintChooseTopic}
        tooltipSide="top"
        disabled={disabled}
        onClick={onShuffle}
        data-topic-hint=""
      />
      <IconButton icon={X} label={COPY.home.closeHint} disabled={disabled} onClick={onClose} />
    </div>
  );
}

export function HintButton({ disabled, onOpen }: { disabled: boolean; onOpen: () => void }) {
  return (
    <div className="absolute top-2 right-2 z-10">
      <IconButton
        icon={Lightbulb}
        label={COPY.home.showPrompt}
        tone="accent"
        shape="round"
        disabled={disabled}
        onClick={onOpen}
      />
    </div>
  );
}
