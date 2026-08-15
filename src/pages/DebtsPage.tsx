import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HandCoins, RefreshCw, Search, CheckCircle2, Clock } from "lucide-react";
import { listDebts, payDebt, type DebtListItem } from "../api/debtsApi";
import { ApiError } from "../api/httpClient";

export default function DebtsPage() {
  const [items, setItems] = useState<DebtListItem[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [onlyUnpaid, setOnlyUnpaid] = useState(true);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await listDebts({ onlyUnpaid, nickname: nickname.trim() || undefined });
      setItems(response.items);
      setTotalOutstanding(response.totalOutstanding);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the debt notebook.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyUnpaid]);

  async function markPaid(invoiceNumber: number) {
    setPayingId(invoiceNumber);
    setError("");
    setSuccess("");
    try {
      await payDebt(invoiceNumber);
      setSuccess(`Invoice #${invoiceNumber} marked as paid.`);
      void load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not mark this debt as paid.");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div dir="rtl" className="pos-page px-5 py-8">
      <main className="mx-auto max-w-5xl">
        <header className="pos-panel mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <Link to="/home" className="pos-icon-button" aria-label="Back">
              <ArrowRight size={20} />
            </Link>
            <div>
              <p className="pos-kicker">AL-ISRAA Supermarket</p>
              <h1 className="text-2xl font-black text-white">Debt notebook — who owes what</h1>
            </div>
          </div>
          <HandCoins className="text-amber-400" size={30} />
        </header>

        {error && <p className="pos-error mb-5">{error}</p>}
        {success && <p className="pos-success mb-5">{success}</p>}

        <section className="pos-panel mb-6 p-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label className="pos-label">
                Search nickname
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="pos-input pr-9"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void load()}
                    placeholder="e.g. Abu Ahmad"
                  />
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyUnpaid(true)}
                className={onlyUnpaid ? "pos-primary" : "pos-secondary"}
              >
                <Clock size={15} /> Unpaid
              </button>
              <button
                type="button"
                onClick={() => setOnlyUnpaid(false)}
                className={!onlyUnpaid ? "pos-primary" : "pos-secondary"}
              >
                <CheckCircle2 size={15} /> All
              </button>
              <button type="button" onClick={() => void load()} className="pos-icon-button" aria-label="Refresh">
                <RefreshCw size={17} />
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <span className="text-sm font-bold text-amber-300">Total outstanding</span>
            <span className="font-mono text-xl font-extrabold text-amber-400">
              {totalOutstanding.toFixed(2)} <span className="text-xs font-sans">JOD</span>
            </span>
          </div>
        </section>

        <section className="pos-panel p-6">
          <h2 className="mb-4 font-bold text-white">Debts</h2>
          {loading ? (
            <p className="pos-muted">Loading...</p>
          ) : items.length === 0 ? (
            <p className="pos-muted">No debts match this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-right text-sm">
                <thead className="border-b border-white/15 text-amber-300">
                  <tr>
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Debtor</th>
                    <th className="p-3">Cashier</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.invoiceId} className="border-b border-white/10 text-slate-200">
                      <td className="p-3 font-mono">#{item.invoiceNumber}</td>
                      <td className="p-3 font-semibold">{item.debtorNickname || "—"}</td>
                      <td className="p-3 text-xs text-slate-400">{item.cashierName}</td>
                      <td className="p-3 font-mono font-bold text-amber-400">{item.total.toFixed(2)}</td>
                      <td className="p-3 text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-3">
                        {item.isPaid ? (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                            Paid
                          </span>
                        ) : (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                            Outstanding
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {!item.isPaid && (
                          <button
                            type="button"
                            onClick={() => void markPaid(item.invoiceNumber)}
                            disabled={payingId === item.invoiceNumber}
                            className="pos-table-button"
                          >
                            <CheckCircle2 size={15} />
                            {payingId === item.invoiceNumber ? "Saving..." : "Mark paid"}
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
      </main>
    </div>
  );
}
