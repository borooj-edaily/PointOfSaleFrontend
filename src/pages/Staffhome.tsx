import { Link } from "react-router-dom";
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
      label: "تعديل رصيد المخزون",
      description: "إضافة كمية مستلمة أو خصم يدوي، وعرض سجل الحركات",
      icon: Boxes,
    },
    permissions.includes("manage_products") && {
      to: "/products",
      label: "الأصناف",
      description: "عرض كل الأصناف، إضافة صنف جديد، أو تعطيل صنف",
      icon: PackagePlus,
    },
    permissions.includes("create_invoice") && {
      to: "/cashier",
      label: "شاشة الكاشير",
      description: "فتح فاتورة بيع جديدة",
      icon: ShoppingCart,
    },
  ].filter(Boolean) as ActionCard[];

  const today = new Intl.DateTimeFormat("ar-JO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const initial = (user?.fullName ?? "م").trim().charAt(0).toUpperCase();

  return (
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
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} />
            تسجيل خروج
          </button>
        </div>
      </header>

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
      </div>
    </div>
  );
}