import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats, type DashboardStats } from "../api/dashboardApi";
import { getCurrentUser, logout } from "../api/authApi";

export default function AdminDashboard() {
  const user = getCurrentUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "فشل تحميل الاحصائيات"));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h1>لوحة تحكم الادمن</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            to="/products"
            style={{
              background: "#059669",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            + إضافة أصناف
          </Link>
          {user && <span>{user.fullName}</span>}
          <button onClick={logout}>تسجيل خروج</button>
        </div>
      </div>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <StatCard label="مبيعات اليوم" value={stats.todaySalesTotal.toFixed(2)} />
          <StatCard label="عدد فواتير اليوم" value={stats.todayInvoicesCount} />
          <StatCard label="مبيعات الشهر" value={stats.monthSalesTotal.toFixed(2)} />
          <StatCard label="اجمالي الفواتير" value={stats.totalInvoicesCount} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "1rem" }}>
      <p style={{ color: "#94a3b8", marginBottom: "0.5rem" }}>{label}</p>
      <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{value}</p>
    </div>
  );
}