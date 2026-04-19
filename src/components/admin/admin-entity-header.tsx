import { UserIdentity } from "@/components/shared/user-identity";

export function AdminEntityHeader({
  name,
  typeLabel,
  mobileNumber,
}: {
  name: string;
  typeLabel: string;
  mobileNumber: string;
}) {
  return (
    <section className="rounded-panel bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <UserIdentity name={name} typeLabel={typeLabel} mobileNumber={mobileNumber} />
        <div className="text-sm text-ink/55">
          هذا الرأس ثابت لإبقاء هوية الحساب واضحة أثناء التنقل بين الأقسام.
        </div>
      </div>
    </section>
  );
}
