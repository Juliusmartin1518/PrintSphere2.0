import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Order, OrderItem } from "@/lib/types";
import { ORDER_STATUS } from "@/lib/constants";

import OrderCard from "@/components/orders/OrderCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon } from "lucide-react";

export default function OrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(ORDER_STATUS.PENDING);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Fetch orders
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/orders"],
  });
  
  // State for active order ID to view details
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  
  // Fetch order items for a specific order
  const { data: orderItemsData, isLoading: isLoadingItems } = useQuery<{ items: OrderItem[] }>({
    queryKey: ["/api/orders", activeOrderId, "items"],
    queryFn: async () => {
      if (!activeOrderId) return { items: [] };
      const res = await fetch(`/api/orders/${activeOrderId}/items`);
      if (!res.ok) throw new Error("Failed to fetch order items");
      return res.json();
    },
    enabled: !!activeOrderId,
  });
  
  // Filter orders by status
  const getFilteredOrders = (status: string) => {
    if (!ordersData?.orders) return [];
    
    let filtered = ordersData.orders;
    
    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(order => order.status === status);
    }
    
    // Apply search filter if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };
  
  // Count orders by status
  const countOrdersByStatus = (status: string) => {
    if (!ordersData?.orders) return 0;
    return ordersData.orders.filter(order => order.status === status).length;
  };
  
  // Set active order and load its items
  const loadOrderItems = (orderId: number) => {
    setActiveOrderId(orderId);
  };
  
  // Get order items for a specific order - memoized to prevent infinite loops
  const getOrderItems = React.useCallback((orderId: number) => {
    // Check cache first
    if (orderItemsData?.items && activeOrderId === orderId) {
      return orderItemsData.items;
    }
    
    // Schedule loading of items but don't trigger a re-render
    if (activeOrderId !== orderId) {
      // Use setTimeout to avoid render loop
      setTimeout(() => {
        loadOrderItems(orderId);
      }, 0);
    }
    
    return [];
  }, [orderItemsData?.items, activeOrderId]);
  
  // Get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING: return "Pending";
      case ORDER_STATUS.IN_PROGRESS: return "In Progress";
      case ORDER_STATUS.READY: return "Ready";
      case ORDER_STATUS.COMPLETED: return "Completed";
      default: return status;
    }
  };
  
  // Handle order status change
  const handleOrderStatusChange = (updatedOrder: Order) => {
    // The actual API call is handled in the OrderCard component
    // This function can be used for additional logic if needed
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Order Management</h1>
          <p className="text-neutral-500">View and manage customer orders</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-neutral-400" />
              </div>
              <Input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value={ORDER_STATUS.PENDING}>Pending</SelectItem>
                <SelectItem value={ORDER_STATUS.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={ORDER_STATUS.READY}>Ready</SelectItem>
                <SelectItem value={ORDER_STATUS.COMPLETED}>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Order Status Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-neutral-200">
            <TabsList className="bg-transparent h-auto p-0">
              <TabsTrigger 
                value={ORDER_STATUS.PENDING}
                className="px-4 py-3 text-sm font-medium data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=inactive]:text-neutral-500 data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent rounded-none"
              >
                Pending{" "}
                <span className="ml-1 bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full text-xs">
                  {countOrdersByStatus(ORDER_STATUS.PENDING)}
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value={ORDER_STATUS.IN_PROGRESS}
                className="px-4 py-3 text-sm font-medium data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=inactive]:text-neutral-500 data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent rounded-none"
              >
                In Progress{" "}
                <span className="ml-1 bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full text-xs">
                  {countOrdersByStatus(ORDER_STATUS.IN_PROGRESS)}
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value={ORDER_STATUS.READY}
                className="px-4 py-3 text-sm font-medium data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=inactive]:text-neutral-500 data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent rounded-none"
              >
                Ready{" "}
                <span className="ml-1 bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full text-xs">
                  {countOrdersByStatus(ORDER_STATUS.READY)}
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value={ORDER_STATUS.COMPLETED}
                className="px-4 py-3 text-sm font-medium data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=inactive]:text-neutral-500 data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent rounded-none"
              >
                Completed{" "}
                <span className="ml-1 bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full text-xs">
                  {countOrdersByStatus(ORDER_STATUS.COMPLETED)}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab Contents */}
          {Object.values(ORDER_STATUS).map((status) => (
            <TabsContent key={status} value={status} className="pt-6">
              {isLoadingOrders ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="p-4 border-b border-neutral-200">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-6 w-48" />
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <Skeleton className="h-3 w-16 mb-1" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <div>
                            <Skeleton className="h-3 w-16 mb-1" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <div>
                            <Skeleton className="h-3 w-16 mb-1" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <div>
                            <Skeleton className="h-3 w-16 mb-1" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full mt-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredOrders(statusFilter === "all" ? status : statusFilter).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      items={getOrderItems(order.id)}
                      onStatusChange={handleOrderStatusChange}
                    />
                  ))}
                  
                  {getFilteredOrders(statusFilter === "all" ? status : statusFilter).length === 0 && (
                    <div className="lg:col-span-3 text-center py-8">
                      <div className="text-neutral-400 mb-2">
                        <i className="ri-file-list-3-line text-4xl"></i>
                      </div>
                      <h3 className="text-lg font-medium text-neutral-900 mb-1">No orders found</h3>
                      <p className="text-neutral-500">
                        {searchQuery
                          ? "Try adjusting your search criteria"
                          : `No ${getStatusText(status).toLowerCase()} orders at the moment`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
