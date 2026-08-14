import { Link } from "react-router-dom";
import { Boxes, Clock3, PackagePlus, ShoppingCart, LogOut, User, Store } from "lucide-react";
import { Boxes, ChevronLeft, LogOut, PackagePlus, ShoppingCart, Tag } from "lucide-react";
import { getCurrentUser, logout } from "../api/authApi";
import { LowStockWidget } from "../features/products/LowStockWidget";

interface ActionCard {
  to: string;
  label: string;
  description: string;
  icon: typeof PackagePlus;
}

export default function StaffHome() {
  const user = getCurrentUser();
  const permissions = user?.permissions ?? [];

  const cards: ActionCard[] = [
    permissions.includes("manage_products") && {
      to: "/categories",
      label: "الكاتيجوريز",
      description: "إضافة أو تعطيل تصنيفات الأصناف",
      icon: Tag,
    },
    permissions.includes("manage_inventory") && {
      to: "/stock",
      label: "Inventory balance",
      description: "Add received stock or make manual deductions and review movement history",
      icon: Boxes,
    },
    permissions.includes("manage_products") && {
      to: "/products",
      label: "Add items",
      description: "Create a new product with its price and sale method",
      label: "الأصناف",
      description: "عرض كل الأصناف، إضافة صنف جديد، أو تعطيل صنف",
      icon: PackagePlus,
    },
    permissions.includes("create_invoice") && {
      to: "/cashier",
      label: "Cashier screen",
      description: "Open a new sales invoice",
      icon: ShoppingCart,
    },
    {
      to: "/shifts",
      label: "Shift management",
      description: "Register start/end of shift and review previous shifts",
      icon: Clock3,
    },
  ].filter(Boolean) as ActionCard[];

  const today = new Intl.DateTimeFormat("ar-JO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const initial = (user?.fullName ?? "م").trim().charAt(0).toUpperCase();

  return (
    <div
      dir="rtl"
      className="pos-page relative min-h-screen w-full text-slate-100 select-none overflow-x-hidden flex flex-col font-sans"
    >
      <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between border-b border-amber-500/20 bg-black/80 px-6 py-4 backdrop-blur-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-inner">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wide text-white">
              AL-ISRAA Supermarket <span className="text-xs font-bold text-amber-400">| AL-ISRAA</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400">POS system</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 backdrop-blur-md">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <User size={15} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium text-slate-400 leading-none">Welcome</p>
              <p className="text-xs font-extrabold text-amber-400 leading-tight">
                {user?.fullName ?? "User"}
              </p>
    <div dir="rtl" className="min-h-screen bg-[#F1F2EF]">
      {/* Header */}
      <header className="bg-[#1C2333]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white">
              {initial}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                نظام نقطة البيع
              </p>
              <h1 className="mt-0.5 text-base font-semibold text-white">
                أهلاً، <bdi>{user?.fullName ?? "مستخدم"}</bdi>
              </h1>
            </div>
          </div>

          <button
            onClick={logout}
            type="button"
            className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/50 active:scale-95 shadow-md cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log out</span>
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} />
            تسجيل خروج
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 py-12 max-w-5xl mx-auto w-full">
        <div className="mb-8 text-center sm:text-right">
          <h2 className="text-2xl font-black text-white">Main service screen</h2>
          <p className="text-xs font-medium text-slate-400 mt-1">Choose one of the available services to access it</p>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-3xl border border-amber-500/20 bg-black/80 p-8 text-center backdrop-blur-2xl shadow-2xl">
            <p className="text-sm font-semibold text-amber-400">
              No permissions are currently enabled for your account. Please contact the admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              const isCashier = card.to === "/cashier";

              return (
                <Link
                  key={card.to}
                  to={card.to}
                  className={`group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 active:scale-[0.98] ${
                    isCashier
                      ? "border-amber-500/40 bg-black/80 hover:border-amber-400 shadow-xl shadow-amber-500/5"
                      : "border-slate-800/80 bg-black/80 hover:border-amber-500/30 hover:bg-black/90"
                  } backdrop-blur-2xl`}
                >
                  <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl transition-all group-hover:bg-amber-500/15" />

                  <div className="relative z-10 flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-110 ${
                        isCashier
                          ? "border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-inner"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      <Icon size={28} />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                          {card.label}
                        </h3>
                        {isCashier && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                            Main
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium leading-relaxed text-slate-400 group-hover:text-slate-300">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
      {/* Body */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <LowStockWidget />

        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-sm font-semibold text-slate-700">المهام المتاحة</h2>
          <span className="text-xs text-slate-400">{today}</span>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-600">
              ما في أي صلاحيات مفعّلة لحسابك حالياً
            </p>
            <p className="mt-1 text-sm text-slate-400">
              تواصل مع الأدمن لتفعيل الصلاحيات المناسبة لدورك.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <card.icon size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-slate-900">{card.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {card.description}
                  </p>
                </div>

                <ChevronLeft
                  size={18}
                  className="shrink-0 text-slate-300 transition group-hover:-translate-x-0.5 group-hover:text-emerald-600"
                />
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-3 text-center text-[10px] font-medium text-slate-600">
        All rights reserved © {new Date().getFullYear()} - AL-ISRAA Supermarket
      </footer>
    </div>
  );
}