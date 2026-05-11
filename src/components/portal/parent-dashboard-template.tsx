import Link from "next/link";
import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { FinancialSummaryCard } from "@/components/ui/financial-summary-card";
import { HelperText } from "@/components/ui/helper-text";
import { JourneyStrip } from "@/components/ui/journey-strip";
import { ReassuranceCard } from "@/components/ui/reassurance-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import type { ParentDashboardViewModel, PortalSectionCard } from "@/types/portal";

const sectionOrder = ["documents", "agreements", "payments", "profile"] as const;

export function ParentDashboardTemplate({ viewModel }: { viewModel: ParentDashboardViewModel }) {
  const sectionCards = buildParentSectionCards(viewModel);

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
              طلب {viewModel.studentName}
            </h1>
            <p className="mt-3 text-body leading-7 text-text-secondary">
              لوحة متابعة مختصرة تساعدك على معرفة ما إذا كان الطلب يسير بشكل طبيعي أو يحتاج تدخلاً منك.
            </p>
          </div>
          <BaseCard variant="outlined" className="w-full tablet:w-72">
            <BaseCardBody className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-caption font-bold text-text-muted">تقدم الطلب</span>
                <span dir="ltr" className="text-h2 font-black text-text-primary">{viewModel.progressPercent}%</span>
              </div>
              <HelperText>{viewModel.stageLabel}</HelperText>
              <Button asChild variant="ghost" size="sm" fullWidth>
                <Link href="#parent-journey">رحلة ابني</Link>
              </Button>
            </BaseCardBody>
          </BaseCard>
        </div>

        <ApplicationSwitcher
          options={viewModel.applicationOptions}
          selectedApplicationId={viewModel.selectedApplicationId}
          basePath="/portal/dashboard"
        />
      </section>

      <ReassuranceCard
        tone={viewModel.reassurance.tone}
        title={viewModel.reassurance.title}
        description={viewModel.reassurance.description}
        primaryAction={viewModel.reassurance.primaryAction}
        badge={{ label: viewModel.reassurance.badgeLabel }}
      />

      {viewModel.financeSnapshot ? (
        <FinancialSummaryCard
          originalTotalCostSar={viewModel.financeSnapshot.originalTotalCostSar}
          discount={viewModel.financeSnapshot.discount}
          totalCostSar={viewModel.financeSnapshot.totalCostSar}
          paidAmountSar={viewModel.financeSnapshot.paidAmountSar}
          remainingAmountSar={viewModel.financeSnapshot.remainingAmountSar}
          paymentsHref={viewModel.financeSnapshot.paymentsHref}
        />
      ) : null}

      {viewModel.latestAdminNote ? (
        <BaseCard variant="outlined">
          <BaseCardBody>
            <h2 className="text-h2 font-extrabold text-text-primary">آخر تحديث من الإدارة</h2>
            <p className="mt-2 text-body leading-7 text-text-secondary">{viewModel.latestAdminNote}</p>
          </BaseCardBody>
        </BaseCard>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-h2 font-extrabold text-text-primary">متابعة الأقسام</h2>
          <HelperText>مراجعة هادئة لأهم أقسام الطلب حسب ما يهم ولي الأمر.</HelperText>
        </div>
        <div className="grid gap-4 tablet:grid-cols-2">
          {sectionCards.map((card) => (
            <SectionCard key={card.id} {...card} />
          ))}
        </div>
      </section>

      <section id="parent-journey" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-h2 font-extrabold text-text-primary">رحلة ابني التفصيلية</h2>
          <HelperText>هذه الرحلة تعرض المراحل الحالية المتاحة من بيانات الطلب، وهي للمتابعة فقط وليست لوحة مهام.</HelperText>
        </div>
        <JourneyStrip
          title="مراحل الطلب"
          helperText="المؤشر هنا ثانوي لمساعدتك على فهم موقع الطلب الحالي."
          stages={viewModel.stage.stages}
          progressPercent={viewModel.stage.progressPercent}
          timelineActive={viewModel.stage.timelineActive}
        />
      </section>
    </div>
  );
}

function buildParentSectionCards(viewModel: ParentDashboardViewModel) {
  const cardsById = new Map(viewModel.cards.map((card) => [card.id, card]));

  return sectionOrder.flatMap((id) => {
    const card = cardsById.get(id);

    if (id === "payments" && !card) {
      return [];
    }

    return [mapParentSectionCard(card, id)];
  });
}

function mapParentSectionCard(card: PortalSectionCard | undefined, fallbackId: string) {
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
    title: parentSectionTitle(card),
    description: parentSectionDescription(card),
    href: card.href,
    ctaLabel: parentCtaLabel(card),
    badge: {
      label: card.statusLabel ?? "متابعة",
      variant: sectionVariant(card.statusTone),
    },
    meta: parentMetaLabel(card),
    emphasized: card.statusTone === "warning",
  };
}

function parentSectionTitle(card: PortalSectionCard) {
  if (card.id === "documents") return "مستندات الطالب";
  if (card.id === "agreements") return "الميثاق والموافقات";
  if (card.id === "payments") return "المدفوعات";
  if (card.id === "profile") return "بيانات الطالب والأسرة";
  return card.title;
}

function parentSectionDescription(card: PortalSectionCard) {
  if (card.id === "documents") return "راجع حالة المستندات وما إذا كان هناك ملف يحتاج إعادة رفع أو متابعة.";
  if (card.id === "agreements") return "راجع الموافقات المطلوبة وتأكد من عدم وجود توقيع مطلوب من ولي الأمر.";
  if (card.id === "payments") return "راجع حالة السداد بهدوء، وما إذا كان هناك مبلغ يحتاج متابعة.";
  if (card.id === "profile") return "راجع بيانات الطالب والأسرة عند الحاجة، بدون الدخول في تفاصيل غير ضرورية.";
  return card.description;
}

function parentCtaLabel(card: PortalSectionCard) {
  if (card.statusTone === "warning") return "مراجعة الآن";
  return "مراجعة";
}

function parentMetaLabel(card: PortalSectionCard) {
  if (card.id === "documents") return card.statusTone === "warning" ? "توجد مستندات تحتاج مراجعة." : "المستندات لا تحتاج تدخلاً حالياً.";
  if (card.id === "agreements") return card.statusTone === "warning" ? "توجد موافقة تحتاج متابعة." : "لا توجد موافقة مطلوبة حالياً.";
  if (card.id === "payments") return card.statusTone === "warning" ? "توجد متابعة مالية مطلوبة." : "لا توجد متابعة مالية مطلوبة حالياً.";
  if (card.id === "profile") return card.statusTone === "warning" ? "توجد بيانات تحتاج مراجعة." : "البيانات لا تحتاج تدخلاً حالياً.";
  return undefined;
}

function statusVariant(tone: ParentDashboardViewModel["statusBehavior"]["tone"]): StatusBadgeProps["variant"] {
  if (tone === "success") return "complete";
  if (tone === "warning") return "warning";
  if (tone === "danger") return "error";
  if (tone === "waiting") return "waiting";
  if (tone === "active") return "action";
  return "waiting";
}

function sectionVariant(tone?: PortalSectionCard["statusTone"]): StatusBadgeProps["variant"] {
  if (tone === "success") return "complete";
  if (tone === "warning") return "warning";
  return "waiting";
}
