import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  LogOut,
  Package,
  Percent,
  Receipt,
  RotateCcw,
  Search,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

import { getSalesReport, type SalesReport } from "../api/reportsApi";
import { getCurrentUser, logout } from "../api/authApi";

interface Filters {
  from: string;
  to: string;
}

const emptyFilters: Filters = { from: "", to: "" };

function toIsoDate(value: string, endOfDay = false): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function formatDay(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export default function ReportsPage() {
  const user = getCurrentUser();

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getSalesReport({
          fromDate: toIsoDate(appliedFilters.from),
          toDate: toIsoDate(appliedFilters.to, true),
        });

        if (!cancelled) setReport(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load the report.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  const maxDailySales = Math.max(1, ...(report?.dailyBreakdown.map((d) => d.totalSales) ?? [1]));

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-cover bg-center bg-no-repeat px-5 py-8 font-sans"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.93)), url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1920&auto=format&fit=crop')",
      }}
    >
      <main className="mx-auto w-full max-w-7xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/15 bg-black/80 px-6 py-5 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-300 bg-amber-400 text-slate-950 shadow-xl">
              <BarChart3 size={28} className="stroke-[2.5]" />
            </div>

            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-amber-400">
                AL-ISRAA Supermarket
              </p>
              <h1 className="text-3xl font-black tracking-tight text-white">Sales report</h1>
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
              to="/dashboard"
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 font-bold text-white transition hover:bg-white/20"
            >
              <ArrowRight size={19} />
              Dashboard
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

        <section className="mb-7 rounded-3xl border border-white/15 bg-black/80 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
          <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300"
              >
                <Search size={17} />
                Apply
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Last 30 days
              </button>
            </div>
          </form>

          {report && !loading && (
            <p className="mt-4 text-xs font-semibold text-slate-400">
              Showing {new Date(report.fromDate).toLocaleDateString("en-US")} –{" "}
              {new Date(report.toDate).toLocaleDateString("en-US")}
            </p>
          )}
        </section>

        {error && (
          <div className="mb-7 rounded-2xl border border-red-500/40 bg-red-500/20 p-5 text-center font-bold text-red-200">
            {error}
          </div>
        )}

        {loading && !report && (
          <div className="rounded-3xl border border-white/15 bg-black/80 p-8 text-center text-slate-300 shadow-2xl backdrop-blur-2xl">
            Loading report...
          </div>
        )}

        {report && (
          <>
            <div className="mb-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Net sales"
                value={`${report.netSales.toFixed(2)} JOD`}
                icon={<DollarSign size={26} className="stroke-[2.5]" />}
              />
              <StatCard
                label="Invoices"
                value={report.totalInvoices}
                icon={<Receipt size={26} className="stroke-[2.5]" />}
              />
              <StatCard
                label="Average invoice"
                value={`${report.averageInvoiceValue.toFixed(2)} JOD`}
                icon={<TrendingUp size={26} className="stroke-[2.5]" />}
              />
              <StatCard
                label="Returns value"
                value={`${report.totalReturnsValue.toFixed(2)} JOD`}
                icon={<RotateCcw size={26} className="stroke-[2.5]" />}
              />
            </div>

            <div className="mb-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/15 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Percent size={16} className="text-amber-400" />
                  <span>Discount given</span>
                </div>
                <p className="text-2xl font-black text-amber-400">
                  {report.totalDiscount.toFixed(2)} JOD
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Out of {report.grossSales.toFixed(2)} JOD gross sales
                </p>
              </div>

              <div className="rounded-3xl border border-white/15 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Package size={16} className="text-amber-400" />
                  <span>Gross vs net sales</span>
                </div>
                <p className="text-2xl font-black text-white">
                  {report.grossSales.toFixed(2)}{" "}
                  <span className="text-sm font-bold text-slate-400">→</span>{" "}
                  <span className="text-amber-400">{report.netSales.toFixed(2)} JOD</span>
                </p>
              </div>
            </div>

            <div className="mb-7 rounded-3xl border border-white/15 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-white">
                <BarChart3 size={20} className="text-amber-400" />
                Daily sales
              </h2>

              {report.dailyBreakdown.length === 0 ? (
                <p className="text-sm text-slate-400">No sales in this period.</p>
              ) : (
                <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: 160 }}>
                  {report.dailyBreakdown.map((day) => (
                    <div key={day.date} className="flex min-w-[44px] flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-300">
                        {day.totalSales.toFixed(0)}
                      </span>
                      <div
                        className="w-6 rounded-t-md bg-gradient-to-t from-amber-500/40 to-amber-400"
                        style={{
                          height: `${Math.max(8, (day.totalSales / maxDailySales) * 120)}px`,
                        }}
                        title={`${day.totalSales.toFixed(2)} JOD across ${day.invoiceCount} invoice(s)`}
                      />
                      <span className="text-[10px] font-medium text-slate-400">
                        {formatDay(day.date)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/15 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
                  <Package size={20} className="text-amber-400" />
                  Top products
                </h2>

                {report.topProducts.length === 0 ? (
                  <p className="text-sm text-slate-400">No product sales in this period.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-white/10 text-amber-400">
                        <tr>
                          <th className="px-3 py-3">Product</th>
                          <th className="px-3 py-3">Qty sold</th>
                          <th className="px-3 py-3">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-slate-200">
                        {report.topProducts.map((p) => (
                          <tr key={p.productId}>
                            <td className="px-3 py-3">{p.productName}</td>
                            <td className="px-3 py-3">{p.quantitySold}</td>
                            <td className="px-3 py-3 font-bold text-amber-400">
                              {p.revenue.toFixed(2)} JOD
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/15 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
                  <Users size={20} className="text-amber-400" />
                  Sales by cashier
                </h2>

                {report.salesByCashier.length === 0 ? (
                  <p className="text-sm text-slate-400">No sales in this period.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-white/10 text-amber-400">
                        <tr>
                          <th className="px-3 py-3">Cashier</th>
                          <th className="px-3 py-3">Invoices</th>
                          <th className="px-3 py-3">Total sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-slate-200">
                        {report.salesByCashier.map((c) => (
                          <tr key={c.cashierId}>
                            <td className="px-3 py-3">{c.cashierName}</td>
                            <td className="px-3 py-3">{c.invoiceCount}</td>
                            <td className="px-3 py-3 font-bold text-amber-400">
                              {c.totalSales.toFixed(2)} JOD
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[150px] flex-col justify-between rounded-3xl border border-white/15 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-300">{label}</span>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-md">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-black tracking-tight text-amber-400">{value}</div>
    </div>
  );
}