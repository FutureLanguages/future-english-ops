"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";
import { SignaturePadField } from "@/components/portal/signature-pad-field";
import { BaseCard, BaseCardBody, BaseCardHeader } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/text-input";

export function PortalAgreementActionPanel({
  agreement,
  role,
}: {
  role: "STUDENT" | "PARENT";
  agreement: {
    id: string;
    applicationId: string;
    accepted: boolean;
    studentAccepted: boolean;
    parentAccepted: boolean;
    acceptedAt: Date | string | null;
    fullName: string | null;
    signature: string | null;
    cancellationRequestedAt: Date | string | null;
    acknowledgmentText: string;
    requiresStudentAcceptance: boolean;
    requiresParentAcceptance: boolean;
  };
}) {
  const router = useRouter();
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentRoleNotRequired =
    (role === "STUDENT" && !agreement.requiresStudentAcceptance) ||
    (role === "PARENT" && !agreement.requiresParentAcceptance);
  const isImmutableAccepted = agreement.accepted || currentRoleNotRequired;

  return (
    <BaseCard variant="outlined">
      <BaseCardHeader>
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div>
            <h2 className="text-h2 font-extrabold text-text-primary">الإقرار والتوقيع</h2>
            <HelperText>
              اقرأ نص الميثاق ثم أكمل الإقرار والاسم والتوقيع إذا كان هذا الحساب مطالبًا بالموافقة.
            </HelperText>
          </div>
          <StatusBadge
            label={isImmutableAccepted ? "حالة مؤكدة" : "موافقة مطلوبة"}
            variant={isImmutableAccepted ? "complete" : "warning"}
          />
        </div>
      </BaseCardHeader>

      <BaseCardBody className="space-y-5">
        <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />

        <div className="rounded-lg border border-border-subtle bg-bg-surface-alt px-4 py-3">
          <div className="text-caption font-bold text-text-muted">نص الإقرار</div>
          <p className="mt-2 text-body leading-7 text-text-primary">{agreement.acknowledgmentText}</p>
        </div>

        <AgreementStatusSummary role={role} agreement={agreement} />

        {agreement.cancellationRequestedAt ? (
          <CancellationDisplay />
        ) : null}

        {currentRoleNotRequired ? (
          <BaseCard variant="outlined" className="border-secondary-100 bg-secondary-100/60">
            <BaseCardBody>
              <h3 className="text-h3 font-extrabold text-text-primary">لا يتطلب هذا الميثاق إجراء من هذا الحساب</h3>
              <p className="mt-2 text-body leading-7 text-text-secondary">
                لا يتطلب هذا الميثاق اعتمادًا من هذا الحساب. يمكنك متابعة حالة الاعتماد دون تقديم توقيع.
              </p>
            </BaseCardBody>
          </BaseCard>
        ) : agreement.accepted ? (
          <AcceptedState agreement={agreement} />
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              startTransition(async () => {
                const response = await fetch(`/api/portal/agreements/${agreement.id}/accept`, {
                  method: "POST",
                  body: new FormData(form),
                });
                const payload = (await response.json().catch(() => null)) as { error?: string } | null;
                if (!response.ok) {
                  setToast({
                    tone: "error",
                    message: payload?.error === "invalid_acceptance"
                      ? "يرجى إكمال الإقرار والاسم والتوقيع قبل الإرسال."
                      : "تعذر حفظ الموافقة حالياً.",
                  });
                  return;
                }

                setToast({ tone: "success", message: "تم حفظ الموافقة على الميثاق بنجاح." });
                router.push(`/portal/agreements?applicationId=${agreement.applicationId}`);
                router.refresh();
              });
            }}
          >
            <label className="flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-surface-alt px-4 py-3 text-body font-bold text-text-primary">
              <input
                type="checkbox"
                name="accepted"
                required
                className="mt-1 h-4 w-4 rounded border-border-strong accent-primary-500"
              />
              <span>أقر بأنني قرأت الميثاق كاملًا وأوافق على جميع بنوده</span>
            </label>

            <TextInput
              name="fullName"
              label="الاسم الكامل"
              required
              placeholder="أدخل الاسم الكامل كما يظهر في الهوية أو الجواز"
              helperText="سيتم حفظ هذا الاسم مع الموافقة ولا يمكن تعديله بعد الاعتماد."
            />

            <SignaturePadField />

            <div className="rounded-lg bg-warning-100 px-4 py-3">
              <HelperText tone="warning">
                عند إرسال الموافقة سيتم تسجيل الإقرار والتوقيع كحالة نهائية لهذا الحساب.
              </HelperText>
            </div>

            <Button type="submit" isLoading={isPending} disabled={isPending} fullWidth>
              {isPending ? "جارٍ الحفظ..." : "أوافق وأوقّع الميثاق"}
            </Button>
          </form>
        )}
      </BaseCardBody>
    </BaseCard>
  );
}

