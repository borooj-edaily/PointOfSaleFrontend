export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  notes: string | null;
  isActive: boolean;

  outstandingDebt: number;

  // NEW
  invoiceCount: number;
  totalPurchases: number;
}

export interface CustomerInvoice {
  invoiceId: number;
  invoiceNumber: number;
  subtotal: number;
  total: number;
  createdAt: string;

  // NEW
  isDebt: boolean;
  debtPaidAt: string | null;
  isPaid: boolean;
}

export interface CustomerDebtHistory {
  customerId: number;
  customerName: string;
  phone: string | null;

  outstandingDebt: number;

  // الآن تحتوي كل الفواتير
  invoices: CustomerInvoice[];
}