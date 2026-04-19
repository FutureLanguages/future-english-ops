import { ApplicationStatusBadge } from "@/components/shared/application-status-badge";

export function DashboardStatusBadge({
  status,
}: {
  status: "NEW" | "INCOMPLETE" | "UNDER_REVIEW" | "WAITING_PAYMENT" | "COMPLETED";
}) {
  return <ApplicationStatusBadge status={status} />;
}

export function PortalOverallCompletionBadge({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone: "complete" | "incomplete";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
        tone === "complete" ? "bg-pine text-white" : "bg-mist text-pine"
      }`}
      title={`${label} - ${percent}%`}
      aria-label={`${label} - ${percent}%`}
    >
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs ${tone === "complete" ? "bg-white/15" : "bg-white"}`}>
        {percent}%
      </span>
    </span>
  );
}
