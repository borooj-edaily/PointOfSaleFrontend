import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Edit3,
  FolderPlus,
  Power,
  Tags,
  X,
} from "lucide-react";
import {
  createCategory,
  deactivateCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  type Category,
} from "../api/categoryApi";
import { getCurrentUser } from "../api/authApi";
import { ApiError } from "../api/httpClient";

export default function CategoryManagementPage() {
  const currentUser = getCurrentUser();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCategories() {
    try {
      const data = await getAllCategories(false);
      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "فشل تحميل الكاتيجوريز."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function resetForm() {
    setName("");
    setEditingCategory(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("اسم الكاتيجوري مطلوب.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          id: editingCategory.id,
          name: trimmedName,
          updatedByUserId: currentUser?.id ?? null,
        });

        setSuccess("تم تعديل الكاتيجوري بنجاح.");
      } else {
        await createCategory({
          name: trimmedName,
          createdByUserId: currentUser?.id ?? null,
        });

        setSuccess("تمت إضافة الكاتيجوري بنجاح.");
      }

      resetForm();
      setLoading(true);
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "حدث خطأ غير متوقع."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function startEditing(categoryId: number) {
    setError("");
    setSuccess("");

    try {
      const category = await getCategoryById(categoryId);
      setEditingCategory(category);
      setName(category.name);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "تعذر تحميل بيانات الكاتيجوري."
      );
    }
  }

  async function handleDeactivate(category: Category) {
    const confirmed = window.confirm(
      `هل تريد تعطيل الكاتيجوري "${category.name}"؟`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deactivateCategory(category.id, {
        id: category.id,
        updatedByUserId: currentUser?.id ?? null,
      });

      setSuccess("تم تعطيل الكاتيجوري بنجاح.");
      setLoading(true);
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "تعذر تعطيل الكاتيجوري."
      );
    }
  }

  return (
    <div dir="rtl" className="pos-page">
      <header className="flex items-center justify-between bg-[#1C2333] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link
            to={
              currentUser?.role === "Admin"
                ? "/dashboard"
                : "/home"
            }
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10"
            aria-label="رجوع"
          >
            <ArrowRight size={16} />
          </Link>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              إدارة المنتجات
            </p>
            <h1 className="text-lg font-semibold">
              إدارة الكاتيجوريز
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-slate-700/60 px-3 py-1 text-xs font-medium text-slate-200">
          <Tags size={14} />
          {categories.length} كاتيجوري
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[380px_1fr]">
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              {editingCategory ? (
                <Edit3 size={20} />
              ) : (
                <FolderPlus size={20} />
              )}
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                {editingCategory
                  ? "تعديل كاتيجوري"
                  : "إضافة كاتيجوري"}
              </h2>
              <p className="text-xs text-slate-500">
                {editingCategory
                  ? "عدل الاسم ثم احفظ التغييرات."
                  : "أضف كاتيجوري جديد للمنتجات."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                اسم الكاتيجوري
              </label>

              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="مثال: مشروبات"
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting
                  ? "جارٍ الحفظ..."
                  : editingCategory
                    ? "حفظ التعديل"
                    : "إضافة كاتيجوري"}
              </button>

              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center justify-center rounded-xl border border-slate-200 px-4 text-slate-500 transition hover:bg-slate-50"
                  aria-label="إلغاء"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                جميع الكاتيجوريز
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                يمكنك تعديل أو تعطيل أي كاتيجوري.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-400">
              جارٍ التحميل...
            </p>
          ) : categories.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              لا توجد كاتيجوريز حتى الآن.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        category.isActive
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Tags size={18} />
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {category.name}
                      </p>

                      <p
                        className={`mt-0.5 text-xs ${
                          category.isActive
                            ? "text-emerald-600"
                            : "text-slate-400"
                        }`}
                      >
                        {category.isActive ? "فعّال" : "معطّل"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void startEditing(category.id)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                      aria-label="تعديل"
                    >
                      <Edit3 size={16} />
                    </button>

                    {category.isActive && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeactivate(category)
                        }
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        aria-label="تعطيل"
                      >
                        <Power size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && categories.length > 0 && (
            <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <CheckCircle2 size={15} className="text-emerald-600" />
              تظهر الكاتيجوريز المعطلة هنا أيضاً، لكنها لن تظهر عند إضافة منتج جديد.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
