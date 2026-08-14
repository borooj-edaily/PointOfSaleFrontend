import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  LogOut,
  RotateCcw,
  Search,
} from "lucide-react";
import { invoiceService } from "../../services/invoiceService";
import { getCurrentUser, logout } from "../../api/authApi";
import { ApiError } from "../../api/httpClient";
import type { GetInvoiceByNumberResponse } from "../../types/invoice";

export function ReturnScreen() {
  const currentUser = getCurrentUser();

  const [invoiceNumberText, setInvoiceNumberText] = useState("");
  const [invoice, setInvoice] = useState<GetInvoiceByNumberResponse | null>(null);

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedItem = invoice?.items.find((item) => item.invoiceItemId === selectedItemId);

  async function loadInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const invoiceNumber = Number(invoiceNumberText);

    if (!invoiceNumber || invoiceNumber < 1) {
      setError("Please enter a valid invoice number.");
      return;
    }

    setLoadingInvoice(true);
    setError("");
    setSuccess("");
    setInvoice(null);
    setSelectedItemId(null);

    try {
      const data = await invoiceService.getByNumber(invoiceNumber);
      setInvoice(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to find the invoice.");
    } finally {
      setLoadingInvoice(false);
    }
  }

  async function submitReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedItem) {
      setError("Select the item you want to return.");
      return;
    }

    const returnedQuantity = Number(quantity);

    if (!returnedQuantity || returnedQuantity < 1 || returnedQuantity > selectedItem.returnableQuantity) {
      setError(`Quantity must be between 1 and ${selectedItem.returnableQuantity}.`);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await invoiceService.returnItem({
        invoiceItemId: selectedItem.invoiceItemId,
        returnedQuantity,
        processedBy: currentUser?.id ?? 0,
        reason: reason.trim() || null,
      });

      setSuccess(`Return completed successfully. Refund amount: ${response.refundAmount.toFixed(2)} JOD`);

      const updatedInvoice = await invoiceService.getByNumber(invoice!.invoiceNumber);

      setInvoice(updatedInvoice);
      setSelectedItemId(null);
      setQuantity("1");
      setReason("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "An error occurred while processing the return.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex shrink-0 items-center justify-between border-b border-amber-500/20 bg-black/80 px-8 py-4 backdrop-blur-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <Link
            to="/cashier"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/60 text-slate-300 transition hover:border-amber-400/50 hover:bg-slate-800 hover:text-amber-400"
            aria-label="Back to cashier"
          >
            <ArrowRight size={18} />
          </Link>

          <div>
            <p className="text-xs uppercase tracking-widest text-amber-400 font-medium">Point of sale</p>
            <h1 className="text-xl font-extrabold tracking-wide text-white">Invoice return</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {currentUser && (
            <span className="font-semibold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-2xl">
              {currentUser.fullName}
            </span>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 font-medium text-red-400 transition hover:bg-red-500/20 hover:border-red-500/50"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <section className="rounded-3xl border border-amber-500/20 bg-black/80 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
          <h2 className="mb-5 text-base font-bold text-amber-400">Search invoice</h2>

          <form onSubmit={loadInvoice} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="number"
              min="1"
              value={invoiceNumberText}
              onChange={(event) => setInvoiceNumberText(event.target.value)}
              placeholder="Enter invoice number..."
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-3 font-mono text-base text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner"
            />

            <button
              type="submit"
              disabled={loadingInvoice}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-7 py-3 text-base font-bold text-black transition hover:bg-amber-300 active:scale-95 disabled:opacity-50 shadow-lg shadow-amber-400/10"
            >
              <Search size={18} />
              {loadingInvoice ? "Searching..." : "Search"}
            </button>
          </form>
        </section>

        {error && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-400">
            {error}
          </p>
        )}

        {success && (
          <p className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-400">
            <CheckCircle2 size={18} className="shrink-0" />
            {success}
          </p>
        )}

        {invoice && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-3xl border border-amber-500/20 bg-black/80 p-6 backdrop-blur-2xl shadow-2xl">
              <div className="mb-5 border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white">
                  Invoice <span className="font-mono text-amber-400">#{invoice.invoiceNumber}</span>
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Current total: <span className="font-mono font-bold text-amber-400">{invoice.total.toFixed(2)} JOD</span>
                </p>
              </div>

              <div className="space-y-3">
                {invoice.items.map((item) => {
                  const canReturn = item.returnableQuantity > 0;
                  const selected = item.invoiceItemId === selectedItemId;

                  return (
                    <button
                      key={item.invoiceItemId}
                      type="button"
                      disabled={!canReturn}
                      onClick={() => {
                        setSelectedItemId(item.invoiceItemId);
                        setQuantity("1");
                      }}
                      className={`w-full rounded-2xl border p-4 text-right transition ${
                        selected
                          ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/5"
                          : "border-slate-800 bg-slate-900/60 hover:border-amber-400/40 hover:bg-slate-900"
                      } ${!canReturn ? "cursor-not-allowed opacity-40 hover:border-slate-800 hover:bg-slate-900/60" : ""}`}
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-100">Item #{item.productId}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Quantity in invoice: <span className="font-mono text-slate-300">{item.quantity}</span> · Returned: {" "}
                            <span className="font-mono text-slate-300">{item.alreadyReturnedQuantity}</span>
                          </p>
                        </div>

                        <div className="text-left">
                          <p className="font-mono text-sm font-bold text-white">{item.lineTotal.toFixed(2)} JOD</p>
                          <p className="mt-1 text-xs font-semibold text-amber-400">Available to return: {item.returnableQuantity}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="h-fit rounded-3xl border border-amber-500/20 bg-black/80 p-6 backdrop-blur-2xl shadow-2xl">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                  <RotateCcw size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-white">Process return</h2>
                  <p className="text-xs text-slate-400">Select an item from the list first.</p>
                </div>
              </div>

              <form onSubmit={submitReturn} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Selected item</label>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-amber-300">
                    {selectedItem ? `Item #${selectedItem.productId}` : "No item selected"}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Quantity</label>

                  <input
                    type="number"
                    min="1"
                    max={selectedItem?.returnableQuantity}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    disabled={!selectedItem}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-amber-400 disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Return reason (optional)</label>

                  <textarea
                    rows={3}
                    maxLength={250}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Example: damaged item or item entered incorrectly"
                    disabled={!selectedItem}
                    className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400 disabled:opacity-40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedItem || submitting}
                  className="w-full rounded-2xl bg-amber-400 py-3.5 text-sm font-bold text-black transition hover:bg-amber-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 shadow-lg shadow-amber-400/10"
                >
                  {submitting ? "Processing return..." : "Confirm return"}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}