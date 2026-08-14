import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, ArrowLeft, Search, CheckCircle2 } from "lucide-react";
import { getAllProducts } from "../../api/productApi";
import { invoiceService } from "../../services/invoiceService";
import { ApiError } from "../../api/httpClient";
import { getCurrentUser, logout } from "../../api/authApi";
import type { Product } from "../../types/catalog";
import type {
  ExchangeInvoiceItemResponse,
  GetInvoiceByNumberResponse,
  InvoiceItemDto,
  UnitSold,
} from "../../types/invoice";

type LookupStatus = "idle" | "loading" | "notFound" | "error";
type SubmitStatus = "idle" | "loading" | "error";

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 font-bold text-black shadow-md shadow-amber-400/20 text-xs">
      {n}
    </span>
  );
}

function productName(products: Product[], productId: number): string {
  return products.find((p) => p.id === productId)?.name ?? `#${productId}`;
}

export function ExchangeScreen() {
  const currentUser = getCurrentUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsStatus, setProductsStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    getAllProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        setProductsStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setProductsStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [invoiceNumberInput, setInvoiceNumberInput] = useState("");
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [invoice, setInvoice] = useState<GetInvoiceByNumberResponse | null>(null);

  const [manualMode, setManualMode] = useState(false);
  const [manualInvoiceItemId, setManualInvoiceItemId] = useState("");

  const [selectedItem, setSelectedItem] = useState<InvoiceItemDto | null>(null);
  const [returnedQuantity, setReturnedQuantity] = useState(1);
  const [replacementProductId, setReplacementProductId] = useState<number | "">("");
  const [replacementUnitSold, setReplacementUnitSold] = useState<UnitSold>("piece");
  const [replacementQuantity, setReplacementQuantity] = useState(1);
  const [reason, setReason] = useState("");

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ExchangeInvoiceItemResponse | null>(null);

  const replacementProduct = products.find((p) => p.id === replacementProductId);

  async function handleLookup() {
    const invoiceNumber = Number(invoiceNumberInput);
    if (!invoiceNumber || invoiceNumber <= 0) {
      setLookupStatus("error");
      return;
    }

    setLookupStatus("loading");
    setInvoice(null);
    setSelectedItem(null);
    setManualMode(false);

    try {
      const response = await invoiceService.getByNumber(invoiceNumber);
      setInvoice(response);
      setLookupStatus("idle");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setLookupStatus("notFound");
      } else {
        setLookupStatus("error");
      }
    }
  }

  function selectItem(item: InvoiceItemDto) {
    setSelectedItem(item);
    setReturnedQuantity(1);
    setReplacementProductId("");
    setReplacementUnitSold("piece");
    setReplacementQuantity(1);
    setReason("");
    setResult(null);
    setErrorMessage(null);
  }

  function resetAll() {
    setInvoiceNumberInput("");
    setInvoice(null);
    setSelectedItem(null);
    setManualMode(false);
    setManualInvoiceItemId("");
    setResult(null);
    setErrorMessage(null);
    setLookupStatus("idle");
    setSubmitStatus("idle");
  }

  async function handleSubmit() {
    const invoiceItemId = manualMode ? Number(manualInvoiceItemId) : selectedItem?.invoiceItemId;

    if (!invoiceItemId || invoiceItemId <= 0) {
      setSubmitStatus("error");
      setErrorMessage("Please select or enter a valid invoice item.");
      return;
    }

    if (!replacementProductId) {
      setSubmitStatus("error");
      setErrorMessage("Please choose a replacement product.");
      return;
    }

    setSubmitStatus("loading");
    setErrorMessage(null);

    try {
      const response = await invoiceService.exchange({
        invoiceItemId,
        returnedQuantity,
        replacementProductId,
        replacementUnitSold,
        replacementQuantity,
        processedBy: currentUser?.id ?? 0,
        reason: reason || null,
      });

      setResult(response);
      setSubmitStatus("idle");
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "An unexpected error occurred.");
    }
  }

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex shrink-0 items-center justify-between border-b border-amber-500/20 bg-black/80 px-8 py-4 backdrop-blur-2xl shadow-xl">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-400 font-medium">Point of sale</p>
          <h1 className="text-xl font-extrabold tracking-wide text-white">Exchange / return</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {currentUser && (
            <span className="font-semibold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-2xl">
              {currentUser.fullName}
            </span>
          )}
          <Link
            to="/cashier"
            className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2 font-medium text-slate-200 transition hover:border-amber-400/50 hover:bg-slate-800 hover:text-amber-400"
          >
            <ArrowLeft size={16} />
            New invoice
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 font-medium text-red-400 transition hover:bg-red-500/20 hover:border-red-500/50"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <section className="rounded-3xl border border-amber-500/20 bg-black/80 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
            <h2 className="mb-6 flex items-center gap-3 text-base font-bold text-amber-400">
              <StepBadge n={1} />
              Find invoice
            </h2>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="number"
                min={1}
                placeholder="Invoice number..."
                value={invoiceNumberInput}
                onChange={(e) => setInvoiceNumberInput(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-3 font-mono text-base text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookupStatus === "loading"}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-7 py-3 text-base font-bold text-black transition hover:bg-amber-300 active:scale-95 disabled:opacity-50 shadow-lg shadow-amber-400/10"
              >
                <Search size={18} />
                {lookupStatus === "loading" ? "Searching..." : "Search"}
              </button>
            </div>

            {lookupStatus === "error" && (
              <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                Please enter a valid invoice number.
              </p>
            )}

            {lookupStatus === "notFound" && !manualMode && (
              <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm">
                <p className="text-amber-200">
                  No invoice was found for this number, or the lookup service is not enabled yet.
                </p>
                <button
                  type="button"
                  className="mt-3 font-bold text-amber-400 transition hover:text-amber-300 hover:underline"
                  onClick={() => setManualMode(true)}
                >
                  ← Enter the invoice item ID manually instead
                </button>
              </div>
            )}

            {manualMode && (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <label className="block text-sm font-medium text-slate-300">
                  Invoice item number
                  <input
                    type="number"
                    min={1}
                    value={manualInvoiceItemId}
                    onChange={(e) => setManualInvoiceItemId(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 font-mono text-sm text-white outline-none transition focus:border-amber-400"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-400">
                  Ask the cashier or supervisor for the item number from the original invoice.
                </p>
              </div>
            )}

            {invoice && (
              <div className="mt-6">
                <p className="mb-4 text-sm text-slate-300">
                  Invoice <span className="font-mono font-bold text-amber-400">#{invoice.invoiceNumber}</span> — Total:{" "}
                  <span className="font-mono font-bold text-amber-400">{invoice.total.toFixed(2)} JOD</span>
                </p>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/80 text-amber-400/80 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-right font-semibold">Product</th>
                        <th className="px-4 py-3 text-right font-semibold">Unit</th>
                        <th className="px-4 py-3 text-right font-semibold">Quantity sold</th>
                        <th className="px-4 py-3 text-right font-semibold">Returnable</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {invoice.items.map((item) => (
                        <tr
                          key={item.invoiceItemId}
                          className={`transition ${
                            selectedItem?.invoiceItemId === item.invoiceItemId ? "bg-amber-400/10" : "hover:bg-slate-800/30"
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-100">
                            {productName(products, item.productId)}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{item.unitSold}</td>
                          <td className="px-4 py-3 font-mono text-slate-200">{item.quantity}</td>
                          <td className="px-4 py-3 font-mono text-amber-400 font-semibold">{item.returnableQuantity}</td>
                          <td className="px-4 py-3 text-left">
                            <button
                              type="button"
                              className="rounded-xl bg-amber-400/10 border border-amber-400/20 px-3 py-1 font-bold text-amber-400 transition hover:bg-amber-400 hover:text-black disabled:cursor-default disabled:opacity-30 disabled:hover:bg-amber-400/10 disabled:hover:text-amber-400"
                              disabled={item.returnableQuantity <= 0}
                              onClick={() => selectItem(item)}
                            >
                              {item.returnableQuantity <= 0 ? "Fully returned" : "Select"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {(selectedItem || manualMode) && (
            <section className="rounded-3xl border border-amber-500/20 bg-black/80 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
              <h2 className="mb-6 flex items-center gap-3 text-base font-bold text-amber-400">
                <StepBadge n={2} />
                Exchange details
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-300">
                  Returned quantity
                  <input
                    type="number"
                    min={1}
                    max={selectedItem?.returnableQuantity}
                    value={returnedQuantity}
                    onChange={(e) => setReturnedQuantity(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 font-mono text-base text-white outline-none transition focus:border-amber-400"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Replacement product
                  <select
                    value={replacementProductId}
                    onChange={(e) => {
                      const id = Number(e.target.value) || "";
                      setReplacementProductId(id);
                      setReplacementUnitSold("piece");
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400"
                  >
                    <option value="">
                      {productsStatus === "loading" ? "Loading products..." : "Select a product..."}
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Replacement unit
                  <select
                    value={replacementUnitSold}
                    onChange={(e) => setReplacementUnitSold(e.target.value as UnitSold)}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400"
                  >
                    <option value="piece">Piece</option>
                    <option value="package" disabled={!replacementProduct?.pricePerPackage}>
                      Package
                    </option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Replacement quantity
                  <input
                    type="number"
                    min={1}
                    value={replacementQuantity}
                    onChange={(e) => setReplacementQuantity(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 font-mono text-base text-white outline-none transition focus:border-amber-400"
                  />
                </label>
              </div>

              <label className="mt-5 block text-sm font-medium text-slate-300">
                Reason (optional)
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400"
                  rows={2}
                  maxLength={255}
                />
              </label>

              {submitStatus === "error" && errorMessage && (
                <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                  {errorMessage}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitStatus === "loading"}
                className="mt-6 w-full rounded-2xl bg-amber-400 py-3.5 text-base font-bold text-black transition hover:bg-amber-300 active:scale-95 disabled:opacity-50 shadow-lg shadow-amber-400/10"
              >
                {submitStatus === "loading" ? "Processing..." : "Execute exchange"}
              </button>
            </section>
          )}

          {result && (
            <section className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-black/80 backdrop-blur-2xl shadow-2xl">
              <div className="border-b border-slate-800 p-6 md:p-8">
                <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-400">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                  Exchange completed successfully
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Exchange process <span className="font-mono text-amber-400 font-bold">#{result.exchangeId}</span> for invoice{" "}
                  <span className="font-mono text-amber-400 font-bold">#{result.invoiceId}</span>
                </p>
              </div>

              <div className="space-y-3 bg-slate-900/40 p-6 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Returned item value</span>
                  <span className="font-mono font-semibold text-slate-100">{result.returnedItemValue.toFixed(2)} JOD</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Replacement item value</span>
                  <span className="font-mono font-semibold text-slate-100">{result.replacementItemValue.toFixed(2)} JOD</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-dashed border-slate-800 pt-3 text-base">
                  <span className="font-bold text-amber-400">
                    {result.priceDifference > 0
                      ? "Amount due from customer"
                      : result.priceDifference < 0
                      ? "Amount due to customer"
                      : "Equivalent exchange"}
                  </span>
                  <span className="font-mono text-xl font-bold text-amber-400">
                    {Math.abs(result.priceDifference).toFixed(2)} JOD
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-3 text-slate-100 font-semibold">
                  <span>New invoice total</span>
                  <span className="font-mono font-bold text-emerald-400">{result.newTotal.toFixed(2)} JOD</span>
                </div>
              </div>

              <div className="p-6">
                <button
                  type="button"
                  onClick={resetAll}
                  className="w-full rounded-2xl border border-amber-400/30 bg-amber-400/10 py-3.5 text-sm font-bold text-amber-400 transition hover:bg-amber-400 hover:text-black"
                >
                  Start a new exchange
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}