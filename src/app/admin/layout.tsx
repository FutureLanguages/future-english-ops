import { requireAdminSession } from "@/features/auth/server/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();

  return children;
}
