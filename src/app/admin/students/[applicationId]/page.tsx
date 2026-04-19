import Link from "next/link";
import { AdminBulkDownloadPanel } from "@/components/admin/admin-bulk-download-panel";
import { AdminDocumentReviewPanel } from "@/components/admin/admin-document-review-panel";
import { AdminEntityHeader } from "@/components/admin/admin-entity-header";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { AdminAgreementAssignmentPanel } from "@/components/admin/admin-agreement-assignment-panel";
import { AdminPaymentControls } from "@/components/admin/admin-payment-controls";
import { AdminStatusControl } from "@/components/admin/admin-status-control";
import { AdminDocumentStatusBadge } from "@/components/admin/admin-document-status-badge";
import { AdminLockToggleButton } from "@/components/admin/admin-lock-toggle-button";
import { PasswordField } from "@/components/shared/password-field";
import { MessageThreadsPanel } from "@/components/shared/message-threads-panel";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { DashboardStatusBadge } from "@/components/portal/dashboard-status";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminWorkspaceTabs } from "@/components/admin/admin-workspace-tabs";
import { isPreviewableMimeType } from "@/lib/storage/file-preview";
import { getAdminNavItems } from "@/features/admin/server/nav";
import {
  bulkReviewApplicationDocumentsAction,
  archiveAgreementTemplateAction,
  removeAssignedAgreementAction,
  requestAgreementCancellationAction,
  updateAgreementTemplateAction,
  resetAccountPasswordAction,
  reviewPaymentReceiptAction,
  reviewApplicationDocumentAction,
  sendAdminMessageAction,
  updateAdminAccessSettingAction,
} from "./actions";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminApplicationWorkspaceViewModel } from "@/features/admin/server/get-admin-application-workspace";

