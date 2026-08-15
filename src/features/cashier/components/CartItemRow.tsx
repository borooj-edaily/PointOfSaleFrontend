import { Minus, Plus, Tag, X } from "lucide-react";
import type { Product } from "../../../types/catalog";
import type { UnitSold } from "../../../types/invoice";

export interface CartLine {
  product: Product;
  unitSold: UnitSold;
  quantity: number;
  // Price Override (feature: edit_price permission required). When set, this
  // price is charged instead of the catalog price for this line only.
  overridePrice?: number | null;
  overrideReason?: string | null;
}

interface Props {
  line: CartLine;
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  canOverridePrice?: boolean;
  onOverridePrice?: (productId: number) => void;
}

function catalogPrice(line: CartLine): number {
  return line.unitSold === "package"
    ? line.product.pricePerPackage ?? 0
    : line.product.pricePerPiece;
}

function unitPrice(line: CartLine): number {
  return line.overridePrice ?? catalogPrice(line);
}

function unitLabel(line: CartLine): string {
  return line.unitSold === "package" ? "Pack" : "Piece";
}

export function CartItemRow({
  line,
  onQuantityChange,
  onRemove,
  canOverridePrice = false,
  onOverridePrice,
}: Props) {
  const lineTotal = unitPrice(line) * line.quantity;
  const isOverridden = line.overridePrice != null;

  return (
    <li className="px-3.5 py-2.5 transition hover:bg-slate-900/60">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold leading-tight text-slate-100 line-clamp-1">{line.product.name}</p>
        <button
          type="button"
          onClick={() => onRemove(line.product.id)}
          className="shrink-0 text-slate-500 transition hover:text-red-400"
          aria-label="Remove item"
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
            className="flex h-5 w-5 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-amber-400/40 hover:text-white disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            <Minus size={10} />
          </button>
          <span className="w-4 text-center font-mono text-xs font-bold text-white">
            {line.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(line.product.id, line.quantity + 1)}
            className="flex h-5 w-5 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-amber-400/40 hover:text-white"
            aria-label="Increase quantity"
          >
            <Plus size={10} />
          </button>
          <span className="mr-1 text-[10px] text-slate-400 font-medium">{unitLabel(line)}</span>

          {canOverridePrice && (
            <button
              type="button"
              onClick={() => onOverridePrice?.(line.product.id)}
              className={`flex h-5 w-5 items-center justify-center rounded-lg border transition ${
                isOverridden
                  ? "border-amber-400/60 bg-amber-400/10 text-amber-300"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:border-amber-400/40 hover:text-amber-300"
              }`}
              aria-label="Override price"
              title={isOverridden ? "Price overridden — click to change" : "Override price"}
            >
              <Tag size={10} />
            </button>
          )}
        </div>

        <div className="text-right">
          <span className="font-mono text-xs font-extrabold text-amber-400">{lineTotal.toFixed(2)}</span>
          {isOverridden && (
            <p className="text-[9px] font-semibold text-amber-500/80 line-through decoration-1">
              {(catalogPrice(line) * line.quantity).toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}