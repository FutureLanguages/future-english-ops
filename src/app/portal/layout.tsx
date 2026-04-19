import { requirePortalSession } from "@/features/auth/server/session";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePortalSession();

  return children;
}