function AgreementStatusSummary({
  agreement,
  role,
}: {
  role: "STUDENT" | "PARENT";
  agreement: {
    studentAccepted: boolean;
    parentAccepted: boolean;
    requiresStudentAcceptance: boolean;
    requiresParentAcceptance: boolean;
  };
}) {
  const studentState = !agreement.requiresStudentAcceptance
    ? "غير مطلوب"
    : agreement.studentAccepted
      ? "تم اعتماد الطالب"
      : "بانتظار اعتماد الطالب";
  const parentState = !agreement.requiresParentAcceptance
    ? "غير مطلوب"
    : agreement.parentAccepted
      ? "تم اعتماد ولي الأمر"
      : "بانتظار اعتماد ولي الأمر";

  return (
    <div className="grid gap-3 tablet:grid-cols-2">
      <div className="rounded-lg border border-border-subtle bg-bg-surface-alt px-4 py-3">
        <div className="text-caption font-bold text-text-muted">
          {role === "STUDENT" ? "حالة هذا الحساب" : "حالة الطالب"}
        </div>
        <div className="mt-2">
          <StatusBadge
            label={studentState}
            variant={!agreement.requiresStudentAcceptance || agreement.studentAccepted ? "complete" : "warning"}
          />
        </div>
      </div>
      <div className="rounded-lg border border-border-subtle bg-bg-surface-alt px-4 py-3">
        <div className="text-caption font-bold text-text-muted">
          {role === "PARENT" ? "حالة هذا الحساب" : "حالة ولي الأمر"}
        </div>
        <div className="mt-2">
          <StatusBadge
            label={parentState}
            variant={!agreement.requiresParentAcceptance || agreement.parentAccepted ? "complete" : "warning"}
          />
        </div>
      </div>
    </div>
  );
}

function AcceptedState({
  agreement,
}: {
  agreement: {
    acceptedAt: Date | string | null;
    fullName: string | null;
    signature: string | null;
  };
}) {
  return (
    <BaseCard variant="outlined" className="border-success-100 bg-success-100/50">
      <BaseCardBody className="space-y-4">
        <div>
          <h3 className="text-h3 font-extrabold text-text-primary">تم تسجيل الموافقة</h3>
          <p className="mt-2 text-body leading-7 text-text-secondary">
            تم تسجيل الموافقة ولا يمكن تعديل الاسم أو التوقيع بعد الاعتماد.
          </p>
        </div>
        {agreement.fullName ? (
          <div className="rounded-lg bg-bg-surface px-4 py-3">
            <div className="text-caption font-bold text-text-muted">الاسم المسجل</div>
            <p className="mt-1 text-body font-bold text-text-primary">{agreement.fullName}</p>
          </div>
        ) : null}
        {agreement.acceptedAt ? (
          <div className="rounded-lg bg-bg-surface px-4 py-3">
            <div className="text-caption font-bold text-text-muted">وقت الموافقة</div>
            <p className="mt-1 text-body font-bold text-text-primary">
              {new Intl.DateTimeFormat("ar-SA", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              }).format(new Date(agreement.acceptedAt))}
            </p>
          </div>
        ) : null}
        {agreement.signature ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agreement.signature}
            alt="التوقيع المحفوظ لهذا الحساب"
            className="max-h-44 rounded-lg border border-border-subtle bg-bg-surface p-3"
          />
        ) : null}
      </BaseCardBody>
    </BaseCard>
  );
}

function CancellationDisplay() {
  return (
    <BaseCard variant="outlined" className="border-warning-100 bg-warning-100/50">
      <BaseCardBody className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-h3 font-extrabold text-text-primary">توجد حالة إلغاء مرتبطة بهذا الميثاق</h3>
            <StatusBadge label="طلب إلغاء قائم" variant="warning" />
          </div>
          <p className="mt-2 text-body leading-7 text-text-secondary">
            توجد حالة إلغاء مرتبطة بهذا الميثاق. هذا القسم للعرض فقط ولا يضيف إجراء إلغاء جديد من هذه الصفحة.
          </p>
        </div>
        <div className="rounded-lg border border-warning-100 bg-bg-surface px-4 py-3">
          <div className="text-caption font-bold text-warning-500">ما الذي يعنيه ذلك؟</div>
          <p className="mt-1 text-body leading-7 text-text-secondary">
            سيظهر التحديث النهائي هنا بعد اكتمال معالجة حالة الإلغاء من المسار المعتمد. إذا كنت بحاجة إلى متابعة إضافية، تواصل مع الإدارة.
          </p>
        </div>
      </BaseCardBody>
    </BaseCard>
  );
}
