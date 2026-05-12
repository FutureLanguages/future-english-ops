import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import type { ReactNode } from "react";
import { PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalShell } from "@/components/portal/portal-shell";
import { ProfileSectionCard } from "@/components/portal/profile-section-card";
import {
  PortalHealthBehaviorForm,
  PortalParentProfileForm,
  PortalStudentProfileForm,
} from "@/components/portal/portal-profile-forms";
import { BaseCard, BaseCardBody, BaseCardHeader } from "@/components/ui/base-card";
import { EmptyState } from "@/components/ui/empty-state";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge } from "@/components/ui/status-badge";
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
        <EmptyState
          title="لا توجد بيانات ملف مرتبطة بهذا الطلب حالياً"
          description="ستظهر بيانات الطالب وولي الأمر هنا بعد ربط الحساب بطلب صالح."
        />
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
            className={`rounded-card border px-4 py-3 text-body font-bold shadow-card ${
              resolvedSearchParams?.success
                ? "border-success-100 bg-success-100 text-success-700"
                : "border-error-100 bg-error-100 text-error-600"
            }`}
          >
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
          </section>
        ) : null}

        <BaseCard variant="elevated" className="bg-secondary-100/70">
          <BaseCardBody className="space-y-4">
            <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={viewModel.activeUserLabel} variant="info" />
                </div>
                <div>
                  <h1 className="text-h1 font-extrabold text-text-primary">{viewModel.summary.title}</h1>
                  <p className="mt-2 max-w-3xl text-body leading-7 text-text-secondary">
                    {viewModel.summary.description}
                  </p>
                </div>
                <HelperText>
                  {viewModel.summary.editableSectionsCount > 0
                    ? "يمكنك تحديث الأقسام المتاحة من بطاقات التعديل أدناه، وكل حفظ يبقى داخل القسم نفسه."
                    : "هذه الصفحة للمتابعة والمراجعة حالياً، ولا توجد أقسام متاحة للتعديل من هذا الحساب."}
                </HelperText>
              </div>
              <div className="shrink-0">
                <ApplicationSwitcher
                  options={viewModel.applicationOptions}
                  selectedApplicationId={viewModel.selectedApplicationId}
                  basePath="/portal/profile"
                />
              </div>
            </div>
          </BaseCardBody>
        </BaseCard>

        <BaseCard variant="outlined">
          <BaseCardHeader>
            <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between">
              <div>
                <h2 className="text-h2 font-extrabold text-text-primary">مراجعة البيانات الحالية</h2>
                <HelperText>
                  هذه البطاقات توضّح ما هو موجود، وما يحتاج استكمال، وهل القسم قابل للتعديل من هذا الحساب.
                </HelperText>
              </div>
              <StatusBadge
                label={
                  viewModel.summary.missingStudentFieldsCount + viewModel.summary.missingParentFieldsCount > 0
                    ? "توجد بيانات ناقصة"
                    : "لا توجد نواقص مطلوبة"
                }
                variant={
                  viewModel.summary.missingStudentFieldsCount + viewModel.summary.missingParentFieldsCount > 0
                    ? "warning"
                    : "complete"
                }
              />
            </div>
          </BaseCardHeader>
          <BaseCardBody>
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
                />
              ))}
            </div>
          </BaseCardBody>
        </BaseCard>

        <div className="space-y-4">
          <div>
            <h2 className="text-h2 font-extrabold text-text-primary">تحديث البيانات</h2>
            <p className="mt-2 text-body leading-7 text-text-secondary">
              تظهر النماذج القابلة للتعديل داخل أقسامها فقط، مع توضيح الأقسام المقفلة أو المعروضة للمتابعة.
            </p>
          </div>

          {viewModel.role === "PARENT" ? (
            <>
              <ParentEditorSections viewModel={viewModel} />
              <HealthEditorSection viewModel={viewModel} />
              <StudentEditorSection viewModel={viewModel} />
            </>
          ) : (
            <>
              <StudentEditorSection viewModel={viewModel} />
              <ParentEditorSections viewModel={viewModel} />
              <HealthEditorSection viewModel={viewModel} />
            </>
          )}
        </div>

        <BaseCard variant="outlined">
          <BaseCardBody>
            <h3 className="text-h3 font-extrabold text-text-primary">كلمة المرور</h3>
            <p className="mt-2 text-body leading-7 text-text-secondary">
              يمكنك تغيير كلمة المرور من إعدادات الحساب عند الحاجة. في حال نسيان كلمة المرور يرجى التواصل مع الإدارة.
            </p>
          </BaseCardBody>
        </BaseCard>
      </div>
    </PortalShell>
  );
}

