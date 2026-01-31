export const ESTIMATE_COLORS = {
  primary: "#1e3a5f",
  primaryHover: "#0f2d52",
  secondary: "#0078D4",
  accent: "#F97316",
  accentLight: "#FEF3C7",
  statusGreen: "#22D69A",
  statusOrange: "#D35400",
  statusBlue: "#60A5FA",
  statusRed: "#EF4444",
  statusGray: "#6B7280",
  bgWhite: "#FFFFFF",
  bgSlate50: "#F8FAFC",
  bgSlate100: "#F1F5F9",
  textDark: "#1E293B",
  textSlate500: "#64748B",
  textSlate400: "#94A3B8",
  borderLight: "#E2E8F0",
  borderMedium: "#CBD5E1",
};

export const STATUS_BADGES = {
  draft: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
  pending_approval: { bg: "#FEF3C7", text: "#D97706", border: "#FCD34D" },
  approved: { bg: "rgba(34, 214, 154, 0.1)", text: "#22D69A", border: "rgba(34, 214, 154, 0.2)" },
  rejected: { bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  needs_scheduling: { bg: "#FEF3C7", text: "#D97706", border: "#FCD34D" },
  scheduled: { bg: "#DBEAFE", text: "#0078D4", border: "#93C5FD" },
  completed: { bg: "#DBEAFE", text: "#60A5FA", border: "#93C5FD" },
  ready_to_invoice: { bg: "rgba(23, 190, 187, 0.1)", text: "#0D9488", border: "rgba(23, 190, 187, 0.2)" },
  invoiced: { bg: "rgba(23, 190, 187, 0.1)", text: "#0D9488", border: "rgba(23, 190, 187, 0.2)" },
};

export function generateEstimateNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EST-${year}${random}`;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatCurrencyDollars(dollars: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

export interface EstimateLineItem {
  id: string;
  lineNumber: number;
  serviceDate?: string;
  productService: string;
  description: string;
  sku?: string;
  quantity: number;
  rate: number;
  amount: number;
  taxable: boolean;
}

export interface EstimateFormData {
  propertyId: string;
  propertyName: string;
  customerName: string;
  customerEmail: string;
  address: string;
  estimateNumber: string;
  estimateDate: Date;
  expirationDate?: Date;
  title: string;
  description: string;
  status: "draft" | "pending_approval" | "approved" | "rejected" | "scheduled" | "completed";
  workType: "repairs" | "chemicals" | "other";
  woReceived: boolean;
  woNumber: string;
  repairTechId: string;
  repairTechName: string;
  reportedDate?: Date;
  items: EstimateLineItem[];
  discountType: "percent" | "fixed";
  discountValue: number;
  salesTaxRate: number;
  customerNote: string;
  memoOnStatement: string;
  techNotes: string;
  photos: string[];
  sourceType: "repair_tech" | "ace_ai";
  createdByTechId: string;
  createdByTechName: string;
}

export function calculateTotals(
  items: EstimateLineItem[],
  discountType: "percent" | "fixed",
  discountValue: number,
  salesTaxRate: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  
  const discountAmount = discountType === "percent"
    ? subtotal * (discountValue / 100)
    : discountValue;
  
  const taxableItems = items.filter(item => item.taxable);
  const taxableSubtotalRaw = taxableItems.reduce((sum, item) => sum + item.amount, 0);
  const discountProportion = subtotal > 0 ? (taxableSubtotalRaw / subtotal) : 0;
  const taxableSubtotal = Math.max(0, taxableSubtotalRaw - (discountProportion * discountAmount));
  
  const salesTaxAmount = taxableSubtotal * (salesTaxRate / 100);
  const totalAmount = subtotal - discountAmount + salesTaxAmount;
  
  return { subtotal, discountAmount, taxableSubtotal, salesTaxAmount, totalAmount };
}
