import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Plus, Tag, X } from "lucide-react";
import { getAllCategories, createCategory, deactivateCategory } from "../api/categoryApi";
import type { Category } from "../types/category";
import { getCurrentUser } from "../api/authApi";
import { ApiError } from "../api/httpClient";

export default function CategoriesPage() {
  const currentUser = getCurrentUser();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [onlyActive, setOnlyActive] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  function loadCategories() {
    setIsLoading(true);
    setLoadError(null);
    getAllCategories({ onlyActive })
      .then((data) => setCategories(data))
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : "تعذّر تحميل الكاتيجوريز.");
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyActive]);

  function openForm() {
    setShowForm(true);
    setNewName("");
    setFormError(null);
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setFormError("اسم الكاتيجوري مطلوب.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await createCategory({ name: newName.trim() });
      setShowForm(false);
      loadCategories();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "حصل خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: number) {
    if (!confirm("هل أنت متأكد من تعطيل هذه الكاتيجوري؟")) return;

    setDeactivatingId(id);
    try {
      await deactivateCategory(id, currentUser?.id ?? null);
      loadCategories();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "تعذّر تعطيل الكاتيجوري.");
    } finally {
      setDeactivatingId(null);
    }
  }

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
            <h1 className="text-lg font-semibold">الكاتيجوريز</h1>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-slate-700/60 px-3 py-1 text-xs font-medium text-slate-200">
          <Tag size={14} />
          {currentUser?.fullName ?? "مستخدم"}
        </span>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">قائمة الكاتيجوريز</h2>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                  className="rounded border-slate-300"
                />
                عرض الفعّالة فقط
              </label>

              <button
                type="button"
                onClick={openForm}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus size={16} />
                كاتيجوري جديدة
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : loadError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{loadError}</p>
          ) : categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">لا يوجد كاتيجوريز بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2.5 pl-3 font-medium">#</th>
                    <th className="px-3 py-2.5 font-medium">الاسم</th>
                    <th className="px-3 py-2.5 font-medium">الحالة</th>
                    <th className="py-2.5 pr-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="py-3 pl-3 font-mono text-xs text-slate-500">{cat.id}</td>
                      <td className="px-3 py-3 text-sm font-medium text-slate-900">{cat.name}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            cat.isActive
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-500"
                          }`}
                        >
                          {cat.isActive ? "فعّالة" : "معطّلة"}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-left">
                        {cat.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(cat.id)}
                            disabled={deactivatingId === cat.id}
                            className="text-sm font-medium text-red-600 transition hover:text-red-800 disabled:opacity-50"
                          >
                            {deactivatingId === cat.id ? "جارِ التعطيل..." : "تعطيل"}
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

      {/* Create category modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">كاتيجوري جديدة</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">اسم الكاتيجوري</label>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: مشروبات"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>

            {formError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={handleCreate}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-default disabled:opacity-50"
            >
              {saving ? "جارِ الحفظ..." : "إضافة الكاتيجوري"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}