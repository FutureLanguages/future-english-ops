import Link from "next/link";

export function PortalPageHeader({
  title,
  description,
  backHref = "/portal/dashboard",
  backLabel = "رجوع",
  aside,
}: {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-panel bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Link
            href={backHref}
            className="inline-flex rounded-full bg-mist px-3 py-2 text-sm font-semibold text-pine"
          >
            {backLabel}
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">{description}</p>
          </div>
        </div>
        {aside}
      </div>
    </section>
  );
}
