import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { getLowStockProducts, type LowStockDto } from "../../api/productApi";

export function LowStockWidget() {
  const [items, setItems] = useState<LowStockDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLowStockProducts(10)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="mb-5 flex items-center justify-center rounded-2xl border border-slate-800 bg-black/80 py-6 backdrop-blur-2xl">
        <Loader2 size={18} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-5 rounded-2xl border border-red-300 bg-red-100 p-5 shadow-xl">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={18} className="text-red-800" />
        <p className="text-sm font-semibold text-red-800">
          {items.length} item{items.length !== 1 ? "s" : ""} reached minimum stock
        </p>
      </div>

      <ul className="space-y-1.5">
        {items.slice(0, 4).map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-red-900">{item.name}</span>
            <span className="font-mono text-xs font-semibold text-red-800">
              {item.stockInPieces} left
            </span>
          </li>
        ))}
      </ul>

      <Link
        to="/products"
        className="mt-3 inline-block text-xs font-medium text-red-800 underline hover:text-red-900"
      >
        View all products
      </Link>
    </div>
  );
}