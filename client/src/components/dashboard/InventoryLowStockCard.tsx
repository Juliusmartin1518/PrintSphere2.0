import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Inventory } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function InventoryLowStockCard() {
  const { data, isLoading, error } = useQuery<{ inventory: Inventory[] }>({
    queryKey: ["/api/inventory/low-stock"],
  });
  
  const getStockStatus = (current: number, threshold: number) => {
    const ratio = current / threshold;
    if (ratio <= 0.25) return { label: "Critical", color: "bg-red-100 text-red-800" };
    if (ratio <= 0.5) return { label: "Low", color: "bg-amber-100 text-amber-800" };
    return { label: "OK", color: "bg-green-100 text-green-800" };
  };
  
  return (
    <Card>
      <CardHeader className="border-b border-neutral-200 flex flex-row items-center justify-between py-5">
        <CardTitle className="text-lg font-medium text-neutral-900">Low Stock Inventory</CardTitle>
        <Link href="/inventory">
          <div className="text-sm text-primary-600 hover:underline cursor-pointer">View all</div>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Item</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Current Stock</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Threshold</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (
                // Skeleton loading state
                Array(3).fill(0).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-16" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-neutral-500">
                    Failed to load inventory data
                  </td>
                </tr>
              ) : data?.inventory && data.inventory.length > 0 ? (
                data.inventory.map((item) => {
                  const status = getStockStatus(item.currentStock, item.lowStockThreshold);
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.currentStock} {item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.lowStockThreshold} {item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className={status.color + " rounded-full text-xs font-medium"}
                        >
                          {status.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-neutral-500">
                    No low stock items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
