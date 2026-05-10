import type { PortalStageItem } from "@/types/portal";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export type JourneyStripProps = {
  stages: PortalStageItem[];
  progressPercent: number;
  timelineActive: boolean;
  title: string;
  helperText?: string;
};

export function JourneyStrip({ helperText, progressPercent, stages, timelineActive, title }: JourneyStripProps) {
  const gridTemplateColumns = `repeat(${Math.max(stages.length, 1)}, minmax(0, 1fr))`;

  return (
    <BaseCard variant="outlined">
      <BaseCardBody className="space-y-4">
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div>
            <h2 className="text-h2 font-extrabold text-text-primary">{title}</h2>
            {helperText ? <p className="mt-2 text-helper leading-6 text-text-muted">{helperText}</p> : null}
          </div>
          <StatusBadge
            label={timelineActive ? `${progressPercent}%` : "غير نشط"}
            variant={timelineActive ? "info" : "waiting"}
          />
        </div>
        <div className="overflow-x-auto pb-1">
          <ol
            className="flex min-w-max gap-3 tablet:grid tablet:min-w-0"
            style={{ gridTemplateColumns }}
            aria-label={title}
          >
            {stages.map((stage) => (
              <li
                key={stage.id}
                className={cn(
                  "min-w-32 rounded-card border px-3 py-3 text-start tablet:min-w-0",
                  stage.status === "current" && "border-primary-500 bg-primary-500 text-text-on-primary shadow-card",
                  stage.status === "completed" && "border-success-100 bg-success-100 text-success-700",
                  stage.status === "upcoming" && "border-border-subtle bg-bg-surface-alt text-text-muted",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-badge bg-bg-surface text-caption font-black text-text-primary",
                      stage.status === "current" && "text-primary-600",
                    )}
                    aria-hidden="true"
                  >
                    {stage.status === "completed" ? "✓" : stage.index + 1}
                  </span>
                  <span className="text-caption font-extrabold leading-5">{stage.label}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </BaseCardBody>
    </BaseCard>
  );
}
