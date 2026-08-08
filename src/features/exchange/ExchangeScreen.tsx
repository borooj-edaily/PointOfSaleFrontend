import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, ArrowLeft, Search } from "lucide-react";
import { getAllProducts } from "../../api/productApi";
import { invoiceService } from "../../services/invoiceService";
import { ApiError } from "../../api/httpClient";
import { getCurrentUser, logout } from "../../api/authApi";
import type { Product } from "../../types/catalog";
import type {
  ExchangeInvoiceItemResponse,
  GetInvoiceByNumberResponse,
  InvoiceItemDto,
  UnitSold,
} from "../../types/invoice";

type LookupStatus = "idle" | "loading" | "notFound" | "error";
type SubmitStatus = "idle" | "loading" | "error";

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
      {n}
    </span>
  );
}

function productName(products: Product[], productId: number): string {
  return products.find((p) => p.id === productId)?.name ?? `#${productId}`;
}

export function ExchangeScreen() {
  const currentUser = getCurrentUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsStatus, setProductsStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    getAllProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        setProductsStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setProductsStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // --- Step 1: find the invoice ---
  const [invoiceNumberInput, setInvoiceNumberInput] = useState("");
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [invoice, setInvoice] = useState<GetInvoiceByNumberResponse | null>(null);

  // Fallback used when the "get invoice by number" endpoint isn't available yet
  // on the backend (currently only /finalize and /exchange exist there).
  const [manualMode, setManualMode] = useState(false);
  const [manualInvoiceItemId, setManualInvoiceItemId] = useState("");

  // --- Step 2: selected line + replacement details ---
  const [selectedItem, setSelectedItem] = useState<InvoiceItemDto | null>(null);
  const [returnedQuantity, setReturnedQuantity] = useState(1);
  const [replacementProductId, setReplacementProductId] = useState<number | "">("");
  const [replacementUnitSold, setReplacementUnitSold] = useState<UnitSold>("piece");
  const [replacementQuantity, setReplacementQuantity] = useState(1);
  const [reason, setReason] = useState("");

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ExchangeInvoiceItemResponse | null>(null);

  const replacementProduct = products.find((p) => p.id === replacementProductId);

  async function handleLookup() {
    const invoiceNumber = Number(invoiceNumberInput);
    if (!invoiceNumber || invoiceNumber <= 0) {
      setLookupStatus("error");
      return;
    }

    setLookupStatus("loading");
    setInvoice(null);
    setSelectedItem(null);
    setManualMode(false);

    try {
      const response = await invoiceService.getByNumber(invoiceNumber);
      setInvoice(response);
      setLookupStatus("idle");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Either the invoice truly doesn't exist, or (today) the lookup
        // endpoint itself isn't implemented on the backend yet.
        setLookupStatus("notFound");
      } else {
        setLookupStatus("error");
      }
    }
  }

  function selectItem(item: InvoiceItemDto) {
    setSelectedItem(item);
    setReturnedQuantity(1);
    setReplacementProductId("");
    setReplacementUnitSold("piece");
    setReplacementQuantity(1);
    setReason("");
    setResult(null);
    setErrorMessage(null);
  }

  function resetAll() {
    setInvoiceNumberInput("");
    setInvoice(null);
    setSelectedItem(null);
    setManualMode(false);
    setManualInvoiceItemId("");
    setResult(null);
    setErrorMessage(null);
    setLookupStatus("idle");
    setSubmitStatus("idle");
  }

  async function handleSubmit() {
    const invoiceItemId = manualMode
      ? Number(manualInvoiceItemId)
      : selectedItem?.invoiceItemId;

    if (!invoiceItemId || invoiceItemId <= 0) {
      setSubmitStatus("error");
      setErrorMessage("الرجاء اختيار (أو إدخال) عنصر فاتورة صحيح.");
      return;
    }

    if (!replacementProductId) {
      setSubmitStatus("error");
      setErrorMessage("الرجاء اختيار منتج بديل.");
      return;
    }

    setSubmitStatus("loading");
    setErrorMessage(null);

    try {
      const response = await invoiceService.exchange({
        invoiceItemId,
        returnedQuantity,
        replacementProductId,
        replacementUnitSold,
        replacementQuantity,
        processedBy: currentUser?.id ?? 0,
        reason: reason || null,
      });

      setResult(response);
      setSubmitStatus("idle");
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "حصل خطأ غير متوقع.");
    }
  }

  return (
    <div dir="rtl" className="flex h-screen flex-col bg-[#F1F2EF]">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between bg-[#1C2333] px-6 py-4 text-white shadow-md">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">نقطة البيع</p>
          <h1 className="text-lg font-semibold">استبدال / إرجاع</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {currentUser && <span className="text-slate-300">{currentUser.fullName}</span>}
          <Link
            to="/cashier"
            className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 transition hover:bg-slate-700"
          >
            <ArrowLeft size={14} />
            فاتورة جديدة
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 transition hover:bg-slate-700"
          >
            <LogOut size={14} />
            تسجيل خروج
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {/* Step 1: locate the invoice item to exchange */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <StepBadge n={1} />
              البحث عن الفاتورة
            </h2>

            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                placeholder="رقم الفاتورة"
                value={invoiceNumberInput}
                onChange={(e) => setInvoiceNumberInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 font-mono text-sm outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookupStatus === "loading"}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Search size={14} />
                {lookupStatus === "loading" ? "جارٍ البحث..." : "بحث"}
              </button>
            </div>

            {lookupStatus === "error" && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                الرجاء إدخال رقم فاتورة صحيح.
              </p>
            )}

            {lookupStatus === "notFound" && !manualMode && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                <p className="text-amber-800">
                  لم يتم العثور على فاتورة بهذا الرقم (أو خدمة البحث غير مفعّلة بعد).
                </p>
                <button
                  type="button"
                  className="mt-2 font-semibold text-emerald-700 hover:underline"
                  onClick={() => setManualMode(true)}
                >
                  ← أدخل رقم عنصر الفاتورة يدوياً بدلاً من ذلك
                </button>
              </div>
            )}

            {manualMode && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="block text-sm font-medium text-slate-700">
                  رقم عنصر الفاتورة
                  <input
                    type="number"
                    min={1}
                    value={manualInvoiceItemId}
                    onChange={(e) => setManualInvoiceItemId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  اطلب من الكاشير أو المشرف رقم العنصر من الفاتورة الأصلية.
                </p>
              </div>
            )}

            {invoice && (
              <div className="mt-4">
                <p className="mb-3 text-sm text-slate-600">
                  فاتورة رقم <span className="font-mono font-semibold">#{invoice.invoiceNumber}</span> — الإجمالي:{" "}
                  <span className="font-mono font-semibold">{invoice.total.toFixed(2)} د.أ</span>
                </p>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-right font-medium">المنتج</th>
                        <th className="px-3 py-2 text-right font-medium">الوحدة</th>
                        <th className="px-3 py-2 text-right font-medium">الكمية المباعة</th>
                        <th className="px-3 py-2 text-right font-medium">القابل للإرجاع</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.items.map((item) => (
                        <tr
                          key={item.invoiceItemId}
                          className={
                            selectedItem?.invoiceItemId === item.invoiceItemId ? "bg-emerald-50" : ""
                          }
                        >
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {productName(products, item.productId)}
                          </td>
                          <td className="px-3 py-2 text-slate-500">{item.unitSold}</td>
                          <td className="px-3 py-2 font-mono">{item.quantity}</td>
                          <td className="px-3 py-2 font-mono">{item.returnableQuantity}</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              className="font-semibold text-emerald-700 hover:underline disabled:cursor-default disabled:text-slate-300 disabled:no-underline"
                              disabled={item.returnableQuantity <= 0}
                              onClick={() => selectItem(item)}
                            >
                              {item.returnableQuantity <= 0 ? "تم إرجاعه بالكامل" : "اختيار"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Step 2: exchange details (shown once an item is selected, or in manual mode) */}
          {(selectedItem || manualMode) && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <StepBadge n={2} />
                تفاصيل الاستبدال
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  الكمية المرتجعة
                  <input
                    type="number"
                    min={1}
                    max={selectedItem?.returnableQuantity}
                    value={returnedQuantity}
                    onChange={(e) => setReturnedQuantity(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  المنتج البديل
                  <select
                    value={replacementProductId}
                    onChange={(e) => {
                      const id = Number(e.target.value) || "";
                      setReplacementProductId(id);
                      setReplacementUnitSold("piece");
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">
                      {productsStatus === "loading" ? "جارٍ تحميل المنتجات..." : "اختر منتج..."}
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  وحدة البديل
                  <select
                    value={replacementUnitSold}
                    onChange={(e) => setReplacementUnitSold(e.target.value as UnitSold)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="piece">قطعة</option>
                    <option value="package" disabled={!replacementProduct?.pricePerPackage}>
                      عبوة
                    </option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  كمية البديل
                  <input
                    type="number"
                    min={1}
                    value={replacementQuantity}
                    onChange={(e) => setReplacementQuantity(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                السبب (اختياري)
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  rows={2}
                  maxLength={255}
                />
              </label>

              {submitStatus === "error" && errorMessage && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {errorMessage}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitStatus === "loading"}
                className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitStatus === "loading" ? "جارٍ التنفيذ..." : "تنفيذ الاستبدال"}
              </button>
            </section>
          )}

          {/* Step 3: result */}
          {result && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-6">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    ✓
                  </span>
                  تم الاستبدال بنجاح
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  عملية استبدال رقم <span className="font-mono">#{result.exchangeId}</span> على الفاتورة{" "}
                  <span className="font-mono">#{result.invoiceId}</span>
                </p>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-4 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>قيمة الصنف المرتجع</span>
                  <span className="font-mono">{result.returnedItemValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>قيمة الصنف البديل</span>
                  <span className="font-mono">{result.replacementItemValue.toFixed(2)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-dashed border-slate-200 pt-2">
                  <span className="font-semibold text-emerald-700">
                    {result.priceDifference > 0
                      ? "مبلغ مستحق من الزبون"
                      : result.priceDifference < 0
                      ? "مبلغ مستحق للزبون"
                      : "استبدال متكافئ"}
                  </span>
                  <span className="font-mono text-lg font-bold text-emerald-700">
                    {Math.abs(result.priceDifference).toFixed(2)} د.أ
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900">
                  <span>إجمالي الفاتورة الجديد</span>
                  <span className="font-mono font-semibold">{result.newTotal.toFixed(2)} د.أ</span>
                </div>
              </div>

              <div className="p-4">
                <button
                  type="button"
                  onClick={resetAll}
                  className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  بدء عملية استبدال جديدة
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}