import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import CustomerSelector from "@/components/customers/CustomerSelector";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
  amountTendered: z.coerce.number().min(0, "Amount must be 0 or greater"),
  customerName: z.string().default("Walk-in Customer"),
  customerId: z.number().optional(),
});

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, subtotal, discount, total, clearCart } = useCart();
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: PAYMENT_METHODS.CASH,
      amountTendered: 0,
      customerName: "Walk-in Customer",
    },
  });
  
  // Handle customer selection
  const handleCustomerChange = (customer: any) => {
    setSelectedCustomer(customer);
    if (customer) {
      form.setValue("customerName", customer.name);
      form.setValue("customerId", customer.id);
    } else {
      form.setValue("customerName", "Walk-in Customer");
      form.unregister("customerId");
    }
  };
  
  // Watch amount tendered to calculate change
  const amountTendered = form.watch("amountTendered");
  const paymentMethod = form.watch("paymentMethod");
  
  // Calculate change
  const change = Math.max(amountTendered - total, 0);
  
  // Check if cash payment and amount is sufficient
  const isAmountValid = paymentMethod !== PAYMENT_METHODS.CASH || amountTendered >= total;
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: {
      orderItems: any[];
      paymentMethod: string;
      total: number;
      discount: number;
      customerName: string;
      customerId?: number;
    }) => {
      try {
        // Log the order data being sent
        console.log("Creating order with data:", {
          customerName: data.customerName,
          customerId: data.customerId,
          total: data.total,
          discount: data.discount,
          status: "pending",
          paymentMethod: data.paymentMethod,
          paymentStatus: "paid",
          itemCount: data.orderItems.length
        });
        
        // Generate a temporary order number (actual one will be created on the server)
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}${month}${day}`;
        const randomNum = String(Math.floor(1000 + Math.random() * 9000));
        const orderNumber = `ORD-${dateString}-${randomNum}`;
        
        // Create order with all items - don't include customer details in notes
        const res = await apiRequest("POST", "/api/orders", {
          orderNumber,
          customerName: data.customerName,
          customerId: data.customerId,
          total: data.total,
          discount: data.discount,
          status: "pending",
          paymentMethod: data.paymentMethod,
          paymentStatus: "paid",
          notes: null, // Don't store customer details in notes
          items: data.orderItems
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to create order");
        }
        
        return res.json();
      } catch (error) {
        console.error("Order creation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Log successful order creation
      console.log("Order created successfully:", data);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/today-sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/order-counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      // Simulate receipt printing
      setIsGeneratingReceipt(true);
      setTimeout(() => {
        setIsGeneratingReceipt(false);
        clearCart();
        onClose();
        
        // Display a more informative toast with customer information
        const customerInfo = selectedCustomer ? 
          `for ${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''}` : 
          '';
        
        toast({
          title: "Order Completed",
          description: `Order #${data.order.orderNumber} ${customerInfo} created successfully.`,
        });
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to complete order. Please try again.",
      });
    },
  });
  
  // Form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (items.length === 0) return;
    
    // Make sure amount tendered is enough for cash payments
    if (values.paymentMethod === PAYMENT_METHODS.CASH && values.amountTendered < total) {
      toast({
        variant: "destructive",
        title: "Insufficient Amount",
        description: "The amount tendered must be at least equal to the total order amount.",
      });
      return;
    }
    
    const orderItems = items.map(item => ({
      serviceId: item.serviceId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      specifications: item.specifications
    }));
    
    createOrderMutation.mutate({
      orderItems,
      paymentMethod: values.paymentMethod,
      customerName: values.customerName,
      customerId: values.customerId, 
      total,
      discount
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <FormLabel>Customer</FormLabel>
              <CustomerSelector 
                value={selectedCustomer}
                onChange={handleCustomerChange}
                allowCreate={true}
              />
              {selectedCustomer && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 font-medium">Selected Customer Information:</p>
                  <p className="text-sm">Name: {selectedCustomer.name}</p>
                  {selectedCustomer.phone && <p className="text-sm">Phone: {selectedCustomer.phone}</p>}
                  {selectedCustomer.address && <p className="text-sm">Address: {selectedCustomer.address}</p>}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                <label htmlFor="payment-method" className="text-sm font-medium">
                Payment Method
                </label>
                <select
                  id="payment-method"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <option value={PAYMENT_METHODS.CASH}>Cash</option>
                  <option value={PAYMENT_METHODS.CARD}>Card</option>
                  <option value={PAYMENT_METHODS.GCASH}>GCash</option>
                </select>
              </FormItem>

              )}
            />
            
            {paymentMethod === PAYMENT_METHODS.CASH && (
              <FormField
                control={form.control}
                name="amountTendered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Tendered</FormLabel>
                    <FormControl>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-neutral-500 sm:text-sm">₱</span>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-7"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="bg-neutral-50 p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Amount</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              
              {paymentMethod === PAYMENT_METHODS.CASH && (
                <>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Amount Tendered</span>
                    <span className="font-medium">{formatPrice(amountTendered)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-neutral-200">
                    <span className="font-medium">Change</span>
                    <span className="font-bold text-lg">{formatPrice(change)}</span>
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter className="space-y-3 sm:space-y-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createOrderMutation.isPending || isGeneratingReceipt}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createOrderMutation.isPending || 
                  isGeneratingReceipt || 
                  items.length === 0 || 
                  !isAmountValid
                }
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : isGeneratingReceipt ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Printing Receipt...
                  </>
                ) : (
                  "Complete Payment & Print Receipt"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
