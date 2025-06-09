import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { USER_ROLES } from "@/lib/constants";

import StatsCard from "@/components/dashboard/StatsCard";
import SalesChart from "@/components/dashboard/SalesChart";
import RecentOrdersCard from "@/components/dashboard/RecentOrdersCard";
import InventoryLowStockCard from "@/components/dashboard/InventoryLowStockCard";
import RecentExpensesCard from "@/components/dashboard/RecentExpensesCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, DownloadIcon } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch dashboard statistics
  const { data: todaySalesData, isLoading: isLoadingSales } = useQuery<{ total: number }>({
    queryKey: ["/api/dashboard/today-sales"],
    enabled: user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.CASHIER,
  });
  
  const { data: orderCountsData, isLoading: isLoadingCounts } = useQuery<{ counts: { status: string; count: number }[] }>({
    queryKey: ["/api/dashboard/order-counts"],
  });
  
  const { data: lowStockData, isLoading: isLoadingLowStock } = useQuery<{ inventory: any[] }>({
    queryKey: ["/api/inventory/low-stock"],
    enabled: user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.STAFF,
  });
  
  // Calculate order counts by status
  const getOrderCountByStatus = (status: string) => {
    if (!orderCountsData?.counts) return 0;
    const statusData = orderCountsData.counts.find(c => c.status === status);
    return statusData?.count || 0;
  };
  
  const pendingOrders = getOrderCountByStatus("pending");
  const inProgressOrders = getOrderCountByStatus("in_progress");
  const readyOrders = getOrderCountByStatus("ready");
  const completedOrders = getOrderCountByStatus("completed");
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-500">Welcome back, {user?.name || 'User'}</p>
        </div>
        
        {user?.role === USER_ROLES.ADMIN && (
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button asChild>
              <Link href="/pos">
                <PlusIcon className="mr-2 h-4 w-4" />
                New Order
              </Link>
            </Button>
            <Button variant="outline">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Today's Sales - Only for Admin and Cashier */}
        {(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.CASHIER) && (
          <div>
            {isLoadingSales ? (
              <div className="bg-white rounded-lg shadow p-5">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <StatsCard
                title="Today's Sales"
                value={todaySalesData?.total || 0}
                icon="ri-line-chart-line"
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                change={{
                  value: "12%",
                  label: "vs yesterday",
                  isPositive: true
                }}
              />
            )}
          </div>
        )}
        
        {/* Pending Orders */}
        <div>
          {isLoadingCounts ? (
            <div className="bg-white rounded-lg shadow p-5">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : (
            <StatsCard
              title="Pending Orders"
              value={pendingOrders.toString()}
              icon="ri-time-line"
              iconBgColor="bg-amber-100"
              iconColor="text-amber-600"
              change={{
                value: inProgressOrders.toString(),
                label: "in progress",
                isPositive: false
              }}
            />
          )}
        </div>
        
        {/* Completed Orders */}
        <div>
          {isLoadingCounts ? (
            <div className="bg-white rounded-lg shadow p-5">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : (
            <StatsCard
              title="Completed Orders"
              value={completedOrders.toString()}
              icon="ri-checkbox-circle-line"
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              change={{
                value: readyOrders.toString(),
                label: "ready for pickup",
                isPositive: true
              }}
            />
          )}
        </div>
        
        {/* Low Stock Items - Only for Admin and Staff */}
        {(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.STAFF) && (
          <div>
            {isLoadingLowStock ? (
              <div className="bg-white rounded-lg shadow p-5">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <StatsCard
                title="Low Stock Items"
                value={(lowStockData?.inventory?.length || 0).toString()}
                icon="ri-alert-line"
                iconBgColor="bg-red-100"
                iconColor="text-red-600"
                actionLink={{
                  label: "View details",
                  href: "/inventory"
                }}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Charts and Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Chart - Only for Admin */}
        {user?.role === USER_ROLES.ADMIN && (
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
        )}
        
        {/* Recent Orders */}
        <div className={user?.role === USER_ROLES.ADMIN ? "" : "lg:col-span-2"}>
          <RecentOrdersCard />
        </div>
        
        {/* If not Admin, show an empty column for layout balance */}
        {user?.role !== USER_ROLES.ADMIN && <div></div>}
      </div>
      
      {/* Low Stock Inventory and Recent Expenses - Only for Admin */}
      {user?.role === USER_ROLES.ADMIN && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InventoryLowStockCard />
          <RecentExpensesCard />
        </div>
      )}
      
      {/* Low Stock Inventory - Only for Staff */}
      {user?.role === USER_ROLES.STAFF && (
        <div className="grid grid-cols-1 gap-6">
          <InventoryLowStockCard />
        </div>
      )}
    </div>
  );
}
