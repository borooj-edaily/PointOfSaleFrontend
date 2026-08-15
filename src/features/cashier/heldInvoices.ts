import type { CartLine } from "./components/CartItemRow";
import type { DiscountType } from "../../types/invoice";

export interface HeldInvoice {
  id: string;
  label: string;
  heldAt: string;
  cart: CartLine[];
  discountType: DiscountType | "";
  discountValue: string;
  isDebt: boolean;
  debtorNickname: string;
}

const STORAGE_PREFIX = "pos_held_invoices";

// Held invoices are scoped per cashier so two cashiers sharing the same
// browser/register never see or resume each other's parked carts.
function storageKey(cashierId: number): string {
  return `${STORAGE_PREFIX}:${cashierId}`;
}

export function getHeldInvoices(cashierId: number): HeldInvoice[] {
  try {
    const raw = localStorage.getItem(storageKey(cashierId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt/unavailable storage should never crash the cashier screen.
    return [];
  }
}

function saveHeldInvoices(cashierId: number, invoices: HeldInvoice[]): void {
  try {
    localStorage.setItem(storageKey(cashierId), JSON.stringify(invoices));
  } catch {
    // If storage is full/unavailable, the hold just won't survive a refresh —
    // not fatal, the cashier can still keep working in the current tab.
  }
}

export function holdInvoice(
  cashierId: number,
  entry: Omit<HeldInvoice, "id" | "heldAt" | "label"> & { label?: string }
): HeldInvoice {
  const invoices = getHeldInvoices(cashierId);

  const held: HeldInvoice = {
    id: `hold_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label: entry.label ?? `Held #${invoices.length + 1}`,
    heldAt: new Date().toISOString(),
    cart: entry.cart,
    discountType: entry.discountType,
    discountValue: entry.discountValue,
    isDebt: entry.isDebt,
    debtorNickname: entry.debtorNickname,
  };

  saveHeldInvoices(cashierId, [...invoices, held]);
  return held;
}

export function removeHeldInvoice(cashierId: number, holdId: string): void {
  const invoices = getHeldInvoices(cashierId).filter((h) => h.id !== holdId);
  saveHeldInvoices(cashierId, invoices);
}