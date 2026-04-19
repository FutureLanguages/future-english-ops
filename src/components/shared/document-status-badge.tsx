import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RotateCcw,
  Upload,
  XCircle,
} from "lucide-react";
import type { DocumentStatus } from "@prisma/client";

const statusConfig: Record<
  DocumentStatus,
  {
    label: string;
    className: string;
    Icon: typeof Clock;
  }
> = {
  MISSING: {
    label: "مفقود",
    className: "bg-sand text-ink/80",
    Icon: AlertTriangle,
  },
  UPLOADED: {
    label: "مرفوع",
    className: "bg-mist text-pine",
    Icon: Upload,
  },
  UNDER_REVIEW: {
    label: "قيد المراجعة",
    className: "bg-clay/35 text-ink",
    Icon: Clock,
  },
  APPROVED: {
    label: "مقبول",
    className: "bg-pine text-white",
    Icon: CheckCircle,
  },
  REJECTED: {
    label: "مرفوض",
    className: "bg-clay/55 text-ink",
    Icon: XCircle,
  },
  REUPLOAD_REQUESTED: {
    label: "إعادة رفع",
    className: "bg-clay/35 text-ink",
    Icon: RotateCcw,
  },
};

export function UnifiedDocumentStatusBadge({
  status,
  compact,
}: {
  status: DocumentStatus;
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
