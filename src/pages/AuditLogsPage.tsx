import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  Filter,
  LogOut,
  Search,
  User,
} from "lucide-react";
import {
  getAuditLogs,
  type AuditLog,
  type AuditLogsResponse,
} from "../api/auditLogApi";
import { getCurrentUser, logout } from "../api/authApi";

const PAGE_SIZE = 50;

interface Filters {
  from: string;
  to: string;
  userId: string;
  action: string;
  entity: string;
}

const emptyFilters: Filters = {
  from: "",
  to: "",
  userId: "",
  action: "",
  entity: "",
};

function toIso(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ar-PS", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AuditLogsPage() {
  const user = getCurrentUser();

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAuditLogs() {
      setLoading(true);
      setError("");

      try {
        const data = await getAuditLogs({
          from: toIso(appliedFilters.from),
          to: toIso(appliedFilters.to),
          userId: appliedFilters.userId
            ? Number(appliedFilters.userId)
            : undefined,
          action: appliedFilters.action.trim() || undefined,
          entity: appliedFilters.entity.trim() || undefined,
          page,
          pageSize: PAGE_SIZE,
        });

        if (!cancelled) {
          setResult(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "فشل تحميل سجل العمليات."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAuditLogs();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters, page]);

  const totalPages = Math.max(
    1,
    Math.ceil((result?.totalCount ?? 0) / PAGE_SIZE)
  );

  const items: AuditLog[] = result?.items ?? [];

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
              <ClipboardList size={28} className="stroke-[2.5]" />
            </div>

            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-amber-400">
                AL-ISRAA Supermarket
              </p>
              <h1 className="text-3xl font-black tracking-tight text-white">
                سجل العمليات
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
              to="/dashboard"
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 font-bold text-white transition hover:bg-white/20"
            >
              <ArrowRight size={19} />
              لوحة التحكم
            </Link>

            <button
              type="button"
              onClick={logout}
              className="flex cursor-pointer items-center gap-2 rounded-2xl border border-red-500/30 bg-red-600/80 px-4 py-3 font-bold text-white transition hover:bg-red-600"
            >
              <LogOut size={19} />
              تسجيل خروج
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-white/15 bg-black/80 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
          <form
            onSubmit={applyFilters}
            className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5"
          >
            <input
              type="datetime-local"
              value={filters.from}
              onChange={(e) =>
                setFilters({ ...filters, from: e.target.value })
              }
              aria-label="من تاريخ"
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
            />

            <input
              type="datetime-local"
              value={filters.to}
              onChange={(e) =>
                setFilters({ ...filters, to: e.target.value })
              }
              aria-label="إلى تاريخ"
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
            />

            <input
              type="number"
              min="1"
              value={filters.userId}
              onChange={(e) =>
                setFilters({ ...filters, userId: e.target.value })
              }
              placeholder="رقم المستخدم"
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-amber-400"
            />

            <input
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
              placeholder="العملية"
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-amber-400"
            />

            <input
              value={filters.entity}
              onChange={(e) =>
                setFilters({ ...filters, entity: e.target.value })
              }
              placeholder="الكيان"
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-amber-400"
            />

            <div className="flex gap-3 md:col-span-2 xl:col-span-5">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300"
              >
                <Search size={17} />
                بحث
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <Filter size={17} />
                مسح الفلاتر
              </button>
            </div>
          </form>

          {error && (
            <p className="mb-5 rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-3 font-bold text-red-100">
              {error}
            </p>
          )}

          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-300">
            <p>
              إجمالي السجلات:{" "}
              <span className="font-black text-amber-400">
                {result?.totalCount ?? 0}
              </span>
            </p>

            {loading && <p>جارٍ التحميل...</p>}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead className="bg-white/10 text-amber-400">
                <tr>
                  <th className="px-4 py-4">التاريخ</th>
                  <th className="px-4 py-4">المستخدم</th>
                  <th className="px-4 py-4">العملية</th>
                  <th className="px-4 py-4">الكيان</th>
                  <th className="px-4 py-4">المعرف</th>
                  <th className="px-4 py-4">التفاصيل</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 text-slate-200">
                {!loading && items.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      لا توجد عمليات مطابقة للفلاتر المحددة.
                    </td>
                  </tr>
                )}

                {items.map((log) => (
                  <tr key={log.id} className="transition hover:bg-white/5">
                    <td className="whitespace-nowrap px-4 py-4">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      {log.userFullName ?? `مستخدم #${log.userId}`}
                    </td>
                    <td className="px-4 py-4">{log.action ?? "—"}</td>
                    <td className="px-4 py-4">{log.entity ?? "—"}</td>
                    <td className="px-4 py-4">{log.entityId ?? "—"}</td>
                    <td className="max-w-sm px-4 py-4 text-slate-400">
                      {log.details ?? "—"}
                    </td>
                  </tr>
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
              السابق
            </button>

            <span className="font-bold text-slate-300">
              صفحة {page} من {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}