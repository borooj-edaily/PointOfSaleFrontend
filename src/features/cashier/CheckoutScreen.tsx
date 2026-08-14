import { Fragment, useState, useEffect } from "react";
import {
  ArrowRight,
  Banknote,
  Delete,
  Percent,
  Receipt,
  Split,
  Users,
} from "lucide-react";
import type { CartLine } from "./components/CartItemRow";

interface CheckoutScreenProps {
  invoiceLabel: string;
  cashierName: string;
  lines: CartLine[];
  subtotal: number;
  discountAmount: number;
  total: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function unitPrice(line: CartLine): number {
  return line.unitSold === "package" ? line.product.pricePerPackage ?? 0 : line.product.pricePerPiece;
}

function unitLabel(line: CartLine): string {
  return line.unitSold === "package" ? "Package" : "Piece";
}

const QUICK_AMOUNTS = [20, 50, 100];
const NUMPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

const DISABLED_NUMPAD_ACTIONS: { label: string; icon: typeof Split }[] = [
  { label: "Split evenly", icon: Split },
  { label: "Rewards", icon: Percent },
  { label: "Service fee", icon: Receipt },
];

export function CheckoutScreen({
  invoiceLabel,
  cashierName,
  lines,
  subtotal,
  discountAmount,
  total,
  loading,
  onConfirm,
  onCancel,
}: CheckoutScreenProps) {
  const [tendered, setTendered] = useState<string>("");

  const roundedTotal = Math.round((total || 0) * 100) / 100;
  const tenderedValue = tendered === "" ? 0 : parseFloat(tendered) || 0;
  const roundedTendered = Math.round(tenderedValue * 100) / 100;

  const change = Math.max(0, Math.round((roundedTendered - roundedTotal) * 100) / 100);
  const canConfirm = roundedTendered >= roundedTotal;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  function pressDigit(digit: string) {
    setTendered((prev) => {
      if (prev.length >= 9) return prev;
      if (digit === ".") {
        if (prev.includes(".")) return prev;
        if (prev === "") return "0.";
      }
      if (prev === "0" && digit !== ".") return digit;
      return prev + digit;
    });
  }

  function clear() {
    setTendered("");
  }

  function backspace() {
    setTendered((prev) => prev.slice(0, -1));
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key >= "0" && e.key <= "9") || e.key === ".") {
        pressDigit(e.key);
      } else if (e.key === "Backspace") {
        backspace();
      } else if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter" && canConfirm && !loading) {
        e.preventDefault();
        onConfirm();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canConfirm, loading, onConfirm, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen bg-slate-950/90 backdrop-blur-md overflow-hidden text-slate-100 select-none" dir="rtl">
      <aside className="flex w-[320px] shrink-0 flex-col border-l border-amber-500/20 bg-black/80 backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-amber-400/50 hover:bg-slate-800 hover:text-amber-400 active:scale-95"
              aria-label="Back to cart"
            >
              <ArrowRight size={16} />
            </button>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                {invoiceLabel}
              </p>
              <p className="text-xs font-bold text-slate-100">{cashierName}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
            <Users size={12} className="text-amber-400" />
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
        </div>

