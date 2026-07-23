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

export function CartItemRow({ line, onQuantityChange, onRemove }: Props) {
  const lineTotal = unitPrice(line) * line.quantity;

  return (
    <tr className="border-b border-gray-200">
      <td className="py-2 px-3">{line.product.name}</td>
      <td className="py-2 px-3 text-gray-500">{line.unitSold}</td>
      <td className="py-2 px-3">
        <input
          type="number"
          min={1}
          value={line.quantity}
          onChange={(e) => onQuantityChange(line.product.id, Number(e.target.value))}
          className="w-16 border border-gray-300 rounded px-2 py-1"
        />
      </td>
      <td className="py-2 px-3">${unitPrice(line).toFixed(2)}</td>
      <td className="py-2 px-3 font-medium">${lineTotal.toFixed(2)}</td>
      <td className="py-2 px-3">
        <button
          onClick={() => onRemove(line.product.id)}
          className="text-red-600 hover:underline"
        >
          Remove
        </button>
      </td>
    </tr>
  );
}
