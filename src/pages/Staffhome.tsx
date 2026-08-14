import { Link } from "react-router-dom";
import { Boxes, Clock3, PackagePlus, ShoppingCart, LogOut, User, Store, Tag } from "lucide-react";
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
      label: "Categories",
      description: "Add or deactivate product categories",
      icon: Tag,
    },
    permissions.includes("manage_inventory") && {
      to: "/stock",
      label: "Inventory balance",
      description: "Add received stock or make manual deductions and review movement history",
      icon: Boxes,
    },
    permissions.includes("manage_products") && {
      to: "/products/add",
      label: "Add items",
      description: "Create a new product with its price and sale method",
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
            </div>
          </div>

          <button
            onClick={logout}
            type="button"
            className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/50 active:scale-95 shadow-md cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 py-12 max-w-5xl mx-auto w-full">
        <div className="mb-8 text-center sm:text-right">
          <h2 className="text-2xl font-black text-white">Main service screen</h2>
          <p className="text-xs font-medium text-slate-400 mt-1">Choose one of the available services to access it</p>
        </div>

        <div className="mb-6">
          <LowStockWidget />
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
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-3 text-center text-[10px] font-medium text-slate-600">
        All rights reserved © {new Date().getFullYear()} - AL-ISRAA Supermarket
      </footer>
    </div>
  );
}