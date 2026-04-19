import Link from "next/link";

export function ApplicationSwitcher({
  options,
  selectedApplicationId,
  basePath = "/portal/dashboard",
}: {
  options: Array<{ id: string; label: string }>;
  selectedApplicationId: string;
  basePath?: string;
}) {
  if (options.length <= 1) {
    return null;
  }

  return (
    <div className="rounded-panel bg-white p-4 shadow-soft">
      <div className="mb-3 text-sm font-semibold text-ink/65">اختيار الطالب</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.id === selectedApplicationId;

          return (
            <Link
              key={option.id}
              href={`${basePath}?applicationId=${option.id}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                isActive ? "bg-pine text-white" : "bg-sand text-ink"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
