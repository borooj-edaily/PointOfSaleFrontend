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
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StockManagementPage() {
  const currentUser = getCurrentUser();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [stock, setStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);

  const [history, setHistory] = useState<StockMovementDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalUnit, setModalUnit] = useState<"piece" | "package">("piece");
  const [modalQuantity, setModalQuantity] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const hasPackageOption = Boolean(selected?.piecesPerPackage);

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

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

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
      .then((data: any) => {
        const currentVal = data?.stockInPieces ?? data?.stockQuantity ?? data?.stock ?? 0;
        setStock(currentVal);
      })
      .catch(() => setStock(null))
      .finally(() => setStockLoading(false));

    setHistoryLoading(true);
    setHistoryError(null);
    getStockHistory(productId)
      .then((data) => setHistory(data))
      .catch((err) => {
        setHistoryError(err instanceof ApiError ? err.message : "Unable to load stock movement history.");
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
      setModalError("Please enter a quantity greater than zero.");
      return;
    }
    if (modalMode === "deduct" && !modalReason.trim()) {
      setModalError("A deduction reason is required.");
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
      setModalError(err instanceof ApiError ? err.message : "An unexpected error occurred.");
      setModalSubmitting(false);
    }
  }

  const modalTitle = modalMode === "restock" ? "Add quantity (goods received)" : "Manual deduction / removal";

  const movementBadgeStyles: Record<string | number, string> = useMemo(
    () => ({
      [StockMovementType.Restock]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      [StockMovementType.Sale]: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      [StockMovementType.Return]: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      [StockMovementType.ManualDeduction]: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      [StockMovementType.ManualAddition]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      Restock: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      Sale: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      Return: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      ManualDeduction: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      ManualAddition: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    }),
    []
  );

  const displayStock =
    stock !== null
      ? stock
      : (selected as any)?.stockInPieces ?? (selected as any)?.stockQuantity ?? (selected as any)?.stock ?? 0;

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        width: "100vw",
        height: "100vh",
        overflowY: "auto",
        backgroundImage: "url('/supermarket-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
      className="text-slate-100 font-sans selection:bg-amber-500/30"
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(2, 6, 23, 0.82)",
          backdropFilter: "blur(12px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div className="relative flex min-h-screen flex-col w-full" style={{ zIndex: 10 }}>
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/70 px-8 py-5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <Link
              to={currentUser?.role === "Admin" ? "/dashboard" : "/home"}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-amber-400 hover:text-black hover:border-amber-400 active:scale-95"
              aria-label="Back"
            >
              <ArrowRight size={18} />
            </Link>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Inventory management</p>
              <h1 className="text-xl font-bold tracking-wide text-white">Adjust stock balance</h1>
            </div>
          </div>

          <span className="flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-300 shadow-inner">
            <Boxes size={16} className="text-amber-400" />
            {currentUser?.fullName ?? "User"}
          </span>
        </header>

        <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 space-y-8">
          <section className="relative z-30 rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="h-3 w-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              <h2 className="text-lg font-bold text-white">Select product</h2>
            </div>

            <div ref={searchBoxRef} className="relative z-50">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition focus-within:border-amber-400 focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-amber-400/20">
                <Search size={20} className="shrink-0 text-amber-400" />
                <input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  placeholder="Search by product name to preview stock..."
                  className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
                />
                {searching && <Loader2 size={18} className="animate-spin text-amber-400" />}
              </div>

              {showResults && results.length > 0 && (
                <ul className="absolute right-0 left-0 top-full mt-2 z-50 max-h-60 overflow-y-auto rounded-2xl border border-amber-400/30 bg-slate-900/95 p-2 backdrop-blur-2xl shadow-2xl ring-1 ring-black/50">
                  {results.map((p: any) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-right text-sm text-slate-200 transition hover:bg-amber-400/20 hover:text-amber-300"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="font-mono text-xs rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-amber-300">
                          {p.stockInPieces ?? p.stockQuantity ?? p.stock ?? 0} pieces
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selected && (
              <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6 backdrop-blur-lg">
                <div>
                  <p className="text-xl font-bold text-white">{selected.name}</p>
                  {hasPackageOption && (
                    <p className="mt-1 text-xs text-amber-400/80">
                      {selected.piecesPerPackage} pieces / package
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-left">
                    <p className="text-xs text-slate-400">Current balance</p>
                    <p className="font-mono text-3xl font-extrabold text-amber-400 mt-1">
                      {stockLoading ? <Loader2 size={24} className="animate-spin text-amber-400" /> : `${displayStock} pieces`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openModal("restock")}
                      className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-300 active:scale-95 shadow-lg shadow-amber-400/10"
                    >
                      <PlusCircle size={18} />
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => openModal("deduct")}
                      className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm font-bold text-rose-400 transition hover:bg-rose-500/20 active:scale-95"
                    >
                      <MinusCircle size={18} />
                      Deduct
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="relative z-10 rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <History size={22} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Movement history</h2>
            </div>

            {!selected ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Please select a product from the search field above to display its detailed movement history.
              </div>
            ) : historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={28} className="animate-spin text-amber-400" />
              </div>
            ) : historyError ? (
              <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {historyError}
              </p>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No inventory movements have been recorded for this product yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-right text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-slate-400">
                      <th className="pb-3 pl-3 font-semibold">Date</th>
                      <th className="px-3 pb-3 font-semibold">Movement type</th>
                      <th className="px-3 pb-3 font-semibold">Quantity</th>
                      <th className="px-3 pb-3 font-semibold">Balance before</th>
                      <th className="px-3 pb-3 font-semibold">Balance after</th>
                      <th className="px-3 pb-3 font-semibold">Reason</th>
                      <th className="pb-3 pr-3 font-semibold">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((m: any) => {
                      const isPositive =
                        m.type === StockMovementType.Restock ||
                        m.type === StockMovementType.Return ||
                        m.type === StockMovementType.ManualAddition ||
                        m.type === "Restock" ||
                        m.type === "Return" ||
                        m.type === "ManualAddition";

                      const labelText =
                        STOCK_MOVEMENT_LABELS[m.type as StockMovementType] ??
                        STOCK_MOVEMENT_LABELS[m.type as keyof typeof STOCK_MOVEMENT_LABELS] ??
                        m.type ??
                        "Inventory movement";

                      return (
                        <tr key={m.id || Math.random()} className="transition hover:bg-white/5">
                          <td className="whitespace-nowrap py-4 pl-3 font-mono text-xs text-slate-400">
                            {formatDateTime(m.createdAt || m.createdOn || m.date)}
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${
                                movementBadgeStyles[m.type] ?? "bg-slate-500/10 text-slate-300 border-slate-500/20"
                              }`}
                            >
                              {labelText}
                            </span>
                          </td>
                          <td className={`px-3 py-4 font-mono text-xs font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : "-"}
                            {m.quantityInPieces ?? m.quantity ?? 0}
                          </td>
                          <td className="px-3 py-4 font-mono text-xs text-slate-400">
                            {m.balanceBefore ?? m.stockBefore ?? "—"}
                          </td>
                          <td className="px-3 py-4 font-mono text-xs font-bold text-amber-400">
                            {m.balanceAfter ?? m.stockAfter ?? "—"}
                          </td>
                          <td className="px-3 py-4 text-xs text-slate-300">{m.reason || "—"}</td>
                          <td className="py-4 pr-3 text-xs text-slate-400">
                            {m.createdByUserName ??
                              (m.createdByUserId
                                ? m.createdByUserId === currentUser?.id
                                  ? currentUser?.fullName
                                  : `User #${m.createdByUserId}`
                                : "System")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {modalMode && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md" onClick={closeModal}>
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{modalTitle}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-6 text-sm text-slate-400">
              Product: <span className="font-bold text-amber-400">{selected.name}</span>
            </p>

            {hasPackageOption && (
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold text-slate-300">Unit</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalUnit("piece")}
                    className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition ${
                      modalUnit === "piece"
                        ? "border-amber-400 bg-amber-400/10 text-amber-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    By piece
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalUnit("package")}
                    className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition ${
                      modalUnit === "package"
                        ? "border-amber-400 bg-amber-400/10 text-amber-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <Package size={16} />
                    By package
                  </button>
                </div>
              </div>
            )}

            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold text-slate-300">
                Quantity {hasPackageOption ? `(${modalUnit === "package" ? "Number of packages" : "Number of pieces"})` : "(pieces)"}
              </label>
              <input
                type="number"
                min="1"
                autoFocus
                value={modalQuantity}
                onChange={(e) => setModalQuantity(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            {modalMode === "deduct" && (
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold text-slate-300">Reason</label>
                <input
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="Example: damaged, lost, expired, correction..."
                  maxLength={250}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            )}

            {modalError && (
              <p className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-400">{modalError}</p>
            )}

            <button
              type="button"
              disabled={modalSubmitting}
              onClick={handleModalSubmit}
              className={`w-full rounded-2xl py-4 text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                modalMode === "restock"
                  ? "bg-amber-400 text-black hover:bg-amber-300 shadow-lg shadow-amber-400/10"
                  : "border border-rose-500/30 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
              }`}
            >
              {modalSubmitting ? "Saving..." : modalMode === "restock" ? "Confirm addition" : "Confirm deduction"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}