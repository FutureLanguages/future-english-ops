import { UnifiedDocumentStatusBadge } from "@/components/shared/document-status-badge";
import type { DocumentChecklistItem } from "@/types/document";

export function DocumentStatusBadge({
  status,
}: {
  status: DocumentChecklistItem["status"];
}) {
  return <UnifiedDocumentStatusBadge status={status} compact />;
}
