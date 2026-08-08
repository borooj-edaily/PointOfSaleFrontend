import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, PackagePlus } from "lucide-react";
import { getAllCategories, type Category } from "../api/categoryApi";
import { createProduct, type SellByType } from "../api/productApi";
import { getCurrentUser } from "../api/authApi";
import { ApiError } from "../api/httpClient";

type SellByOption = "piece" | "package" | "both";

const SELL_BY_TO_ENUM: Record<SellByOption, SellByType> = {
  piece: 1,
  package: 2,
  both: 3,
};

interface AddedProduct {
  id: number;
  name: string;
  categoryName: string;
  sellBy: SellByOption;
  pricePerPiece: string;
  pricePerPackage: string;
  stockInPieces: string;
}

const emptyForm = {
  name: "",
  categoryId: "",
  sellBy: "piece" as SellByOption,
  piecesPerPackage: "",
  pricePerPiece: "",
  pricePerPackage: "",
  stockInPieces: "0",
};

export default function AddProductsPage() {
  const currentUser = getCurrentUser();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesStatus, setCategoriesStatus] = useState<"loading" | "idle" | "error">("loading");

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    getAllCategories()
      .then((data) => {
        if (cancelled) return;
        setCategories(data);
        setCategoriesStatus("idle");
        setForm((prev) => ({ ...prev, categoryId: data[0] ? String(data[0].id) : "" }));
      })
      .catch(() => {
        if (cancelled) return;
        setCategoriesStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.name.trim()) return "اسم الصنف مطلوب.";
    if (!form.categoryId) return "لازم تختار كاتيجوري.";

    if ((form.sellBy === "piece" || form.sellBy === "both") && !form.pricePerPiece) {
      return "سعر الحبة مطلوب عند البيع بالحبة.";
    }
    if (form.sellBy === "package" || form.sellBy === "both") {
      if (!form.pricePerPackage) return "سعر الباكيج مطلوب عند البيع بالباكيج.";
      if (!form.piecesPerPackage) return "عدد الحبات بالباكيج مطلوب عند البيع بالباكيج.";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await createProduct({
        name: form.name.trim(),
        categoryId: Number(form.categoryId),
        sellBy: SELL_BY_TO_ENUM[form.sellBy],
        piecesPerPackage: form.piecesPerPackage ? Number(form.piecesPerPackage) : null,
        pricePerPiece:
          form.sellBy === "piece" || form.sellBy === "both" ? Number(form.pricePerPiece) : null,
        pricePerPackage:
          form.sellBy === "package" || form.sellBy === "both" ? Number(form.pricePerPackage) : null,
        stockInPieces: form.stockInPieces ? Number(form.stockInPieces) : 0,
        createdByUserId: currentUser?.id ?? null,
      });

      const categoryName =
        categories.find((c) => String(c.id) === form.categoryId)?.name ?? "";

      setAddedProducts((prev) => [
        {
          id: result.id,
          name: form.name.trim(),
          categoryName,
          sellBy: form.sellBy,
          pricePerPiece: form.pricePerPiece,
          pricePerPackage: form.pricePerPackage,
          stockInPieces: form.stockInPieces || "0",
        },
        ...prev,
      ]);

      // Reset the form for the next product, but keep the same category
      // selected since products are usually added in batches per category.
      setForm((prev) => ({ ...emptyForm, categoryId: prev.categoryId }));
      nameInputRef.current?.focus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "حصل خطأ غير متوقع.");
    } finally {
      setSubmitting(false);
    }
  }

  const showPiecePrice = form.sellBy === "piece" || form.sellBy === "both";
  const showPackageFields = form.sellBy === "package" || form.sellBy === "both";

  return (
    <div dir="rtl" className="min-h-screen bg-[#F1F2EF]">
      <header className="flex items-center justify-between bg-[#1C2333] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10"
            aria-label="رجوع للوحة التحكم"
          >
            <ArrowRight size={16} />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">إدارة المخزون</p>
            <h1 className="text-lg font-semibold">إضافة أصناف جديدة</h1>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-slate-700/60 px-3 py-1 text-xs font-medium text-slate-200">
          <PackagePlus size={14} />
          {addedProducts.length} صنف مُضاف بهذه الجلسة
        </span>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_1fr]">
        {/* Quick add form */}
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-slate-900">بيانات الصنف</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">اسم الصنف</label>
              <input
                ref={nameInputRef}
                autoFocus
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="مثال: شيبس ليز كبير"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">الكاتيجوري</label>
              {categoriesStatus === "error" ? (
                <p className="text-sm text-red-500">تعذّر تحميل الكاتيجوريز.</p>
              ) : (
                <select
                  value={form.categoryId}
                  onChange={(e) => updateField("categoryId", e.target.value)}
                  disabled={categoriesStatus === "loading"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
                >
                  {categoriesStatus === "loading" && <option>جارٍ التحميل...</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">طريقة البيع</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "piece", label: "بالحبة" },
                    { value: "package", label: "بالباكيج" },
                    { value: "both", label: "الاثنين" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField("sellBy", opt.value)}
                    className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                      form.sellBy === opt.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {showPiecePrice && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">سعر الحبة (د.أ)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.pricePerPiece}
                  onChange={(e) => updateField("pricePerPiece", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
                />
              </div>
            )}

            {showPackageFields && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">سعر الباكيج (د.أ)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.pricePerPackage}
                    onChange={(e) => updateField("pricePerPackage", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">عدد الحبات بالباكيج</label>
                  <input
                    type="number"
                    min="1"
                    value={form.piecesPerPackage}
                    onChange={(e) => updateField("piecesPerPackage", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">المخزون الابتدائي (بالحبة)</label>
              <input
                type="number"
                min="0"
                value={form.stockInPieces}
                onChange={(e) => updateField("stockInPieces", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || categoriesStatus !== "idle"}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-default disabled:opacity-50"
            >
              {submitting ? "جارٍ الحفظ..." : "حفظ وإضافة صنف تاني"}
            </button>
          </form>
        </section>

        {/* Session log of what's been added so far */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-slate-900">أضيف بهذه الجلسة</h2>

          {addedProducts.length === 0 ? (
            <p className="text-sm text-slate-400">لسا ما ضفت أي صنف. أول صنف تحفظه بيظهر هون.</p>
          ) : (
            <ul className="space-y-2.5">
              {addedProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.categoryName}</p>
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-left font-mono text-xs text-slate-500">
                    {(p.sellBy === "piece" || p.sellBy === "both") && p.pricePerPiece && (
                      <p>{Number(p.pricePerPiece).toFixed(2)} د.أ / حبة</p>
                    )}
                    {(p.sellBy === "package" || p.sellBy === "both") && p.pricePerPackage && (
                      <p>{Number(p.pricePerPackage).toFixed(2)} د.أ / باكيج</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}