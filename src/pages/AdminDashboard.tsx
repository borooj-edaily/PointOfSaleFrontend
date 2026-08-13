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
  ShoppingCart 
} from "lucide-react";
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
    <div
      dir="rtl"
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat font-sans"
      style={{
        padding: "30px 20px",
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1920&auto=format&fit=crop')`,
        boxSizing: "border-box"
      }}
    >
      {/* الحاوية الرئيسية للتصميم */}
      <div className="mx-auto w-full max-w-7xl">
        
        {/* الشريط العلوي - Header */}
        <div 
          className="relative rounded-3xl border border-white/15 bg-black/80 shadow-2xl backdrop-blur-2xl flex flex-wrap items-center justify-between"
          style={{
            padding: "24px 32px",
            marginBottom: "30px",
            boxSizing: "border-box"
          }}
        >
          {/* عنوان الصفحة ووسام السوبرماركت */}
          <div className="flex items-center" style={{ gap: "16px" }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-xl border-2 border-amber-300">
              <LayoutDashboard size={28} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase block" style={{ marginBottom: "4px" }}>
                AL-ISRAA Supermarket
              </span>
              <h1 className="text-3xl font-black text-white tracking-tight">
                لوحة تحكم الأدمن
              </h1>
            </div>
          </div>

          {/* عناصر التحكم والمعلومات */}
          <div className="flex flex-wrap items-center" style={{ gap: "16px", marginTop: "12px" }}>
            
            {/* زر إضافة أصناف */}
            <Link
              to="/products"
              className="flex items-center rounded-2xl bg-amber-400 font-bold text-slate-950 shadow-lg transition-all hover:bg-amber-300 active:scale-95 text-decoration-none"
              style={{
                padding: "12px 20px",
                gap: "8px",
                fontSize: "1rem"
              }}
            >
              <PlusCircle size={20} className="stroke-[2.5]" />
              <span>إضافة أصناف</span>
            </Link>

            {/* زر تعديل المخزون */}
            {user?.permissions.includes("manage_inventory") && (
              <Link
                to="/stock"
                className="flex items-center rounded-2xl bg-white/10 border border-white/20 font-bold text-white shadow-lg transition-all hover:bg-white/20 active:scale-95 text-decoration-none"
                style={{
                  padding: "12px 20px",
                  gap: "8px",
                  fontSize: "1rem"
                }}
              >
                <Boxes size={20} />
                <span>تعديل رصيد المخزون</span>
              </Link>
            )}

            {/* اسم المستخدم */}
            {user && (
              <div 
                className="flex items-center rounded-2xl bg-black/50 border border-amber-400/30 text-amber-400 font-bold"
                style={{
                  padding: "12px 18px",
                  gap: "8px"
                }}
              >
                <User size={20} />
                <span>{user.fullName}</span>
              </div>
            )}

            {/* زر تسجيل الخروج */}
            <button
              onClick={logout}
              className="flex items-center rounded-2xl bg-red-600/80 hover:bg-red-600 font-bold text-white shadow-lg transition-all active:scale-95 border border-red-500/30 cursor-pointer"
              style={{
                padding: "12px 20px",
                gap: "8px"
              }}
            >
              <LogOut size={20} />
              <span>تسجيل خروج</span>
            </button>
          </div>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div 
            className="rounded-2xl bg-red-500/20 p-5 text-center text-lg font-bold text-red-200 border border-red-500/40"
            style={{ marginBottom: "30px" }}
          >
            {error}
          </div>
        )}

        {/* بطاقات الإحصائيات (Stats Grid) */}
        {stats && (
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            style={{ gap: "24px" }}
          >
            <StatCard 
              label="مبيعات اليوم" 
              value={`${stats.todaySalesTotal.toFixed(2)} شيكل`} 
              icon={<DollarSign size={28} className="stroke-[2.5]" />} 
            />
            <StatCard 
              label="عدد فواتير اليوم" 
              value={stats.todayInvoicesCount} 
              icon={<Receipt size={28} className="stroke-[2.5]" />} 
            />
            <StatCard 
              label="مبيعات الشهر" 
              value={`${stats.monthSalesTotal.toFixed(2)} شيكل`} 
              icon={<TrendingUp size={28} className="stroke-[2.5]" />} 
            />
            <StatCard 
              label="إجمالي الفواتير" 
              value={stats.totalInvoicesCount} 
              icon={<FileSpreadsheet size={28} className="stroke-[2.5]" />} 
            />
          </div>
        )}

      </div>
    </div>
  );
}

{/* مكون بطاقات الإحصائيات المصمم بذات الهوية */}
function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div 
      className="relative rounded-3xl border border-white/15 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl flex flex-col justify-between"
      style={{
        minHeight: "170px",
        boxSizing: "border-box"
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
        <span className="text-base font-bold text-slate-300">
          {label}
        </span>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-md">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-amber-400 tracking-tight">
        {value}
      </div>
    </div>
  );
}