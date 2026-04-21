import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { DashboardStatusBadge, PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { ProfileSectionCard } from "@/components/portal/profile-section-card";
import {
  PortalHealthBehaviorForm,
  PortalParentProfileForm,
  PortalStudentProfileForm,
} from "@/components/portal/portal-profile-forms";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalProfileViewModel } from "@/features/portal/server/get-portal-profile";

export default async function PortalProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string; success?: string; error?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getPortalProfileViewModel({
    user: session,
    applicationId: resolvedSearchParams?.applicationId,
  });

  if (!viewModel) {
    return (
      <PortalShell
        role={session.role}
        navItems={[
          { key: "dashboard", label: "الرئيسية", href: "/portal/dashboard" },
          { key: "profile", label: "الملف", href: "/portal/profile", active: true },
        ]}
        isDev={devSession.isDev}
        devUsers={devSession.availableUsers}
        currentUserId={session.id}
        activeUserLabel={session.role === "STUDENT" ? "طالب" : "ولي أمر"}
        activeMobileNumber={session.mobileNumber}
      >
        <div className="rounded-panel bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink">لا توجد بيانات ملف لعرضها</h2>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      role={viewModel.role}
      studentName={viewModel.studentName}
      activeUserLabel={viewModel.activeUserLabel}
      activeMobileNumber={viewModel.mobileNumber}
      statusSlot={
        <PortalOverallCompletionBadge
          label={viewModel.overallCompletion.label}
          percent={viewModel.overallCompletion.percent}
          tone={viewModel.overallCompletion.tone}
        />
      }
      navItems={viewModel.navItems}
      isDev={devSession.isDev}
      devUsers={devSession.availableUsers}
      currentUserId={session.id}
    >
      <div className="space-y-5">
        {resolvedSearchParams?.success || resolvedSearchParams?.error ? (
          <section
            className={`rounded-panel p-4 shadow-soft ${
              resolvedSearchParams?.success
                ? "bg-[#e9f7ee] text-[#1b7a43]"
                : "bg-[#ffe8e8] text-[#a03232]"
            }`}
          >
            <div className="text-sm font-semibold">
              {resolvedSearchParams?.success === "student_profile_updated"
                ? "تم تحديث بيانات الطالب بنجاح."
                : resolvedSearchParams?.success === "parent_linked"
                  ? "تم ربط ولي الأمر أو إنشاء حسابه بنجاح."
                  : resolvedSearchParams?.success === "parent_profile_updated"
                    ? "تم تحديث بيانات ولي الأمر بنجاح."
                    : resolvedSearchParams?.error === "mobile_used_by_other_account"
                      ? "رقم الجوال مستخدم لحساب آخر، يرجى استخدام رقم مختلف."
                    : resolvedSearchParams?.error === "invalid_english_fields"
                      ? "يرجى إدخال الاسم الإنجليزي ورقم الجواز بالأحرف والأرقام الإنجليزية فقط."
                    : resolvedSearchParams?.error === "agreement_required"
                      ? "يجب الموافقة على الميثاق قبل استكمال البيانات."
                    : "تعذر تنفيذ العملية المطلوبة على الملف حالياً."}
            </div>
          </section>
        ) : null}
        <PortalPageHeader
          title="الملف"
          description="صفحة مستقلة لبيانات الطالب والأسرة. كل قسم هنا مخصص للمراجعة أو التعديل فقط."
          aside={<DashboardStatusBadge status={viewModel.status} />}
        />

        <ApplicationSwitcher
          options={viewModel.applicationOptions}
          selectedApplicationId={viewModel.selectedApplicationId}
          basePath="/portal/profile"
        />

        <div className="grid gap-4">
          {viewModel.sections.map((section) => (
            <ProfileSectionCard
              key={section.id}
              title={section.title}
              description={section.description}
              statusLabel={section.statusLabel}
              statusTone={section.statusTone}
              locked={section.locked}
              lockLabel={section.lockLabel}
              fields={section.fields}
              missingFields={section.missingFields}
              actionLabel={section.actionLabel}
              actionDisabledReason={section.actionDisabledReason}
              isDev={devSession.isDev}
            />
          ))}
        </div>

        {viewModel.studentEditor.canEdit ? (
          <section className="rounded-panel bg-white p-5 shadow-soft">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-ink">تعديل بيانات الطالب</h3>
              <p className="mt-1 text-sm leading-6 text-ink/65">
                حدّث بيانات الطالب هنا. الحقول المطلوبة ظاهرة داخل القسم أعلاه، ويمكنك حفظ التغييرات مباشرة.
              </p>
            </div>
            <PortalStudentProfileForm
              applicationId={viewModel.studentEditor.applicationId}
              values={viewModel.studentEditor.values}
            />
          </section>
        ) : null}

        {viewModel.parentEditors.map((editor) => (
              <section key={editor.id} className="rounded-panel bg-white p-5 shadow-soft">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-ink">{editor.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/65">
                    يمكنك إدخال البيانات الكاملة هنا. عند إدخال رقم الجوال سيتم ربط الطلب
                    بحساب ولي الأمر الموجود أو إنشاء حساب جديد تلقائيًا عند الحاجة.
                  </p>
                </div>
                {editor.canEdit ? (
                  <PortalParentProfileForm editor={editor} />
                ) : (
                  <div className="mt-3 rounded-2xl bg-mist px-4 py-3 text-sm text-ink/65">
                    هذا القسم ظاهر لك للمراجعة فقط، ولا يمكن تعديل بياناته من هذا الحساب حالياً.
                  </div>
                )}
              </section>
            ))}

        {viewModel.healthEditor.visible ? (
          <section className="rounded-panel bg-white p-5 shadow-soft">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-ink">الحالة الصحية والسلوكية</h3>
              <p className="mt-1 text-sm leading-6 text-ink/65">
                هذه البيانات يعبئها ولي الأمر للمشرفين، وتظهر للإدارة لمتابعة الطالب بأمان.
              </p>
            </div>
            <PortalHealthBehaviorForm
              applicationId={viewModel.healthEditor.applicationId}
              canEdit={viewModel.healthEditor.canEdit}
              values={viewModel.healthEditor.values}
              parentSupervisorNotes={viewModel.healthEditor.parentSupervisorNotes}
            />
          </section>
        ) : null}

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <h3 className="text-lg font-bold text-ink">كلمة المرور</h3>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            يمكنك تغيير كلمة المرور من زر "تغيير كلمة المرور" أعلى الصفحة. في حال نسيان كلمة
            المرور يرجى التواصل مع الإدارة.
          </p>
        </section>
      </div>
    </PortalShell>
  );
}
