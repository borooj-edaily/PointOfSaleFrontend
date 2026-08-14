import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Boxes, Loader2, Plus, X } from "lucide-react";
import { getAllProducts, deactivateProduct, activateProduct } from "../api/productApi";
import { getAllCategories, type Category } from "../api/categoryApi";
import { getCurrentUser } from "../api/authApi";
import { ApiError } from "../api/httpClient";
import type { Product } from "../types/catalog";

const SELL_BY_LABELS: Record<number, string> = {
  1: "بالحبة",
  2: "بالباكيج",
  3: "الاثنين",
};

export default function ProductsListPage() {
  const currentUser = getCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryIdFromUrl = searchParams.get("categoryId") ?? "";
  const categoryNameFromUrl = searchParams.get("categoryName") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>(categoryIdFromUrl);
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  function loadProducts() {
    setIsLoading(true);
    setLoadError(null);
    getAllProducts({
      categoryId: categoryFilter ? Number(categoryFilter) : undefined,
      search: search.trim() || undefined,
      onlyActive,
    })
      .then((data) => setProducts(data))
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : "تعذّر تحميل الأصناف.");
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    getAllCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // إذا تغيّر الرابط (مثلاً ضغط اسم كاتيجوري تانية)، حدّث الفلتر تلقائياً
  useEffect(() => {
    setCategoryFilter(categoryIdFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryIdFromUrl]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, onlyActive]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadProducts();
  }

  function clearCategoryFilter() {
    setSearchParams({});
    setCategoryFilter("");
  }

  function handleCategorySelectChange(value: string) {
    setCategoryFilter(value);
    // لو المستخدم غيّر الفلتر يدوياً من القائمة، امسح categoryName من الرابط
    // (لأنه صار الفلتر يدوي مش قادم من ضغطة على كاتيجوري معيّنة)
    setSearchParams(value ? { categoryId: value } : {});
  }

  async function handleDeactivate(id: number) {
    if (!confirm("هل أنت متأكد من تعطيل هذا الصنف؟")) return;

    setDeactivatingId(id);
    try {
      await deactivateProduct(id, currentUser?.id ?? null);
      loadProducts();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "تعذّر تعطيل الصنف.");
    } finally {
      setDeactivatingId(null);
    }
  }

  async function handleActivate(id: number) {
    setActivatingId(id);
    try {
      await activateProduct(id, currentUser?.id ?? null);
      loadProducts();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "تعذّر تفعيل الصنف.");
    } finally {
      setActivatingId(null);
    }
  }

  const pageTitle = categoryNameFromUrl ? categoryNameFromUrl : "كل الأصناف";

  return (
    <div dir="rtl" className="min-h-screen bg-[#F1F2EF]">
      <header className="flex items-center justify-between bg-[#1C2333] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link
            to={currentUser?.role === "Admin" ? "/dashboard" : "/home"}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10"
            aria-label="رجوع"
          >
            <ArrowRight size={16} />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">إدارة الأصناف</p>
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
        </div>
        <Link
          to="/products/add"
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus size={14} />
          إضافة صنف
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {categoryNameFromUrl && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
            <p className="text-sm text-emerald-700">
              عم تشوف أصناف كاتيجوري: <span className="font-semibold">{categoryNameFromUrl}</span>
            </p>
            <button
              type="button"
              onClick={clearCategoryFilter}
              className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
            >
              <X size={14} />
              عرض كل الأصناف
            </button>
          </div>
        )}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="mb-4 flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="دوّر باسم الصنف..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
            />

            <select
              value={categoryFilter}
              onChange={(e) => handleCategorySelectChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
            >
              <option value="">كل الكاتيجوريز</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="rounded border-slate-300"
              />
              الفعّالة فقط
            </label>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              بحث
            </button>
          </form>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : loadError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{loadError}</p>
          ) : products.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">لا يوجد أصناف مطابقة.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2.5 pl-3 font-medium">الاسم</th>
                    <th className="px-3 py-2.5 font-medium">طريقة البيع</th>
                    <th className="px-3 py-2.5 font-medium">سعر الحبة</th>
                    <th className="px-3 py-2.5 font-medium">سعر الباكيج</th>
                    <th className="px-3 py-2.5 font-medium">المخزون</th>
                    <th className="px-3 py-2.5 font-medium">الحالة</th>
                    <th className="py-2.5 pr-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pl-3 text-sm font-medium text-slate-900">{p.name}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {p.piecesPerPackage
                          ? p.pricePerPiece && p.pricePerPackage
                            ? SELL_BY_LABELS[3]
                            : SELL_BY_LABELS[2]
                          : SELL_BY_LABELS[1]}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">
                        {p.pricePerPiece ? `${p.pricePerPiece.toFixed(2)} د.أ` : "—"}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">
                        {p.pricePerPackage ? `${p.pricePerPackage.toFixed(2)} د.أ` : "—"}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-900">
                        <span className="inline-flex items-center gap-1">
                          <Boxes size={12} className="text-slate-400" />
                          {p.stockInPieces} حبة
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            p.isActive
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.isActive ? "فعّال" : "معطّل"}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-left">
                        {p.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(p.id)}
                            disabled={deactivatingId === p.id}
                            className="text-sm font-medium text-red-600 transition hover:text-red-800 disabled:opacity-50"
                          >
                            {deactivatingId === p.id ? "جارِ التعطيل..." : "تعطيل"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivate(p.id)}
                            disabled={activatingId === p.id}
                            className="text-sm font-medium text-emerald-600 transition hover:text-emerald-800 disabled:opacity-50"
                          >
                            {activatingId === p.id ? "جارِ التفعيل..." : "تفعيل"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}