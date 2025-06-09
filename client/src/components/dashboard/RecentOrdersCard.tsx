import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Order } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS } from "@/lib/constants";
import OrderStatusBadge from "../orders/OrderStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentOrdersCard() {
  const { data, isLoading, error } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/dashboard/recent-orders?limit=4"],
  });
  
  return (
    <Card>
      <CardHeader className="border-b border-neutral-200 flex flex-row items-center justify-between py-5">
        <CardTitle className="text-lg font-medium text-neutral-900">Recent Orders</CardTitle>
        <Link href="/orders">
          <div className="text-sm text-primary-600 hover:underline cursor-pointer">View all</div>
        </Link>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-neutral-200">
        {isLoading ? (
          // Skeleton loading state
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="p-4">
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="p-4 text-center text-neutral-500">
            Failed to load recent orders
          </div>
        ) : data?.orders && data.orders.length > 0 ? (
          data.orders.map((order) => (
            <div key={order.id} className="p-4 hover:bg-neutral-50">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{order.orderNumber}</p>
                  <p className="text-sm text-neutral-500">
                    {order.customerName} • {formatDate(order.createdAt, "MMM d, h:mm a")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-neutral-900">{formatPrice(order.total)}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-neutral-500">
            No recent orders found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
