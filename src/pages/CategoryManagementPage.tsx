import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
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
  activateCategory,
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
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCategories() {
    try {
      const data = await getAllCategories({ onlyActive: false });
      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load categories."
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
      setError("Category name is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (editingCategory) {
        await updateCategory(
          editingCategory.id,
          { name: trimmedName },
          currentUser?.id ?? null
        );

        setSuccess("Category updated successfully.");
      } else {
        await createCategory({ name: trimmedName });

        setSuccess("Category added successfully.");
      }

      resetForm();
      setLoading(true);
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "An unexpected error occurred."
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
          : "Unable to load category data."
      );
    }
  }

  async function handleDeactivate(category: Category) {
    const confirmed = window.confirm(
      `Do you want to disable the category "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deactivateCategory(category.id, currentUser?.id ?? null);

      setSuccess("Category disabled successfully.");
      setLoading(true);
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to disable the category."
      );
    }
  }

  async function handleActivate(category: Category) {
    setError("");
    setSuccess("");

    try {
      await activateCategory(category.id, currentUser?.id ?? null);

      setSuccess("Category enabled successfully.");
      setLoading(true);
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to enable the category."
      );
    }
  }

  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen w-full justify-center bg-cover bg-center bg-no-repeat font-sans"
      style={{
        padding: "40px 24px",
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1920&auto=format&fit=crop')`,
        boxSizing: "border-box"
      }}
    >
      <div className="w-full max-w-[1800px]">
        <header
          className="relative rounded-3xl border border-white/15 bg-black/80 shadow-2xl backdrop-blur-2xl flex flex-wrap items-center justify-between"
          style={{
            padding: "28px 36px",
            marginBottom: "40px",
            boxSizing: "border-box"
          }}
        >
          <div className="flex items-center" style={{ gap: "20px" }}>
            <Link
              to={currentUser?.role === "Admin" ? "/dashboard" : "/home"}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-xl transition-all hover:bg-amber-300 active:scale-95"
              aria-label="Back"
            >
              <ArrowRight size={26} className="stroke-[2.5]" />
            </Link>

            <div>
              <span className="text-sm font-black tracking-widest text-amber-400 uppercase block" style={{ marginBottom: "4px" }}>
                AL-ISRAA Supermarket
              </span>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Categories
              </h1>
            </div>
          </div>

          <div 
            className="flex items-center rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 font-black"
            style={{ padding: "14px 24px", gap: "10px", fontSize: "1.1rem" }}
          >
            <Tags size={22} />
            <span>{categories.length} categories</span>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-8 lg:grid-cols-[440px_1fr]">
          <section 
            className="h-fit rounded-3xl border border-white/15 bg-black/80 p-8 shadow-2xl backdrop-blur-2xl"
            style={{ boxSizing: "border-box" }}
          >
            <div className="flex items-center" style={{ gap: "16px", marginBottom: "28px" }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-md">
                {editingCategory ? (
                  <Edit3 size={26} className="stroke-[2.5]" />
                ) : (
                  <FolderPlus size={26} className="stroke-[2.5]" />
                )}
              </div>

              <div>
                <h2 className="text-xl font-black text-white">
                  {editingCategory ? "Edit category" : "Add category"}
                </h2>
                <p className="text-sm font-semibold text-slate-400">
                  {editingCategory
                    ? "Edit the name and save the changes."
                    : "Add a new category for products."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "20px" }}>
              <div>
                <label className="block text-base font-bold text-slate-300" style={{ marginBottom: "10px" }}>
                  Category name
                </label>

                <input
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example: Drinks"
                  maxLength={100}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-lg font-semibold text-white outline-none placeholder:text-slate-500 focus:border-amber-400 focus:bg-white/15 transition-all"
                  style={{ boxSizing: "border-box" }}
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-red-500/20 p-4 text-center text-base font-bold text-red-200 border border-red-500/40">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl bg-emerald-500/20 p-4 text-center text-base font-bold text-emerald-200 border border-emerald-500/40">
                  {success}
                </div>
              )}

              <div className="flex" style={{ gap: "12px", marginTop: "10px" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-amber-400 py-4 text-lg font-black text-slate-950 shadow-xl transition-all hover:bg-amber-300 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? "Saving..."
                    : editingCategory
                      ? "Save changes"
                      : "Add category"}
                </button>

                {editingCategory && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 text-slate-300 transition hover:bg-white/20 hover:text-white cursor-pointer"
                    aria-label="Cancel"
                  >
                    <X size={24} />
                  </button>
                )}
              </div>
            </form>
          </section>

          <section 
            className="rounded-3xl border border-white/15 bg-black/80 p-8 shadow-2xl backdrop-blur-2xl"
            style={{ boxSizing: "border-box" }}
          >
            <div style={{ marginBottom: "28px" }}>
              <h2 className="text-2xl font-black text-white">
                All categories
              </h2>
              <p className="text-sm font-semibold text-slate-400" style={{ marginTop: "6px" }}>
                You can modify or disable any category.
              </p>
            </div>

            {loading ? (
              <p className="py-16 text-center text-lg font-bold text-slate-400">
                Loading...
              </p>
            ) : categories.length === 0 ? (
              <p className="py-16 text-center text-lg font-bold text-slate-400">
                No categories available yet.
              </p>
            ) : (
              <div className="flex flex-col" style={{ gap: "16px" }}>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10"
                  >
                    <div className="flex items-center" style={{ gap: "18px" }}>
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl font-bold ${
                          category.isActive
                            ? "bg-amber-400 text-slate-950 shadow-md"
                            : "bg-white/10 text-slate-500"
                        }`}
                      >
                        <Tags size={24} />
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/products?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`
                            )
                          }
                          className="text-xl font-bold text-white transition hover:text-amber-400 hover:underline cursor-pointer"
                        >
                          {category.name}
                        </button>

                        <span
                          className={`block text-sm font-bold ${
                            category.isActive
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                          style={{ marginTop: "4px" }}
                        >
                          {category.isActive ? "● Active" : "● Disabled"}
                        </span>
                      </div>
                    </div>

                    <div className="flex" style={{ gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => void startEditing(category.id)}
                        className="rounded-xl border border-white/20 bg-white/10 p-3.5 text-amber-400 transition hover:bg-amber-400 hover:text-slate-950 cursor-pointer"
                        aria-label="Edit"
                      >
                        <Edit3 size={22} />
                      </button>

                      {category.isActive ? (
                        <button
                          type="button"
                          onClick={() => void handleDeactivate(category)}
                          className="rounded-xl border border-white/20 bg-white/10 p-3.5 text-red-400 transition hover:bg-red-600 hover:text-white cursor-pointer"
                          aria-label="Disable"
                        >
                          <Power size={22} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleActivate(category)}
                          className="rounded-xl border border-white/20 bg-white/10 p-3.5 text-emerald-400 transition hover:bg-emerald-600 hover:text-white cursor-pointer"
                          aria-label="Enable"
                        >
                          <Power size={22} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && categories.length > 0 && (
              <div 
                className="flex items-center border-t border-white/10 text-sm font-semibold text-slate-400"
                style={{ marginTop: "32px", paddingTop: "20px", gap: "10px" }}
              >
                <CheckCircle2 size={20} className="text-amber-400 shrink-0" />
                <span>Disabled categories also appear here, but they will not appear when adding a new product.</span>
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}