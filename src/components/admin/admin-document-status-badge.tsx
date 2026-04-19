import { UnifiedDocumentStatusBadge } from "@/components/shared/document-status-badge";

export function AdminDocumentStatusBadge({
  status,
}: {
  status: "MISSING" | "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
}) {
  return <UnifiedDocumentStatusBadge status={status} compact />;
}
