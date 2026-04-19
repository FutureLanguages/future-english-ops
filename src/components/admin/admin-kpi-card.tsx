import { ApplicationStatusBadge } from "@/components/shared/application-status-badge";

export function AdminKpiCard({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status?: "NEW" | "INCOMPLETE" | "UNDER_REVIEW" | "WAITING_PAYMENT" | "COMPLETED";
}) {
  return (
    <div className="rounded-panel bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-ink/55">{label}</div>
        {status ? <ApplicationStatusBadge status={status} compact /> : null}
      </div>
      <div className="mt-2 text-3xl font-bold text-ink">{value}</div>
    </div>
  );
}
