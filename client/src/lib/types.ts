import type { UserRole } from "@/lib/constants"; 

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string | Date; // ← add this line
}

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: UserRole[];
};
export interface Service {
  id: number;
  name: string;
  description?: string;
  category: string;
  type: string;
  basePrice: number;
  pricingRules?: any;
  active: boolean;
  imageUrl?: string;
  featured?: boolean;
  displayOrder?: number;
  onlineAvailable?: boolean;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerId?: number;
  total: number;
  discount: number;
  status: string;
  paymentMethod?: string;
  paymentStatus: string;
  notes?: string;
  createdBy: number;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  serviceId: number;
  quantity: number;
  unitPrice: number;
  amount: number;
  specifications?: any;
}

export interface Inventory {
  id: number;
  name: string;
  description?: string;
  category: string;
  unit: string;
  currentStock: number;
  lowStockThreshold: number;
  lastRestocked?: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  notes?: string;
  createdBy: number;
  createdAt: string;
}

export interface CartItem {
  serviceId: number;
  serviceName: string;
  serviceType: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  specifications: any;
}

export interface SalesData {
  date: string;
  total: number;
}

export interface OrderCount {
  status: string;
  count: number;
}

export interface DashboardStats {
  todaySales: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockItems: number;
}

export interface DocumentPrintingFormData {
  paperSize: string;
  paperType: string;
  copies: number;
  colorMode: string;
  file?: File;
  notes?: string;
}

export interface TarpaulinPrintingFormData {
  width: number;
  height: number;
  eyelets: number;
  rope: boolean;
  stand: boolean;
  file?: File;
  notes?: string;
}

export interface LaminationFormData {
  size: string;
  quantity: number;
  notes?: string;
}

export interface StandardServiceFormData {
  serviceId: number;
  quantity: number;
  notes?: string;
}

export interface CheckoutFormData {
  paymentMethod: string;
  amountTendered: number;
  customerId?: number;
  customerName: string;
}
