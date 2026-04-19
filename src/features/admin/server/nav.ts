import type { AdminNavItem } from "@/types/admin";

export function getAdminNavItems(activeKey?: string): AdminNavItem[] {
  return [
    { key: "dashboard", label: "لوحة الإدارة", href: "/admin/dashboard", active: activeKey === "dashboard" },
    { key: "students", label: "الطلاب", href: "/admin/students", active: activeKey === "students" },
    { key: "parents", label: "أولياء الأمور", href: "/admin/parents", active: activeKey === "parents" },
    { key: "documents", label: "المستندات", href: "/admin/documents", active: activeKey === "documents" },
    { key: "reports", label: "الجدول الذكي", href: "/admin/reports", active: activeKey === "reports" },
    { key: "finance", label: "الوضع المالي", href: "/admin/finance", active: activeKey === "finance" },
    { key: "notifications", label: "الإشعارات", href: "/admin/notifications", active: activeKey === "notifications" },
  ];
}