function getFeedbackMessage(searchParams?: {
  success?: string;
  error?: string;
}) {
  if (searchParams?.success === "access_updated") {
    return {
      tone: "success" as const,
      text: "تم تحديث إعدادات الوصول والأقفال بنجاح.",
    };
  }

  if (searchParams?.success === "status_updated") {
    return {
      tone: "success" as const,
      text: "تم تحديث حالة الطلب بنجاح.",
    };
  }

  if (searchParams?.error === "invalid_access_setting") {
    return {
      tone: "error" as const,
      text: "تعذر تحديث إعداد الوصول المطلوب.",
    };
  }

  if (searchParams?.error === "invalid_status") {
    return {
      tone: "error" as const,
      text: "تعذر تحديث حالة الطلب.",
    };
  }

  if (searchParams?.success === "document_review_updated") {
    return {
      tone: "success" as const,
      text: "تم تحديث حالة المستند بنجاح.",
    };
  }

  if (searchParams?.success === "student_created") {
    return {
      tone: "success" as const,
      text: "تم إنشاء حساب الطالب والطلب المرتبط بنجاح.",
    };
  }

  if (searchParams?.success === "fee_added") {
    return {
      tone: "success" as const,
      text: "تمت إضافة الرسم الجديد وتحديث الملخص المالي.",
    };
  }

  if (searchParams?.success === "payment_added") {
    return {
      tone: "success" as const,
      text: "تمت إضافة الدفعة الرسمية وتحديث الملخص المالي.",
    };
  }

  if (searchParams?.success === "agreement_removed") {
    return {
      tone: "success" as const,
      text: "تمت إزالة الميثاق غير المعتمد من الطلب.",
    };
  }

  if (searchParams?.success === "agreement_cancellation_requested") {
    return {
      tone: "success" as const,
      text: "تم تسجيل طلب إلغاء الميثاق المعتمد وبانتظار موافقة المستخدم.",
    };
  }

  if (searchParams?.success === "message_sent") {
    return {
      tone: "success" as const,
      text: "تم إرسال الرسالة بنجاح.",
    };
  }

  if (searchParams?.success === "agreement_assigned") {
    return {
      tone: "success" as const,
      text: "تم إسناد الميثاق إلى الطلب بنجاح.",
    };
  }

  if (searchParams?.success === "agreement_template_updated") {
    return {
      tone: "success" as const,
      text: "تم تحديث قالب الميثاق بنجاح. المواثيق المسندة سابقًا بقيت محفوظة كنسخ تاريخية.",
    };
  }

  if (searchParams?.success === "agreement_template_archived") {
    return {
      tone: "success" as const,
      text: "تمت أرشفة قالب الميثاق بنجاح دون حذف النسخ المسندة تاريخيًا.",
    };
  }

  if (searchParams?.error === "invalid_document_review") {
    return {
      tone: "error" as const,
      text: "تعذر تحديث حالة المستند المطلوبة.",
    };
  }

  if (searchParams?.error === "missing_review_note") {
    return {
      tone: "error" as const,
      text: "يرجى إضافة ملاحظة إدارية عند الرفض أو طلب إعادة الرفع.",
    };
  }

  if (searchParams?.success === "password_reset") {
    return {
      tone: "success" as const,
      text: "تم تحديث كلمة المرور بنجاح لهذا الحساب.",
    };
  }

  if (searchParams?.error === "password_reset_failed") {
    return {
      tone: "error" as const,
      text: "تعذر إعادة تعيين كلمة المرور لهذا الحساب.",
    };
  }

  if (searchParams?.error === "invalid_fee") {
    return {
      tone: "error" as const,
      text: "يرجى إدخال رسم صحيح بعنوان ومبلغ أكبر من صفر.",
    };
  }

  if (searchParams?.error === "agreement_already_accepted") {
    return {
      tone: "error" as const,
      text: "لا يمكن حذف الميثاق بعد اعتماده مباشرة. استخدم طلب الإلغاء بدلًا من ذلك.",
    };
  }

  if (searchParams?.error === "agreement_not_accepted") {
    return {
      tone: "error" as const,
      text: "هذا الميثاق غير معتمد بعد، ويمكن إزالته مباشرة دون طلب إلغاء.",
    };
  }

  if (searchParams?.error === "invalid_payment") {
    return {
      tone: "error" as const,
      text: "يرجى إدخال دفعة صحيحة بالمبلغ والتاريخ المطلوبين.",
    };
  }

  if (searchParams?.error === "message_failed") {
    return {
      tone: "error" as const,
      text: "تعذر إرسال الرسالة حالياً.",
    };
  }

  if (searchParams?.error === "agreement_failed") {
    return {
      tone: "error" as const,
      text: "تعذر إسناد الميثاق. تأكد من اكتمال العنوان والنص والإقرار.",
    };
  }

  return null;
}

