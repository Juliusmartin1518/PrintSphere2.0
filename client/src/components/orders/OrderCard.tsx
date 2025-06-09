import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Order, OrderItem as OrderItemType } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice, formatDate } from "@/lib/utils";
import OrderStatusBadge from "./OrderStatusBadge";
import ReceiptModal from "./ReceiptModal";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, MoreVertical, Printer, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ORDER_STATUS } from "@/lib/constants";

interface OrderCardProps {
  order: Order;
  items: OrderItemType[];
  onStatusChange?: (order: Order) => void;
}

export default function OrderCard({ order, items, onStatusChange }: OrderCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
  mutationFn: async () => {
    const res = await apiRequest("DELETE", `/api/orders/${order.id}`);
    if (!res.ok) throw new Error("Failed to delete order");
    return res.json();
  },
  onSuccess: () => {
    toast({
      title: "Order Deleted",
      description: `Order ${order.orderNumber} was successfully deleted.`,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
  },
  onError: (err: any) => {
    toast({
      variant: "destructive",
      title: "Error",
      description: err.message || "Failed to delete order.",
    });
  },
});


  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status: newStatus });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Status updated",
        description: `Order ${order.orderNumber} is now ${data.order.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/order-counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      
      if (onStatusChange) {
        onStatusChange(data.order);
      }
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update order status",
      });
    }
  });
  
  // Get next status based on current status
  const getNextStatus = () => {
    switch (order.status) {
      case ORDER_STATUS.PENDING:
        return { value: ORDER_STATUS.IN_PROGRESS, label: "Start Processing" };
      case ORDER_STATUS.IN_PROGRESS:
        return { value: ORDER_STATUS.READY, label: "Mark as Ready" };
      case ORDER_STATUS.READY:
        return { value: ORDER_STATUS.COMPLETED, label: "Complete Order" };
      default:
        return null;
    }
  };
  
  const nextStatus = getNextStatus();
  
  const handleStatusChange = (newStatus: string) => {
    statusMutation.mutate(newStatus);
  };
  
  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-neutral-200 flex justify-between items-center py-4 px-4">
          <div>
            <div className="flex items-center space-x-2">
              <OrderStatusBadge status={order.status} />
              <span className="text-sm text-neutral-500">{order.orderNumber}</span>
            </div>
            <h3 className="font-bold text-neutral-900 mt-1">
              {items.length > 0 
                ? items.map(item => item.specifications?.serviceName || `Item #${item.id}`).join(", ")
                : "Order Items"
              }
            </h3>
          </div>
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                className="text-red-600 focus:text-red-700"
                onClick={() => {
                 if (confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) {
                  deleteMutation.mutate();
                 }
                 }}
                  >
                   🗑️ Delete Order
                  </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                  View Details
                </DropdownMenuItem>
                {nextStatus && (
                  <DropdownMenuItem onClick={() => handleStatusChange(nextStatus.value)}>
                    {nextStatus.label}
                  </DropdownMenuItem>
                )}
                {order.status === ORDER_STATUS.COMPLETED && (
                  <DropdownMenuItem onClick={() => setIsReceiptOpen(true)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Receipt
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-neutral-500">Customer</dt>
              <dd className="text-neutral-900 font-medium mt-0.5">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Created At</dt>
              <dd className="text-neutral-900 font-medium mt-0.5">{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Amount</dt>
              <dd className="text-neutral-900 font-medium mt-0.5">{formatPrice(order.total)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Payment</dt>
              <dd className="text-neutral-900 font-medium mt-0.5">
                {order.paymentMethod ? order.paymentMethod.toUpperCase() : "Not specified"}
              </dd>
            </div>
          </dl>
          
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <h4 className="font-medium text-neutral-900 mb-2">Order Items</h4>
            <ul className="text-sm space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span className="text-neutral-600">
                    {item.specifications?.serviceName || `Item #${item.id}`}
                    {item.specifications?.description ? ` (${item.specifications?.description})` : ""}
                  </span>
                  <span className="text-neutral-900">{item.quantity} {item.quantity > 1 ? "pcs" : "pc"}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="mt-4 flex space-x-3 p-4">
          {nextStatus ? (
            <Button
              className="flex-1"
              onClick={() => handleStatusChange(nextStatus.value)}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <i className={order.status === ORDER_STATUS.PENDING ? "ri-play-line mr-1" : "ri-check-line mr-1"}></i>
                  {nextStatus.label}
                </>
              )}
            </Button>
          ) : (
            <Button variant="secondary" className="flex-1" disabled>
              <i className="ri-check-double-line mr-1"></i>
              Completed
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsDetailsOpen(true)}>
            <i className="ri-file-text-line mr-1"></i>
            Details
          </Button>
        </CardFooter>
      </Card>
      
      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Status</h4>
              <OrderStatusBadge status={order.status} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Created</h4>
                <p className="text-sm">{formatDate(order.createdAt, "PPP p")}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Customer</h4>
                <p className="text-sm">{order.customerName}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Payment Details</h4>
              <div className="bg-neutral-50 rounded p-2 text-sm">
                <div className="flex justify-between mb-1">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.total + order.discount)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between mb-1">
                    <span>Discount:</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-neutral-200">
                  <span>Payment Method:</span>
                  <span>{order.paymentMethod ? order.paymentMethod.toUpperCase() : "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span>{order.paymentStatus.toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Order Items</h4>
              <div className="bg-neutral-50 rounded p-2 divide-y divide-neutral-200">
                {items.map((item) => (
                  <div key={item.id} className="py-2 first:pt-0 last:pb-0">
                    <div className="flex justify-between font-medium">
                      <span>{item.specifications?.serviceName || `Item #${item.id}`}</span>
                      <span>{formatPrice(item.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>
                        {item.quantity} x {formatPrice(item.unitPrice)}
                        {item.specifications?.description ? ` (${item.specifications.description})` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {order.notes && (
              <div>
                <h4 className="text-sm font-medium mb-1">Notes</h4>
                <p className="text-sm bg-neutral-50 rounded p-2">{order.notes}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-between">
            {order.status === ORDER_STATUS.COMPLETED && (
              <Button 
                variant="outline" 
                className="mr-auto"
                onClick={() => {
                  setIsReceiptOpen(true);
                  setIsDetailsOpen(false);
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
            )}
            
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            
            {nextStatus && (
              <Button
                onClick={() => {
                  handleStatusChange(nextStatus.value);
                  setIsDetailsOpen(false);
                }}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  nextStatus.label
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Receipt Modal */}
      <ReceiptModal
        order={order}
        items={items}
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </>
  );
}
