import type { PortalProgramConfigView } from "@/types/portal";

export function EnrollmentSurfaceCard({
  program,
  stageLabel,
  statusLabel,
  studentName,
}: {
  program: PortalProgramConfigView;
  stageLabel: string;
  statusLabel: string;
  studentName: string;
}) {
  const enrollmentSurface = program.items.find((item) => item.key === "showEnrollmentCard" && item.renderable);

  if (!enrollmentSurface) {
    return null;
  }

  return (
    <section className="rounded-panel bg-white p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-pine">{enrollmentSurface.label}</div>
          <h3 className="mt-1 text-lg font-bold text-ink">{studentName}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            ملخص تسجيل مبني على بيانات الطلب الحالية، بدون أي بيانات برنامج غير مدعومة.
          </p>
        </div>
        <div className="grid gap-2 text-sm sm:min-w-72">
          <SurfaceFact label="نمط البوابة" value={program.modeLabel} />
          <SurfaceFact label="المرحلة الحالية" value={stageLabel} />
          <SurfaceFact label="الحالة" value={statusLabel} />
        </div>
      </div>
    </section>
  );
}

function SurfaceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand px-4 py-3">
      <div className="text-xs font-semibold text-ink/50">{label}</div>
      <div className="mt-1 text-sm font-bold text-ink">{value}</div>
    </div>
  );
}
