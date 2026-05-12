import { LockStateIndicator } from "@/components/shared/lock-state-indicator";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";

type ProfileFieldRow = {
  label: string;
  value: string;
  missing?: boolean;
};

type ProfileSectionCardProps = {
  title: string;
  description: string;
  statusLabel: string;
  statusTone: "editable" | "locked" | "readonly";
  fields: ProfileFieldRow[];
  missingFields: string[];
  locked: boolean;
  lockLabel?: string;
};

const toneVariant: Record<ProfileSectionCardProps["statusTone"], StatusBadgeProps["variant"]> = {
  editable: "action",
  locked: "warning",
  readonly: "waiting",
} as const;

export function ProfileSectionCard({
  title,
  description,
  statusLabel,
  statusTone,
  fields,
  missingFields,
  locked,
  lockLabel,
}: ProfileSectionCardProps) {
  return (
    <BaseCard variant="outlined">
      <BaseCardBody>
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div>
            <h3 className="text-h3 font-extrabold text-text-primary">{title}</h3>
            <p className="mt-2 text-body leading-7 text-text-secondary">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 tablet:justify-end">
            <LockStateIndicator locked={locked} label={lockLabel} subtle />
            <StatusBadge label={statusLabel} variant={toneVariant[statusTone]} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 tablet:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.label}
              className={`rounded-lg border px-3 py-3 ${
                field.missing
                  ? "border-warning-100 bg-warning-100/60"
                  : "border-border-subtle bg-bg-surface-alt"
              }`}
            >
              <div className="text-caption font-bold text-text-muted">{field.label}</div>
              <div className={`mt-1 text-body font-bold ${field.missing ? "text-warning-500" : "text-text-primary"}`}>
                {field.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          {missingFields.length > 0 ? (
            <div className="rounded-lg border border-warning-100 bg-warning-100/60 px-3 py-3 text-body leading-7 text-warning-500">
              <div className="mb-1 font-extrabold">الحقول المطلوبة الناقصة</div>
              <div>{missingFields.join("، ")}</div>
            </div>
          ) : (
            <HelperText>لا توجد حقول مطلوبة ناقصة في هذا القسم.</HelperText>
          )}
        </div>
      </BaseCardBody>
    </BaseCard>
  );
}
