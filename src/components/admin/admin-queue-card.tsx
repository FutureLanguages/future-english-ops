import Link from "next/link";

export function AdminQueueCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-panel bg-white p-5 shadow-soft transition hover:-translate-y-0.5">
      <div className="text-sm font-medium text-ink/55">{label}</div>
      <div className="mt-2 text-2xl font-bold text-ink">{value}</div>
      <div className="mt-3 text-sm font-semibold text-pine">فتح القائمة</div>
    </Link>
  );
}
