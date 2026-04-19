import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCreateStudentForm } from "@/components/admin/admin-create-student-form";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminNavItems } from "@/features/admin/server/nav";

export default async function AdminNewStudentPage() {
  const session = await getAdminSession();

  return (
    <AdminShell
      mobileNumber={session.mobileNumber}
      navItems={getAdminNavItems("students")}
      title="إضافة طالب جديد"
      subtitle="إنشاء حساب طالب جديد مع طلب مرتبط وكلمة مرور افتراضية."
    >
      <div className="max-w-2xl space-y-5">
        <AdminCreateStudentForm />
      </div>
    </AdminShell>
  );
}