export default async function AdminApplicationWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  const session = await getAdminSession();
  const { applicationId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getAdminApplicationWorkspaceViewModel({
    adminMobileNumber: session.mobileNumber,
    applicationId,
  });
  const feedback = getFeedbackMessage(resolvedSearchParams);

  if (!viewModel) {
    return (
      <AdminShell
        mobileNumber={session.mobileNumber}
        navItems={getAdminNavItems("students")}
        title="ملف الطالب"
      >
        <div className="rounded-panel bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink">لم يتم العثور على الطلب</h2>
        </div>
      </AdminShell>
    );
  }

  const accessSections = [
    {
      key: "student",
      title: "بيانات الطالب",
      field: "studentInfoLocked",
      locked: viewModel.accessSettings.sections.studentInfoLocked,
      items: [
        {
          key: "student-basic",
          title: "البيانات الأساسية",
          field: "studentBasicInfoLocked",
          locked: viewModel.accessSettings.subSections.studentBasicInfoLocked,
        },
        {
          key: "student-additional",
          title: "البيانات الإضافية",
          field: "studentAdditionalInfoLocked",
          locked: viewModel.accessSettings.subSections.studentAdditionalInfoLocked,
        },
      ],
    },
    {
      key: "parent",
      title: "بيانات ولي الأمر",
      field: "parentInfoLocked",
      locked: viewModel.accessSettings.sections.parentInfoLocked,
      items: [
        {
          key: "father",
          title: "بيانات الأب",
          field: "fatherInfoLocked",
          locked: viewModel.accessSettings.subSections.fatherInfoLocked,
        },
        {
          key: "mother",
          title: "بيانات الأم",
          field: "motherInfoLocked",
          locked: viewModel.accessSettings.subSections.motherInfoLocked,
        },
        {
          key: "guardian",
          title: "بيانات الوصي",
          field: "guardianInfoLocked",
          locked: viewModel.accessSettings.subSections.guardianInfoLocked,
        },
      ],
    },
    {
      key: "documents",
      title: "المستندات",
      field: "documentsLocked",
      locked: viewModel.accessSettings.sections.documentsLocked,
      items: [
        {
          key: "student-documents",
          title: "مستندات الطالب",
          field: "studentDocumentsLocked",
          locked: viewModel.accessSettings.subSections.studentDocumentsLocked,
        },
        {
          key: "parent-documents",
          title: "مستندات ولي الأمر",
          field: "parentDocumentsLocked",
          locked: viewModel.accessSettings.subSections.parentDocumentsLocked,
        },
        {
          key: "guardian-documents",
          title: "مستندات الوصاية",
          field: "guardianDocumentsLocked",
          locked: viewModel.accessSettings.subSections.guardianDocumentsLocked,
        },
      ],
    },
  ] as const;

  return (
    <AdminShell
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="ملف الطالب"
      subtitle="مساحة تشغيلية موحدة لمراجعة الطلب، المستندات، المدفوعات، وإعدادات الوصول."
    >
      <div className="space-y-5">
        {feedback ? (
          <AutoDismissToast message={feedback.text} tone={feedback.tone} />
        ) : null}

        <AdminEntityHeader
          name={viewModel.summary.studentName}
          typeLabel="الطالب"
          mobileNumber={viewModel.summary.studentMobileNumber}
        />

        <section id="overview" className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <DashboardStatusBadge status={viewModel.summary.status} />
                <span className="text-sm text-ink/60">
                  ولي الأمر: {viewModel.summary.parentMobileNumber}
                </span>
              </div>
              <div className="text-sm text-ink/65">
                آخر ملاحظة إدارية: {viewModel.summary.latestAdminNote ?? "لا توجد ملاحظات حالياً."}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-sand px-4 py-3 text-sm">
                  <div className="text-xs font-medium text-ink/55">
                    {viewModel.overview.progressIndicators.profileDocumentsAgreements.label}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="font-bold text-ink">
                      {viewModel.overview.progressIndicators.profileDocumentsAgreements.statusLabel}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        viewModel.overview.progressIndicators.profileDocumentsAgreements.tone === "success"
                          ? "bg-[#e9f7ee] text-[#1b7a43]"
                          : "bg-[#fff1ea] text-[#9f4a1f]"
                      }`}
                    >
                      {viewModel.overview.progressIndicators.profileDocumentsAgreements.tone === "success"
                        ? "مكتمل"
                        : "يحتاج استكمال"}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl bg-sand px-4 py-3 text-sm">
                  <div className="text-xs font-medium text-ink/55">
                    {viewModel.overview.progressIndicators.payments.label}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="font-bold text-ink">
                      {viewModel.overview.progressIndicators.payments.statusLabel}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        viewModel.overview.progressIndicators.payments.tone === "success"
                          ? "bg-[#e9f7ee] text-[#1b7a43]"
                          : "bg-[#fff1ea] text-[#9f4a1f]"
                      }`}
                    >
                      {viewModel.overview.progressIndicators.payments.tone === "success"
                        ? "مكتمل"
                        : "يحتاج استكمال"}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl bg-sand px-4 py-3 text-sm">
                  <div className="text-xs font-medium text-ink/55">
                    {viewModel.overview.progressIndicators.messages.label}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="font-bold text-ink">
                      {viewModel.overview.progressIndicators.messages.unreadCount} غير مقروءة
                    </span>
                    <span className="rounded-full bg-clay/35 px-2.5 py-1 text-[11px] font-bold text-ink">
                      {viewModel.overview.progressIndicators.messages.unreadCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-xs font-medium text-ink/55">نسبة الاكتمال</div>
              <div className="mt-1 text-2xl font-bold text-ink">
                {viewModel.summary.completionPercent}%
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-ink">إدارة كلمة مرور الطالب</h2>
            <form action={resetAccountPasswordAction} className="mt-4 space-y-3">
              <input type="hidden" name="userId" value={viewModel.summary.studentUserId} />
              <input type="hidden" name="applicationId" value={applicationId} />
              <input type="hidden" name="redirectTo" value={`/admin/students/${applicationId}#overview`} />
              <PasswordField
                name="nextPassword"
                label="كلمة المرور الجديدة"
                placeholder="اتركه فارغاً لاستخدام كلمة المرور الافتراضية"
                helperText="يمكنك كتابة كلمة مرور جديدة أو ترك الحقل فارغًا لاستخدام النمط الافتراضي."
              />
              <label className="flex items-center gap-2 text-sm text-ink/70">
                <input type="checkbox" name="forceChange" defaultChecked />
                <span>إجبار الطالب على تغيير كلمة المرور عند الدخول</span>
              </label>
              <AdminFormSubmitButton idleLabel="إعادة تعيين كلمة مرور الطالب" tone="primary" />
            </form>
          </div>

          <div className="rounded-panel bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-ink">إدارة كلمة مرور ولي الأمر</h2>
            <form action={resetAccountPasswordAction} className="mt-4 space-y-3">
              <input type="hidden" name="userId" value={viewModel.summary.parentUserId} />
              <input type="hidden" name="applicationId" value={applicationId} />
              <input type="hidden" name="redirectTo" value={`/admin/students/${applicationId}#overview`} />
              <PasswordField
                name="nextPassword"
                label="كلمة المرور الجديدة"
                placeholder="اتركه فارغاً لاستخدام كلمة المرور الافتراضية"
                helperText="يمكنك كتابة كلمة مرور جديدة أو ترك الحقل فارغًا لاستخدام النمط الافتراضي."
              />
              <label className="flex items-center gap-2 text-sm text-ink/70">
                <input type="checkbox" name="forceChange" defaultChecked />
                <span>إجبار ولي الأمر على تغيير كلمة المرور عند الدخول</span>
              </label>
              <AdminFormSubmitButton idleLabel="إعادة تعيين كلمة مرور ولي الأمر" tone="primary" />
            </form>
          </div>
        </section>

        <AdminWorkspaceTabs tabs={viewModel.tabs} />

        <section className="grid gap-4 xl:grid-cols-4">
          <Link
            href={`/admin/students/${applicationId}/profile`}
            className="rounded-panel bg-white p-5 shadow-soft transition hover:bg-sand"
          >
            <div className="text-sm font-medium text-ink/55">البيانات الكاملة</div>
            <div className="mt-2 text-base font-bold text-ink">عرض وتحرير بيانات الطالب وولي الأمر</div>
            <div className="mt-2 text-sm text-ink/60">
              الاسم، الجوال، الجنسية، الهوية، الجواز، والجميع الحقول الأساسية للطرفين.
            </div>
          </Link>
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">ولي الأمر</div>
            <div className="mt-2 text-base font-bold text-ink">
              {viewModel.summary.parentMobileNumber}
            </div>
          </div>
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">المستندات الناقصة</div>
            <div className="mt-2 text-2xl font-bold text-ink">
              {viewModel.overview.missingDocumentsCount}
            </div>
          </div>
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">إجمالي الرسوم</div>
            <div className="mt-2 text-2xl font-bold text-ink">
              {viewModel.overview.paymentSummary.totalCostSar} ر.س
            </div>
          </div>
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="text-sm font-medium text-ink/55">المتبقي</div>
            <div className="mt-2 text-2xl font-bold text-ink">
              {viewModel.overview.paymentSummary.remainingAmountSar} ر.س
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">الإجراءات الأساسية</h2>
              <div className="flex items-center gap-2 text-sm font-medium text-ink/55">
                <span>{viewModel.overview.requiredActions.length} إجراء</span>
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink">
                  الرسائل غير المقروءة: {viewModel.overview.unreadMessagesCount}
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {viewModel.overview.requiredActions.length > 0 ? (
                viewModel.overview.requiredActions.map((action) => (
                  <div
                    key={action}
                    className="rounded-2xl border border-black/5 bg-sand px-4 py-3 text-sm font-medium text-ink"
                  >
                    {action}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-black/5 bg-sand px-4 py-3 text-sm text-ink/65">
                  لا توجد إجراءات حرجة حالياً على هذا الطلب.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-panel bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-ink">إعدادات الوصول والأقفال</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-sand px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-ink">السماح للطالب بعرض تفاصيل المدفوعات</div>
                    <div className="mt-1 text-sm text-ink/65">
                      الحالة الحالية: {viewModel.accessSettings.showPaymentToStudent ? "مفعّل" : "غير مفعّل"}
                    </div>
                  </div>
                  <form action={updateAdminAccessSettingAction}>
                    <input type="hidden" name="applicationId" value={applicationId} />
                    <input type="hidden" name="field" value="showPaymentToStudent" />
                    <input
                      type="hidden"
                      name="value"
                      value={String(!viewModel.accessSettings.showPaymentToStudent)}
                    />
                    <AdminFormSubmitButton
                      idleLabel={
                        viewModel.accessSettings.showPaymentToStudent ? "إخفاء" : "إظهار"
                      }
                    />
                  </form>
                </div>
              </div>

              {accessSections.map((section) => (
                <div key={section.key} className="rounded-2xl bg-sand px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-ink">{section.title}</div>
                      <div className="mt-1 text-sm text-ink/65">
                        قفل القسم: {section.locked ? "مفعّل" : "غير مفعّل"}
                      </div>
                    </div>
                    <form action={updateAdminAccessSettingAction}>
                      <input type="hidden" name="applicationId" value={applicationId} />
                      <input type="hidden" name="field" value={section.field} />
                      <input type="hidden" name="value" value={String(!section.locked)} />
                      <AdminLockToggleButton
                        locked={section.locked}
                        title={section.locked ? `فتح ${section.title}` : `قفل ${section.title}`}
                      />
                    </form>
                  </div>

                  <div className="mt-4 space-y-2">
                    {section.items.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-ink">{item.title}</div>
                          <div className="mt-1 text-xs text-ink/55">
                            {section.locked
                              ? "خاضع لقفل القسم الرئيسي"
                              : item.locked
                                ? "مقفل على مستوى المجموعة"
                                : "مفتوح على مستوى المجموعة"}
                          </div>
                        </div>
                        <form action={updateAdminAccessSettingAction}>
                          <input type="hidden" name="applicationId" value={applicationId} />
                          <input type="hidden" name="field" value={item.field} />
                          <input type="hidden" name="value" value={String(!item.locked)} />
                          <AdminLockToggleButton
                            locked={item.locked}
                            title={item.locked ? `فتح ${item.title}` : `قفل ${item.title}`}
                          />
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="documents" className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">مراجعة المستندات</h2>
              <p className="mt-1 text-sm text-ink/65">
                قائمة تشغيلية بالمستندات المطلوبة وحالاتها وملاحظات المراجعة.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-sand px-3 py-1 font-semibold text-ink">
                تحتاج مراجعة: {viewModel.documents.documentsNeedingReviewCount}
              </span>
              <span className="rounded-full bg-sand px-3 py-1 font-semibold text-ink">
                إعادة رفع: {viewModel.documents.reuploadCount}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <AdminBulkDownloadPanel
              items={viewModel.documents.groups.flatMap((group) =>
                group.items.map((item) => ({
                  requirementId: item.requirementId,
                  title: item.title,
                  fileAssetId: item.fileAssetId,
                })),
              )}
            />
            <AdminDocumentReviewPanel
              applicationId={applicationId}
              groups={viewModel.documents.groups}
              bulkAction={bulkReviewApplicationDocumentsAction}
              reviewAction={reviewApplicationDocumentAction}
            />
          </div>
        </section>

        <section id="payments" className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">إدارة المدفوعات</h2>
              <p className="mt-1 text-sm text-ink/65">
                الرسوم والدفعات الرسمية تُدار من الإدارة، بينما يمكن ربط أي دفعة بإيصال مرفوع
                اختياريًا.
              </p>
            </div>
            <span className="rounded-full bg-sand px-3 py-1 text-sm font-semibold text-ink">
              {viewModel.payments.isPaymentComplete ? "السداد مكتمل" : "يوجد مبلغ متبقٍ"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">إجمالي الرسوم</div>
              <div className="mt-2 text-2xl font-bold text-ink">{viewModel.payments.totalFeesSar} ر.س</div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">إجمالي الخصم</div>
              <div className="mt-2 text-2xl font-bold text-ink">{viewModel.payments.discountSar} ر.س</div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">الإجمالي بعد الخصم</div>
              <div className="mt-2 text-2xl font-bold text-ink">{viewModel.payments.totalCostSar} ر.س</div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">المدفوع</div>
              <div className="mt-2 text-2xl font-bold text-ink">{viewModel.payments.paidAmountSar} ر.س</div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">المتبقي</div>
              <div className="mt-2 text-2xl font-bold text-ink">{viewModel.payments.remainingAmountSar} ر.س</div>
            </div>
          </div>

          <div className="mt-4">
            <AdminPaymentControls
              applicationId={applicationId}
              fees={viewModel.payments.fees}
              payments={viewModel.payments.payments}
              receipts={viewModel.payments.receipts}
            />
          </div>

          <div className="mt-4 rounded-2xl bg-sand px-4 py-4">
            <div className="text-sm font-semibold text-ink">إيصالات السداد المرفوعة</div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {viewModel.payments.receipts.length > 0 ? (
                viewModel.payments.receipts.map((receipt) => (
                  <div key={receipt.id} className="rounded-2xl bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-ink">
                          {new Intl.DateTimeFormat("ar-SA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }).format(receipt.createdAt)}
                        </div>
                        <div className="mt-1 text-xs text-ink/55">
                          {receipt.uploadedByLabel ?? "رافع غير معروف"}
                        </div>
                      </div>
                      <AdminDocumentStatusBadge status={receipt.status} />
                    </div>
                    {receipt.adminNote ? (
                      <div className="mt-3 rounded-2xl bg-sand px-3 py-3 text-sm text-ink/80">
                        {receipt.adminNote}
                      </div>
                    ) : null}
                    <div className="mt-3 flex items-center gap-3">
                      {isPreviewableMimeType(receipt.fileMimeType) ? (
                        <Link
                          href={`/api/files/${receipt.fileAssetId}/view`}
                          target="_blank"
                          className="text-sm font-semibold text-pine"
                        >
                          عرض
                        </Link>
                      ) : null}
                      <Link
                        href={`/api/files/${receipt.fileAssetId}/download`}
                        className="text-sm font-semibold text-pine"
                      >
                        تحميل
                      </Link>
                    </div>
                    <form action={reviewPaymentReceiptAction} className="mt-3 flex flex-col gap-2">
                      <input type="hidden" name="applicationId" value={applicationId} />
                      <input type="hidden" name="receiptId" value={receipt.id} />
                      <textarea
                        name="adminNote"
                        rows={3}
                        defaultValue={receipt.adminNote ?? ""}
                        placeholder="ملاحظة مرتبطة بالإيصال"
                        className="rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                      />
                      <button
                        type="submit"
                        name="status"
                        value="APPROVED"
                        className="rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white"
                      >
                        اعتماد الإيصال
                      </button>
                      <button
                        type="submit"
                        name="status"
                        value="REJECTED"
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink"
                      >
                        رفض الإيصال
                      </button>
                      <button
                        type="submit"
                        name="status"
                        value="REUPLOAD_REQUESTED"
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink"
                      >
                        طلب إعادة رفع
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-white px-4 py-4 text-sm text-ink/55">
                  لا توجد إيصالات مرفوعة حتى الآن.
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="agreements" className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">المواثيق</h2>
              <p className="mt-1 text-sm leading-6 text-ink/65">
                اسند ميثاقًا إلى هذا الطلب. يتم حفظ نسخة snapshot من النص والإقرار ولا تتأثر
                لاحقًا بأي تعديل على القالب.
              </p>
            </div>
            <span className="rounded-full bg-sand px-3 py-1 text-sm font-semibold text-ink">
              {viewModel.agreements.assigned.length} ميثاق
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <AdminAgreementAssignmentPanel
                applicationId={applicationId}
                templates={viewModel.agreements.templates.map((template) => ({
                  id: template.id,
                  title: template.title,
                  isDefault: template.isDefault,
                }))}
              />

              <div className="rounded-2xl bg-sand p-4">
                <div className="text-sm font-bold text-ink">قائمة قوالب المواثيق</div>
                <p className="mt-1 text-xs leading-6 text-ink/55">
                  تعديل القالب يؤثر على الإسنادات المستقبلية فقط. النسخ المسندة سابقًا تبقى محفوظة كما هي.
                </p>
                <div className="mt-4 space-y-4">
                  {viewModel.agreements.templates.map((template) => (
                    <details key={template.id} className="rounded-2xl bg-white p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-ink">
                        {template.title}
                        {template.isDefault ? " - افتراضي" : ""}
                      </summary>
                      <form action={updateAgreementTemplateAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="applicationId" value={applicationId} />
                        <input type="hidden" name="templateId" value={template.id} />
                        <label className="block">
                          <span className="mb-1 block text-sm font-semibold text-ink">العنوان</span>
                          <input
                            name="title"
                            defaultValue={template.title}
                            className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                            required
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-sm font-semibold text-ink">نص الميثاق</span>
                          <textarea
                            name="content"
                            rows={7}
                            defaultValue={template.content}
                            className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                            required
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-sm font-semibold text-ink">نص الإقرار</span>
                          <textarea
                            name="acknowledgmentText"
                            rows={3}
                            defaultValue={template.acknowledgmentText}
                            className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                            required
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <AdminFormSubmitButton idleLabel="حفظ التعديل" tone="primary" />
                        </div>
                      </form>
                      <form action={archiveAgreementTemplateAction} className="mt-3">
                        <input type="hidden" name="applicationId" value={applicationId} />
                        <input type="hidden" name="templateId" value={template.id} />
                        <AdminFormSubmitButton idleLabel="أرشفة القالب" />
                      </form>
                    </details>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {viewModel.agreements.assigned.length > 0 ? (
                viewModel.agreements.assigned.map((agreement) => (
                  <article key={agreement.id} className="rounded-2xl bg-sand p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-base font-bold text-ink">{agreement.title}</h3>
                        <p className="mt-1 text-xs text-ink/55">
                          أُسند في{" "}
                          {new Intl.DateTimeFormat("ar-SA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }).format(agreement.assignedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span
                          className={`rounded-full px-3 py-1 ${
                            agreement.studentAccepted ? "bg-mist text-pine" : "bg-clay/35 text-ink"
                          }`}
                        >
                          الطالب: {agreement.studentAccepted ? "مكتمل" : "معلّق"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 ${
                            !agreement.requiresParentAcceptance || agreement.parentAccepted
                              ? "bg-mist text-pine"
                              : "bg-clay/35 text-ink"
                          }`}
                        >
                          ولي الأمر: {!agreement.requiresParentAcceptance ? "غير مطلوب" : agreement.parentAccepted ? "مكتمل" : "معلّق"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 ${
                            agreement.studentAccepted && (!agreement.requiresParentAcceptance || agreement.parentAccepted)
                              ? "bg-pine text-white"
                              : "bg-white text-ink"
                          }`}
                        >
                          {agreement.studentAccepted && (!agreement.requiresParentAcceptance || agreement.parentAccepted) ? "الميثاق مكتمل" : "بانتظار الإكمال"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-white p-3 text-sm text-ink/70">
                        <div className="font-semibold text-ink">قبول الطالب</div>
                        <div className="mt-1">الاسم: {agreement.studentFullName ?? "لم يوقّع بعد"}</div>
                        <div className="mt-1">
                          الوقت:{" "}
                          {agreement.studentAcceptedAt
                            ? new Intl.DateTimeFormat("ar-SA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                              }).format(agreement.studentAcceptedAt)
                            : "غير متوفر"}
                        </div>
                        {agreement.studentSignature ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={agreement.studentSignature}
                            alt="توقيع الطالب"
                            className="mt-3 max-h-28 rounded-xl border border-black/10 bg-sand p-2"
                          />
                        ) : null}
                      </div>
                      <div className="rounded-2xl bg-white p-3 text-sm text-ink/70">
                        <div className="font-semibold text-ink">قبول ولي الأمر</div>
                        <div className="mt-1">الاسم: {agreement.parentFullName ?? "لم يوقّع بعد"}</div>
                        <div className="mt-1">
                          الوقت:{" "}
                          {agreement.parentAcceptedAt
                            ? new Intl.DateTimeFormat("ar-SA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                              }).format(agreement.parentAcceptedAt)
                            : "غير متوفر"}
                        </div>
                        {agreement.parentSignature ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={agreement.parentSignature}
                            alt="توقيع ولي الأمر"
                            className="mt-3 max-h-28 rounded-xl border border-black/10 bg-sand p-2"
                          />
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {agreement.studentAccepted || agreement.parentAccepted ? (
                        agreement.cancellationRequestedAt ? (
                          <span className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink/55">
                            تم طلب إلغاء الميثاق
                          </span>
                        ) : (
                          <form action={requestAgreementCancellationAction}>
                            <input type="hidden" name="applicationId" value={applicationId} />
                            <input type="hidden" name="agreementId" value={agreement.id} />
                            <AdminFormSubmitButton idleLabel="طلب إلغاء الميثاق المعتمد" />
                          </form>
                        )
                      ) : (
                        <form action={removeAssignedAgreementAction}>
                          <input type="hidden" name="applicationId" value={applicationId} />
                          <input type="hidden" name="agreementId" value={agreement.id} />
                          <AdminFormSubmitButton idleLabel="إزالة الميثاق" />
                        </form>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-sand p-4 text-sm text-ink/65">
                  لا يوجد ميثاق مسند لهذا الطلب.
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="messages" className="rounded-panel bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">الرسائل الداخلية</h2>
              <p className="mt-1 text-sm text-ink/65">
                محادثتان منفصلتان: واحدة تخص الطالب، وأخرى خاصة بولي الأمر والإدارة.
              </p>
            </div>
            <span className="rounded-full bg-sand px-3 py-1 text-sm font-semibold text-ink">
              غير مقروء: {viewModel.messaging.unreadCount}
            </span>
          </div>
          <MessageThreadsPanel
            applicationId={applicationId}
            initialThreads={viewModel.messaging.threads}
            initialActiveThread="STUDENT"
            endpoint="/api/admin/messages"
            readEndpoint="/api/admin/messages/read"
          />
        </section>

        <section id="status" className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">إدارة الحالة</h2>
              <p className="mt-1 text-sm text-ink/65">
                تغيير حالة الطلب من نفس مساحة العمل بدون الانتقال لصفحة أخرى.
              </p>
            </div>
            <DashboardStatusBadge status={viewModel.statusControls.currentStatus} />
          </div>

          <div className="mt-5">
            <AdminStatusControl
              applicationId={applicationId}
              currentStatus={viewModel.statusControls.currentStatus}
              options={viewModel.statusControls.options}
            />
          </div>
        </section>

        <Link href="/admin/students" className="inline-flex rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white">
          العودة إلى قائمة الطلاب
        </Link>
      </div>
    </AdminShell>
  );
}
