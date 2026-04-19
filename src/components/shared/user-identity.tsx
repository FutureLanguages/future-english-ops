import clsx from "clsx";

export function UserIdentity({
  name,
  typeLabel,
  mobileNumber,
  compact = false,
  align = "start",
}: {
  name: string;
  typeLabel: string;
  mobileNumber?: string | null;
  compact?: boolean;
  align?: "start" | "center";
}) {
  return (
    <div className={clsx("min-w-0", align === "center" && "text-center")}>
      <div
        className={clsx(
          "truncate font-bold text-ink",
          compact ? "text-base" : "text-lg md:text-xl",
        )}
      >
        {name}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/55">
        <span>({typeLabel})</span>
        {mobileNumber ? <span dir="ltr">{mobileNumber}</span> : null}
      </div>
    </div>
  );
}
