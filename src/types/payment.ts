export type PaymentSummary = {
  totalCostSar: number;
  paidAmountSar: number;
  remainingAmountSar: number;
  isPaymentComplete: boolean;
  hasOutstandingPayment: boolean;
};

export type RequiredAction = {
  id: string;
  label: string;
  section: "student_info" | "parent_info" | "documents" | "payments";
  kind: "reupload_document" | "missing_document" | "missing_profile" | "payment";
  priority: number;
};