function StudentEditorSection({ viewModel }: { viewModel: NonNullable<Awaited<ReturnType<typeof getPortalProfileViewModel>>> }) {
  if (!viewModel.studentEditor.canEdit) {
    return (
      <ProfileEditorShell
        title={viewModel.role === "STUDENT" ? "بيانات الطالب" : "بيانات الطالب للمتابعة"}
        description={
          viewModel.role === "STUDENT"
            ? "هذا القسم مقفل أو غير متاح للتعديل من هذا الحساب حالياً."
            : "يمكنك مراجعة بيانات الطالب ضمن بطاقات المراجعة أعلاه، ولا يظهر نموذج تعديل من هذا الحساب حالياً."
        }
        statusLabel="عرض فقط"
        statusVariant="waiting"
      />
    );
  }

  return (
    <ProfileEditorShell
      title={viewModel.role === "STUDENT" ? "بيانات الطالب" : "بيانات الطالب"}
      description={
        viewModel.role === "STUDENT"
          ? "حدّث بياناتك الأساسية أولاً لأنها تؤثر مباشرة على اكتمال الملف."
          : "بيانات الطالب متاحة هنا عند الحاجة، مع الحفاظ على ترتيب ولي الأمر أولاً في هذه الصفحة."
      }
      statusLabel="قابل للتعديل"
      statusVariant="action"
    >
      <PortalStudentProfileForm
        applicationId={viewModel.studentEditor.applicationId}
        values={viewModel.studentEditor.values}
      />
    </ProfileEditorShell>
  );
}

function ParentEditorSections({ viewModel }: { viewModel: NonNullable<Awaited<ReturnType<typeof getPortalProfileViewModel>>> }) {
  return (
    <>
      {viewModel.parentEditors.map((editor) => (
        <ProfileEditorShell
          key={editor.id}
          title={editor.title}
          description={
            viewModel.role === "PARENT"
              ? "هذه بيانات ولي الأمر والأسرة المرتبطة بالمتابعة، ويمكن تحديثها هنا عند السماح بالتعديل."
              : "راجع بيانات ولي الأمر والأسرة، وحدّثها فقط إذا كانت متاحة لهذا الحساب."
          }
          statusLabel={editor.canEdit ? "قابل للتعديل" : "عرض فقط"}
          statusVariant={editor.canEdit ? "action" : "waiting"}
        >
          {editor.canEdit ? (
            <PortalParentProfileForm editor={editor} />
          ) : (
            <div className="rounded-lg border border-border-subtle bg-bg-surface-alt px-4 py-3 text-body leading-7 text-text-secondary">
              هذا القسم ظاهر لك للمراجعة فقط، ولا يمكن تعديل بياناته من هذا الحساب حالياً.
            </div>
          )}
        </ProfileEditorShell>
      ))}
    </>
  );
}

function HealthEditorSection({ viewModel }: { viewModel: NonNullable<Awaited<ReturnType<typeof getPortalProfileViewModel>>> }) {
  if (!viewModel.healthEditor.visible) {
    return null;
  }

  return (
    <ProfileEditorShell
      title="الحالة الصحية والسلوكية"
      description="هذه البيانات جزء من متابعة الأسرة للطالب، وتُستخدم لمساعدة المشرفين على التعامل معه بأمان وهدوء."
      statusLabel={
        viewModel.healthEditor.canEdit || viewModel.healthEditor.canEditParentSupervisorNotes
          ? "قابل للتعديل"
          : "عرض فقط"
      }
      statusVariant={
        viewModel.healthEditor.canEdit || viewModel.healthEditor.canEditParentSupervisorNotes
          ? "action"
          : "waiting"
      }
    >
      <PortalHealthBehaviorForm
        applicationId={viewModel.healthEditor.applicationId}
        canEdit={viewModel.healthEditor.canEdit}
        canEditParentSupervisorNotes={viewModel.healthEditor.canEditParentSupervisorNotes}
        showParentSupervisorNotes={viewModel.healthEditor.showParentSupervisorNotes}
        values={viewModel.healthEditor.values}
        parentSupervisorNotes={viewModel.healthEditor.parentSupervisorNotes}
      />
    </ProfileEditorShell>
  );
}

function ProfileEditorShell({
  children,
  description,
  statusLabel,
  statusVariant,
  title,
}: {
  children?: ReactNode;
  description: string;
  statusLabel: string;
  statusVariant: "action" | "waiting";
  title: string;
}) {
  return (
    <BaseCard variant="outlined">
      <BaseCardHeader>
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div>
            <h3 className="text-h3 font-extrabold text-text-primary">{title}</h3>
            <p className="mt-2 text-body leading-7 text-text-secondary">{description}</p>
          </div>
          <StatusBadge label={statusLabel} variant={statusVariant} />
        </div>
      </BaseCardHeader>
      {children ? <BaseCardBody>{children}</BaseCardBody> : null}
    </BaseCard>
  );
}
