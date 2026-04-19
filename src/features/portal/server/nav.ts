import type { PortalNavItem } from "@/types/portal";

export function resolveAgreementHref(params: {
  applicationId: string;
  agreements: Array<{ id: string }>;
}) {
  if (params.agreements.length === 1) {
    return `/portal/agreements/${params.agreements[0].id}`;
  }

  return `/portal/agreements?applicationId=${params.applicationId}`;
}

export function buildPortalNavItems(params: {
  activeKey: string;
  canSeePayments: boolean;
  applicationId: string;
  agreements: Array<{ id: string }>;
}): PortalNavItem[] {
  const items: PortalNavItem[] = [
    { key: "dashboard", label: "الرئيسية", href: `/portal/dashboard?applicationId=${params.applicationId}`, active: params.activeKey === "dashboard" },
    { key: "profile", label: "البيانات", href: `/portal/profile?applicationId=${params.applicationId}`, active: params.activeKey === "profile" },
    { key: "documents", label: "المستندات", href: `/portal/documents?applicationId=${params.applicationId}`, active: params.activeKey === "documents" },
  ];

  if (params.canSeePayments) {
    items.push({
      key: "payments",
      label: "المدفوعات",
      href: `/portal/payments?applicationId=${params.applicationId}`,
      active: params.activeKey === "payments",
    });
  }

  items.push({
    key: "messages",
    label: "الرسائل",
    href: `/portal/messages?applicationId=${params.applicationId}`,
    active: params.activeKey === "messages",
  });

  items.push({
    key: "agreements",
    label: "الميثاق",
    href: resolveAgreementHref({
      applicationId: params.applicationId,
      agreements: params.agreements,
    }),
    active: params.activeKey === "agreements",
  });

  return items;
}
