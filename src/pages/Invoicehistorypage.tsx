import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  History,
  LogOut,
  RotateCcw,
  Search,
  User,
} from "lucide-react";

import { listInvoices, type InvoiceListItem } from "../api/Invoicesapi";
import { getCurrentUser, logout } from "../api/authApi";
import { invoiceService } from "../services/invoiceService";
import { getUsers, type UserDto } from "../api/userApi";
import { getAllProducts } from "../api/productApi";
import type { GetInvoiceByNumberResponse } from "../types/invoice";

const PAGE_SIZE = 20;

interface Filters {
  from: string;
  to: string;
  cashierId: string;
}

const emptyFilters: Filters = { from: "", to: "", cashierId: "" };

function toIsoDate(value: string, endOfDay = false): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function InvoiceHistoryPage() {
  const user = getCurrentUser();
  const canViewAll =
    user?.role === "Admin" || (user?.permissions.includes("view_all_invoices") ?? false);

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<InvoiceListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cashiers, setCashiers] = useState<UserDto[]>([]);
  const [productNames, setProductNames] = useState<Record<number, string>>({});

  const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);
  const [detail, setDetail] = useState<GetInvoiceByNumberResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Cashier filter dropdown is only meaningful for admins / view_all_invoices holders.
  useEffect(() => {
    if (!canViewAll) return;

    getUsers()
      .then(setCashiers)
      .catch(() => {
        // Not fatal — the filter dropdown just won't be populated.
      });
  }, [canViewAll]);

  // Best-effort product name lookup for the expanded line items.
  useEffect(() => {
    getAllProducts()
      .then((products) => {
        const map: Record<number, string> = {};
        for (const product of products) {
          map[product.id] = product.name;
        }
        setProductNames(map);
      })
      .catch(() => {
        // Fall back to showing raw product IDs.
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await listInvoices({
          cashierId: appliedFilters.cashierId ? Number(appliedFilters.cashierId) : undefined,
          fromDate: toIsoDate(appliedFilters.from),
          toDate: toIsoDate(appliedFilters.to, true),
          page,
          pageSize: PAGE_SIZE,
        });

        if (!cancelled) {
          setItems(data.items ?? []);
          setTotalCount(data.totalCount);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load invoices.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters, page]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  }

  async function toggleDetail(invoiceNumber: number) {
    if (expandedInvoice === invoiceNumber) {
      setExpandedInvoice(null);
      setDetail(null);
      return;
    }

    setExpandedInvoice(invoiceNumber);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const data = await invoiceService.getByNumber(invoiceNumber);
      setDetail(data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to load invoice details.");
    } finally {
      setDetailLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
       <div
      dir="rtl"
      className="invoice-history-page min-h-screen bg-cover bg-center bg-no-repeat px-5 py-8 font-sans"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.93)), url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1920&auto=format&fit=crop')",
      }}
       >
      <div
        className="invoice-overlay"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <main className="relative z-10 w-full">      <header className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/15 bg-black/80 px-6 py-5 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-300 bg-amber-400 text-slate-950 shadow-xl">
              <History size={28} className="stroke-[2.5]" />
            </div>

            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-amber-400">
                AL-ISRAA Supermarket
              </p>
              <h1 className="text-3xl font-black tracking-tight text-white">
                {canViewAll ? "Invoice history — all cashiers" : "My invoices"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-black/50 px-4 py-3 font-bold text-amber-400">
                <User size={19} />
                <span>{user.fullName}</span>
              </div>
            )}

            <Link
              to="/home"
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 font-bold text-white transition hover:bg-white/20"
            >
              <ArrowRight size={19} />
              Home
            </Link>

            <button
              type="button"
              onClick={logout}
              className="flex cursor-pointer items-center gap-2 rounded-2xl border border-red-500/30 bg-red-600/80 px-4 py-3 font-bold text-white transition hover:bg-red-600"
            >
              <LogOut size={19} />
              Log out
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-white/15 bg-black/80 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
          <form
            onSubmit={applyFilters}
            className={`mb-6 grid gap-3 md:grid-cols-2 ${canViewAll ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}
          >
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              aria-label="From date"
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
            />

            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              aria-label="To date"
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
            />

            {canViewAll && (
              <select
                value={filters.cashierId}
                onChange={(e) => setFilters({ ...filters, cashierId: e.target.value })}
                aria-label="Cashier"
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
              >
                <option value="" className="text-slate-900">All cashiers</option>
                {cashiers.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900">
                    {c.fullName}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300"
              >
                <Search size={17} />
                Search
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Clear
              </button>
            </div>
          </form>

          {error && (
                      <p className="mb-5 rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-3 font-bold text-red-100 invoice-error-text">
              {error}
            </p>
          )}

          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-300">
            <p>
              Total invoices: <span className="font-black text-amber-400">{totalCount}</span>
            </p>
            {loading && <p>Loading...</p>}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead className="bg-white/10 text-amber-400">
                <tr>
                  <th className="px-4 py-4">Invoice #</th>
                  {canViewAll && <th className="px-4 py-4">Cashier</th>}
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Subtotal</th>
                  <th className="px-4 py-4">Total</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 text-slate-200">
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={canViewAll ? 7 : 6} className="px-4 py-10 text-center text-slate-400">
                      No invoices match the selected filters.
                    </td>
                  </tr>
                )}

                {items.map((invoice) => (
                  <Fragment key={invoice.invoiceId}>
                    <tr className="transition hover:bg-white/5">
                      <td className="px-4 py-4 font-black text-white">
                        #{invoice.invoiceNumber}
                      </td>
                      {canViewAll && <td className="px-4 py-4">{invoice.cashierName}</td>}
                      <td className="whitespace-nowrap px-4 py-4">{formatDate(invoice.createdAt)}</td>
                      <td className="px-4 py-4">{invoice.subtotal.toFixed(2)} JOD</td>
                      <td className="px-4 py-4 font-bold text-amber-400">
                        {invoice.total.toFixed(2)} JOD
                      </td>
                      <td className="px-4 py-4">
                        {invoice.hasReturn ? (
                          <span className="flex w-fit items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                            <RotateCcw size={12} />
                            Has return/exchange
                          </span>
                        ) : (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => toggleDetail(invoice.invoiceNumber)}
                          className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                        >
                          {expandedInvoice === invoice.invoiceNumber ? (
                            <>
                              <ChevronUp size={14} /> Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} /> View items
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {expandedInvoice === invoice.invoiceNumber && (
                      <tr>
                        <td colSpan={canViewAll ? 7 : 6} className="bg-black/40 px-4 py-4">
                          {detailLoading && (
                            <p className="text-sm text-slate-400">Loading items...</p>
                          )}

                          {detailError && (
                            <p className="text-sm font-bold text-red-300">{detailError}</p>
                          )}

                          {detail && !detailLoading && (
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                              <table className="w-full min-w-[600px] text-right text-xs">
                                <thead className="bg-white/5 text-amber-300">
                                  <tr>
                                    <th className="px-3 py-2">Product</th>
                                    <th className="px-3 py-2">Unit</th>
                                    <th className="px-3 py-2">Qty</th>
                                    <th className="px-3 py-2">Unit price</th>
                                    <th className="px-3 py-2">Line total</th>
                                    <th className="px-3 py-2">Returned</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                  {detail.items.map((line) => (
                                    <tr key={line.invoiceItemId}>
                                      <td className="px-3 py-2">
                                        {productNames[line.productId] ?? `Product #${line.productId}`}
                                      </td>
                                      <td className="px-3 py-2">
                                        {line.unitSold === "package" ? "Package" : "Piece"}
                                      </td>
                                      <td className="px-3 py-2">{line.quantity}</td>
                                      <td className="px-3 py-2">{line.unitPriceSnapshot.toFixed(2)}</td>
                                      <td className="px-3 py-2 font-bold text-amber-300">
                                        {line.lineTotal.toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2">
                                        {line.alreadyReturnedQuantity > 0
                                          ? `${line.alreadyReturnedQuantity} returned`
                                          : "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="font-bold text-slate-300">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}