import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

/**
 * Combines class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string
 */

export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = "MMM d, yyyy"
): string {
  if (!date) return "N/A";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return "Invalid date";
  }
}

/**
 * Formats a price to Philippine Peso
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats an order number to be more readable
 */
export function formatOrderNumber(orderNumber: string): string {
  return orderNumber.startsWith("ORD-") ? orderNumber : `ORD-${orderNumber}`;
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const timestamp = new Date().getTime();
  return `ORD-${timestamp.toString().substring(0, 10)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Get capitalized status text
 */
export function getStatusText(status: string): string {
  return status.split("_").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
}

/**
 * Get color for status based on value
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "neutral";
    case "in_progress":
      return "blue";
    case "ready":
      return "amber";
    case "completed":
      return "green";
    default:
      return "neutral";
  }
}

/**
 * Convert a File to Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Get role-based accessible routes
 */
export function getAccessibleRoutes(role: string): string[] {
  switch (role) {
    case "admin":
      return [
        "/dashboard",
        "/pos",
        "/orders",
        "/inventory",
        "/services",
        "/users",
        "/expenses",
        "/reports",
      ];
    case "cashier":
      return [
        "/dashboard", 
        "/pos", 
        "/orders"
      ];
    case "staff":
      return [
        "/dashboard", 
        "/orders", 
        "/inventory"
      ];
    default:
      return [];
  }
}
import { UserRole } from "@/lib/constants";

const roleBasedAccess: Record<UserRole, string[]> = {
  admin: ["/dashboard", "/customers", "/reports", "/users", "/expenses", "/orders", "/pos", "/inventory", "/services"],
  cashier: ["/dashboard", "/orders", "/pos", "/customers"],
  staff: ["/dashboard","/orders","/inventory"]
};

export function isRouteAccessible(path: string, role: UserRole): boolean {
  return roleBasedAccess[role]?.includes(path);
}

//const roleBasedAccess: Record<UserRole, string[]> = {
  //admin: ["/customers", "/reports", "/users", "/expenses"],
  //cashier: ["/dashboard", "/orders", "/pos"],
  //staff: ["/dashboard"],
//};

//export function isRouteAccessible(location: string, role: UserRole): boolean {
  //return roleBasedAccess[role]?.includes(location) ?? false;
//}
/**
 * Check if a route is accessible for a given role
 */
//export function isRouteAccessible(route: string, role: string): boolean {
  //const accessibleRoutes = getAccessibleRoutes(role);
  //return accessibleRoutes.some(r => route.startsWith(r));
  
//}
