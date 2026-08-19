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
import { ThemeToggle } from "../components/ThemeToggle";

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
    <div dir="rtl" className="pos-page min-h-screen w-full font-sans">
      <div className="mx-auto w-full max-w-[1800px] p-8">
        <header className="pos-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-8">
          <div className="flex items-center gap-4">
            <Link
              to={currentUser?.role === "Admin" ? "/dashboard" : "/home"}
              className="pos-icon-button"
              aria-label="Back"
            >
              <ArrowRight size={26} />
            </Link>

            <div>
              <p className="pos-kicker">AL-ISRAA Supermarket</p>
              <h1 className="text-3xl font-black">Categories</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <div className="flex items-center gap-2.5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-6 py-3.5 font-black text-amber-400">
              <Tags size={22} />
              <span>{categories.length} categories</span>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-8 lg:grid-cols-[440px_1fr]">
          <section className="pos-panel h-fit p-8">
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-md">
                {editingCategory ? (
                  <Edit3 size={26} className="stroke-[2.5]" />
                ) : (
                  <FolderPlus size={26} className="stroke-[2.5]" />
                )}
              </div>

              <div>
                <h2 className="text-xl font-black">
                  {editingCategory ? "Edit category" : "Add category"}
                </h2>
                <p className="pos-muted text-sm">
                  {editingCategory
                    ? "Edit the name and save the changes."
                    : "Add a new category for products."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="pos-label mb-2.5 block">
                  Category name
                </label>

                <input
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example: Drinks"
                  maxLength={100}
                  className="pos-input py-4 text-lg"
                />
              </div>

              {error && <p className="pos-error text-center text-base">{error}</p>}
              {success && <p className="pos-success text-center text-base">{success}</p>}

              <div className="mt-2.5 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="pos-primary flex-1 py-4 text-lg"
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
                    className="pos-secondary px-5"
                    aria-label="Cancel"
                  >
                    <X size={24} />
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="pos-panel p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-black">All categories</h2>
              <p className="pos-muted mt-1.5 text-sm">
                You can modify or disable any category.
              </p>
            </div>

            {loading ? (
              <p className="pos-muted py-16 text-center text-lg font-bold">
                Loading...
              </p>
            ) : categories.length === 0 ? (
              <p className="pos-muted py-16 text-center text-lg font-bold">
                No categories available yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="pos-panel flex items-center justify-between p-5"
                  >
                    <div className="flex items-center gap-4.5">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl font-bold ${
                          category.isActive
                            ? "bg-amber-400 text-slate-950 shadow-md"
                            : "pos-secondary"
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
                          className="text-xl font-bold transition hover:text-amber-400 hover:underline"
                        >
                          {category.name}
                        </button>

                        <span
                          className={`mt-1 block text-sm font-bold ${
                            category.isActive
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {category.isActive ? "● Active" : "● Disabled"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => void startEditing(category.id)}
                        className="pos-table-button"
                        aria-label="Edit"
                      >
                        <Edit3 size={22} />
                      </button>

                      {category.isActive ? (
                        <button
                          type="button"
                          onClick={() => void handleDeactivate(category)}
                          className="pos-danger"
                          aria-label="Disable"
                        >
                          <Power size={22} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleActivate(category)}
                          className="pos-table-button pos-enable-button"
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
              <div className="pos-muted mt-8 flex items-center gap-2.5 border-t border-white/10 pt-5 text-sm font-semibold">
                <CheckCircle2 size={20} className="shrink-0 text-amber-400" />
                <span>Disabled categories also appear here, but they will not appear when adding a new product.</span>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}