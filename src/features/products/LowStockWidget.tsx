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
      <div className="mb-5 flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-6">
        <Loader2 size={18} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-600" />
        <p className="text-sm font-semibold text-amber-800">
          {items.length} صنف وصل لحد المخزون الأدنى
        </p>
      </div>

      <ul className="space-y-1.5">
        {items.slice(0, 4).map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-slate-700">{item.name}</span>
            <span className="font-mono text-xs text-amber-700">
              {item.stockInPieces} حبة متبقية
            </span>
          </li>
        ))}
      </ul>

      <Link
        to="/products"
        className="mt-3 inline-block text-xs font-medium text-amber-700 underline hover:text-amber-900"
      >
        عرض كل الأصناف
      </Link>
    </div>
  );
}