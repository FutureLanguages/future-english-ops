import Link from "next/link";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { HelperText } from "@/components/ui/helper-text";

export function AdminQueueCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-card outline-none transition-[border-color,box-shadow] duration-default ease-default focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
    >
      <BaseCard variant="outlined" className="h-full hover:border-secondary-600 hover:shadow-card">
        <BaseCardBody>
          <div className="text-caption font-bold text-text-muted">{label}</div>
          <div className="mt-2 text-h1 font-extrabold text-text-primary" dir="ltr">{value}</div>
          <HelperText className="mt-3">فتح القائمة</HelperText>
        </BaseCardBody>
      </BaseCard>
    </Link>
  );
}
