import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  History,
  Loader2,
  MinusCircle,
  Package,
  PlusCircle,
  Search,
  X,
} from "lucide-react";
import { getAllProducts } from "../api/productApi";
import type { Product } from "../types/catalog";
import { getCurrentUser } from "../api/authApi";
import { ApiError } from "../api/httpClient";
import {
  StockMovementType,
  STOCK_MOVEMENT_LABELS,
  deductStock,
  getCurrentStock,
  getStockHistory,
  restockProduct,
  type StockMovementDto,
} from "../api/stockApi";

type ModalMode = "restock" | "deduct" | null;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ar-JO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StockManagementPage() {
  const currentUser = getCurrentUser();

  // --- Product search / selection ---
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResults, setShowResults] = useState(false);

  // --- Current stock (source of truth balance for the selected product) ---
  const [stock, setStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);

  // --- History ---
  const [history, setHistory] = useState<StockMovementDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // --- Modal (restock / deduct) ---
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalUnit, setModalUnit] = useState<"piece" | "package">("piece");
  const [modalQuantity, setModalQuantity] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const hasPackageOption = Boolean(selected?.piecesPerPackage);

  // Debounced product search, driven straight from the input's onChange
  // (see handleSearchChange below) rather than a useEffect — this keeps every
  // setState call inside an event handler or an async callback instead of a
  // synchronous effect body.
  function handleSearchChange(value: string) {
    setSearch(value);
    setShowResults(true);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const trimmed = value.trim();
    if (!trimmed) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimerRef.current = setTimeout(() => {
      getAllProducts({ search: trimmed, onlyActive: true })
        .then((data) => setResults(data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
  }

  // Clean up any pending debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // Close the dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function loadStockAndHistory(productId: number) {
    setStockLoading(true);
    getCurrentStock(productId)
      .then((data) => setStock(data.stockInPieces))
      .catch(() => setStock(null))
      .finally(() => setStockLoading(false));

    setHistoryLoading(true);
    setHistoryError(null);
    getStockHistory(productId)
      .then((data) => setHistory(data))
      .catch((err) => {
        setHistoryError(err instanceof ApiError ? err.message : "تعذّر تحميل سجل الحركات.");
        setHistory([]);
      })
      .finally(() => setHistoryLoading(false));
  }

  function handleSelectProduct(product: Product) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSelected(product);
    setSearch("");
    setResults([]);
    setSearching(false);
    setShowResults(false);
    loadStockAndHistory(product.id);
  }

  function openModal(mode: ModalMode) {
    setModalMode(mode);
    setModalUnit("piece");
    setModalQuantity("");
    setModalReason("");
    setModalError(null);
  }

  function closeModal() {
    setModalMode(null);
    setModalSubmitting(false);
  }

  async function handleModalSubmit() {
    if (!selected) return;

    const qty = Number(modalQuantity);
    if (!modalQuantity || Number.isNaN(qty) || qty <= 0) {
      setModalError("لازم تدخل كمية أكبر من صفر.");
      return;
    }
    if (modalMode === "deduct" && !modalReason.trim()) {
      setModalError("سبب الخصم إلزامي.");
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      if (modalMode === "restock") {
        await restockProduct(selected.id, {
          quantity: qty,
          isPackage: modalUnit === "package",
          createdByUserId: currentUser?.id ?? null,
        });
      } else if (modalMode === "deduct") {
        await deductStock(selected.id, {
          quantity: qty,
          isPackage: modalUnit === "package",
          reason: modalReason.trim(),
          createdByUserId: currentUser?.id ?? null,
        });
      }

      loadStockAndHistory(selected.id);
      closeModal();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : "حصل خطأ غير متوقع.");
      setModalSubmitting(false);
    }
  }

  const modalTitle = modalMode === "restock" ? "إضافة كمية (استلام بضاعة)" : "خصم / حذف يدوي";

  const movementBadgeStyles: Record<StockMovementType, string> = useMemo(
    () => ({
      [StockMovementType.Restock]: "bg-emerald-50 text-emerald-700 border-emerald-100",
      [StockMovementType.Sale]: "bg-sky-50 text-sky-700 border-sky-100",
      [StockMovementType.Return]: "bg-amber-50 text-amber-700 border-amber-100",
      [StockMovementType.ManualDeduction]: "bg-red-50 text-red-700 border-red-100",
      [StockMovementType.ManualAddition]: "bg-emerald-50 text-emerald-700 border-emerald-100",
    }),
    []
  );

  return (
    <div dir="rtl" className="pos-page">
      <header className="flex items-center justify-between bg-[#1C2333] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link
            to={currentUser?.role === "Admin" ? "/dashboard" : "/home"}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10"
            aria-label="رجوع"
          >
            <ArrowRight size={16} />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">إدارة المخزون</p>
            <h1 className="text-lg font-semibold">تعديل رصيد الأصناف</h1>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-slate-700/60 px-3 py-1 text-xs font-medium text-slate-200">
          <Boxes size={14} />
          {currentUser?.fullName ?? "مستخدم"}
        </span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Product search */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">اختيار الصنف</h2>
          <div ref={searchBoxRef} className="relative">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 focus-within:border-emerald-400 focus-within:bg-white">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowResults(true)}
                placeholder="دوّر باسم الصنف..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none"
              />
              {searching && <Loader2 size={14} className="animate-spin text-slate-400" />}
            </div>

            {showResults && results.length > 0 && (
              <ul className="absolute z-10 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectProduct(p)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-right text-sm text-slate-700 transition hover:bg-emerald-50"
                    >
                      <span>{p.name}</span>
                      <span className="font-mono text-xs text-slate-400">{p.stockInPieces} حبة</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selected && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selected.name}</p>
                {hasPackageOption && (
                  <p className="text-xs text-slate-500">
                    {selected.piecesPerPackage} حبة / باكيج
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="text-xs text-slate-500">الرصيد الحالي</p>
                  <p className="font-mono text-2xl font-bold text-slate-900">
                    {stockLoading ? (
                      <Loader2 size={20} className="animate-spin text-slate-400" />
                    ) : (
                      `${stock ?? selected.stockInPieces} حبة`
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openModal("restock")}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <PlusCircle size={16} />
                    إضافة
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal("deduct")}
                    className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <MinusCircle size={16} />
                    خصم
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* History */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <History size={18} className="text-slate-500" />
            سجل الحركات
          </h2>

          {!selected ? (
            <p className="text-sm text-slate-400">اختار صنف من فوق لعرض سجل حركاته.</p>
          ) : historyLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : historyError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{historyError}</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400">ما في أي حركة مسجلة لهذا الصنف لسا.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2.5 pl-3 font-medium">التاريخ</th>
                    <th className="px-3 py-2.5 font-medium">نوع الحركة</th>
                    <th className="px-3 py-2.5 font-medium">الكمية</th>
                    <th className="px-3 py-2.5 font-medium">الرصيد قبل</th>
                    <th className="px-3 py-2.5 font-medium">الرصيد بعد</th>
                    <th className="px-3 py-2.5 font-medium">السبب</th>
                    <th className="py-2.5 pr-3 font-medium">مين عملها</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map((m) => {
                    const isPositive =
                      m.type === StockMovementType.Restock ||
                      m.type === StockMovementType.Return ||
                      m.type === StockMovementType.ManualAddition;
                    return (
                      <tr key={m.id}>
                        <td className="whitespace-nowrap py-3 pl-3 font-mono text-xs text-slate-500">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${movementBadgeStyles[m.type]}`}
                          >
                            {STOCK_MOVEMENT_LABELS[m.type] ?? "غير معروف"}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-3 font-mono text-xs font-semibold ${
                            isPositive ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {isPositive ? "+" : "-"}
                          {m.quantityInPieces}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-500">{m.balanceBefore}</td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-900">{m.balanceAfter}</td>
                        <td className="px-3 py-3 text-xs text-slate-600">{m.reason ?? "—"}</td>
                        <td className="py-3 pr-3 text-xs text-slate-500">
                          {m.createdByUserId
                            ? m.createdByUserId === currentUser?.id
                              ? currentUser?.fullName
                              : `مستخدم #${m.createdByUserId}`
                            : "النظام"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Restock / Deduct modal */}
      {modalMode && selected && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">{modalTitle}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-500">
              الصنف: <span className="font-medium text-slate-800">{selected.name}</span>
            </p>

            {hasPackageOption && (
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">الوحدة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalUnit("piece")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition ${
                      modalUnit === "piece"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    بالحبة
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalUnit("package")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition ${
                      modalUnit === "package"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Package size={14} />
                    بالباكيج
                  </button>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                الكمية {hasPackageOption ? `(${modalUnit === "package" ? "عدد الباكيجات" : "عدد الحبات"})` : "(حبة)"}
              </label>
              <input
                type="number"
                min="1"
                autoFocus
                value={modalQuantity}
                onChange={(e) => setModalQuantity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>

            {modalMode === "deduct" && (
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">السبب</label>
                <input
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="مثال: تلف، فقدان، انتهاء صلاحية، تصحيح خطأ..."
                  maxLength={250}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
                />
              </div>
            )}

            {modalError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{modalError}</p>
            )}

            <button
              type="button"
              disabled={modalSubmitting}
              onClick={handleModalSubmit}
              className={`w-full rounded-xl py-3.5 text-sm font-semibold text-white transition disabled:cursor-default disabled:opacity-50 ${
                modalMode === "restock" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {modalSubmitting ? "جارٍ الحفظ..." : modalMode === "restock" ? "تأكيد الإضافة" : "تأكيد الخصم"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
