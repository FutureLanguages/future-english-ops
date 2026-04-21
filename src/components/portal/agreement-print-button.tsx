"use client";

export function AgreementPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-sand print:hidden"
    >
      طباعة الميثاق
    </button>
  );
}
