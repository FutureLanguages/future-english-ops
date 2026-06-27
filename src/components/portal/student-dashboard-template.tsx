import Link from "next/link";
import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { ActionCard } from "@/components/ui/action-card";
import { BaseCard, BaseCardBody } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";
import { JourneyStrip } from "@/components/ui/journey-strip";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import type { PortalActionView, PortalSectionCard, PortalStudyPlanView, StudentDashboardViewModel } from "@/types/portal";

const sectionOrder = ["profile", "documents", "agreements", "payments"] as const;
const studyPlaceholder = "سيتم عرض تفاصيل البرنامج عند اعتمادها من الإدارة";

export function StudentDashboardTemplate({ viewModel }: { viewModel: StudentDashboardViewModel }) {
  const actionsHref = `/portal/actions?applicationId=${viewModel.selectedApplicationId}`;
  const primaryAction = viewModel.actions[0];
  const sectionCards = buildStudentSectionCards(viewModel);
  const profileHref = `/portal/profile?applicationId=${viewModel.selectedApplicationId}`;
  const shouldShowAlert = viewModel.actions.length > 0;
  const studyRows = buildStudyRows(viewModel.studyPlan, viewModel.program.surfaces.showFlightInfo);
  const countdownItems = buildCountdownItems(viewModel.studyPlan, viewModel.program.surfaces.showCountdown);

  return (
    <div className="space-y-6">
      <BaseCard variant="elevated" className="overflow-hidden">
        <BaseCardBody className="space-y-5">
          <div className="flex flex-col gap-5 tablet:flex-row tablet:items-start tablet:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-badge bg-success-100 text-h2 font-black text-pine"
                aria-hidden="true"
              >
                {getStudentInitials(viewModel.studentName)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={viewModel.statusBehavior.label} variant={statusVariant(viewModel.statusBehavior.tone)} />
                  <StatusBadge label={viewModel.stageLabel} variant="info" />
                </div>
                <h1 className="mt-3 text-h1 font-extrabold leading-9 text-text-primary">
                  أهلاً {viewModel.studentName}
                </h1>
                <p className="mt-2 text-body leading-7 text-text-secondary">
                  {viewModel.statusBehavior.studentHeroDescription}
                </p>
              </div>
            </div>
            <div className="w-full rounded-card bg-bg-surface-alt p-4 tablet:w-64">
              <div className="text-caption font-bold text-text-muted">اكتمال الملف</div>
              <div dir="ltr" className="mt-1 text-h1 font-black text-text-primary">{viewModel.completionPercent}%</div>
              <HelperText>{viewModel.overallCompletion.label}</HelperText>
              <Button asChild variant="ghost" size="sm" className="mt-3">
                <Link href={profileHref}>فتح الملف الشخصي</Link>
              </Button>
            </div>
          </div>

          <ApplicationSwitcher
            options={viewModel.applicationOptions}
            selectedApplicationId={viewModel.selectedApplicationId}
            basePath="/portal/dashboard"
          />
        </BaseCardBody>
      </BaseCard>

      <BaseCard variant="elevated" className="border-transparent bg-[#042C53] text-white">
        <BaseCardBody className="space-y-5">
          <div>
            <div className="text-caption font-bold text-white/70">ملخص الدراسة</div>
            <h2 className="mt-2 text-h2 font-extrabold text-white">تفاصيل البرنامج الحالية</h2>
            {studyRows.length === 0 ? (
              <p className="mt-2 text-body leading-7 text-white/75">
                {studyPlaceholder}
              </p>
            ) : null}
          </div>
          {studyRows.length > 0 ? (
            <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
              {studyRows.map((row) => (
                <StudyFact key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          ) : null}
        </BaseCardBody>
      </BaseCard>

      {countdownItems.length > 0 ? (
        <section className="grid gap-3 tablet:grid-cols-3">
          {countdownItems.map((item) => (
            <BaseCard key={item.label} variant="outlined">
              <BaseCardBody className="space-y-2">
                <div className="text-caption font-bold text-text-muted">{item.label}</div>
                <div dir="ltr" className="text-h1 font-black text-text-primary">{item.daysLabel}</div>
                <HelperText>{item.dateLabel}</HelperText>
              </BaseCardBody>
            </BaseCard>
          ))}
        </section>
      ) : null}

      {shouldShowAlert ? (
        <BaseCard variant="outlined" className="border-primary-200 bg-primary-200/20">
          <BaseCardBody className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
            <div>
              <StatusBadge label="تنبيه يحتاج متابعة" variant={actionVariant(primaryAction?.tone)} />
              <h2 className="mt-3 text-h2 font-extrabold text-text-primary">
                {primaryAction?.label ?? viewModel.statusBehavior.studentHeroTitle}
              </h2>
              <p className="mt-2 text-body leading-7 text-text-secondary">
                {primaryAction?.description ?? viewModel.statusBehavior.studentHeroDescription}
              </p>
            </div>
            {primaryAction?.href ? (
              <Button asChild variant="primary" size="sm">
                <Link href={primaryAction.href}>{actionCtaLabel(primaryAction)}</Link>
              </Button>
            ) : null}
          </BaseCardBody>
        </BaseCard>
      ) : null}

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

      {viewModel.actions.length > 1 ? (
        <div className="flex justify-start">
          <Button asChild variant="ghost" size="sm">
            <Link href={actionsHref}>عرض كل الإجراءات</Link>
          </Button>
        </div>
      ) : null}

      <JourneyStrip
        title="مسار الطلب"
        helperText="المراحل مأخوذة من مسار الطلب الحالي، وتوضح أين يقف الملف الآن."
        stages={viewModel.stage.stages}
        progressPercent={viewModel.stage.progressPercent}
        timelineActive={viewModel.stage.timelineActive}
      />
    </div>
  );
}

function getStudentInitials(studentName: string) {
  const initials = studentName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials || "ط";
}

function StudyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 px-4 py-3">
      <div className="text-caption font-bold text-white/65">{label}</div>
      <div className="mt-1 text-h3 font-extrabold text-white">{value}</div>
    </div>
  );
}

function hasValue(value: string | Date | null) {
  if (value instanceof Date) {
    return true;
  }

  return Boolean(value?.trim());
}

function formatArabicDate(value: Date) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

function addStudyRow(rows: Array<{ label: string; value: string }>, label: string, value: string | Date | null) {
  if (!hasValue(value)) {
    return;
  }

  if (value === null) {
    return;
  }

  rows.push({
    label,
    value: value instanceof Date ? formatArabicDate(value) : value.trim(),
  });
}

function buildStudyRows(studyPlan: PortalStudyPlanView | null, showFlightInfo: boolean) {
  const rows: Array<{ label: string; value: string }> = [];

  if (!studyPlan) {
    return rows;
  }

  addStudyRow(rows, "اسم البرنامج", studyPlan.programName);
  addStudyRow(rows, "المعهد", studyPlan.instituteName);
  addStudyRow(rows, "فرع المعهد", studyPlan.instituteBranch);
  addStudyRow(rows, "الدولة", studyPlan.country);
  addStudyRow(rows, "المدينة", studyPlan.city);
  addStudyRow(rows, "تاريخ بداية البرنامج", studyPlan.programStartDate);
  addStudyRow(rows, "تاريخ نهاية البرنامج", studyPlan.programEndDate);
  addStudyRow(rows, "نوع السكن", studyPlan.housingType);
  addStudyRow(rows, "نوع الغرفة", studyPlan.roomType);
  addStudyRow(rows, "ملاحظات السكن", studyPlan.housingNotes);

  if (showFlightInfo) {
    addStudyRow(rows, "تاريخ المغادرة", studyPlan.departureDate);
    addStudyRow(rows, "تاريخ الوصول", studyPlan.arrivalDate);
    addStudyRow(rows, "شركة الطيران", studyPlan.airlineName);
    addStudyRow(rows, "رقم الرحلة", studyPlan.flightNumber);
  }

  return rows;
}

function daysUntil(value: Date) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const targetStart = new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  return Math.ceil((targetStart - todayStart) / 86_400_000);
}

function formatDaysLabel(value: Date) {
  const days = daysUntil(value);
  const absDays = Math.abs(days);

  if (days === 0) {
    return "اليوم";
  }

  return days > 0 ? `${absDays} يوم` : `منذ ${absDays} يوم`;
}

function buildCountdownItems(studyPlan: PortalStudyPlanView | null, showCountdown: boolean) {
  if (!showCountdown || !studyPlan) {
    return [];
  }

  return [
    { label: "المغادرة", date: studyPlan.departureDate },
    { label: "بداية الدراسة", date: studyPlan.programStartDate },
    { label: "نهاية الدراسة", date: studyPlan.programEndDate },
  ]
    .filter((item): item is { label: string; date: Date } => item.date instanceof Date)
    .map((item) => ({
      label: item.label,
      daysLabel: formatDaysLabel(item.date),
      dateLabel: formatArabicDate(item.date),
    }));
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
