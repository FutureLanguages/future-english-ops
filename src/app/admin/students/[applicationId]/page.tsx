import Link from "next/link";
import { AdminBulkDownloadPanel } from "@/components/admin/admin-bulk-download-panel";
import { AdminDocumentReviewPanel } from "@/components/admin/admin-document-review-panel";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { AdminAgreementAssignmentPanel } from "@/components/admin/admin-agreement-assignment-panel";
import { AdminPaymentControls } from "@/components/admin/admin-payment-controls";
import { AdminReceiptReviewPanel } from "@/components/admin/admin-receipt-review-panel";
import { AdminStatusControl } from "@/components/admin/admin-status-control";
import { AdminLockToggleButton } from "@/components/admin/admin-lock-toggle-button";
import { PasswordField } from "@/components/shared/password-field";
import { MessageThreadsPanel } from "@/components/shared/message-threads-panel";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { DashboardStatusBadge } from "@/components/portal/dashboard-status";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminWorkspaceTabs } from "@/components/admin/admin-workspace-tabs";
import { UserIdentity } from "@/components/shared/user-identity";
import { LoadingLink } from "@/components/shared/loading-link";
import { getAdminNavItems } from "@/features/admin/server/nav";
import {
  archiveAgreementTemplateAction,
  removeAssignedAgreementAction,
  requestAgreementCancellationAction,
  updateAgreementTemplateAction,
  resetAccountPasswordAction,
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
    tab?: string;
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
  const tabParam = resolvedSearchParams?.tab;
  const activeTab = (
    ["overview", "data", "documents", "finance", "messages", "agreements", "settings"].includes(tabParam ?? "")
      ? tabParam
      : "overview"
  ) as "overview" | "data" | "documents" | "finance" | "messages" | "agreements" | "settings";

  if (!viewModel) {
    return (
      <AdminShell
        adminId={session.id}
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
  const workspaceTabs = [
    { id: "overview", label: "نظرة عامة", href: `/admin/students/${applicationId}?tab=overview` },
    { id: "data", label: "البيانات", href: `/admin/students/${applicationId}?tab=data` },
    { id: "documents", label: "المستندات", href: `/admin/students/${applicationId}?tab=documents` },
    { id: "finance", label: "المالية", href: `/admin/students/${applicationId}?tab=finance` },
    { id: "messages", label: "الرسائل", href: `/admin/students/${applicationId}?tab=messages` },
    { id: "agreements", label: "الميثاق", href: `/admin/students/${applicationId}?tab=agreements` },
    { id: "settings", label: "الإعدادات", href: `/admin/students/${applicationId}?tab=settings` },
  ];
  const agreementPendingCount = viewModel.agreements.assigned.filter((agreement) => {
    const parentAccepted = !agreement.requiresParentAcceptance || agreement.parentAccepted;
    return !agreement.studentAccepted || !parentAccepted;
  }).length;
  const agreementStateLabel =
    viewModel.agreements.assigned.length === 0
      ? "الميثاق غير مسند"
      : agreementPendingCount > 0
        ? `مواثيق معلقة: ${agreementPendingCount}`
        : "الميثاق مكتمل";
  const documentItems = viewModel.documents.groups.flatMap((group) => group.items);
  const documentTotalCount = documentItems.length;
  const documentReviewCount = documentItems.filter(
    (item) => item.canReview && (item.status === "UPLOADED" || item.status === "UNDER_REVIEW"),
  ).length;
  const documentAttentionCount = documentItems.filter(
    (item) => item.status === "REJECTED" || item.status === "REUPLOAD_REQUESTED",
  ).length;
  const documentMissingCount = documentItems.filter((item) => item.status === "MISSING").length;
  const documentApprovedCount = documentItems.filter((item) => item.status === "APPROVED").length;
  const tabQuery = `?tab=${activeTab}`;

  return (
    <AdminShell
      adminId={session.id}
      mobileNumber={viewModel.adminMobileNumber}
      navItems={viewModel.navItems}
      title="ملف الطالب"
      subtitle="مساحة تشغيلية موحدة لمراجعة الطلب، المستندات، المدفوعات، وإعدادات الوصول."
    >
      <div className="space-y-5">
        {feedback ? (
          <AutoDismissToast message={feedback.text} tone={feedback.tone} />
        ) : null}

        <section className="sticky top-[4.25rem] z-20 rounded-2xl border border-black/10 bg-white/95 p-4 shadow-soft backdrop-blur">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <DashboardStatusBadge status={viewModel.summary.status} />
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-ink">
                  ولي الأمر: {viewModel.summary.parentMobileNumber}
                </span>
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-ink">
                  {agreementStateLabel}
                </span>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <UserIdentity
                  name={viewModel.summary.studentName}
                  typeLabel="الطالب"
                  mobileNumber={viewModel.summary.studentMobileNumber}
                />
                <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-sand p-2 text-xs font-bold text-ink/70">
                  <span className="px-2">{viewModel.studentSwitch.positionLabel}</span>
                  {viewModel.studentSwitch.previous ? (
                    <LoadingLink
                      href={`/admin/students/${viewModel.studentSwitch.previous.applicationId}${tabQuery}`}
                      className="rounded-xl bg-white px-3 py-2 text-pine transition hover:bg-mist"
                      loadingLabel="جاري الفتح..."
                    >
                      السابق
                    </LoadingLink>
                  ) : (
                    <span className="rounded-xl bg-white/50 px-3 py-2 text-ink/35">السابق</span>
                  )}
                  {viewModel.studentSwitch.next ? (
                    <LoadingLink
                      href={`/admin/students/${viewModel.studentSwitch.next.applicationId}${tabQuery}`}
                      className="rounded-xl bg-white px-3 py-2 text-pine transition hover:bg-mist"
                      loadingLabel="جاري الفتح..."
                    >
                      التالي
                    </LoadingLink>
                  ) : (
                    <span className="rounded-xl bg-white/50 px-3 py-2 text-ink/35">التالي</span>
                  )}
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <div className="rounded-xl bg-sand px-4 py-3">
                  <div className="text-xs font-bold text-ink/50">الاكتمال</div>
                  <div className="mt-1 text-xl font-extrabold text-ink">{viewModel.summary.completionPercent}%</div>
                </div>
                <div className="rounded-xl bg-sand px-4 py-3">
                  <div className="text-xs font-bold text-ink/50">مستندات تحتاج إجراء</div>
                  <div className="mt-1 text-xl font-extrabold text-ink">
                    {viewModel.documents.documentsNeedingReviewCount + viewModel.documents.reuploadCount + viewModel.overview.missingDocumentsCount}
                  </div>
                </div>
                <div className="rounded-xl bg-sand px-4 py-3">
                  <div className="text-xs font-bold text-ink/50">رسائل غير مقروءة</div>
                  <div className="mt-1 text-xl font-extrabold text-ink">{viewModel.overview.unreadMessagesCount}</div>
                </div>
                <div className="rounded-xl bg-sand px-4 py-3">
                  <div className="text-xs font-bold text-ink/50">المتبقي</div>
                  <div className="mt-1 text-xl font-extrabold text-ink">{viewModel.overview.paymentSummary.remainingAmountSar} ر.س</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-mist px-4 py-4">
              <div className="text-xs font-bold text-ink/50">الحالة التشغيلية</div>
              <div className="mt-2 text-sm leading-6 text-ink/70">
                {viewModel.summary.latestAdminNote ?? "لا توجد ملاحظات إدارية حالياً."}
              </div>
            </div>
          </div>
        </section>

        <AdminWorkspaceTabs tabs={workspaceTabs} activeTab={activeTab} />

        {activeTab === "overview" ? (
          <section className="grid gap-4 xl:grid-cols-[1fr,0.95fr]">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-ink">الإجراءات المطلوبة الآن</h2>
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-ink">
                  {viewModel.overview.requiredActions.length} إجراء
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {viewModel.overview.requiredActions.length > 0 ? (
                  viewModel.overview.requiredActions.map((action) => (
                    <div key={action} className="rounded-xl border border-black/5 bg-sand px-4 py-3 text-sm font-bold text-ink">
                      {action}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-black/5 bg-sand px-4 py-3 text-sm text-ink/65">
                    لا توجد إجراءات حرجة حالياً على هذا الطلب.
                  </div>
                )}
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Link href={`/admin/students/${applicationId}?tab=documents`} className="rounded-xl bg-mist px-4 py-3 text-sm font-bold text-pine transition hover:bg-sand">
                  مراجعة المستندات
                </Link>
                <Link href={`/admin/students/${applicationId}?tab=finance`} className="rounded-xl bg-mist px-4 py-3 text-sm font-bold text-pine transition hover:bg-sand">
                  متابعة المالية
                </Link>
                <Link href={`/admin/students/${applicationId}?tab=messages`} className="rounded-xl bg-mist px-4 py-3 text-sm font-bold text-pine transition hover:bg-sand">
                  فتح الرسائل
                </Link>
                <Link href={`/admin/students/${applicationId}?tab=agreements`} className="rounded-xl bg-mist px-4 py-3 text-sm font-bold text-pine transition hover:bg-sand">
                  متابعة الميثاق
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-extrabold text-ink">تحديث حالة الطلب</h2>
              <p className="mt-1 text-sm leading-6 text-ink/60">
                هذا التحكم يومي ومتاح مباشرة من النظرة العامة.
              </p>
              <div className="mt-4">
                <AdminStatusControl
                  applicationId={applicationId}
                  currentStatus={viewModel.statusControls.currentStatus}
                  options={viewModel.statusControls.options}
                />
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "data" ? (
          <section className="grid gap-4 xl:grid-cols-[1fr,0.8fr]">
            <Link
              href={`/admin/students/${applicationId}/profile`}
              className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft transition hover:bg-sand"
            >
              <div className="text-sm font-bold text-ink/55">البيانات الكاملة</div>
              <div className="mt-2 text-lg font-extrabold text-ink">عرض وتحرير بيانات الطالب وولي الأمر</div>
              <div className="mt-2 text-sm leading-6 text-ink/60">
                الاسم، الجوال، البريد، الجنسية، الهوية، الجواز، بيانات الأسرة، الحالة الصحية والسلوكية، وملاحظات ولي الأمر للمشرفين.
              </div>
            </Link>
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-extrabold text-ink">مرجع سريع</h2>
              <div className="mt-4 space-y-3 text-sm text-ink/70">
                <div className="flex justify-between gap-3 rounded-xl bg-sand px-4 py-3">
                  <span>رقم الطالب</span>
                  <span dir="ltr" className="font-bold">{viewModel.summary.studentMobileNumber}</span>
                </div>
                <div className="flex justify-between gap-3 rounded-xl bg-sand px-4 py-3">
                  <span>رقم ولي الأمر</span>
                  <span dir="ltr" className="font-bold">{viewModel.summary.parentMobileNumber}</span>
                </div>
                <div className="rounded-xl bg-sand px-4 py-3">
                  آخر ملاحظة إدارية: {viewModel.summary.latestAdminNote ?? "لا توجد ملاحظات حالياً."}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "settings" ? (
          <>
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
                <h2 className="text-lg font-extrabold text-ink">إدارة كلمة مرور الطالب</h2>
                <form action={resetAccountPasswordAction} className="mt-4 space-y-3">
                  <input type="hidden" name="userId" value={viewModel.summary.studentUserId} />
                  <input type="hidden" name="applicationId" value={applicationId} />
                  <input type="hidden" name="redirectTo" value={`/admin/students/${applicationId}?tab=settings`} />
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

              <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
                <h2 className="text-lg font-extrabold text-ink">إدارة كلمة مرور ولي الأمر</h2>
                <form action={resetAccountPasswordAction} className="mt-4 space-y-3">
                  <input type="hidden" name="userId" value={viewModel.summary.parentUserId} />
                  <input type="hidden" name="applicationId" value={applicationId} />
                  <input type="hidden" name="redirectTo" value={`/admin/students/${applicationId}?tab=settings`} />
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

            <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-extrabold text-ink">إعدادات الوصول والأقفال</h2>
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
                      <input type="hidden" name="value" value={String(!viewModel.accessSettings.showPaymentToStudent)} />
                      <AdminFormSubmitButton idleLabel={viewModel.accessSettings.showPaymentToStudent ? "إخفاء" : "إظهار"} />
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
                        <AdminLockToggleButton locked={section.locked} title={section.locked ? `فتح ${section.title}` : `قفل ${section.title}`} />
                      </form>
                    </div>

                    <div className="mt-4 space-y-2">
                      {section.items.map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3">
                          <div>
                            <div className="text-sm font-medium text-ink">{item.title}</div>
                            <div className="mt-1 text-xs text-ink/55">
                              {section.locked ? "خاضع لقفل القسم الرئيسي" : item.locked ? "مقفل على مستوى المجموعة" : "مفتوح على مستوى المجموعة"}
                            </div>
                          </div>
                          <form action={updateAdminAccessSettingAction}>
                            <input type="hidden" name="applicationId" value={applicationId} />
                            <input type="hidden" name="field" value={item.field} />
                            <input type="hidden" name="value" value={String(!item.locked)} />
                            <AdminLockToggleButton locked={item.locked} title={item.locked ? `فتح ${item.title}` : `قفل ${item.title}`} />
                          </form>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "documents" ? <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-ink">مراجعة المستندات</h2>
              <p className="mt-1 text-sm text-ink/65">
                مساحة مراجعة مركزة تعرض ما يحتاج قرارًا أولاً، ثم الملفات التي تحتاج متابعة.
              </p>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-3 text-sm font-bold text-ink">
              إجمالي المتطلبات: {documentTotalCount}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            <div className="rounded-2xl bg-mist px-4 py-3">
              <div className="text-xs font-bold text-ink/50">بانتظار مراجعة</div>
              <div className="mt-1 text-2xl font-extrabold text-pine">{documentReviewCount}</div>
            </div>
            <div className="rounded-2xl bg-clay/20 px-4 py-3">
              <div className="text-xs font-bold text-ink/50">تحتاج إجراء</div>
              <div className="mt-1 text-2xl font-extrabold text-ink">{documentAttentionCount}</div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-3">
              <div className="text-xs font-bold text-ink/50">غير مرفوعة</div>
              <div className="mt-1 text-2xl font-extrabold text-ink">{documentMissingCount}</div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-3">
              <div className="text-xs font-bold text-ink/50">معتمدة</div>
              <div className="mt-1 text-2xl font-extrabold text-ink">{documentApprovedCount}</div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-3">
              <div className="text-xs font-bold text-ink/50">إعادة رفع</div>
              <div className="mt-1 text-2xl font-extrabold text-ink">{viewModel.documents.reuploadCount}</div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
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
            />
          </div>
        </section> : null}

        {activeTab === "finance" ? <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-ink">المساحة المالية</h2>
              <p className="mt-1 text-sm text-ink/65">
                الرسوم والخصومات والدفعات الرسمية والإيصالات مفصولة بوضوح داخل نفس مساحة الطالب.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${
              viewModel.payments.isPaymentComplete ? "bg-mist text-pine" : "bg-clay/25 text-ink"
            }`}>
              {viewModel.payments.isPaymentComplete ? "السداد مكتمل" : "يوجد مبلغ متبقٍ"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-5">
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">إجمالي الرسوم</div>
              <div className="mt-2 text-2xl font-extrabold text-ink">{viewModel.payments.totalFeesSar} ر.س</div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">إجمالي الخصم</div>
              <div className="mt-2 text-2xl font-extrabold text-ink">{viewModel.payments.discountSar} ر.س</div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">الصافي بعد الخصم</div>
              <div className="mt-2 text-2xl font-extrabold text-ink">{viewModel.payments.totalCostSar} ر.س</div>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-4">
              <div className="text-sm font-medium text-ink/55">المدفوع</div>
              <div className="mt-2 text-2xl font-extrabold text-ink">{viewModel.payments.paidAmountSar} ر.س</div>
            </div>
            <div className={`rounded-2xl px-4 py-4 ${
              viewModel.payments.isPaymentComplete ? "bg-mist" : "bg-clay/25"
            }`}>
              <div className="text-sm font-medium text-ink/55">المتبقي</div>
              <div className="mt-2 text-3xl font-extrabold text-ink">{viewModel.payments.remainingAmountSar} ر.س</div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_0.95fr]">
            <section className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="mb-4">
                <h3 className="text-base font-extrabold text-ink">الرسوم والدفعات الرسمية</h3>
                <p className="mt-1 text-sm text-ink/55">
                  استخدم التبديل الداخلي للفصل بين بنود الرسوم والدفعات دون تشتيت.
                </p>
              </div>
              <AdminPaymentControls
                applicationId={applicationId}
                fees={viewModel.payments.fees}
                payments={viewModel.payments.payments}
                receipts={viewModel.payments.receipts}
              />
            </section>

            <section className="rounded-2xl border border-black/5 bg-sand px-4 py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-ink">إيصالات السداد</h3>
                  <p className="mt-1 text-sm text-ink/55">
                    عرض وتحميل ومراجعة الإيصالات المرفوعة من ولي الأمر.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ink">
                  {viewModel.payments.receipts.length} إيصال
                </span>
              </div>
              <AdminReceiptReviewPanel applicationId={applicationId} receipts={viewModel.payments.receipts} />
            </section>
          </div>
        </section> : null}

        {activeTab === "agreements" ? <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
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
        </section> : null}

        {activeTab === "messages" ? <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
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
        </section> : null}

        <Link href="/admin/students" className="inline-flex rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white">
          العودة إلى قائمة الطلاب
        </Link>
      </div>
    </AdminShell>
  );
}
