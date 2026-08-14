import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, ArrowLeftRight, Search, Users, RotateCcw } from "lucide-react";
import { CartItemRow, type CartLine } from "./components/CartItemRow";
import { CheckoutScreen } from "./CheckoutScreen";
import { getAllProducts } from "../../api/productApi";
import { invoiceService } from "../../services/invoiceService";
import { ApiError } from "../../api/httpClient";
import { getCurrentUser, logout } from "../../api/authApi";
import type { DiscountType } from "../../types/invoice";
import type { Product } from "../../types/catalog";
import "./cashier.css";

export function CashierCartPage() {
  const currentUser = getCurrentUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsStatus, setProductsStatus] = useState<"loading" | "idle" | "error">("loading");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType | "">("");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState<{
    invoiceNumber: number;
    lines: {
      productId: number;
      productName: string;
      unitSold: "piece" | "package";
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[];
    subtotal: number;
    discountAmount: number;
    total: number;
    createdAt: Date;
  } | null>(null);

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

  function addProduct(productId: number) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === productId);
      if (existing) {
        return prev.map((line) =>
          line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...prev, { product, unitSold: "piece", quantity: 1 }];
    });
  }

  function updateQuantity(productId: number, quantity: number) {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((line) => (line.product.id === productId ? { ...line, quantity } : line))
    );
  }

  function removeLine(productId: number) {
    setCart((prev) => prev.filter((line) => line.product.id !== productId));
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const subtotal = cart.reduce((sum, line) => {
    const price = line.unitSold === "package" ? line.product.pricePerPackage ?? 0 : line.product.pricePerPiece;
    return sum + price * line.quantity;
  }, 0);

  const discountNumber = discountValue === "" ? 0 : Number(discountValue);

  const discountAmount =
    discountType === "fixed"
      ? discountNumber
      : discountType === "percentage"
      ? (subtotal * discountNumber) / 100
      : 0;

  const total = subtotal - discountAmount;

  function openCheckout() {
    if (cart.length === 0) {
      setStatus("error");
      setErrorMessage("Cannot checkout an empty cart.");
      return;
    }
    setStatus("idle");
    setErrorMessage(null);
    setShowCheckout(true);
  }

  async function handleFinalize() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await invoiceService.finalize({
        cashierId: currentUser?.id ?? 0,
        items: cart.map((line) => ({
          productId: line.product.id,
          unitSold: line.unitSold,
          quantity: line.quantity,
        })),
        discountType: discountType || null,
        discountValue: discountType ? discountNumber : null,
      });

      const savedInvoice = await invoiceService.getByNumber(response.invoiceNumber);

      setLastInvoiceNumber(savedInvoice.invoiceNumber);
      setReceipt({
        invoiceNumber: savedInvoice.invoiceNumber,
        lines: savedInvoice.items.map((item) => ({
          productId: item.productId,
          productName:
            products.find((p) => p.id === item.productId)?.name ?? `Product #${item.productId}`,
          unitSold: item.unitSold,
          quantity: item.quantity,
          unitPrice: item.unitPriceSnapshot,
          lineTotal: item.lineTotal,
        })),
        subtotal: savedInvoice.subtotal,
        discountAmount: savedInvoice.subtotal - savedInvoice.total,
        total: savedInvoice.total,
        createdAt: new Date(savedInvoice.createdAt),
      });
      setCart([]);
      setDiscountType("");
      setDiscountValue("");
      setStatus("idle");
      setShowCheckout(false);

      setTimeout(() => window.print(), 100);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "An unexpected error occurred.");
    }
  }

  return (
    <div dir="ltr" className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 select-none">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-amber-500/20 bg-black/90 px-6 backdrop-blur-2xl shadow-xl">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">Point of Sale</p>
          <h1 className="text-base font-extrabold tracking-wide text-white">New Invoice</h1>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {currentUser && (
            <span className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 font-semibold text-amber-300">
              {currentUser.fullName}
            </span>
          )}
          <Link
            to="/exchange"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 font-medium text-slate-300 transition hover:border-amber-400/50 hover:bg-slate-800 hover:text-amber-400"
          >
            <ArrowLeftRight size={14} />
            Exchange / Return
          </Link>
          <Link
            to="/returns"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 font-medium text-slate-300 transition hover:border-amber-400/50 hover:bg-slate-800 hover:text-amber-400"
          >
            <RotateCcw size={14} />
            Return Invoice
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-medium text-red-400 transition hover:bg-red-500/20 hover:border-red-500/50"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden p-4 gap-4 box-border">
        <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-amber-500/20 bg-black/80 p-4 backdrop-blur-2xl shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Available products
            </h2>
            <div className="relative w-72">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {productsStatus === "loading" ? (
              <p className="mt-12 text-center text-xs font-semibold text-slate-400">Loading products...</p>
            ) : productsStatus === "error" ? (
              <p className="mt-12 text-center text-xs font-semibold text-red-400">Unable to load products from the server.</p>
            ) : filteredProducts.length === 0 ? (
              <p className="mt-12 text-center text-xs font-semibold text-slate-400">No matching results</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product.id)}
                    className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition hover:border-amber-400/50 hover:bg-amber-400/10 active:scale-[0.98]"
                  >
                    <p className="text-xs font-bold text-slate-100 transition group-hover:text-amber-300 line-clamp-2">{product.name}</p>
                    <p className="mt-3 font-mono text-base font-extrabold text-amber-400">
                      {product.pricePerPiece.toFixed(2)} <span className="text-[10px] font-sans text-slate-400">JOD</span>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="flex w-96 shrink-0 flex-col rounded-2xl border border-amber-500/20 bg-black/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 px-4 py-3 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Cart
              </p>
              <p className="text-sm font-extrabold text-white">New invoice</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
              <Users size={13} className="text-amber-400" />
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-xs font-medium text-slate-400">
                Cart is empty — choose a product from the list
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/60">
                {cart.map((line) => (
                  <CartItemRow
                    key={line.product.id}
                    line={line}
                    onQuantityChange={updateQuantity}
                    onRemove={removeLine}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-800/80 p-3 bg-slate-950/40 shrink-0">
            <div className="flex gap-2">
              <select
                value={discountType}
                onChange={(e) => {
                  const value = e.target.value as DiscountType | "";
                  setDiscountType(value);
                  if (!value) setDiscountValue("");
                }}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 outline-none transition focus:border-amber-400"
              >
                <option value="">No discount</option>
                <option value="fixed">Fixed amount</option>
                <option value="percentage">Percentage</option>
              </select>
              {discountType && (
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={discountValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) setDiscountValue(value);
                  }}
                  className="w-20 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-white text-center outline-none transition focus:border-amber-400"
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-800/80 bg-slate-950/80 p-4 text-xs shrink-0">
            <div className="flex justify-between text-slate-400 font-medium">
              <span>Subtotal</span>
              <span className="font-mono text-slate-200">{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 font-medium">
              <span>Discount</span>
              <span className="font-mono text-red-400">-{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-slate-800/80 pt-2 text-sm font-bold text-white">
              <span>Total</span>
              <span className="font-mono text-xl font-extrabold text-amber-400">{total.toFixed(2)} <span className="text-xs font-sans">JOD</span></span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/90 shrink-0">
            {status === "error" && errorMessage && (
              <p className="mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
                {errorMessage}
              </p>
            )}
            {lastInvoiceNumber && (
              <p className="mb-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400">
                Invoice saved #{lastInvoiceNumber}
              </p>
            )}
            <button
              type="button"
              onClick={openCheckout}
              className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-black transition hover:bg-amber-300 active:scale-95 shadow-lg shadow-amber-400/10"
            >
              Pay
            </button>
          </div>
        </aside>
      </div>

      {showCheckout && (
        <CheckoutScreen
          invoiceLabel="New invoice"
          cashierName={currentUser?.fullName ?? "—"}
          lines={cart}
          subtotal={subtotal}
          discountAmount={discountAmount}
          total={total}
          loading={status === "loading"}
          onConfirm={handleFinalize}
          onCancel={() => setShowCheckout(false)}
        />
      )}

      {receipt && (
        <div className="receipt">
          <div className="receipt-store-name">AL-ISRAA Supermarket</div>
          <div className="receipt-tagline">Nablus — Sh. Sufyan</div>

          <div className="receipt-divider" />

          <div className="receipt-meta">
            <div>
              <span>Invoice #</span>
              <span>#{receipt.invoiceNumber}</span>
            </div>
            <div>
              <span>Date</span>
              <span>{receipt.createdAt.toLocaleDateString("en-GB")}</span>
            </div>
            <div>
              <span>Time</span>
              <span>{receipt.createdAt.toLocaleTimeString("en-GB")}</span>
            </div>
            <div>
              <span>Cashier</span>
              <span>{currentUser?.fullName ?? "—"}</span>
            </div>
          </div>

          <div className="receipt-divider" />

          {receipt.lines.map((line) => (
            <div key={line.productId} className="receipt-item">
              <div className="receipt-item-name">{line.productName}</div>
              <div className="receipt-item-detail">
                <span>
                  {line.quantity} × {line.unitPrice.toFixed(2)}
                </span>
                <span>{line.lineTotal.toFixed(2)}</span>
              </div>
            </div>
          ))}

          <div className="receipt-divider" />

          <div className="receipt-summary-line">
            <span>Subtotal</span>
            <span>{receipt.subtotal.toFixed(2)}</span>
          </div>
          <div className="receipt-summary-line">
            <span>Discount</span>
            <span>-{receipt.discountAmount.toFixed(2)}</span>
          </div>

          <div className="receipt-total">
            <span>Total</span>
            <span>{receipt.total.toFixed(2)} JOD</span>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-footer">
            Thank you for shopping with us
            <br />
            Have a nice day
          </div>
        </div>
      )}
    </div>
  );
}