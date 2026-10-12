import { Info } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { APP, COPY, TIMINGS_MS } from "../../../shared/globals";
import { promptNewSession } from "../../transactions/vaultSession";
import { Button } from "../../ui/button";
import { Icon } from "../../ui/icon";
import { cx } from "../../ui/cx";
import { Tooltip } from "../../ui/tooltip";

/**
 * First run, or after "Reset saved folder": one sentence and one button.
 * The folder tip shows itself once on arrival, then behaves like a normal tooltip.
 */

export const Onboarding = memo(function Onboarding() {
  // Mounted only while onboarding shows, so "on arrival" is simply "on mount".
  const [arriving, setArriving] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setArriving(false);
    }, TIMINGS_MS.onboardingHint);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const tipControl = {
    open: arriving || hovered,
    onOpenChange: (open: boolean) => {
      setHovered(open);
      if (!open) {
        setArriving(false);
      }
    },
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-surface p-8">
      <div className="flex max-w-88 flex-col items-center gap-3 text-center">
        <h1 className="mb-6 text-xl font-semibold tracking-tight">{APP.name}</h1>
        <p className="flex items-center justify-center gap-2 text-ink-muted">
          <Tooltip content={COPY.onboarding.tip} side="top" control={tipControl}>
            <button
              type="button"
              aria-label={`${COPY.onboarding.tipLabel}${COPY.onboarding.tip}`}
              className={cx(
                "inline-flex size-6 shrink-0 cursor-help items-center justify-center rounded-full border border-line-strong bg-surface-muted text-ink hover:bg-surface-hover",
                arriving && "animate-attention",
              )}
            >
              <Icon icon={Info} size="sm" />
            </button>
          </Tooltip>
          <span>{COPY.onboarding.lead}</span>
        </p>
        <div className="mt-3">
          <Button size="lg" onClick={() => void promptNewSession({ intent: "onboarding" })}>
            {COPY.onboarding.chooseFolder}
          </Button>
        </div>
      </div>
    </div>
  );
});