        <ul className="flex-1 divide-y divide-slate-800/60 overflow-y-auto bg-slate-950/30">
          {lines.map((line) => (
            <li key={line.product.id} className="flex items-start justify-between gap-2 px-4 py-3 transition hover:bg-slate-900/40">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 px-1 font-mono text-xs font-bold text-amber-300">
                  {line.quantity}
                </span>
                <div>
                  <p className="text-xs font-bold leading-tight text-slate-200 line-clamp-1">{line.product.name}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">{unitLabel(line)}</p>
                </div>
              </div>
              <span className="font-mono text-xs font-extrabold text-amber-400">
                {(unitPrice(line) * line.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="space-y-1.5 border-t border-slate-800/80 bg-slate-950/90 p-4 text-xs">
          <div className="flex justify-between font-medium text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono text-slate-200">{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium text-slate-400">
            <span>Discount</span>
            <span className="font-mono text-red-400">-{discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-slate-800/80 pt-2.5 text-sm font-bold text-white">
            <span>Amount due</span>
            <span className="font-mono text-lg font-extrabold text-amber-400">{roundedTotal.toFixed(2)} <span className="text-xs font-sans">JOD</span></span>
          </div>
        </div>
      </aside>

      <section className="flex flex-1 flex-col justify-center px-8 lg:px-12 bg-slate-950/60">
        <div className="max-w-md mx-auto w-full">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Amount due</p>
          <p className="mb-6 text-5xl font-mono font-extrabold tracking-tight text-amber-400 drop-shadow-md">
            {roundedTotal.toFixed(2)} <span className="text-2xl font-sans font-semibold text-slate-500">JOD</span>
          </p>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1.5 text-xs font-bold text-slate-400">Amount received</p>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-left font-mono text-xl font-bold text-white shadow-inner">
                {tendered === "" ? "0" : tendered}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold text-slate-400">Change</p>
              <div
                className={`rounded-2xl border px-4 py-3 text-left font-mono text-xl font-bold shadow-inner transition-all ${
                  canConfirm
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700/80 bg-slate-900/90 text-slate-500"
                }`}
              >
                {canConfirm ? change.toFixed(2) : "0.00"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {NUMPAD_ROWS.map((row, rowIndex) => (
              <Fragment key={row.join("")}>
                {row.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pressDigit(key)}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 py-3.5 text-xl font-extrabold text-slate-100 shadow-md transition hover:border-amber-400/50 hover:bg-slate-800 hover:text-amber-300 active:scale-95"
                  >
                    {key}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTendered(String(QUICK_AMOUNTS[rowIndex]))}
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 py-3.5 text-xs font-extrabold text-amber-300 shadow-md transition hover:bg-amber-500/20 hover:border-amber-400 active:scale-95"
                >
                  {QUICK_AMOUNTS[rowIndex]} JOD
                </button>
              </Fragment>
            ))}

            <button
              type="button"
              onClick={clear}
              className="rounded-2xl border border-red-500/30 bg-red-500/10 py-3.5 text-xl font-extrabold text-red-400 shadow-md transition hover:bg-red-500/20 hover:border-red-500/50 active:scale-95"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => pressDigit("0")}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 py-3.5 text-xl font-extrabold text-slate-100 shadow-md transition hover:border-amber-400/50 hover:bg-slate-800 hover:text-amber-300 active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => pressDigit(".")}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 py-3.5 text-xl font-extrabold text-amber-400 shadow-md transition hover:border-amber-400/50 hover:bg-slate-800 hover:text-amber-300 active:scale-95"
            >
              .
            </button>
            <button
              type="button"
              onClick={backspace}
              className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 py-3.5 text-slate-400 shadow-md transition hover:border-red-500/40 hover:bg-slate-800 hover:text-red-400 active:scale-95"
              aria-label="Delete"
            >
              <Delete size={20} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {DISABLED_NUMPAD_ACTIONS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                title="Coming soon"
                className="flex cursor-not-allowed flex-col items-center gap-1 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 py-2.5 text-[10px] font-bold text-slate-500 opacity-60"
              >
                <Icon size={15} className="mb-0.5 text-slate-500" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="flex w-[300px] shrink-0 flex-col gap-4 border-r border-amber-500/20 bg-black/80 backdrop-blur-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 py-3.5 shadow-lg shadow-amber-500/5">
          <Banknote className="text-amber-400" size={20} />
          <span className="text-xs font-extrabold text-amber-300">Cash payment</span>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 text-xs shadow-inner">
          <div className="flex justify-between font-medium text-slate-400">
            <span>Amount due</span>
            <span className="font-mono font-bold text-slate-200">
              {roundedTotal.toFixed(2)} JOD
            </span>
          </div>
          <div className="flex justify-between font-medium text-slate-400">
            <span>Amount received</span>
            <span className="font-mono font-bold text-slate-200">
              {tendered === "" ? "0.00" : parseFloat(tendered || "0").toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t border-dashed border-slate-800 pt-3 mt-1">
            <span className="font-bold text-amber-400">Change</span>
            <span className="font-mono text-xl font-extrabold text-amber-400 drop-shadow">
              {canConfirm ? change.toFixed(2) : "0.00"} JOD
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <button
            type="button"
            onClick={() => {
              if (canConfirm && !loading) {
                onConfirm();
              }
            }}
            disabled={!canConfirm || loading}
            className="w-full rounded-2xl bg-amber-400 py-3.5 text-xs sm:text-sm font-extrabold text-black shadow-lg shadow-amber-400/10 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-30 disabled:bg-slate-800 disabled:text-slate-500 active:scale-[0.98]"
          >
            {loading ? "Saving..." : "Confirm payment and print invoice"}
          </button>
        </div>
      </aside>
    </div>
  );
}