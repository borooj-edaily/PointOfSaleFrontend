import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ListChecks, Loader2, PackagePlus, PlusCircle } from "lucide-react";
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
    if (!form.name.trim()) return "Product name is required.";
    if (!form.categoryId) return "Please choose a category.";

    if ((form.sellBy === "piece" || form.sellBy === "both") && !form.pricePerPiece) {
      return "Piece price is required when selling by piece.";
    }
    if (form.sellBy === "package" || form.sellBy === "both") {
      if (!form.pricePerPackage) return "Package price is required when selling by package.";
      if (!form.piecesPerPackage) return "Number of pieces per package is required when selling by package.";
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

      setForm((prev) => ({ ...emptyForm, categoryId: prev.categoryId }));
      nameInputRef.current?.focus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const showPiecePrice = form.sellBy === "piece" || form.sellBy === "both";
  const showPackageFields = form.sellBy === "package" || form.sellBy === "both";

  return (
    <div
      dir="rtl"
      className="pos-page min-h-screen text-slate-100 font-sans selection:bg-amber-500/30 flex flex-col"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/80 px-8 py-4 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <Link
            to={currentUser?.role === "Admin" ? "/dashboard" : "/home"}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-amber-400 hover:text-black hover:border-amber-400 active:scale-95"
            aria-label="Back"
          >
            <ArrowRight size={18} />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Inventory management</p>
            <h1 className="text-xl font-bold tracking-wide text-white">Add new items</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="flex items-center gap-2.5 rounded-2xl border-2 border-amber-400/60 bg-amber-400/15 px-6 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-400 hover:text-black hover:border-amber-400 active:scale-95 shadow-lg shadow-amber-400/10"
          >
            <ListChecks size={20} />
            View all items
          </Link>

          <span className="flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-300 shadow-inner">
            <PackagePlus size={16} className="text-amber-400" />
            {addedProducts.length} item{addedProducts.length === 1 ? "" : "s"} added this session
          </span>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 flex flex-col justify-center">
        <div className="grid gap-8 lg:grid-cols-2 items-stretch flex-1">
          
          {/* Form Section */}
          <section className="flex flex-col justify-between rounded-3xl border border-white/10 bg-black/80 p-8 backdrop-blur-2xl shadow-2xl h-full">
            <div className="flex flex-col h-full justify-between">
              
              {/* Header Title */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <span className="h-3 w-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                <h2 className="text-lg font-bold text-white">Item details</h2>
              </div>

              {/* Form Element Spanning Height */}
              <form id="add-product-form" onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between py-4 space-y-4">
                {/* Product Name */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-300">Item name</label>
                  <input
                    ref={nameInputRef}
                    autoFocus
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Example: Large Lay's chips"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:bg-white/10 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-300">Category</label>
                  {categoriesStatus === "error" ? (
                    <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">
                      Unable to load categories.
                    </p>
                  ) : (
                    <select
                      value={form.categoryId}
                      onChange={(e) => updateField("categoryId", e.target.value)}
                      disabled={categoriesStatus === "loading"}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    >
                      {categoriesStatus === "loading" && <option className="bg-slate-900">Loading...</option>}
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Sell By Toggle Options */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-300">Selling method</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { value: "piece", label: "Per piece" },
                        { value: "package", label: "Per package" },
                        { value: "both", label: "Both" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField("sellBy", opt.value)}
                        className={`rounded-2xl border py-2.5 text-xs font-bold transition active:scale-95 ${
                          form.sellBy === opt.value
                            ? "border-amber-400 bg-amber-400/10 text-amber-300 shadow-sm"
                            : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Per Piece Field */}
                {showPiecePrice && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-300">Piece price (JOD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.pricePerPiece}
                      onChange={(e) => updateField("pricePerPiece", e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:bg-white/10 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>
                )}

                {/* Package Price and Pieces Count */}
                {showPackageFields && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-300">Package price (JOD)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.pricePerPackage}
                        onChange={(e) => updateField("pricePerPackage", e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:bg-white/10 focus:ring-2 focus:ring-amber-400/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-300">Pieces / package</label>
                      <input
                        type="number"
                        min="1"
                        value={form.piecesPerPackage}
                        onChange={(e) => updateField("piecesPerPackage", e.target.value)}
                        placeholder="Number of pieces"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:bg-white/10 focus:ring-2 focus:ring-amber-400/20"
                      />
                    </div>
                  </div>
                )}

                {/* Initial Stock */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-300">Initial stock (pieces)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockInPieces}
                    onChange={(e) => updateField("stockInPieces", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:bg-white/10 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-400">
                    {error}
                  </p>
                )}
              </form>

              {/* Submit Button Section */}
              <div className="pt-2">
                <button
                  form="add-product-form"
                  type="submit"
                  disabled={submitting || categoriesStatus !== "idle"}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-sm font-bold text-black transition hover:bg-amber-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-amber-400/10"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      Save and add another item
                    </>
                  )}
                </button>
              </div>

            </div>
          </section>

          {/* Added Log Section */}
          <section className="flex flex-col rounded-3xl border border-white/10 bg-black/80 p-8 backdrop-blur-2xl shadow-2xl h-full">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
              <CheckCircle2 size={22} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Added this session</h2>
            </div>

            {addedProducts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
                No items added yet. Your first saved item will appear here.
              </div>
            ) : (
              <ul className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[calc(100vh-250px)]">
                {addedProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 backdrop-blur-md transition hover:bg-amber-400/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">{p.name}</p>
                        <p className="text-xs text-amber-400/80">{p.categoryName}</p>
                      </div>
                    </div>

                    <div className="whitespace-nowrap text-left font-mono text-xs">
                      {(p.sellBy === "piece" || p.sellBy === "both") && p.pricePerPiece && (
                        <p className="font-semibold text-amber-300">
                          {Number(p.pricePerPiece).toFixed(2)} JOD <span className="text-slate-400 font-sans">/ piece</span>
                        </p>
                      )}
                      {(p.sellBy === "package" || p.sellBy === "both") && p.pricePerPackage && (
                        <p className="font-semibold text-amber-300">
                          {Number(p.pricePerPackage).toFixed(2)} JOD <span className="text-slate-400 font-sans">/ package</span>
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Stock: {p.stockInPieces} pieces
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}