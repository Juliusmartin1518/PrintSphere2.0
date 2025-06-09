import { useState, useRef } from "react";
import { formatPrice } from "@/lib/utils";
import { Order, OrderItem, User } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { APP_NAME } from "@/lib/constants";

interface ReceiptModalProps {
  order: Order;
  items: OrderItem[];
  onClose: () => void;
  open: boolean;
}

export default function ReceiptModal({
  order,
  items,
  onClose,
  open,
}: ReceiptModalProps) {
  const { user } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    setIsPrinting(true);
    
    const content = receiptRef.current;
    const originalContents = document.body.innerHTML;
    
    if (content) {
      document.body.innerHTML = content.innerHTML;
      
      window.print();
      document.body.innerHTML = originalContents;
      
      // Re-render will happen, so no need to set setIsPrinting(false)
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            Order #{order.orderNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-2" ref={receiptRef}>
          <div className="border-b pb-4 mb-4">
            <h2 className="text-center font-bold text-xl">{APP_NAME}</h2>
            <p className="text-center text-sm text-neutral-500">Receipt / Invoice</p>
          </div>
          
          <div className="grid grid-cols-2 gap-1 text-sm mb-4">
            <div>
              <p><span className="font-medium">Order Number:</span></p>
              <p>{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p><span className="font-medium">Date:</span></p>
              <p>{order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
            </div>
            <div className="col-span-2 mt-2">
              <p><span className="font-medium">Customer:</span></p>
              <p>{order.customerName || "Walk-in Customer"}</p>
            </div>
            <div className="col-span-2 mt-2">
              <p><span className="font-medium">Cashier:</span></p>
              <p>{user?.name || "Staff"}</p>
            </div>
          </div>
          
          <div className="border-t border-b py-2 mb-2">
            <div className="flex items-center justify-between font-medium text-sm mb-2">
              <span className="w-1/2">Item</span>
              <div className="flex w-1/2">
                <span className="w-1/3 text-center">Qty</span>
                <span className="w-1/3 text-right">Price</span>
                <span className="w-1/3 text-right">Amount</span>
              </div>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm py-1">
                <span className="w-1/2">{item.specifications?.serviceName || `Service #${item.serviceId}`}</span>
                <div className="flex w-1/2">
                  <span className="w-1/3 text-center">{item.quantity}</span>
                  <span className="w-1/3 text-right">{formatPrice(item.unitPrice)}</span>
                  <span className="w-1/3 text-right">{formatPrice(item.amount)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm mb-4">
            <div className="flex justify-between py-1">
              <span>Subtotal:</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            
            {order.discount > 0 && (
              <div className="flex justify-between py-1">
                <span>Discount:</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold pt-1">
              <span>Total:</span>
              <span>{formatPrice(order.total - (order.discount || 0))}</span>
            </div>
            
            <div className="mt-4 pt-2 border-t">
              <div className="flex justify-between py-1">
                <span>Payment Method:</span>
                <span>{order.paymentMethod?.toUpperCase() || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Payment Status:</span>
                <span>{order.paymentStatus?.toUpperCase() || "N/A"}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm mt-6 pt-6 border-t">
            <p>Thank you for your business!</p>
            <p className="text-xs text-neutral-500 mt-1">PrintSphere POS System</p>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button onClick={onClose} variant="outline">Close</Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? "Printing..." : "Print Receipt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}