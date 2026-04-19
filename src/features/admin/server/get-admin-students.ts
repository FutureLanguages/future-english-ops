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
  const view = params.view === "all" ? "all" : "needs_action";

  let filteredRows = rows.slice();

  if (view === "needs_action") {
    filteredRows = filteredRows.filter((row) => row.needsAction);
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
