import { useState } from "react";
import { Link } from "react-router-dom";
import { mockProducts, mockCurrentUser } from "../../mocks/mockCatalog";
import { invoiceService } from "../../services/invoiceService";
import { ApiError } from "../../api/httpClient";
import type {
  ExchangeInvoiceItemResponse,
  GetInvoiceByNumberResponse,
  InvoiceItemDto,
  UnitSold,
} from "../../types/invoice";
import "./exchange.css";

type LookupStatus = "idle" | "loading" | "notFound" | "error";
type SubmitStatus = "idle" | "loading" | "error";

export function ExchangeScreen() {
  // --- Step 1: find the invoice ---
  const [invoiceNumberInput, setInvoiceNumberInput] = useState("");
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [invoice, setInvoice] = useState<GetInvoiceByNumberResponse | null>(null);

  // Fallback used when the "get invoice by number" endpoint isn't available yet
  // on the backend (currently only /finalize and /exchange exist there).
  const [manualMode, setManualMode] = useState(false);
  const [manualInvoiceItemId, setManualInvoiceItemId] = useState("");

  // --- Step 2: selected line + replacement details ---
  const [selectedItem, setSelectedItem] = useState<InvoiceItemDto | null>(null);
  const [returnedQuantity, setReturnedQuantity] = useState(1);
  const [replacementProductId, setReplacementProductId] = useState<number | "">("");
  const [replacementUnitSold, setReplacementUnitSold] = useState<UnitSold>("piece");
  const [replacementQuantity, setReplacementQuantity] = useState(1);
  const [reason, setReason] = useState("");

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ExchangeInvoiceItemResponse | null>(null);

  const replacementProduct = mockProducts.find((p) => p.id === replacementProductId);

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
        // Either the invoice truly doesn't exist, or (today) the lookup
        // endpoint itself isn't implemented on the backend yet.
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
    const invoiceItemId = manualMode
      ? Number(manualInvoiceItemId)
      : selectedItem?.invoiceItemId;

    if (!invoiceItemId || invoiceItemId <= 0) {
      setSubmitStatus("error");
      setErrorMessage("Please select (or enter) a valid invoice item.");
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
        processedBy: mockCurrentUser.id,
        reason: reason || null,
      });

      setResult(response);
      setSubmitStatus("idle");
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "Unexpected error.");
    }
  }

  return (
    <div className="exchange-page">
      <div className="exchange-screen">
        <div className="exchange-header">
          <h1 className="exchange-title">Exchange / Return</h1>
          <Link to="/" className="nav-link">
            ← Back to New Invoice
          </Link>
        </div>

        {/* Step 1: locate the invoice item to exchange */}
        <section className="exchange-section">
          <h2 className="section-label">1. Find the invoice</h2>
          <div className="lookup-row">
            <input
              type="number"
              min={1}
              placeholder="Invoice number"
              value={invoiceNumberInput}
              onChange={(e) => setInvoiceNumberInput(e.target.value)}
              className="lookup-input"
            />
            <button
              onClick={handleLookup}
              disabled={lookupStatus === "loading"}
              className="lookup-btn"
            >
              {lookupStatus === "loading" ? "Searching..." : "Find"}
            </button>
          </div>

          {lookupStatus === "error" && (
            <p className="error-message">Enter a valid invoice number.</p>
          )}

          {lookupStatus === "notFound" && !manualMode && (
            <div className="fallback-box">
              <p>
                No invoice found for that number (or the lookup isn't available yet).
              </p>
              <button className="link-btn" onClick={() => setManualMode(true)}>
                Enter the invoice item ID manually instead →
              </button>
            </div>
          )}

          {manualMode && (
            <div className="manual-entry">
              <label className="field-label">
                Invoice Item ID
                <input
                  type="number"
                  min={1}
                  value={manualInvoiceItemId}
                  onChange={(e) => setManualInvoiceItemId(e.target.value)}
                  className="lookup-input"
                />
              </label>
              <p className="hint-text">
                Ask the cashier/supervisor for the item's ID from the original receipt.
              </p>
            </div>
          )}

          {invoice && (
            <div className="invoice-summary">
              <p>
                Invoice #{invoice.invoiceNumber} — Total: ${invoice.total.toFixed(2)}
              </p>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Unit</th>
                    <th>Qty sold</th>
                    <th>Returnable</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr
                      key={item.invoiceItemId}
                      className={selectedItem?.invoiceItemId === item.invoiceItemId ? "row-selected" : ""}
                    >
                      <td>#{item.productId}</td>
                      <td>{item.unitSold}</td>
                      <td>{item.quantity}</td>
                      <td>{item.returnableQuantity}</td>
                      <td>
                        <button
                          className="link-btn"
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
          )}
        </section>

        {/* Step 2: exchange details (shown once an item is selected, or in manual mode) */}
        {(selectedItem || manualMode) && (
          <section className="exchange-section">
            <h2 className="section-label">2. Exchange details</h2>

            <div className="form-grid">
              <label className="field-label">
                Returned quantity
                <input
                  type="number"
                  min={1}
                  max={selectedItem?.returnableQuantity}
                  value={returnedQuantity}
                  onChange={(e) => setReturnedQuantity(Number(e.target.value))}
                  className="form-input"
                />
              </label>

              <label className="field-label">
                Replacement product
                <select
                  value={replacementProductId}
                  onChange={(e) => {
                    const id = Number(e.target.value) || "";
                    setReplacementProductId(id);
                    setReplacementUnitSold("piece");
                  }}
                  className="form-input"
                >
                  <option value="">Select a product…</option>
                  {mockProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-label">
                Replacement unit
                <select
                  value={replacementUnitSold}
                  onChange={(e) => setReplacementUnitSold(e.target.value as UnitSold)}
                  className="form-input"
                >
                  <option value="piece">Piece</option>
                  <option value="package" disabled={!replacementProduct?.pricePerPackage}>
                    Package
                  </option>
                </select>
              </label>

              <label className="field-label">
                Replacement quantity
                <input
                  type="number"
                  min={1}
                  value={replacementQuantity}
                  onChange={(e) => setReplacementQuantity(Number(e.target.value))}
                  className="form-input"
                />
              </label>
            </div>

            <label className="field-label reason-field">
              Reason (optional)
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-input reason-input"
                rows={2}
                maxLength={255}
              />
            </label>

            {submitStatus === "error" && errorMessage && (
              <p className="error-message">{errorMessage}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitStatus === "loading"}
              className="submit-btn"
            >
              {submitStatus === "loading" ? "Processing..." : "Process exchange"}
            </button>
          </section>
        )}

        {/* Step 3: result */}
        {result && (
          <section className="exchange-section result-box">
            <h2 className="section-label">Exchange completed</h2>
            <p>Exchange #{result.exchangeId} on invoice #{result.invoiceId}</p>
            <div className="result-line">
              <span>Returned item value</span>
              <span>${result.returnedItemValue.toFixed(2)}</span>
            </div>
            <div className="result-line">
              <span>Replacement item value</span>
              <span>${result.replacementItemValue.toFixed(2)}</span>
            </div>
            <div className="result-line result-diff">
              <span>
                {result.priceDifference > 0
                  ? "Amount due from customer"
                  : result.priceDifference < 0
                  ? "Refund due to customer"
                  : "Even exchange"}
              </span>
              <span>${Math.abs(result.priceDifference).toFixed(2)}</span>
            </div>
            <hr />
            <div className="result-line result-total">
              <span>New invoice total</span>
              <span>${result.newTotal.toFixed(2)}</span>
            </div>

            <button className="submit-btn" onClick={resetAll}>
              Start another exchange
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
