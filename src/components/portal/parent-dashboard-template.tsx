import Link from "next/link";
import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { EnrollmentSurfaceCard } from "@/components/portal/enrollment-surface-card";
import { RequiredActionsList } from "@/components/portal/required-actions-list";
import type { ParentDashboardViewModel, ParentReassuranceState } from "@/types/portal";

const reassuranceCopy: Record<ParentReassuranceState, { title: string; description: string; tone: string }> = {
  ALL_GOOD: {
    title: "الأمور مستقرة حالياً",
    description: "لا يوجد تدخل مطلوب من ولي الأمر الآن. سنعرض أي إجراء جديد هنا بوضوح.",
    tone: "bg-[#e9f7ee] text-[#1b7a43]",
  },
  ACTION_REQUIRED: {
    title: "يوجد إجراء مطلوب منكم",
    description: "هناك خطوة مباشرة تساعد على تقدم الطلب. ابدأوا بالإجراء الظاهر أدناه.",
    tone: "bg-[#fff8e1] text-[#7a5a03]",
  },
  WAITING: {
    title: "الطلب قيد المتابعة",
    description: "لا يوجد إجراء مطلوب منكم حالياً، والطلب لدى الإدارة أو تحت المراجعة.",
    tone: "bg-mist text-pine",
  },
  NEEDS_ATTENTION: {
    title: "يوجد أمر يحتاج انتباهكم",
    description: "هناك مستند أو إيصال يحتاج تصحيحاً أو متابعة قبل اكتمال الطلب.",
    tone: "bg-[#fff1ea] text-[#8d3a14]",
  },
};

export function ParentDashboardTemplate({ viewModel }: { viewModel: ParentDashboardViewModel }) {
  const actionsHref = `/portal/actions?applicationId=${viewModel.selectedApplicationId}`;
  const reassurance = reassuranceCopy[viewModel.reassuranceState];
  const canShowActions = !viewModel.statusBehavior.suppressActionFraming;
  const secondaryActions = viewModel.requiredIntervention
    ? viewModel.topActions.filter((action) => action.id !== viewModel.requiredIntervention?.id)
    : viewModel.topActions;

  return (
    <div className="space-y-5">
      <section className="rounded-panel bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${reassurance.tone}`}>
              {viewModel.statusLabel}
            </span>
            <div>
              <p className="text-sm font-semibold text-pine">متابعة ولي الأمر</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">{viewModel.statusBehavior.parentHeroTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/65">
                {viewModel.statusBehavior.parentHeroDescription}
              </p>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-3 text-sm leading-6 text-ink/70">
              الطلب الخاص بـ <span className="font-bold text-ink">{viewModel.studentName}</span> في مرحلة{" "}
              <span className="font-bold text-ink">{viewModel.stageLabel}</span>.
              <span className="mt-1 block text-xs font-semibold text-ink/50">
                تقدم المرحلة: {viewModel.stage.progressPercent}%
              </span>
            </div>
          </div>
          {canShowActions && viewModel.heroPrimaryAction.href ? (
            <Link
              href={viewModel.heroPrimaryAction.href}
              className="inline-flex items-center justify-center rounded-2xl bg-pine px-5 py-3 text-sm font-bold text-white transition hover:bg-pine/90"
            >
              {viewModel.heroPrimaryAction.label}
            </Link>
          ) : null}
        </div>
      </section>

      <ApplicationSwitcher
        options={viewModel.applicationOptions}
        selectedApplicationId={viewModel.selectedApplicationId}
        basePath="/portal/dashboard"
      />

      <EnrollmentSurfaceCard
        program={viewModel.program}
        stageLabel={viewModel.stageLabel}
        statusLabel={viewModel.statusLabel}
        studentName={viewModel.studentName}
      />

      {canShowActions && viewModel.requiredIntervention ? (
        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-pine">التدخل المطلوب</div>
              <h3 className="mt-1 text-lg font-bold text-ink">{viewModel.requiredIntervention.label}</h3>
              {viewModel.requiredIntervention.description ? (
                <p className="mt-2 text-sm leading-6 text-ink/65">{viewModel.requiredIntervention.description}</p>
              ) : null}
            </div>
            <Link
              href={viewModel.requiredIntervention.href ?? actionsHref}
              className="inline-flex items-center justify-center rounded-2xl bg-pine px-4 py-3 text-sm font-bold text-white"
            >
              متابعة الآن
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-panel bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-pine">الملخص المالي</div>
            <h3 className="mt-1 text-lg font-bold text-ink">
              {viewModel.financeSnapshot.remainingAmountSar > 0
                ? `المتبقي ${viewModel.financeSnapshot.remainingAmountSar} ر.س`
                : "لا يوجد مبلغ متبقٍ حالياً"}
            </h3>
          </div>
          <Link
            href={`/portal/payments?applicationId=${viewModel.selectedApplicationId}`}
            className="inline-flex items-center justify-center rounded-2xl bg-mist px-4 py-3 text-sm font-bold text-pine"
          >
            فتح المدفوعات
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <FinanceItem label="إجمالي الرسوم" value={`${viewModel.financeSnapshot.totalCostSar} ر.س`} />
          <FinanceItem label="المدفوع" value={`${viewModel.financeSnapshot.paidAmountSar} ر.س`} />
          <FinanceItem label="المتبقي" value={`${viewModel.financeSnapshot.remainingAmountSar} ر.س`} />
        </div>
      </section>

      <section className="rounded-panel bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-pine">ملخص هادئ للحالة</div>
            <h3 className="mt-1 text-lg font-bold text-ink">الأقسام الأساسية</h3>
          </div>
          {canShowActions && viewModel.actions.length > 0 ? (
            <Link href={actionsHref} className="text-sm font-bold text-pine">
              كل الإجراءات
            </Link>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {viewModel.sectionSummaries.map((section) => (
            <Link key={section.id} href={section.href ?? actionsHref} className="rounded-2xl bg-sand px-4 py-3 transition hover:bg-mist">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-ink">{section.title}</span>
                <span className="text-xs font-semibold text-ink/60">{section.statusLabel}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {canShowActions && secondaryActions.length > 0 ? (
        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="text-sm font-semibold text-pine">إجراءات أخرى</div>
          <div className="mt-4">
            <RequiredActionsList actions={secondaryActions} />
          </div>
          {viewModel.remainingActionsCount > 0 ? (
            <Link href={actionsHref} className="mt-3 inline-flex text-sm font-bold text-pine">
              وهناك {viewModel.remainingActionsCount} إجراءات أخرى
            </Link>
          ) : null}
        </section>
      ) : null}

      {viewModel.latestAdminNote ? (
        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="text-sm font-semibold text-pine">ملاحظة من الإدارة</div>
          <p className="mt-2 text-sm leading-7 text-ink/70">{viewModel.latestAdminNote}</p>
        </section>
      ) : null}
    </div>
  );
}

function FinanceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand px-4 py-3">
      <div className="text-xs font-semibold text-ink/55">{label}</div>
      <div className="mt-1 text-lg font-bold text-ink">{value}</div>
    </div>
  );
}
