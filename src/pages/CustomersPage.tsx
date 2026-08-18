import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  UserPlus,
  Users,
  Edit3,
  Power,
  X,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Receipt,
  Wallet,
} from "lucide-react";

import {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
  getCustomerDebtHistory,
} from "../api/customerApi";

import type {
  Customer,
  CustomerDebtHistory,
} from "../types/customer";

import { ApiError } from "../api/httpClient";

export default function CustomersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] =
    useState<CustomerDebtHistory | null>(null);

  const [historyLoading, setHistoryLoading] = useState(false);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    try {
      const data = await getAllCustomers({
        search: search.trim() || undefined,
      });

      // أعلى عدد فواتير أولاً
      const sorted = [...data].sort(
        (a, b) =>
          (b.invoiceCount ?? 0) -
          (a.invoiceCount ?? 0)
      );

      setCustomers(sorted);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openHistory(customerId: number) {
    setHistoryLoading(true);
    setError("");

    try {
      const data = await getCustomerDebtHistory(customerId);

      setHistory(data);

      navigate(`/customers/${customerId}`, {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load this customer's file."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setHistory(null);
    navigate("/customers", {
      replace: true,
    });
  }

  useEffect(() => {
    if (id) {
      void openHistory(Number(id));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function resetForm() {
    setName("");
    setPhone("");
    setNotes("");
    setEditingCustomer(null);
  }

  function startEditing(customer: Customer) {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone ?? "");
    setNotes(customer.notes ?? "");
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Customer name is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: trimmedName,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      };

      if (editingCustomer) {
        await updateCustomer(
          editingCustomer.id,
          payload
        );

        setSuccess(
          "Customer updated successfully."
        );
      } else {
        await createCustomer(payload);

        setSuccess(
          "Customer added successfully."
        );
      }

      resetForm();
      await loadCustomers();
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

  async function handleDeactivate(
    customer: Customer
  ) {
    if (customer.outstandingDebt > 0) {
      window.alert(
        "This customer still has an outstanding debt and cannot be deactivated yet."
      );

      return;
    }

    const confirmed = window.confirm(
      `Deactivate customer "${customer.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deactivateCustomer(customer.id);

      setSuccess("Customer deactivated.");

      await loadCustomers();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not deactivate this customer."
      );
    }
  }

  return (
    <div
      dir="rtl"
      className="pos-page px-5 py-8"
    >
      <main className="mx-auto max-w-7xl">

        {/* HEADER */}
        <header className="pos-panel mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <Link
              to="/cashier"
              className="pos-icon-button"
              aria-label="Back"
            >
              <ArrowRight size={20} />
            </Link>

            <div>
              <p className="pos-kicker">
                AL-ISRAA Supermarket
              </p>

              <h1 className="text-2xl font-black text-white">
                Customers
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                Customer profiles, invoices and debt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/debts"
              className="pos-secondary"
            >
              <Clock size={15} />
              Debt notebook
            </Link>

            <Users
              className="text-amber-400"
              size={30}
            />
          </div>
        </header>

        {error && (
          <p className="pos-error mb-5">
            {error}
          </p>
        )}

        {success && (
          <p className="pos-success mb-5">
            {success}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">

          {/* ADD CUSTOMER */}
          <section className="pos-panel h-fit p-6">
            <div className="mb-4 flex items-center gap-2">
              {editingCustomer ? (
                <Edit3
                  size={18}
                  className="text-amber-400"
                />
              ) : (
                <UserPlus
                  size={18}
                  className="text-amber-400"
                />
              )}

              <h2 className="font-bold text-white">
                {editingCustomer
                  ? "Edit customer"
                  : "Add customer"}
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <label className="pos-label">
                Name

                <input
                  autoFocus
                  className="pos-input"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. Abu Ahmad"
                  maxLength={150}
                />
              </label>

              <label className="pos-label">
                Phone (optional)

                <input
                  className="pos-input"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="059xxxxxxx"
                  maxLength={30}
                />
              </label>

              <label className="pos-label">
                Notes (optional)

                <textarea
                  className="pos-input"
                  rows={3}
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  placeholder="Any useful note about this customer"
                  maxLength={500}
                />
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="pos-primary flex-1"
                >
                  {submitting
                    ? "Saving..."
                    : editingCustomer
                    ? "Save changes"
                    : "Add customer"}
                </button>

                {editingCustomer && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="pos-icon-button"
                    aria-label="Cancel"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* CUSTOMERS */}
          <section className="pos-panel p-6">

            {/* SEARCH */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  className="pos-input pr-9"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    void loadCustomers()
                  }
                  placeholder="Search by name or phone"
                />
              </div>

              <button
                type="button"
                onClick={() => void loadCustomers()}
                className="pos-secondary"
              >
                <Search size={15} />
                Search
              </button>
            </div>

            {/* SORT INFO */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">
                  Customers
                </p>

                <p className="text-xs text-slate-500">
                  Sorted by number of invoices
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                {customers.length} customers
              </span>
            </div>

            {loading ? (
              <p className="pos-muted">
                Loading...
              </p>
            ) : customers.length === 0 ? (
              <p className="pos-muted">
                No customers match this search.
              </p>
            ) : (
              <div className="space-y-2">

                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`rounded-xl border p-4 transition ${
                      customer.isActive
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "border-white/5 bg-white/[0.02] opacity-60"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-4">

                      {/* CUSTOMER */}
                      <button
                        type="button"
                        onClick={() =>
                          void openHistory(
                            customer.id
                          )
                        }
                        className="flex min-w-[220px] flex-1 items-center gap-3 text-right"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                          <Users size={19} />
                        </div>

                        <div>
                          <p className="font-bold text-white">
                            {customer.name}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                            {customer.phone && (
                              <>
                                <Phone size={11} />
                                {customer.phone}
                              </>
                            )}

                            {!customer.isActive && (
                              <span className="text-red-400">
                                · Inactive
                              </span>
                            )}
                          </p>
                        </div>
                      </button>

                      {/* INVOICE COUNT */}
                      <div className="min-w-[90px] text-center">
                        <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
                          <Receipt size={12} />
                          Invoices
                        </p>

                        <p className="mt-1 font-mono text-lg font-extrabold text-white">
                          {customer.invoiceCount ?? 0}
                        </p>
                      </div>

                      {/* TOTAL PURCHASES */}
                      <div className="min-w-[110px] text-center">
                        <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
                          <Wallet size={12} />
                          Purchases
                        </p>

                        <p className="mt-1 font-mono text-sm font-bold text-slate-200">
                          {(customer.totalPurchases ?? 0).toFixed(
                            2
                          )}{" "}
                          JOD
                        </p>
                      </div>

                      {/* DEBT */}
                      <div className="min-w-[110px] text-center">
                        <p className="text-xs text-slate-500">
                          Outstanding
                        </p>

                        <p
                          className={`mt-1 font-mono text-sm font-bold ${
                            customer.outstandingDebt > 0
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {customer.outstandingDebt.toFixed(
                            2
                          )}{" "}
                          JOD
                        </p>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(customer)
                          }
                          className="pos-table-button"
                          aria-label="Edit"
                        >
                          <Edit3 size={15} />
                        </button>

                        {customer.isActive && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeactivate(
                                customer
                              )
                            }
                            className="pos-table-button"
                            aria-label="Deactivate"
                          >
                            <Power size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </section>
        </div>
      </main>

      {/* CUSTOMER FILE */}
      {(history || historyLoading) && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-amber-500/20 bg-slate-950 p-6 shadow-2xl">

            {historyLoading || !history ? (
              <p className="pos-muted py-10 text-center">
                Loading customer file...
              </p>
            ) : (
              <>
                {/* CUSTOMER HEADER */}
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="pos-kicker">
                      Customer file
                    </p>

                    <h2 className="text-2xl font-black text-white">
                      {history.customerName}
                    </h2>

                    {history.phone && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <Phone size={11} />
                        {history.phone}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={closeHistory}
                    className="pos-icon-button"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* STATS */}
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-500">
                      Total invoices
                    </p>

                    <p className="mt-1 font-mono text-xl font-extrabold text-white">
                      {history.invoices.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-500">
                      Total purchases
                    </p>

                    <p className="mt-1 font-mono text-xl font-extrabold text-white">
                      {history.invoices
                        .reduce(
                          (sum, invoice) =>
                            sum + invoice.total,
                          0
                        )
                        .toFixed(2)}{" "}
                      <span className="text-xs">
                        JOD
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-xs text-amber-300">
                      Outstanding debt
                    </p>

                    <p className="mt-1 font-mono text-xl font-extrabold text-amber-400">
                      {history.outstandingDebt.toFixed(
                        2
                      )}{" "}
                      <span className="text-xs">
                        JOD
                      </span>
                    </p>
                  </div>
                </div>

                {/* INVOICES */}
                <h3 className="mb-3 text-sm font-bold text-white">
                  Invoice history
                </h3>

                {history.invoices.length === 0 ? (
                  <p className="pos-muted">
                    No invoices recorded for this
                    customer yet.
                  </p>
                ) : (
                  <div className="space-y-2">

                    {history.invoices.map(
                      (invoice) => (
                        <div
                          key={invoice.invoiceId}
                          className="rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">

                            <div>
                              <p className="font-mono font-bold text-slate-200">
                                Invoice #
                                {
                                  invoice.invoiceNumber
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-slate-500">
                                {new Date(
                                  invoice.createdAt
                                ).toLocaleDateString(
                                  "en-GB"
                                )}
                              </p>
                            </div>

                            <div className="text-left">
                              <p className="font-mono text-lg font-extrabold text-white">
                                {invoice.total.toFixed(
                                  2
                                )}
                              </p>

                              <p className="text-[10px] text-slate-500">
                                JOD
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">

                            {/* CASH */}
                            {!invoice.isDebt && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                                Cash payment
                              </span>
                            )}

                            {/* DEBT */}
                            {invoice.isDebt && (
                              <>
                                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                                  Deferred payment
                                </span>

                                {invoice.isPaid ? (
                                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                                    <CheckCircle2
                                      size={12}
                                      className="mr-1 inline -mt-0.5"
                                    />
                                    Paid
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-300">
                                    <Clock
                                      size={12}
                                      className="mr-1 inline -mt-0.5"
                                    />
                                    Outstanding
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    )}

                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}