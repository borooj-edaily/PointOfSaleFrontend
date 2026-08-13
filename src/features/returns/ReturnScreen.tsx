import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  LogOut,
  RotateCcw,
  Search,
} from "lucide-react";
import { invoiceService } from "../../services/invoiceService";
import { getCurrentUser, logout } from "../../api/authApi";
import { ApiError } from "../../api/httpClient";
import type { GetInvoiceByNumberResponse } from "../../types/invoice";

export function ReturnScreen() {
  const currentUser = getCurrentUser();

  const [invoiceNumberText, setInvoiceNumberText] = useState("");
  const [invoice, setInvoice] =
    useState<GetInvoiceByNumberResponse | null>(null);

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedItem = invoice?.items.find(
    (item) => item.invoiceItemId === selectedItemId
  );

  async function loadInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const invoiceNumber = Number(invoiceNumberText);

    if (!invoiceNumber || invoiceNumber < 1) {
      setError("أدخل رقم فاتورة صحيح.");
      return;
    }

    setLoadingInvoice(true);
    setError("");
    setSuccess("");
    setInvoice(null);
    setSelectedItemId(null);

    try {
      const data = await invoiceService.getByNumber(invoiceNumber);
      setInvoice(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "تعذر العثور على الفاتورة."
      );
    } finally {
      setLoadingInvoice(false);
    }
  }

  async function submitReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedItem) {
      setError("اختر الصنف الذي تريد إرجاعه.");
      return;
    }

    const returnedQuantity = Number(quantity);

    if (
      !returnedQuantity ||
      returnedQuantity < 1 ||
      returnedQuantity > selectedItem.returnableQuantity
    ) {
      setError(
        `الكمية يجب أن تكون بين 1 و ${selectedItem.returnableQuantity}.`
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await invoiceService.returnItem({
        invoiceItemId: selectedItem.invoiceItemId,
        returnedQuantity,
        processedBy: currentUser?.id ?? 0,
        reason: reason.trim() || null,
      });

      setSuccess(
        `تم الإرجاع بنجاح. قيمة المبلغ المسترد: ${response.refundAmount.toFixed(2)} شيكل`
      );

      const updatedInvoice = await invoiceService.getByNumber(
        invoice!.invoiceNumber
      );

      setInvoice(updatedInvoice);
      setSelectedItemId(null);
      setQuantity("1");
      setReason("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "حدث خطأ أثناء تنفيذ الإرجاع."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="pos-page">
      <header className="flex items-center justify-between bg-[#1C2333] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link
            to="/cashier"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10"
            aria-label="رجوع للكاشير"
          >
            <ArrowRight size={16} />
          </Link>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              نقطة البيع
            </p>
            <h1 className="text-lg font-semibold">إرجاع فاتورة</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
          تسجيل خروج
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            البحث عن فاتورة
          </h2>

          <form
            onSubmit={loadInvoice}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="number"
              min="1"
              value={invoiceNumberText}
              onChange={(event) =>
                setInvoiceNumberText(event.target.value)
              }
              placeholder="رقم الفاتورة"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
            />

            <button
              type="submit"
              disabled={loadingInvoice}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Search size={17} />
              {loadingInvoice ? "جارٍ البحث..." : "بحث"}
            </button>
          </form>
        </section>

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={18} />
            {success}
          </p>
        )}

        {invoice && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    فاتورة رقم #{invoice.invoiceNumber}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    الإجمالي الحالي: {invoice.total.toFixed(2)} شيكل
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {invoice.items.map((item) => {
                  const canReturn = item.returnableQuantity > 0;
                  const selected =
                    item.invoiceItemId === selectedItemId;

                  return (
                    <button
                      key={item.invoiceItemId}
                      type="button"
                      disabled={!canReturn}
                      onClick={() => {
                        setSelectedItemId(item.invoiceItemId);
                        setQuantity("1");
                      }}
                      className={`w-full rounded-xl border p-4 text-right transition ${
                        selected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-emerald-300"
                      } ${
                        !canReturn
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            صنف رقم #{item.productId}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            الكمية بالفاتورة: {item.quantity} · تم إرجاع:{" "}
                            {item.alreadyReturnedQuantity}
                          </p>
                        </div>

                        <div className="text-left">
                          <p className="font-mono text-sm text-slate-700">
                            {item.lineTotal.toFixed(2)} شيكل
                          </p>
                          <p className="mt-1 text-xs text-emerald-600">
                            المتاح للإرجاع: {item.returnableQuantity}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <RotateCcw size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    تنفيذ الإرجاع
                  </h2>
                  <p className="text-xs text-slate-500">
                    اختر صنفاً من القائمة أولاً.
                  </p>
                </div>
              </div>

              <form onSubmit={submitReturn} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    الصنف المختار
                  </label>

                  <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                    {selectedItem
                      ? `صنف رقم #${selectedItem.productId}`
                      : "لم يتم اختيار صنف"}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    الكمية
                  </label>

                  <input
                    type="number"
                    min="1"
                    max={selectedItem?.returnableQuantity}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    disabled={!selectedItem}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    سبب الإرجاع (اختياري)
                  </label>

                  <textarea
                    rows={3}
                    maxLength={250}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="مثال: منتج تالف أو تم إدخال المنتج بالخطأ"
                    disabled={!selectedItem}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedItem || submitting}
                  className="w-full rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "جارٍ تنفيذ الإرجاع..." : "تأكيد الإرجاع"}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
