export const APP_NAME = "Koffie Station × Ladanya";
export const APP_SHORT = "KoffieStation";

export const TAX_RATE = 0.12; // 12% PPN
export const SERVICE_RATE = 0.05; // 5% service charge

export const CURRENCY = "IDR";
export const CURRENCY_SYMBOL = "Rp";

export const ORDER_NUMBER_PREFIX = "ORD";
export const OPNAME_CODE_PREFIX = "OPN";

export const STATION_LABELS: Record<string, string> = {
  bar: "Coffee Bar",
  kitchen: "Hot Kitchen",
  sushi: "Sushi Station",
};

export const STATION_COLORS: Record<string, string> = {
  bar: "#C08B5C",
  kitchen: "#EF4444",
  sushi: "#3B82F6",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  queued: "Queued",
  cooking: "Cooking",
  ready: "Ready",
  delivered: "Delivered",
  canceled: "Canceled",
  void: "Void",
  open: "Open",
  paid: "Paid",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  queued: "#D97706",
  cooking: "#3B82F6",
  ready: "#10B981",
  delivered: "#8B5CF6",
  canceled: "#EF4444",
  void: "#7F1D1D",
  open: "#C08B5C",
  paid: "#10B981",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  qris: "QRIS",
  card: "Kartu Debit/Kredit",
  ewallet: "E-Wallet",
  transfer: "Transfer Bank",
};

export const LOW_STOCK_THRESHOLD = 1.2; // 120% of min_stock

export const KITCHEN_STATUS_FLOW = [
  "pending",
  "queued",
  "cooking",
  "ready",
  "delivered",
] as const;

export const ITEMS_PER_PAGE = 20;
