import Link from "next/link";
import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { CompletionRing } from "@/components/portal/completion-ring";
import { DashboardStatusBadge } from "@/components/portal/dashboard-status";
import { RequiredActionsList } from "@/components/portal/required-actions-list";
import type { PortalStageItem, StudentDashboardViewModel } from "@/types/portal";

export function StudentDashboardTemplate({ viewModel }: { viewModel: StudentDashboardViewModel }) {
  const actionsHref = `/portal/actions?applicationId=${viewModel.selectedApplicationId}`;
  const canShowActions = !viewModel.statusBehavior.suppressActionFraming;

  return (
    <div className="space-y-5">
      <section className="rounded-panel bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <DashboardStatusBadge status={viewModel.status} />
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusToneClass(viewModel.statusBehavior.tone)}`}>
                {viewModel.statusBehavior.label}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-pine">رحلة الطالب</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">{viewModel.statusBehavior.studentHeroTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/65">
                {viewModel.statusBehavior.studentHeroDescription}
              </p>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-3">
              <div className="text-xs font-semibold text-ink/55">المرحلة الحالية</div>
              <div className="mt-1 text-lg font-bold text-ink">{viewModel.stageLabel}</div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {canShowActions && viewModel.heroPrimaryAction.href ? (
                <Link
                  href={viewModel.heroPrimaryAction.href}
                  className="inline-flex items-center justify-center rounded-2xl bg-pine px-5 py-3 text-sm font-bold text-white transition hover:bg-pine/90"
                >
                  {viewModel.heroPrimaryAction.label}
                </Link>
              ) : null}
              {canShowActions && viewModel.actions.length > 0 ? (
                <Link
                  href={actionsHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-mist px-5 py-3 text-sm font-bold text-pine transition hover:bg-sand"
                >
                  عرض كل الإجراءات
                </Link>
              ) : null}
            </div>
          </div>
          <CompletionRing percent={viewModel.completionPercent} />
        </div>
      </section>

      <ApplicationSwitcher
        options={viewModel.applicationOptions}
        selectedApplicationId={viewModel.selectedApplicationId}
        basePath="/portal/dashboard"
      />

      <StageTimeline
        stages={viewModel.stage.stages}
        progressPercent={viewModel.stage.progressPercent}
        timelineActive={viewModel.stage.timelineActive}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-panel bg-white p-5 shadow-soft">
          <div className="text-sm font-semibold text-pine">ملخص المرحلة</div>
          <h3 className="mt-1 text-lg font-bold text-ink">{viewModel.stage.currentStageLabel}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            {viewModel.progressIndicators.profileDocumentsAgreements.detailLabel}
          </p>
          <div className="mt-4 rounded-2xl bg-sand px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink/65">نسبة الاكتمال</span>
              <span className="text-xl font-bold text-ink">
                {viewModel.progressIndicators.profileDocumentsAgreements.statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-panel bg-white p-5 shadow-soft">
          {canShowActions ? (
            <>
              <div className="text-sm font-semibold text-pine">الأهم الآن</div>
              <h3 className="mt-1 text-lg font-bold text-ink">إجراءات تساعد طلبك على التقدم</h3>
              <div className="mt-4">
                <RequiredActionsList actions={viewModel.topActions} />
              </div>
              {viewModel.remainingActionsCount > 0 ? (
                <Link href={actionsHref} className="mt-3 inline-flex text-sm font-bold text-pine">
                  وهناك {viewModel.remainingActionsCount} إجراءات أخرى
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-pine">حالة نهائية</div>
              <h3 className="mt-1 text-lg font-bold text-ink">{viewModel.statusBehavior.label}</h3>
              <p className="mt-2 text-sm leading-7 text-ink/65">{viewModel.statusBehavior.studentHeroDescription}</p>
            </>
          )}
        </div>
      </section>

      {viewModel.financeSnapshot ? (
        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-pine">لمحة مالية</div>
              <h3 className="mt-1 text-lg font-bold text-ink">
                {viewModel.financeSnapshot.remainingAmountSar > 0 ? "يوجد مبلغ متبقٍ" : "لا يوجد مبلغ متبقٍ حالياً"}
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
      ) : null}

      <section className="rounded-panel bg-white p-5 shadow-soft">
        <div className="text-sm font-semibold text-pine">صحة الأقسام</div>
        <h3 className="mt-1 text-lg font-bold text-ink">أين تقف كل منطقة في الطلب؟</h3>
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

      {viewModel.latestAdminNote ? (
        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="text-sm font-semibold text-pine">ملاحظة من الإدارة</div>
          <p className="mt-2 text-sm leading-7 text-ink/70">{viewModel.latestAdminNote}</p>
        </section>
      ) : null}
    </div>
  );
}

function StageTimeline({
  stages,
  progressPercent,
  timelineActive,
}: {
  stages: PortalStageItem[];
  progressPercent: number;
  timelineActive: boolean;
}) {
  return (
    <section className="rounded-panel bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-pine">مسار الطلب</div>
          <h3 className="mt-1 text-lg font-bold text-ink">المراحل الموحدة</h3>
        </div>
        <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-ink/65">
          {timelineActive ? `${progressPercent}%` : "غير نشط"}
        </span>
      </div>
      <div className="mt-4 overflow-x-auto pb-1">
        <div className="flex min-w-max items-start gap-2 sm:min-w-0 sm:grid sm:grid-cols-6">
          {stages.map((stage) => (
            <StageStep key={stage.id} stage={stage} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StageStep({ stage }: { stage: PortalStageItem }) {
  const isCompleted = stage.status === "completed";
  const isCurrent = stage.status === "current";

  return (
    <div
      className={`min-w-28 rounded-2xl border px-3 py-3 text-center sm:min-w-0 ${
        isCurrent
          ? "border-pine bg-pine text-white"
          : isCompleted
            ? "border-[#d7ebdf] bg-[#e9f7ee] text-[#1b7a43]"
            : "border-black/5 bg-sand text-ink/55"
      }`}
    >
      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-xs font-black text-ink">
        {isCompleted ? "✓" : stage.index + 1}
      </div>
      <div className="mt-2 text-xs font-bold leading-5">{stage.label}</div>
    </div>
  );
}

function statusToneClass(tone: StudentDashboardViewModel["statusBehavior"]["tone"]) {
  if (tone === "success") return "bg-[#e9f7ee] text-[#1b7a43]";
  if (tone === "warning") return "bg-[#fff8e1] text-[#7a5a03]";
  if (tone === "danger") return "bg-[#ffe8e8] text-[#a03232]";
  if (tone === "waiting") return "bg-mist text-pine";
  if (tone === "active") return "bg-clay/35 text-ink";
  return "bg-sand text-ink/65";
}

function FinanceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand px-4 py-3">
      <div className="text-xs font-semibold text-ink/55">{label}</div>
      <div className="mt-1 text-lg font-bold text-ink">{value}</div>
    </div>
  );
}
