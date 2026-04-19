import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  PlusCircle,
} from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";

const statusConfig: Record<
  ApplicationStatus,
  {
    label: string;
    className: string;
    Icon: typeof PlusCircle;
  }
> = {
  NEW: {
    label: "جديد",
    className: "bg-sand text-ink",
    Icon: PlusCircle,
  },
  INCOMPLETE: {
    label: "ناقص",
    className: "bg-clay/35 text-ink",
    Icon: AlertCircle,
  },
  UNDER_REVIEW: {
    label: "قيد المراجعة",
    className: "bg-clay/35 text-ink",
    Icon: Clock,
  },
  WAITING_PAYMENT: {
    label: "بانتظار الدفع",
    className: "bg-mist text-pine",
    Icon: CreditCard,
  },
  COMPLETED: {
    label: "مكتمل",
    className: "bg-pine text-white",
    Icon: CheckCircle,
  },
};

export function ApplicationStatusBadge({
  status,
  compact,
}: {
  status: ApplicationStatus;
  compact?: boolean;
}) {
  const config = statusConfig[status];
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } ${config.className}`}
      title={config.label}
      aria-label={config.label}
    >
      <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.1} />
      <span>{config.label}</span>
    </span>
  );
}
