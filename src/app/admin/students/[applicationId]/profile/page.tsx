import Link from "next/link";
import { AdminEntityHeader } from "@/components/admin/admin-entity-header";
import { AdminParentProfileForm } from "@/components/admin/admin-parent-profile-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminStudentProfileForm } from "@/components/admin/admin-student-profile-form";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminNavItems } from "@/features/admin/server/nav";
import { prisma } from "@/lib/db/prisma";

export default async function AdminStudentProfilePage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const session = await getAdminSession();
  const { applicationId } = await params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      studentProfile: true,
      parentProfiles: true,
      studentUser: {
        select: {
          mobileNumber: true,
        },
      },
      parentUser: {
        select: {
          mobileNumber: true,
        },
      },
    },
  });

  if (!application) {
    return (
      <AdminShell
        mobileNumber={session.mobileNumber}
        navItems={getAdminNavItems("students")}
        title="بيانات الطالب"
      >
        <div className="rounded-panel bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink">لم يتم العثور على الطلب</h2>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      mobileNumber={session.mobileNumber}
      navItems={[
        ...getAdminNavItems("students"),
        {
          key: "student-profile",
          label: "بيانات الطالب",
          href: `/admin/students/${applicationId}/profile`,
          active: true,
        },
      ]}
      title="بيانات الطالب"
      subtitle="عرض وتحرير مباشر لبيانات الطالب الأساسية والإضافية من لوحة الإدارة."
    >
      <div className="space-y-5">
        <AdminEntityHeader
          name={application.studentProfile?.fullNameAr ?? "طالب بدون اسم"}
          typeLabel="الطالب"
          mobileNumber={application.studentUser.mobileNumber}
        />

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">تحرير ملف الطالب</h2>
              <p className="mt-1 text-sm text-ink/60">
                هذه الصفحة مخصصة لتعديل بيانات الطالب بدون مغادرة مساحة الإدارة.
              </p>
            </div>
            <Link
              href={`/admin/students/${applicationId}`}
              className="rounded-full border border-black/10 bg-sand px-4 py-2 text-sm font-semibold text-ink"
            >
              العودة إلى ملف الطالب
            </Link>
          </div>

          <AdminStudentProfileForm
            applicationId={applicationId}
            values={{
              mobileNumber: application.studentUser.mobileNumber,
              fullNameAr: application.studentProfile?.fullNameAr ?? "",
              fullNameEn: application.studentProfile?.fullNameEn ?? "",
              birthDate: application.studentProfile?.birthDate
                ? application.studentProfile.birthDate.toISOString().slice(0, 10)
                : "",
              gender: application.studentProfile?.gender ?? "",
              nationality: application.studentProfile?.nationality ?? "",
              city: application.studentProfile?.city ?? "",
              schoolName: application.studentProfile?.schoolName ?? "",
              passportNumber: application.studentProfile?.passportNumber ?? "",
              nationalIdNumber: application.studentProfile?.nationalIdNumber ?? "",
            }}
          />
        </section>

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-ink">بيانات ولي الأمر</h2>
            <p className="mt-1 text-sm text-ink/60">
              جميع بيانات ولي الأمر والملفات المرتبطة به متاحة هنا للإدارة، مع إمكانية التعديل المباشر.
            </p>
            <div className="mt-2 text-sm text-ink/65">
              رقم حساب ولي الأمر الحالي: {application.parentUser?.mobileNumber ?? "غير مرتبط بعد"}
            </div>
          </div>

          <div className="space-y-5">
            {[
              { type: "FATHER", title: "بيانات الأب" },
              { type: "MOTHER", title: "بيانات الأم" },
              { type: "GUARDIAN", title: "بيانات الوصي" },
            ].map(({ type, title }) => {
              const profile = application.parentProfiles.find((item) => item.type === type);

              return (
                <div key={type} className="rounded-2xl bg-sand p-4">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-ink">{title}</h3>
                    <p className="mt-1 text-sm text-ink/60">
                      تعديل مباشر لبيانات هذا القسم من داخل لوحة الإدارة.
                    </p>
                  </div>
                  <AdminParentProfileForm
                    applicationId={applicationId}
                    parentType={type}
                    title={title}
                    values={{
                      fullName: profile?.fullName ?? "",
                      mobileNumber: profile?.mobileNumber ?? "",
                      passportNumber: profile?.passportNumber ?? "",
                      nationalIdNumber: profile?.nationalIdNumber ?? "",
                      relationToStudent: profile?.relationToStudent ?? "",
                      note: profile?.note ?? "",
                      isDeceased: profile?.isDeceased ?? false,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
