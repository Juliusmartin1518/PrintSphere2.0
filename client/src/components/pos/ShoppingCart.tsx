import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { generateOrderNumber } from "@/lib/utils";

interface ShoppingCartProps {
  onCheckout: () => void;
}

export default function ShoppingCart({ onCheckout }: ShoppingCartProps) {
  const { 
    items, 
    removeItem, 
    subtotal, 
    discount, 
    total, 
    setDiscount,
    clearCart
  } = useCart();
  
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  
  // Generate a random order number
  const orderNumber = generateOrderNumber();
  
  // Apply discount
  const applyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value < 0) return;
    
    if (discountType === "fixed") {
      setDiscount(value);
    } else {
      // Calculate percentage discount
      const percentageDiscount = (value / 100) * subtotal;
      setDiscount(percentageDiscount);
    }
    
    setShowDiscountForm(false);
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-5 border-b border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900">Current Order</h3>
        <p className="text-sm text-neutral-500">Order #{orderNumber}</p>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-5 divide-y divide-neutral-200 scrollbar-hide">
        {items.length === 0 ? (
          <div className="py-8 text-center text-neutral-400">
            <i className="ri-shopping-cart-line text-4xl mb-2"></i>
            <p>Your cart is empty</p>
            <p className="text-sm mt-1">Add items to proceed with the order</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div key={index} className="py-3 first:pt-0">
              <div className="flex justify-between mb-1">
                <p className="font-medium text-neutral-900">{item.serviceName}</p>
                <div className="flex items-center">
                  <span className="text-neutral-900 font-medium">{formatPrice(item.amount)}</span>
                  <button 
                    className="ml-2 text-neutral-400 hover:text-red-500"
                    onClick={() => removeItem(index)}
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
              <p className="text-sm text-neutral-500">
                {item.quantity} × {formatPrice(item.unitPrice)}
                {item.specifications?.description && ` (${item.specifications.description})`}
              </p>
            </div>
          ))
        )}
      </CardContent>
      
      <CardFooter className="p-5 border-t border-neutral-200 bg-neutral-50 flex flex-col">
        <div className="space-y-3 w-full">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span className="text-neutral-900 font-medium">{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-neutral-500">Discount</span>
            <div className="flex items-center">
              <span className="text-neutral-900 font-medium">{formatPrice(discount)}</span>
              <button 
                className="ml-2 text-primary-600 text-sm"
                onClick={() => setShowDiscountForm(!showDiscountForm)}
              >
                {discount > 0 || showDiscountForm ? (
                  <i className="ri-edit-line"></i>
                ) : (
                  <><i className="ri-add-line"></i> Add</>
                )}
              </button>
            </div>
          </div>
          
          {showDiscountForm && (
            <div className="flex items-end gap-2 mt-2 p-2 border border-dashed border-neutral-200 rounded-md bg-white">
              <div className="flex-1">
                <label className="block text-xs text-neutral-500 mb-1">Discount Value</label>
                <Input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="Enter amount"
                  className="h-9"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-neutral-500 mb-1">Type</label>
                <div className="flex">
                  <Button
                    type="button"
                    variant={discountType === "fixed" ? "default" : "outline"}
                    size="sm"
                    className="rounded-r-none flex-1"
                    onClick={() => setDiscountType("fixed")}
                  >
                    ₱
                  </Button>
                  <Button
                    type="button"
                    variant={discountType === "percentage" ? "default" : "outline"}
                    size="sm"
                    className="rounded-l-none flex-1"
                    onClick={() => setDiscountType("percentage")}
                  >
                    %
                  </Button>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-16"
                onClick={applyDiscount}
              >
                Apply
              </Button>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between pt-2">
            <span className="text-neutral-900 font-medium">Total</span>
            <span className="text-neutral-900 font-bold text-lg">{formatPrice(total)}</span>
          </div>
        </div>
        
        <div className="mt-6 space-y-3 w-full">
          <Button 
            className="w-full"
            disabled={items.length === 0}
            onClick={onCheckout}
          >
            Proceed to Checkout
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            disabled={items.length === 0}
            onClick={clearCart}
          >
            Clear Cart
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
