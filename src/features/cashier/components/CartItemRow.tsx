import { Minus, Plus, X } from "lucide-react";
import type { Product } from "../../../types/catalog";
import type { UnitSold } from "../../../types/invoice";

export interface CartLine {
  product: Product;
  unitSold: UnitSold;
  quantity: number;
}

interface Props {
  line: CartLine;
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

function unitPrice(line: CartLine): number {
  return line.unitSold === "package"
    ? line.product.pricePerPackage ?? 0
    : line.product.pricePerPiece;
}

function unitLabel(line: CartLine): string {
  return line.unitSold === "package" ? "عبوة" : "قطعة";
}

export function CartItemRow({ line, onQuantityChange, onRemove }: Props) {
  const lineTotal = unitPrice(line) * line.quantity;

  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight text-slate-800">{line.product.name}</p>
        <button
          type="button"
          onClick={() => onRemove(line.product.id)}
          className="shrink-0 text-slate-300 transition hover:text-red-500"
          aria-label="حذف الصنف"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onQuantityChange(line.product.id, line.quantity - 1)}
            disabled={line.quantity <= 1}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
            aria-label="إنقاص الكمية"
          >
            <Minus size={12} />
          </button>
          <span className="w-6 text-center font-mono text-xs font-semibold text-slate-700">
            {line.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(line.product.id, line.quantity + 1)}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            aria-label="زيادة الكمية"
          >
            <Plus size={12} />
          </button>
          <span className="mr-1 text-[11px] text-slate-400">{unitLabel(line)}</span>
        </div>

        <span className="font-mono text-sm text-slate-600">{lineTotal.toFixed(2)}</span>
      </div>
    </li>
  );
}