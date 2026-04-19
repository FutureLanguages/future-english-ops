"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AutoDismissToast } from "@/components/shared/auto-dismiss-toast";

type ReceiptOption = {
  id: string;
  status: string;
  fileAssetId: string;
  fileMimeType: string;
  uploadedByLabel: string | null;
  adminNote: string | null;
  createdAt: Date;
};

type FeeItem = {
  id: string;
  title: string;
  amountSar: number;
  note: string | null;
};

type PaymentItem = {
  id: string;
  amountSar: number;
  note: string | null;
  paymentDate: Date;
  linkedReceiptFileAssetId: string | null;
  linkedReceiptId: string | null;
};

function formatMoney(amount: number) {
  return `${amount} ر.س`;
}

export function AdminPaymentControls({
  applicationId,
  fees,
  payments,
  receipts,
}: {
  applicationId: string;
  fees: FeeItem[];
  payments: PaymentItem[];
  receipts: ReceiptOption[];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  function showError(error?: string) {
    setToast({
      tone: "error",
      message:
        error === "invalid_payment"
          ? "يرجى إدخال مبلغ الدفعة وتاريخها بشكل صحيح."
          : error === "invalid_fee"
            ? "يرجى إدخال قيمة صحيحة لهذا البند المالي."
            : "تعذر حفظ العملية المالية حالياً.",
    });
  }

  function submitCreate(url: string, form: HTMLFormElement, successMessage: string) {
    startTransition(async () => {
      const response = await fetch(url, {
        method: "POST",
        body: new FormData(form),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        showError(payload?.error);
        return;
      }

      form.reset();
      setToast({ tone: "success", message: successMessage });
      router.refresh();
    });
  }

  function submitUpdate(
    url: string,
    form: HTMLFormElement,
    successMessage: string,
    onFinish: () => void,
  ) {
    startTransition(async () => {
      const response = await fetch(url, {
        method: "PATCH",
        body: new FormData(form),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        showError(payload?.error);
        return;
      }

      onFinish();
      setToast({ tone: "success", message: successMessage });
      router.refresh();
    });
  }

  function submitDelete(url: string, successMessage: string, onFinish?: () => void) {
    startTransition(async () => {
      const response = await fetch(url, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        showError(payload?.error);
        return;
      }

      onFinish?.();
      setToast({ tone: "success", message: successMessage });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <AutoDismissToast message={toast?.message ?? ""} tone={toast?.tone ?? "success"} />

      <div className="rounded-2xl bg-sand px-4 py-4">
        <h3 className="text-sm font-semibold text-ink">الرسوم والخصومات</h3>
        <form
          className="mt-3 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitCreate(`/api/admin/applications/${applicationId}/fees`, event.currentTarget, "تمت إضافة الرسوم بنجاح.");
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">نوع الرسم</span>
            <select
              name="presetTitle"
              defaultValue="رسوم الدراسة"
              className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            >
              <option value="رسوم البرنامج الصيفي">رسوم البرنامج الصيفي</option>
              <option value="رسوم الدراسة">رسوم الدراسة</option>
              <option value="رسوم السكن">رسوم السكن</option>
              <option value="تذكرة السفر">تذكرة السفر</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">عنوان مخصص</span>
            <input
              type="text"
              name="customTitle"
              placeholder="أو أدخل عنوان رسم مخصص"
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">المبلغ</span>
            <input
              type="number"
              step="0.01"
              name="amount"
              placeholder="أدخل مبلغ الرسم"
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">ملاحظة</span>
            <textarea
              name="note"
              rows={2}
              placeholder="ملاحظة اختيارية"
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ..." : "إضافة رسوم"}
          </button>
        </form>

        <form
          className="mt-4 grid gap-3 rounded-2xl bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitCreate(
              `/api/admin/applications/${applicationId}/discounts`,
              event.currentTarget,
              "تم تحديث الخصم بنجاح.",
            );
          }}
        >
          <div className="text-sm font-semibold text-ink">إضافة خصم</div>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">نوع الخصم</span>
            <select
              name="discountType"
              defaultValue="fixed"
              className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
            >
              <option value="fixed">مبلغ ثابت</option>
              <option value="percentage">نسبة مئوية</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">قيمة الخصم</span>
            <input
              type="number"
              step="0.01"
              name="amount"
              placeholder="أدخل قيمة الخصم"
              className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
            />
          </label>
          <fieldset className="rounded-2xl border border-black/10 bg-sand px-4 py-3">
            <legend className="px-1 text-sm font-semibold text-ink">يطبّق الخصم على</legend>
            <div className="mt-2 grid gap-2 text-sm text-ink">
              {["رسوم البرنامج الصيفي", "رسوم الدراسة", "رسوم السكن", "تذكرة السفر"].map((target) => (
                <label key={target} className="flex items-center gap-2">
                  <input type="checkbox" name="discountTargets" value={target} />
                  {target}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">سبب الخصم</span>
            <textarea
              name="note"
              rows={2}
              placeholder="سبب اختياري للخصم"
              className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ..." : "إضافة خصم"}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {fees.map((fee) => {
            const isDiscount = fee.amountSar < 0;
            const amountValue = Math.abs(fee.amountSar);
            const isEditing = editingFeeId === fee.id;

            return (
              <div key={fee.id} className="rounded-2xl bg-white px-3 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{fee.title}</div>
                    <div className="mt-1 text-xs text-ink/55">
                      {isDiscount ? "خصم" : "رسم"}
                    </div>
                  </div>
                  <div className="font-bold text-ink">
                    {isDiscount ? "-" : ""}
                    {formatMoney(amountValue)}
                  </div>
                </div>
                {fee.note ? <div className="mt-1 text-ink/55">{fee.note}</div> : null}

                {isEditing ? (
                  <form
                    className="mt-3 grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitUpdate(
                        `/api/admin/applications/${applicationId}/fees/${fee.id}`,
                        event.currentTarget,
                        "تم تحديث البند المالي بنجاح.",
                        () => setEditingFeeId(null),
                      );
                    }}
                  >
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-ink">العنوان</span>
                      <input
                        name="title"
                        defaultValue={fee.title}
                        className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-ink">المبلغ</span>
                      <input
                        type="number"
                        step="0.01"
                        name="amount"
                        defaultValue={amountValue}
                        className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-ink">ملاحظة</span>
                      <textarea
                        name="note"
                        rows={2}
                        defaultValue={fee.note ?? ""}
                        className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-2xl bg-pine px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {isPending ? "جارٍ الحفظ..." : "حفظ"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingFeeId(null)}
                        className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingFeeId(fee.id)}
                      className="rounded-full border border-black/10 bg-sand px-3 py-1 text-xs font-semibold text-ink"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        submitDelete(
                          `/api/admin/applications/${applicationId}/fees/${fee.id}`,
                          "تم حذف البند المالي بنجاح.",
                          () => setEditingFeeId(null),
                        )
                      }
                      className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#a03232]"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-sand px-4 py-4">
        <h3 className="text-sm font-semibold text-ink">الدفعات الرسمية</h3>
        <form
          className="mt-3 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitCreate(
              `/api/admin/applications/${applicationId}/payments`,
              event.currentTarget,
              "تمت إضافة الدفعة بنجاح.",
            );
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">المبلغ</span>
            <input
              type="number"
              step="0.01"
              name="amount"
              placeholder="أدخل مبلغ الدفعة"
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">تاريخ الدفعة</span>
            <input
              type="date"
              name="paymentDate"
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">ربط بإيصال مرفوع</span>
            <select
              name="linkedReceiptId"
              defaultValue=""
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            >
              <option value="">بدون ربط بإيصال</option>
              {receipts.map((receipt) => (
                <option key={receipt.id} value={receipt.id}>
                  {new Intl.DateTimeFormat("ar-SA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(receipt.createdAt))}{" "}
                  - {receipt.status}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">ملاحظة</span>
            <textarea
              name="note"
              rows={2}
              placeholder="ملاحظة اختيارية"
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ..." : "إضافة دفعة"}
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {payments.map((payment) => {
            const isEditing = editingPaymentId === payment.id;

            return (
              <div key={payment.id} className="rounded-2xl bg-white px-3 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-ink">
                    {new Intl.DateTimeFormat("ar-SA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(new Date(payment.paymentDate))}
                  </div>
                  <div className="font-bold text-ink">{formatMoney(payment.amountSar)}</div>
                </div>
                {payment.note ? <div className="mt-1 text-ink/55">{payment.note}</div> : null}
                {payment.linkedReceiptFileAssetId ? (
                  <div className="mt-2">
                    <Link
                      href={`/api/files/${payment.linkedReceiptFileAssetId}/view`}
                      target="_blank"
                      className="text-xs font-semibold text-pine"
                    >
                      عرض الإيصال المرتبط
                    </Link>
                  </div>
                ) : null}

                {isEditing ? (
                  <form
                    className="mt-3 grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitUpdate(
                        `/api/admin/applications/${applicationId}/payments/${payment.id}`,
                        event.currentTarget,
                        "تم تحديث الدفعة الرسمية بنجاح.",
                        () => setEditingPaymentId(null),
                      );
                    }}
                  >
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-ink">المبلغ</span>
                      <input
                        type="number"
                        step="0.01"
                        name="amount"
                        defaultValue={payment.amountSar}
                        className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-ink">تاريخ الدفعة</span>
                      <input
                        type="date"
                        name="paymentDate"
                        defaultValue={new Date(payment.paymentDate).toISOString().slice(0, 10)}
                        className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-ink">ربط بإيصال مرفوع</span>
                      <select
                        name="linkedReceiptId"
                        defaultValue={payment.linkedReceiptId ?? ""}
                        className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                      >
                        <option value="">بدون ربط بإيصال</option>
                        {receipts.map((receipt) => (
                          <option key={receipt.id} value={receipt.id}>
                            {new Intl.DateTimeFormat("ar-SA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }).format(new Date(receipt.createdAt))}{" "}
                            - {receipt.status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-ink">ملاحظة</span>
                      <textarea
                        name="note"
                        rows={2}
                        defaultValue={payment.note ?? ""}
                        className="w-full rounded-2xl border border-black/10 bg-sand px-3 py-3 text-sm outline-none"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-2xl bg-pine px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {isPending ? "جارٍ الحفظ..." : "حفظ"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPaymentId(null)}
                        className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPaymentId(payment.id)}
                      className="rounded-full border border-black/10 bg-sand px-3 py-1 text-xs font-semibold text-ink"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        submitDelete(
                          `/api/admin/applications/${applicationId}/payments/${payment.id}`,
                          "تم حذف الدفعة الرسمية بنجاح.",
                          () => setEditingPaymentId(null),
                        )
                      }
                      className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#a03232]"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
