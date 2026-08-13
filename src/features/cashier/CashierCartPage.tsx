import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, ArrowLeftRight, Search, Users   , RotateCcw } from "lucide-react";
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
      setErrorMessage("لا يمكن الدفع لسلة فارغة.");
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

      // The finalize response doesn't include per-item breakdown, so fetch the
      // invoice we just created back from the server. This is the ONLY source
      // of truth for what actually got saved (prices are snapshotted server-side
      // and can differ from what the cart showed if a price changed).
      const savedInvoice = await invoiceService.getByNumber(response.invoiceNumber);

      setLastInvoiceNumber(savedInvoice.invoiceNumber);
      setReceipt({
        invoiceNumber: savedInvoice.invoiceNumber,
        lines: savedInvoice.items.map((item) => ({
          productId: item.productId,
          productName:
            products.find((p) => p.id === item.productId)?.name ?? `منتج #${item.productId}`,
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

      // Give React a tick to render the print-only receipt before opening the print dialog
      setTimeout(() => window.print(), 100);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "حصل خطأ غير متوقع.");
    }
  }

  return (
    <div dir="rtl" className="pos-page min-h-screen">
      <div className="cashier-screen flex h-screen flex-col">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between bg-[#1C2333] px-6 py-4 text-white shadow-md">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">نقطة البيع</p>
            <h1 className="text-lg font-semibold">فاتورة جديدة</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {currentUser && <span className="text-slate-300">{currentUser.fullName}</span>}
            <Link
              to="/exchange"
              className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 transition hover:bg-slate-700"
            >
              <ArrowLeftRight size={14} />
              استبدال / إرجاع
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 transition hover:bg-slate-700"
            >
              <Link
  to="/returns"
  className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 transition hover:bg-slate-700"
>
  <RotateCcw size={14} />
  إرجاع فاتورة
</Link>
              <LogOut size={14} />
              تسجيل خروج
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Cart / order ticket */}
          <aside className="flex w-[320px] shrink-0 flex-col border-l border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  السلة
                </p>
                <p className="text-sm font-semibold text-slate-900">فاتورة جديدة</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                <Users size={12} />
                {itemCount} صنف
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-400">
                السلة فارغة — اختر منتج من القائمة
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
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

            <div className="border-t border-slate-100 p-4">
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => {
                    const value = e.target.value as DiscountType | "";
                    setDiscountType(value);
                    if (!value) setDiscountValue("");
                  }}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">بدون خصم</option>
                  <option value="fixed">مبلغ ثابت</option>
                  <option value="percentage">نسبة مئوية</option>
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
                    className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-mono focus:border-emerald-400 focus:outline-none"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>المجموع الفرعي</span>
                <span className="font-mono">{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>الخصم</span>
                <span className="font-mono">-{discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-dashed border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <span>الإجمالي</span>
                <span className="font-mono">{total.toFixed(2)} د.أ</span>
              </div>
            </div>

            <div className="p-4">
              {status === "error" && errorMessage && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {errorMessage}
                </p>
              )}
              {lastInvoiceNumber && (
                <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
                  تم حفظ الفاتورة رقم #{lastInvoiceNumber}
                </p>
              )}
              <button
                type="button"
                onClick={openCheckout}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                الدفع
              </button>
            </div>
          </aside>

          {/* Products */}
          <section className="flex-1 overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                المنتجات
              </h2>
              <div className="relative w-64">
                <Search
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {productsStatus === "loading" ? (
              <p className="mt-10 text-center text-sm text-slate-400">جارٍ تحميل المنتجات...</p>
            ) : productsStatus === "error" ? (
              <p className="mt-10 text-center text-sm text-red-500">تعذّر تحميل المنتجات من الخادم.</p>
            ) : filteredProducts.length === 0 ? (
              <p className="mt-10 text-center text-sm text-slate-400">لا توجد نتائج مطابقة</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product.id)}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-right transition hover:border-emerald-400 hover:shadow-md"
                  >
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="mt-2 font-mono font-semibold text-emerald-700">
                      {product.pricePerPiece.toFixed(2)} د.أ
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {showCheckout && (
          <CheckoutScreen
            invoiceLabel="فاتورة جديدة"
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
      </div>

      {receipt && (
        <div className="receipt">
          <div className="receipt-store-name">سوبرماركت المدينة</div>
          <div className="receipt-tagline">شارع الملك حسين — 06-1234567</div>

          <div className="receipt-divider" />

          <div className="receipt-meta">
            <div>
              <span>فاتورة رقم</span>
              <span>#{receipt.invoiceNumber}</span>
            </div>
            <div>
              <span>التاريخ</span>
              <span>{receipt.createdAt.toLocaleDateString("ar-JO")}</span>
            </div>
            <div>
              <span>الوقت</span>
              <span>{receipt.createdAt.toLocaleTimeString("ar-JO")}</span>
            </div>
            <div>
              <span>الكاشير</span>
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
            <span>المجموع الفرعي</span>
            <span>{receipt.subtotal.toFixed(2)}</span>
          </div>
          <div className="receipt-summary-line">
            <span>الخصم</span>
            <span>-{receipt.discountAmount.toFixed(2)}</span>
          </div>

          <div className="receipt-total">
            <span>الإجمالي</span>
            <span>{receipt.total.toFixed(2)} د.أ</span>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-footer">
            شكراً لتسوقكم معنا
            <br />
            نتمنى لكم يوماً سعيداً
          </div>
        </div>
      )}
    </div>
  );
}
