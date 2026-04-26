import type { AdminStudentsViewModel } from "@/types/admin";
import { loadAdminApplications } from "./load-admin-applications";
import { getAdminNavItems } from "./nav";

export async function getAdminStudentsViewModel(params: {
  adminMobileNumber: string;
  q?: string;
  status?: string;
  view?: string;
}): Promise<AdminStudentsViewModel> {
  const { rows } = await loadAdminApplications();

  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const viewOptions = [
    "all",
    "needs_action",
    "missing_documents",
    "outstanding_payment",
    "unread_messages",
    "completed",
  ] as const;
  const view = viewOptions.includes(params.view as (typeof viewOptions)[number])
    ? (params.view as (typeof viewOptions)[number])
    : "needs_action";

  let filteredRows = rows.slice();

  if (view === "needs_action") {
    filteredRows = filteredRows.filter((row) => row.needsAction);
  }

  if (view === "missing_documents") {
    filteredRows = filteredRows.filter((row) => row.missingDocumentsCount + row.reuploadCount > 0);
  }

  if (view === "outstanding_payment") {
    filteredRows = filteredRows.filter((row) => row.remainingAmountSar > 0);
  }

  if (view === "unread_messages") {
    filteredRows = filteredRows.filter((row) => row.unreadMessagesCount > 0);
  }

  if (view === "completed") {
    filteredRows = filteredRows.filter((row) => row.status === "COMPLETED" || row.completionPercent === 100);
  }

  if (status) {
    filteredRows = filteredRows.filter((row) => row.status === status);
  }

  if (q) {
    const normalizedQuery = q.toLowerCase();
    filteredRows = filteredRows.filter((row) => {
      return (
        row.studentName.toLowerCase().includes(normalizedQuery) ||
        row.parentMobileNumber.toLowerCase().includes(normalizedQuery)
      );
    });
  }

  filteredRows.sort((left, right) => {
    if (left.needsAction !== right.needsAction) {
      return left.needsAction ? -1 : 1;
    }

    if (left.requiredActionsCount !== right.requiredActionsCount) {
      return right.requiredActionsCount - left.requiredActionsCount;
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

  return {
    adminMobileNumber: params.adminMobileNumber,
    navItems: getAdminNavItems("students"),
    rows: filteredRows,
    filters: {
      q,
      status,
      view,
    },
  };
}
