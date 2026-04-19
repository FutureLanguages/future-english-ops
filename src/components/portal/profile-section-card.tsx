import { LockStateIndicator } from "@/components/shared/lock-state-indicator";

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
  actionLabel?: string;
  actionDisabledReason?: string;
  isDev?: boolean;
};

const toneStyles = {
  editable: "bg-[#eaf7ef] text-[#1a7f46]",
  locked: "bg-[#fff1ea] text-[#9a4a18]",
  readonly: "bg-[#eef3f1] text-[#34525b]",
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
  actionLabel,
  actionDisabledReason,
  isDev,
}: ProfileSectionCardProps) {
  return (
    <section className="rounded-panel bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-ink/65">{description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LockStateIndicator locked={locked} label={lockLabel} subtle />
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneStyles[statusTone]}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.label}
            className={`rounded-2xl px-3 py-3 ${field.missing ? "bg-[#fff4ef]" : "bg-sand"}`}
          >
            <div className="text-xs font-medium text-ink/55">{field.label}</div>
            <div className={`mt-1 text-sm font-semibold ${field.missing ? "text-[#aa4d19]" : "text-ink"}`}>
              {field.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-10">
          {missingFields.length > 0 ? (
            <div className="rounded-2xl bg-[#fff8e1] px-3 py-3 text-sm text-[#7a5a03]">
              <div className="mb-1 font-bold">الحقول المطلوبة الناقصة</div>
              <div>{missingFields.join("، ")}</div>
            </div>
          ) : (
            <div className="rounded-2xl bg-mist px-3 py-3 text-sm text-ink/65">
              لا توجد حقول مطلوبة ناقصة في هذا القسم.
            </div>
          )}
        </div>

        {actionLabel ? (
          <button
            type="button"
            disabled
            className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {actionLabel}
            {isDev ? " - قريباً" : ""}
          </button>
        ) : actionDisabledReason ? (
          <span className="text-sm font-semibold text-ink/45">{actionDisabledReason}</span>
        ) : null}
      </div>
    </section>
  );
}
