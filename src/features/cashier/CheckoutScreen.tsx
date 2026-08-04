import { Fragment, useState } from "react";
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
  return line.unitSold === "package" ? "عبوة" : "قطعة";
}

const QUICK_AMOUNTS = [20, 50, 100];
const NUMPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

const DISABLED_NUMPAD_ACTIONS: { label: string; icon: typeof Split }[] = [
  { label: "تقسيم بالتساوي", icon: Split },
  { label: "المكافآت", icon: Percent },
  { label: "رسوم خدمة", icon: Receipt },
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

  const tenderedValue = tendered === "" ? 0 : Number(tendered);
  const change = tenderedValue - total;
  const canConfirm = tenderedValue >= total;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  function pressDigit(digit: string) {
    setTendered((prev) => (prev.length >= 9 ? prev : prev + digit));
  }

  function clear() {
    setTendered("");
  }

  function backspace() {
    setTendered((prev) => prev.slice(0, -1));
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-[#F1F2EF]" dir="rtl">
      {/* Order ticket */}
      <aside className="flex w-[300px] shrink-0 flex-col border-l border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
              aria-label="رجوع للسلة"
            >
              <ArrowRight size={16} />
            </button>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {invoiceLabel}
              </p>
              <p className="text-sm font-semibold text-slate-900">{cashierName}</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            <Users size={12} />
            {itemCount} صنف
          </span>
        </div>

        <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
          {lines.map((line) => (
            <li key={line.product.id} className="flex items-start justify-between gap-2 px-4 py-2.5">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-md bg-slate-100 px-1 font-mono text-xs font-semibold text-slate-500">
                  {line.quantity}
                </span>
                <div>
                  <p className="text-sm leading-tight text-slate-800">{line.product.name}</p>
                  <p className="text-[11px] text-slate-400">{unitLabel(line)}</p>
                </div>
              </div>
              <span className="font-mono text-sm text-slate-600">
                {(unitPrice(line) * line.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="space-y-1.5 border-t border-slate-100 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>المجموع الفرعي</span>
            <span className="font-mono">{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>الخصم</span>
            <span className="font-mono">-{discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-dashed border-slate-200 pt-2 text-base font-semibold text-slate-900">
            <span>المبلغ المستحق</span>
            <span className="font-mono">{total.toFixed(2)} د.أ</span>
          </div>
        </div>
      </aside>

      {/* Numpad */}
      <section className="flex flex-1 flex-col justify-center px-10">
        <p className="mb-1 text-sm text-slate-400">المبلغ المستحق</p>
        <p className="mb-8 text-4xl font-bold tracking-tight text-slate-900">
          {total.toFixed(2)} <span className="text-xl font-semibold text-slate-400">د.أ</span>
        </p>

        <div className="mb-6 grid max-w-md grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-400">المبلغ المستلم</p>
            <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-left font-mono text-xl text-slate-900">
              {tendered === "" ? "0" : tendered}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-400">الباقي</p>
            <div
              className={`rounded-xl border px-4 py-3 text-left font-mono text-xl ${
                tenderedValue > 0 && change >= 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {tenderedValue > 0 ? Math.max(change, 0).toFixed(2) : "0.00"}
            </div>
          </div>
        </div>

        <div className="grid max-w-md grid-cols-4 gap-3">
          {NUMPAD_ROWS.map((row, rowIndex) => (
            <Fragment key={row.join("")}>
              {row.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => pressDigit(key)}
                  className="rounded-xl border border-slate-200 bg-white py-4 text-lg font-medium text-slate-800 transition hover:bg-slate-50"
                >
                  {key}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTendered(String(QUICK_AMOUNTS[rowIndex]))}
                className="rounded-xl border border-slate-200 bg-slate-100 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                {QUICK_AMOUNTS[rowIndex]} د.أ
              </button>
            </Fragment>
          ))}

          <button
            type="button"
            onClick={clear}
            className="rounded-xl border border-slate-200 bg-white py-4 text-lg font-medium text-slate-500 transition hover:bg-slate-50"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => pressDigit("0")}
            className="rounded-xl border border-slate-200 bg-white py-4 text-lg font-medium text-slate-800 transition hover:bg-slate-50"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => pressDigit("00")}
            className="rounded-xl border border-slate-200 bg-white py-4 text-lg font-medium text-slate-800 transition hover:bg-slate-50"
          >
            00
          </button>
          <button
            type="button"
            onClick={backspace}
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-4 text-slate-500 transition hover:bg-slate-50"
            aria-label="حذف"
          >
            <Delete size={18} />
          </button>
        </div>

        <div className="mt-4 grid max-w-md grid-cols-3 gap-3">
          {DISABLED_NUMPAD_ACTIONS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              disabled
              title="قريباً"
              className="flex cursor-not-allowed flex-col items-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-3 text-[11px] font-medium text-slate-300"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Cash payment summary */}
      <aside className="flex w-[280px] shrink-0 flex-col gap-4 border-r border-slate-200 bg-white p-5">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-4">
          <Banknote className="text-emerald-700" size={22} />
          <span className="text-sm font-semibold text-emerald-700">الدفع نقداً</span>
        </div>

        <div className="space-y-2.5 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>المبلغ المستحق</span>
            <span className="font-mono font-semibold text-slate-900">
              {total.toFixed(2)} د.أ
            </span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>المبلغ المستلم</span>
            <span className="font-mono font-semibold text-slate-900">
              {tendered === "" ? "0.00" : tendered}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t border-dashed border-slate-200 pt-2.5">
            <span className="font-semibold text-emerald-700">الباقي</span>
            <span className="font-mono text-lg font-bold text-emerald-700">
              {Math.max(change, 0).toFixed(2)} د.أ
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            className="w-full rounded-xl bg-emerald-600 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-default disabled:opacity-40"
          >
            {loading ? "جارٍ الحفظ..." : "تأكيد الدفع وطباعة الفاتورة"}
          </button>
        </div>
      </aside>
    </div>
  );
}