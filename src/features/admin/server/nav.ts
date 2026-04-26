import type { AdminNavItem } from "@/types/admin";

export function getAdminNavItems(activeKey?: string): AdminNavItem[] {
  return [
    { key: "dashboard", label: "لوحة التحكم", href: "/admin/dashboard", active: activeKey === "dashboard" },
    { key: "students", label: "الطلاب", href: "/admin/students", active: activeKey === "students" },
    { key: "parents", label: "أولياء الأمور", href: "/admin/parents", active: activeKey === "parents" },
    { key: "documents", label: "المستندات", href: "/admin/documents", active: activeKey === "documents" },
    { key: "finance", label: "المالية", href: "/admin/finance", active: activeKey === "finance" },
    { key: "messages", label: "الرسائل", href: "/admin/messages", active: activeKey === "messages" },
    { key: "reports", label: "التقارير", href: "/admin/reports", active: activeKey === "reports" },
    { key: "exports", label: "التصدير", href: "/admin/reports", active: activeKey === "exports" },
    { key: "notifications", label: "الإشعارات", href: "/admin/notifications", active: activeKey === "notifications" },
  ];
}
