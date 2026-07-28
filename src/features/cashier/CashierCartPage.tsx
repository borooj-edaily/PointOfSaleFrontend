import { useState } from "react";
import { Link } from "react-router-dom";
import { CartItemRow, type CartLine } from "./components/CartItemRow";
import { mockProducts, mockCurrentUser } from "../../mocks/mockCatalog";
import { invoiceService } from "../../services/invoiceService";
import { ApiError } from "../../api/httpClient";
import type { DiscountType } from "../../types/invoice";
import "./cashier.css";

export function CashierCartPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType | "">("");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<{
    invoiceNumber: number;
    lines: CartLine[];
    subtotal: number;
    discountAmount: number;
    total: number;
  } | null>(null);

  function addProduct(productId: number) {
    const product = mockProducts.find((p) => p.id === productId);
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

  const subtotal = cart.reduce((sum, line) => {
    const price = line.unitSold === "package" ? line.product.pricePerPackage ?? 0 : line.product.pricePerPiece;
    return sum + price * line.quantity;
  }, 0);

  const discountAmount =
    discountType === "fixed"
      ? discountValue
      : discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : 0;

  const total = subtotal - discountAmount;

  async function handleFinalize() {
    // BR-01: block empty invoice client-side too (server also enforces this)
    if (cart.length === 0) {
      setStatus("error");
      setErrorMessage("Cannot finalize an empty invoice.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await invoiceService.finalize({
        cashierId: mockCurrentUser.id,
        items: cart.map((line) => ({
          productId: line.product.id,
          unitSold: line.unitSold,
          quantity: line.quantity,
        })),
        discountType: discountType || null,
        discountValue: discountType ? discountValue : null,
      });

      setLastInvoiceNumber(response.invoiceNumber);
      setReceipt({
        invoiceNumber: response.invoiceNumber,
        lines: cart,
        subtotal,
        discountAmount,
        total,
      });
      setCart([]);
      setDiscountType("");
      setDiscountValue(0);
      setStatus("idle");

      // Give React a tick to render the print-only receipt before opening the print dialog
      setTimeout(() => window.print(), 100);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "Unexpected error.");
    }
  }

  return (
    <div className="cashier-page">
      <div className="cashier-screen">
        <div className="cashier-header">
          <h1 className="cashier-title">New Invoice</h1>
          <Link to="/exchange" className="nav-link">
            Exchange / Return →
          </Link>
        </div>

        <div className="product-picker">
          {mockProducts.map((product) => (
            <button key={product.id} onClick={() => addProduct(product.id)} className="product-btn">
              {product.name}
            </button>
          ))}
        </div>

        {cart.length === 0 ? (
          <p className="empty-cart">Cart is empty — add a product above.</p>
        ) : (
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Line total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((line) => (
                <CartItemRow
                  key={line.product.id}
                  line={line}
                  onQuantityChange={updateQuantity}
                  onRemove={removeLine}
                />
              ))}
            </tbody>
          </table>
        )}

        <div className="discount-row">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as DiscountType | "")}
            className="select-input"
          >
            <option value="">No discount</option>
            <option value="fixed">Fixed amount</option>
            <option value="percentage">Percentage</option>
          </select>
          {discountType && (
            <input
              type="number"
              min={0}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="discount-input"
            />
          )}
        </div>

        <div className="totals">
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>Discount: -${discountAmount.toFixed(2)}</p>
          <p className="grand-total">Total: ${total.toFixed(2)}</p>
        </div>

        {status === "error" && errorMessage && <p className="error-message">{errorMessage}</p>}
        {lastInvoiceNumber && <p className="success-message">Invoice #{lastInvoiceNumber} saved.</p>}

        <button onClick={handleFinalize} disabled={status === "loading"} className="finalize-btn">
          {status === "loading" ? "Saving..." : "Finalize & Print"}
        </button>
      </div>

      {receipt && (
        <div className="receipt">
          <h2>Receipt</h2>
          <p>Invoice #{receipt.invoiceNumber}</p>
          <p>Cashier: {mockCurrentUser.fullName}</p>
          <hr />
          {receipt.lines.map((line) => {
            const price =
              line.unitSold === "package" ? line.product.pricePerPackage ?? 0 : line.product.pricePerPiece;
            return (
              <div key={line.product.id} className="receipt-line">
                <span>
                  {line.product.name} ({line.unitSold}) x{line.quantity}
                </span>
                <span>${(price * line.quantity).toFixed(2)}</span>
              </div>
            );
          })}
          <hr />
          <div className="receipt-line">
            <span>Subtotal</span>
            <span>${receipt.subtotal.toFixed(2)}</span>
          </div>
          <div className="receipt-line">
            <span>Discount</span>
            <span>-${receipt.discountAmount.toFixed(2)}</span>
          </div>
          <div className="receipt-line receipt-total">
            <span>Total</span>
            <span>${receipt.total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}