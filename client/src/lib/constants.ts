export const APP_NAME = "PrintSphere POS";

export const USER_ROLES = {
  ADMIN: "admin",
  CASHIER: "cashier",
  STAFF: "staff",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ORDER_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  READY: "ready",
  COMPLETED: "completed",
} as const;

export const PAYMENT_METHODS = {
  CASH: "cash",
  GCASH: "gcash",
  CARD: "card",
} as const;

export const PAYMENT_STATUS = {
  PAID: "paid",
  UNPAID: "unpaid",
} as const;

export const SERVICE_CATEGORIES = {
  DYNAMIC: "dynamic",
  STANDARD: "standard",
} as const;

export const SERVICE_TYPES = {
  DOCUMENT: "document",
  TARPAULIN: "tarpaulin",
  LAMINATION: "lamination",
  STANDARD: "standard",
} as const;

export const EXPENSE_CATEGORIES = [
  { value: "supplies", label: "Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "utilities", label: "Utilities" },
  { value: "misc", label: "Miscellaneous" },
];

export const INVENTORY_CATEGORIES = [
  { value: "paper", label: "Paper" },
  { value: "ink", label: "Ink" },
  { value: "material", label: "Material" },
  { value: "equipment", label: "Equipment" },
  { value: "misc", label: "Miscellaneous" },
];

export const DOCUMENT_PAPER_SIZES = [
  { value: "A4", label: "A4" },
  { value: "Letter", label: "Letter" },
  { value: "Long", label: "Long" },
  { value: "A5", label: "A5" },
];

export const DOCUMENT_PAPER_TYPES = [
  { value: "Standard", label: "Standard" },
  { value: "Glossy", label: "Glossy" },
  { value: "Matte", label: "Matte" },
  { value: "High Quality", label: "High Quality" },
];

export const DOCUMENT_COLOR_MODES = [
  { value: "Auto Detect", label: "Auto Detect" },
  { value: "Color", label: "Color" },
  { value: "Black & White", label: "Black & White" },
];

export const LAMINATION_SIZES = [
  { value: "ID Size", label: "ID Size" },
  { value: "Big ID", label: "Big ID (with inches)" },
  { value: "A4", label: "A4" },
  { value: "Long", label: "Long" },
  { value: "A5", label: "A5" },
];
