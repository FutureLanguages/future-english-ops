import Link from "next/link";
import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { EnrollmentSurfaceCard } from "@/components/portal/enrollment-surface-card";
import { ActionCard } from "@/components/ui/action-card";
import { BaseCard, BaseCardBody, BaseCardFooter, BaseCardHeader } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";
import { JourneyStrip } from "@/components/ui/journey-strip";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import type { PortalActionView, PortalSectionCard, StudentDashboardViewModel } from "@/types/portal";

const sectionOrder = ["profile", "documents", "agreements", "payments"] as const;

export function StudentDashboardTemplate({ viewModel }: { viewModel: StudentDashboardViewModel }) {
  const actionsHref = `/portal/actions?applicationId=${viewModel.selectedApplicationId}`;
  const primaryAction = viewModel.actions[0];
  const sectionCards = buildStudentSectionCards(viewModel);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={viewModel.statusBehavior.label} variant={statusVariant(viewModel.statusBehavior.tone)} />
              <StatusBadge label={viewModel.stageLabel} variant="info" />
            </div>
            <h1 className="mt-4 text-h1 font-extrabold leading-9 text-text-primary">
              {viewModel.statusBehavior.studentHeroTitle}
            </h1>
            <p className="mt-3 text-body leading-7 text-text-secondary">
              {viewModel.statusBehavior.studentHeroDescription}
            </p>
          </div>
          <BaseCard variant="outlined" className="w-full tablet:w-64">
            <BaseCardBody className="space-y-2">
              <div className="text-caption font-bold text-text-muted">اكتمال الملف</div>
              <div dir="ltr" className="text-h1 font-black text-text-primary">{viewModel.completionPercent}%</div>
              <HelperText>{viewModel.overallCompletion.label}</HelperText>
            </BaseCardBody>
          </BaseCard>
        </div>

        <ApplicationSwitcher
          options={viewModel.applicationOptions}
          selectedApplicationId={viewModel.selectedApplicationId}
          basePath="/portal/dashboard"
        />
      </section>

      <JourneyStrip
        title="مسار الطلب"
        helperText="المراحل مأخوذة من مسار الطلب الحالي، وتوضح أين يقف الملف الآن."
        stages={viewModel.stage.stages}
        progressPercent={viewModel.stage.progressPercent}
        timelineActive={viewModel.stage.timelineActive}
      />

      <ActionCard
        title={primaryAction ? primaryAction.label : "لا توجد إجراءات مطلوبة حالياً"}
        description={
          primaryAction?.description ??
          "كل الإجراءات المطلوبة من حسابك مكتملة الآن. سنعرض هنا أي خطوة جديدة تحتاج تنفيذها فور ظهورها."
        }
        primaryAction={primaryAction?.href ? { label: actionCtaLabel(primaryAction), href: primaryAction.href } : undefined}
        helperText={
          viewModel.actions.length > 1
            ? `يوجد ${viewModel.actions.length - 1} إجراء إضافي يمكنك مراجعته من صفحة الإجراءات.`
            : viewModel.actions.length === 0
              ? "سنخبرك هنا فور ظهور أي خطوة تحتاج إلى تنفيذها."
              : undefined
        }
        badge={{
          label: viewModel.actions.length > 0 ? "إجراء مطلوب" : "هادئ",
          variant: viewModel.actions.length > 0 ? actionVariant(primaryAction?.tone) : "complete",
        }}
      />

      {viewModel.actions.length > 1 ? (
        <div className="flex justify-start">
          <Button asChild variant="ghost" size="sm">
            <Link href={actionsHref}>عرض كل الإجراءات</Link>
          </Button>
        </div>
      ) : null}

      <EnrollmentSurfaceCard
        program={viewModel.program}
        stageLabel={viewModel.stageLabel}
        statusLabel={viewModel.statusBehavior.label}
        studentName={viewModel.studentName}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-h2 font-extrabold text-text-primary">الأقسام الأساسية</h2>
          <HelperText>ادخل إلى القسم المناسب حسب الإجراء أو المعلومة التي تحتاجها.</HelperText>
        </div>
        <div className="grid gap-4 tablet:grid-cols-2">
          {sectionCards.map((card) => (
            <SectionCard key={card.id} {...card} />
          ))}
        </div>
      </section>

      {viewModel.financeSnapshot ? (
        <BaseCard variant="outlined">
          <BaseCardHeader>
            <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
              <div>
                <h2 className="text-h2 font-extrabold text-text-primary">لمحة مالية</h2>
                <HelperText>تظهر هذه اللمحة لأن المدفوعات مفعلة لهذا الحساب.</HelperText>
              </div>
              <StatusBadge
                label={viewModel.financeSnapshot.remainingAmountSar > 0 ? "متبقٍ مالي" : "مكتمل مالياً"}
                variant={viewModel.financeSnapshot.remainingAmountSar > 0 ? "warning" : "complete"}
              />
            </div>
          </BaseCardHeader>
          <BaseCardBody>
            <div className="grid gap-3 mobile:grid-cols-3">
              <FinanceSummaryItem label="إجمالي الرسوم" value={`${viewModel.financeSnapshot.totalCostSar} ر.س`} />
              <FinanceSummaryItem label="المدفوع" value={`${viewModel.financeSnapshot.paidAmountSar} ر.س`} />
              <FinanceSummaryItem label="المتبقي" value={`${viewModel.financeSnapshot.remainingAmountSar} ر.س`} />
            </div>
          </BaseCardBody>
          <BaseCardFooter>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/portal/payments?applicationId=${viewModel.selectedApplicationId}`}>فتح المدفوعات</Link>
            </Button>
          </BaseCardFooter>
        </BaseCard>
      ) : null}

      {viewModel.latestAdminNote ? (
        <BaseCard variant="outlined">
          <BaseCardBody>
            <h2 className="text-h2 font-extrabold text-text-primary">ملاحظة من الإدارة</h2>
            <p className="mt-2 text-body leading-7 text-text-secondary">{viewModel.latestAdminNote}</p>
          </BaseCardBody>
        </BaseCard>
      ) : null}
    </div>
  );
}

function buildStudentSectionCards(viewModel: StudentDashboardViewModel) {
  const cardsById = new Map(viewModel.cards.map((card) => [card.id, card]));

  return sectionOrder.map((id) => {
    const card = cardsById.get(id);

    if (id === "payments" && !card) {
      return {
        id,
        title: "المدفوعات",
        description: "تفاصيل السداد يتابعها ولي الأمر لهذا الطلب، وستظهر لك التعليمات العامة فقط عند الحاجة.",
        badge: { label: "لولي الأمر", variant: "waiting" as const },
        meta: "لا تظهر بيانات مالية خاصة في حساب الطالب حالياً.",
      };
    }

    return mapSectionCard(card, id);
  });
}

function mapSectionCard(card: PortalSectionCard | undefined, fallbackId: string) {
  if (!card) {
    return {
      id: fallbackId,
      title: "قسم غير متاح حالياً",
      description: "لا توجد بيانات كافية لعرض هذا القسم الآن.",
      badge: { label: "غير متاح", variant: "waiting" as const },
    };
  }

  return {
    id: card.id,
    title: card.title,
    description: card.description,
    href: card.href,
    ctaLabel: card.ctaLabel ?? "فتح القسم",
    badge: {
      label: card.statusLabel ?? "متابعة",
      variant: sectionVariant(card.statusTone),
    },
    meta: card.stats.map((stat) => `${stat.label}: ${stat.value}`).join(" · "),
    emphasized: card.statusTone === "warning",
  };
}

function actionCtaLabel(action: PortalActionView) {
  if (action.section === "documents") return "فتح المستندات";
  if (action.section === "payments") return "فتح المدفوعات";
  if (action.section === "agreements") return "فتح الميثاق";
  if (action.section === "messages") return "فتح الرسائل";
  if (action.section === "student_info" || action.section === "parent_info") return "فتح البيانات";
  return "متابعة الإجراء";
}

function actionVariant(tone?: PortalActionView["tone"]): StatusBadgeProps["variant"] {
  if (tone === "critical") return "error";
  if (tone === "warning") return "warning";
  return "action";
}

function statusVariant(tone: StudentDashboardViewModel["statusBehavior"]["tone"]): StatusBadgeProps["variant"] {
  if (tone === "success") return "complete";
  if (tone === "warning") return "warning";
  if (tone === "danger") return "error";
  if (tone === "waiting") return "waiting";
  if (tone === "active") return "action";
  return "info";
}

function sectionVariant(tone?: PortalSectionCard["statusTone"]): StatusBadgeProps["variant"] {
  if (tone === "success") return "complete";
  if (tone === "warning") return "warning";
  return "info";
}

function FinanceSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg-surface-alt px-4 py-3">
      <div className="text-caption font-bold text-text-muted">{label}</div>
      <div dir="ltr" className="mt-1 text-h3 font-extrabold text-text-primary">{value}</div>
    </div>
  );
}
