import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Edit3, PackagePlus, Power, RefreshCw } from "lucide-react";
import { getCurrentUser } from "../api/authApi";
import { ApiError } from "../api/httpClient";
import {
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

  return <div dir="rtl" className="pos-page px-5 py-8"><main className="mx-auto max-w-7xl">
    <header className="pos-panel mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
      <div className="flex items-center gap-3"><Link to="/dashboard" className="pos-icon-button" aria-label="Back"><ArrowRight size={20} /></Link><div><p className="pos-kicker">AL-ISRAA Supermarket</p><h1 className="text-2xl font-black text-white">Product management</h1></div></div>
      <Link to="/products/add" className="pos-primary"><PackagePlus size={18} /> Add new product</Link>
    </header>
    {error && <p className="pos-error mb-5">{error}</p>}{success && <p className="pos-success mb-5">{success}</p>}
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <section className="pos-panel h-fit p-6"><h2 className="mb-4 text-lg font-bold text-white">{editing ? "Edit product" : "Select a product to edit"}</h2>
        {editing ? <form onSubmit={save} className="space-y-3">
          <Input label="Product name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <label className="pos-label">Category<select className="pos-input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required><option value="">Select category</option>{categories.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="pos-label">Selling method<select className="pos-input" value={form.sellBy} onChange={(e) => setForm({ ...form, sellBy: e.target.value })}><option value="1">By piece</option><option value="2">By package</option><option value="3">Both</option></select></label>
          <Input label="Pieces per package" type="number" value={form.piecesPerPackage} onChange={(value) => setForm({ ...form, piecesPerPackage: value })} required={form.sellBy === "2" || form.sellBy === "3"} />
          <Input label="Piece price" type="number" value={form.pricePerPiece} onChange={(value) => setForm({ ...form, pricePerPiece: value })} required={form.sellBy === "1" || form.sellBy === "3"} />
          <Input label="Package price" type="number" value={form.pricePerPackage} onChange={(value) => setForm({ ...form, pricePerPackage: value })} required={form.sellBy === "2" || form.sellBy === "3"} />
          <div className="flex gap-2"><button disabled={saving} className="pos-primary flex-1">{saving ? "Saving..." : "Save"}</button><button type="button" onClick={() => { setEditing(null); setForm(emptyEdit); }} className="pos-secondary">Cancel</button></div>
        </form> : <p className="text-sm text-slate-300">You can edit product details or deactivate it from the list.</p>}</section>
      <section className="pos-panel p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-white">All products</h2><button onClick={() => void loadProducts()} className="pos-icon-button" aria-label="Refresh"><RefreshCw size={17} /></button></div>
        {loading ? <p className="pos-muted">Loading...</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-right text-sm"><thead className="border-b border-white/15 text-amber-300"><tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3" /></tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-b border-white/10 text-slate-200"><td className="p-3 font-semibold">{product.name}</td><td className="p-3">{product.categoryName}</td><td className="p-3">{product.stockInPieces}</td><td className="p-3">{product.isActive ? "Active" : "Inactive"}</td><td className="flex gap-2 p-3"><button onClick={() => void beginEdit(product.id)} className="pos-table-button"><Edit3 size={15} /> Edit</button>{product.isActive && <button onClick={() => void deactivate(product)} className="pos-danger"><Power size={15} /> Disable</button>}</td></tr>)}</tbody></table></div>}</section>
    </div>
    <section className="pos-panel mt-6 p-6"><div className="mb-4 flex flex-wrap items-center gap-3"><AlertTriangle className="text-amber-400" /><h2 className="font-bold text-white">Low stock alert</h2><input className="pos-input w-28" type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} /><button onClick={() => void loadLowStock()} className="pos-secondary">Show</button></div>{lowStock.length > 0 ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{lowStock.map((product) => <div key={product.id} className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-white"><p className="font-bold">{product.name}</p><p className="text-sm text-amber-200">Remaining: {product.stockInPieces}</p></div>)}</div> : <p className="pos-muted">Press “Show” to review low-stock products.</p>}</section>
  </main></div>;
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="pos-label">{label}<input className="pos-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} min={type === "number" ? (required ? "1" : "0") : undefined} /></label>; }