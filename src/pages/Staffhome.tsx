import { Link } from "react-router-dom";
import { Boxes, Clock3, PackagePlus, ShoppingCart } from "lucide-react";
import { getCurrentUser, logout } from "../api/authApi";

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
    permissions.includes("manage_inventory") && {
      to: "/stock",
      label: "تعديل رصيد المخزون",
      description: "إضافة كمية مستلمة أو خصم يدوي، وعرض سجل الحركات",
      icon: Boxes,
    },
    permissions.includes("manage_products") && {
      to: "/products",
      label: "إضافة أصناف",
      description: "تعريف صنف جديد بالنظام مع سعره وطريقة بيعه",
      icon: PackagePlus,
    },
    permissions.includes("create_invoice") && {
      to: "/cashier",
      label: "شاشة الكاشير",
      description: "فتح فاتورة بيع جديدة",
      icon: ShoppingCart,
    },
    {
      to: "/shifts",
      label: "إدارة الدوام",
      description: "تسجيل بداية ونهاية الدوام ومراجعة الدوامات السابقة",
      icon: Clock3,
    },
  ].filter(Boolean) as ActionCard[];

  return (
    <div dir="rtl" className="pos-page">
      <header className="flex items-center justify-between bg-[#1C2333] px-6 py-4 text-white shadow-md">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">نظام نقطة البيع</p>
          <h1 className="text-lg font-semibold">أهلاً، {user?.fullName ?? "مستخدم"}</h1>
        </div>
        <button
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          تسجيل خروج
        </button>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {cards.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            ما في أي صلاحيات مفعّلة لحسابك حالياً. تواصل مع الأدمن.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <card.icon size={20} />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">{card.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
