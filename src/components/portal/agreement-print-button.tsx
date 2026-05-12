"use client";

import { Button } from "@/components/ui/button";

export function AgreementPrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      variant="secondary"
      size="sm"
      className="print:hidden"
    >
      طباعة الميثاق
    </Button>
  );
}
