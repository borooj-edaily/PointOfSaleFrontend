import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Boxes,
  LogOut,
  User,
  DollarSign,
  Receipt,
  TrendingUp,
  FileSpreadsheet,
  ClipboardList,
  Users,
  Clock3,
} from "lucide-react";
import {
  getDashboardStats,
  type DashboardStats,
} from "../api/dashboardApi";
import { getCurrentUser, logout } from "../api/authApi";

export default function AdminDashboard() {
  const user = getCurrentUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load statistics"
        )
      );
  }, []);

  return (
    <div
      dir="rtl"
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat font-sans"
      style={{
        padding: "30px 20px",
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1920&auto=format&fit=crop')`,
        boxSizing: "border-box",
      }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          className="relative flex flex-wrap items-center justify-between rounded-3xl border border-white/15 bg-black/80 shadow-2xl backdrop-blur-2xl"
          style={{
            padding: "24px 32px",
            marginBottom: "30px",
            boxSizing: "border-box",
          }}
        >
          <div className="flex items-center" style={{ gap: "16px" }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-300 bg-amber-400 text-slate-950 shadow-xl">
              <LayoutDashboard size={28} className="stroke-[2.5]" />
            </div>

            <div>
              <span
                className="block text-xs font-black uppercase tracking-widest text-amber-400"
                style={{ marginBottom: "4px" }}
              >
                AL-ISRAA Supermarket
              </span>

              <h1 className="text-3xl font-black tracking-tight text-white">
                Admin dashboard
              </h1>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center"
            style={{ gap: "16px", marginTop: "12px" }}
          >
            <Link
              to="/products"
              className="flex items-center rounded-2xl bg-amber-400 font-bold text-slate-950 shadow-lg transition-all hover:bg-amber-300 active:scale-95"
              style={{
                padding: "12px 20px",
                gap: "8px",
                fontSize: "1rem",
                textDecoration: "none",
              }}
            >
              <PlusCircle size={20} className="stroke-[2.5]" />
              <span>Add items</span>
            </Link>
            <Link
              to="/categories"
              className="flex items-center rounded-2xl bg-white/10 border border-white/20 font-bold text-white shadow-lg transition-all hover:bg-white/20 active:scale-95"
              style={{
                padding: "12px 20px",
                gap: "8px",
                fontSize: "1rem",
                textDecoration: "none",
              }}
            >
              <FileSpreadsheet size={20} className="stroke-[2.5]" />
              <span>Categories</span>
            </Link>
            {user?.permissions.includes("manage_inventory") && (
              <Link
                to="/stock"
                className="flex items-center rounded-2xl border border-white/20 bg-white/10 font-bold text-white shadow-lg transition-all hover:bg-white/20 active:scale-95"
                style={{
                  padding: "12px 20px",
                  gap: "8px",
                  fontSize: "1rem",
                  textDecoration: "none",
                }}
              >
                <Boxes size={20} />
                <span>Inventory balance</span>
              </Link>
            )}

            <Link
              to="/audit-logs"
              className="flex items-center rounded-2xl border border-white/20 bg-white/10 font-bold text-white shadow-lg transition-all hover:bg-white/20 active:scale-95"
              style={{
                padding: "12px 20px",
                gap: "8px",
                fontSize: "1rem",
                textDecoration: "none",
              }}
            >
              <ClipboardList size={20} />
              <span>Activity log</span>
            </Link>

            <Link
              to="/product-management"
              className="flex items-center rounded-2xl border border-white/20 bg-white/10 font-bold text-white shadow-lg transition-all hover:bg-white/20 active:scale-95"
              style={{ padding: "12px 20px", gap: "8px", fontSize: "1rem", textDecoration: "none" }}
            >
              <Boxes size={20} />
              <span>Products</span>
            </Link>

            <Link
              to="/users"
              className="flex items-center rounded-2xl border border-white/20 bg-white/10 font-bold text-white shadow-lg transition-all hover:bg-white/20 active:scale-95"
              style={{ padding: "12px 20px", gap: "8px", fontSize: "1rem", textDecoration: "none" }}
            >
              <Users size={20} />
              <span>Users</span>
            </Link>

            <Link
              to="/shifts"
              className="flex items-center rounded-2xl border border-white/20 bg-white/10 font-bold text-white shadow-lg transition-all hover:bg-white/20 active:scale-95"
              style={{ padding: "12px 20px", gap: "8px", fontSize: "1rem", textDecoration: "none" }}
            >
              <Clock3 size={20} />
              <span>Shifts</span>
            </Link>

            {user && (
              <div
                className="flex items-center rounded-2xl border border-amber-400/30 bg-black/50 font-bold text-amber-400"
                style={{
                  padding: "12px 18px",
                  gap: "8px",
                }}
              >
                <User size={20} />
                <span>{user.fullName}</span>
              </div>
            )}

            <button
              type="button"
              onClick={logout}
              className="flex cursor-pointer items-center rounded-2xl border border-red-500/30 bg-red-600/80 font-bold text-white shadow-lg transition-all hover:bg-red-600 active:scale-95"
              style={{
                padding: "12px 20px",
                gap: "8px",
              }}
            >
              <LogOut size={20} />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {error && (
          <div
            className="rounded-2xl border border-red-500/40 bg-red-500/20 p-5 text-center text-lg font-bold text-red-200"
            style={{ marginBottom: "30px" }}
          >
            {error}
          </div>
        )}

        {stats && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            style={{ gap: "24px" }}
          >
            <StatCard
              label="Today's sales"
              value={`${stats.todaySalesTotal.toFixed(2)} JOD`}
              icon={<DollarSign size={28} className="stroke-[2.5]" />}
            />

            <StatCard
              label="Today's invoices"
              value={stats.todayInvoicesCount}
              icon={<Receipt size={28} className="stroke-[2.5]" />}
            />

            <StatCard
              label="Monthly sales"
              value={`${stats.monthSalesTotal.toFixed(2)} JOD`}
              icon={<TrendingUp size={28} className="stroke-[2.5]" />}
            />

            <StatCard
              label="Total invoices"
              value={stats.totalInvoicesCount}
              icon={<FileSpreadsheet size={28} className="stroke-[2.5]" />}
            />
          </div>
        )}
      </div>
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
    <div
      className="relative flex min-h-[170px] flex-col justify-between rounded-3xl border border-white/15 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl"
      style={{ boxSizing: "border-box" }}
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "16px" }}
      >
        <span className="text-base font-bold text-slate-300">{label}</span>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-md">
          {icon}
        </div>
      </div>

      <div className="text-3xl font-black tracking-tight text-amber-400">
        {value}
      </div>
    </div>
  );
}
