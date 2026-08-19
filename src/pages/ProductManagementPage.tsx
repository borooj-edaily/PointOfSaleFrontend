import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowRight, Edit3, PackagePlus, Power, RefreshCw } from "lucide-react";
import { getCurrentUser } from "../api/authApi";
import { ApiError } from "../api/httpClient";
import {
  activateProduct,
  deactivateProduct,
  getAllProductDetails,
  getLowStockProducts,
  getProductById,
  updateProduct,
  type LowStockDto,
  type ProductDto,
  type SellByType,
} from "../api/productApi";
import { getAllCategories, type Category } from "../api/categoryApi";

const emptyEdit = { name: "", categoryId: "", sellBy: "1", piecesPerPackage: "", pricePerPiece: "", pricePerPackage: "" };

export default function ProductManagementPage() {
  const user = getCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get("categoryId") ?? "";
  const categoryNameFromUrl = searchParams.get("categoryName") ?? "";

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [form, setForm] = useState(emptyEdit);
  const [lowStock, setLowStock] = useState<LowStockDto[]>([]);
  const [threshold, setThreshold] = useState("10");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  async function loadProducts() {
    setLoading(true);
    try { setProducts(await getAllProductDetails({ onlyActive: false })); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load products."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void loadProducts();
    getAllCategories({ onlyActive: false }).then(setCategories).catch(() => undefined);
  }, []);

  async function loadLowStock() {
    setError("");
    try { setLowStock(await getLowStockProducts(Number(threshold) || 10)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load low-stock products."); }
  }

  async function beginEdit(id: number) {
    setError(""); setSuccess("");
    try {
      const product = await getProductById(id);
      setEditing(product);
      setForm({ name: product.name, categoryId: String(product.categoryId), sellBy: String(product.sellBy), piecesPerPackage: product.piecesPerPackage?.toString() ?? "", pricePerPiece: product.pricePerPiece?.toString() ?? "", pricePerPackage: product.pricePerPackage?.toString() ?? "" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load the product."); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      await updateProduct(editing.id, { id: editing.id, name: form.name.trim(), categoryId: Number(form.categoryId), sellBy: Number(form.sellBy) as SellByType, piecesPerPackage: form.piecesPerPackage ? Number(form.piecesPerPackage) : null, pricePerPiece: form.pricePerPiece ? Number(form.pricePerPiece) : null, pricePerPackage: form.pricePerPackage ? Number(form.pricePerPackage) : null, updatedByUserId: user?.id ?? null });
      setSuccess("Product updated successfully."); setEditing(null); setForm(emptyEdit); void loadProducts();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not update the product."); }
    finally { setSaving(false); }
  }

  async function deactivate(product: ProductDto) {
    if (!window.confirm(`Deactivate ${product.name}?`)) return;
    try { await deactivateProduct(product.id, user?.id ?? null); setSuccess("Product deactivated."); void loadProducts(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not deactivate product."); }
  }

  async function activate(product: ProductDto) {
    try { await activateProduct(product.id, user?.id ?? null); setSuccess("Product activated."); void loadProducts(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not activate product."); }
  }

  function clearCategoryFilter() {
    setSearchParams({});
  }

  const visibleProducts = products
    .filter((p) => (categoryIdFromUrl ? String(p.categoryId) === categoryIdFromUrl : true))
    .filter((p) => {
      if (statusFilter === "active") return p.isActive;
      if (statusFilter === "inactive") return !p.isActive;
      return true;
    });

  const pageTitle = categoryNameFromUrl ? `${categoryNameFromUrl} — Products` : "Product management";

  return (
    <div dir="rtl" className="pos-page flex justify-center px-5 py-10">
      <main className="w-full max-w-[1800px]">
        <header className="pos-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-8">
          <div className="flex items-center gap-4">
            <Link
              to={user?.role === "Admin" ? "/dashboard" : "/home"}
              className="pos-icon-button"
              aria-label="Back"
            >
              <ArrowRight size={22} />
            </Link>
            <div>
              <p className="pos-kicker">AL-ISRAA Supermarket</p>
              <h1 className="text-3xl font-black text-white">{pageTitle}</h1>
            </div>
          </div>
          <Link to="/products/add" className="pos-primary text-base"><PackagePlus size={20} /> Add new product</Link>
        </header>

        {categoryNameFromUrl && (
          <div className="mb-8 flex items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-6 py-4">
            <p className="text-base text-amber-200">
              Showing products in category: <span className="font-bold text-white">{categoryNameFromUrl}</span>
            </p>
            <button
              onClick={clearCategoryFilter}
              className="rounded-md bg-amber-400 px-6 py-3 text-base font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95"
            >
              Show all products
            </button>
          </div>
        )}

        {error && <p className="pos-error mb-6 text-base">{error}</p>}{success && <p className="pos-success mb-6 text-base">{success}</p>}

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="pos-panel h-fit p-8">
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit product" : "Select a product to edit"}</h2>
            {editing ? (
              <form onSubmit={save} className="space-y-4">
                <Input label="Product name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
                <label className="pos-label">Category<select className="pos-input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required><option value="">Select category</option>{categories.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                <label className="pos-label">Selling method<select className="pos-input" value={form.sellBy} onChange={(e) => setForm({ ...form, sellBy: e.target.value })}><option value="1">By piece</option><option value="2">By package</option><option value="3">Both</option></select></label>
                <Input label="Pieces per package" type="number" value={form.piecesPerPackage} onChange={(value) => setForm({ ...form, piecesPerPackage: value })} required={form.sellBy === "2" || form.sellBy === "3"} />
                <Input label="Piece price" type="number" value={form.pricePerPiece} onChange={(value) => setForm({ ...form, pricePerPiece: value })} required={form.sellBy === "1" || form.sellBy === "3"} />
                <Input label="Package price" type="number" value={form.pricePerPackage} onChange={(value) => setForm({ ...form, pricePerPackage: value })} required={form.sellBy === "2" || form.sellBy === "3"} />
                <div className="flex gap-3">
                  <button disabled={saving} className="pos-primary flex-1 text-base">{saving ? "Saving..." : "Save"}</button>
                  <button type="button" onClick={() => { setEditing(null); setForm(emptyEdit); }} className="pos-secondary text-base">Cancel</button>
                </div>
              </form>
            ) : (
              <p className="text-base text-slate-300">You can edit product details or deactivate it from the list.</p>
            )}
          </section>

          <section className="pos-panel p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white">{categoryNameFromUrl ? `${categoryNameFromUrl} products` : "All products"}</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
                  {(
                    [
                      { value: "all", label: "All" },
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Disabled" },
                    ] as const
                  ).map((opt) => {
                    const activeColor =
                      opt.value === "active"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : opt.value === "inactive"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-400 text-slate-950";

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatusFilter(opt.value)}
                        className={`rounded-lg px-5 py-2.5 text-base font-bold transition ${
                          statusFilter === opt.value ? activeColor : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => void loadProducts()} className="pos-icon-button" aria-label="Refresh"><RefreshCw size={19} /></button>
              </div>
            </div>

            {loading ? (
              <p className="pos-muted text-base">Loading...</p>
            ) : visibleProducts.length === 0 ? (
              <p className="pos-muted text-base">No products in this category.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-center text-base">
                  <thead className="border-b border-white/15 text-amber-300">
                    <tr>
                      <th className="w-1/4 p-4 text-center">Product</th>
                      <th className="w-1/6 p-4 text-center">Category</th>
                      <th className="w-1/6 p-4 text-center">Stock</th>
                      <th className="w-1/6 p-4 text-center">Status</th>
                      <th className="w-1/4 p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((product) => (
                      <tr key={product.id} className={`border-b border-white/10 transition-opacity ${product.isActive ? "text-slate-200" : "text-slate-500 opacity-50"}`}>
                        <td className={`p-4 text-center font-semibold ${!product.isActive ? "line-through" : ""}`}>{product.name}</td>
                        <td className="p-4 text-center">{product.categoryName}</td>
                        <td className="p-4 text-center">{product.stockInPieces}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block rounded-full px-3 py-1.5 text-sm font-bold ${product.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                            {product.isActive ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => void beginEdit(product.id)} className="pos-table-button px-5 py-2.5 text-base"><Edit3 size={17} /> Edit</button>
                            {product.isActive ? (
                              <button onClick={() => void deactivate(product)} className="pos-danger px-5 py-2.5 text-base"><Power size={17} /> Disable</button>
                            ) : (
                              <button onClick={() => void activate(product)} className="pos-table-button pos-enable-button"><Power size={17} /> Enable</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section className="pos-panel mt-8 p-8">
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <AlertTriangle className="text-amber-400" size={22} />
            <h2 className="text-xl font-bold text-white">Low stock alert</h2>
            <input className="pos-input w-32 text-base" type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            <button onClick={() => void loadLowStock()} className="pos-secondary text-base">Show</button>
          </div>
          {lowStock.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lowStock.map((product) => (
                <div key={product.id} className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-5 text-white">
                  <p className="text-lg font-bold">{product.name}</p>
                  <p className="text-base text-amber-200">Remaining: {product.stockInPieces}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="pos-muted text-base">Press "Show" to review low-stock products.</p>
          )}
        </section>
      </main>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="pos-label">
      {label}
      <input
        className="pos-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={type === "number" ? (required ? "1" : "0") : undefined}
      />
    </label>
  );
}