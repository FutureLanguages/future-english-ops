import { redirect } from "next/navigation";

export default async function PortalOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const applicationId = resolvedSearchParams?.applicationId;

  redirect(applicationId ? `/portal/dashboard?applicationId=${applicationId}` : "/portal/dashboard");
}
