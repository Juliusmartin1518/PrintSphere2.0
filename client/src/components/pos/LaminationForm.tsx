import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import { LaminationFormData, Service } from "@/lib/types";
import { calculateLaminationPrice } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { LAMINATION_SIZES, SERVICE_TYPES } from "@/lib/constants";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ServiceSelector from "./ServiceSelector";

const formSchema = z.object({
  size: z.string().min(1, "Size is required"),
  quantity: z.coerce.number().min(1, "At least one item is required"),
  notes: z.string().optional(),
});

interface LaminationFormProps {
  onServiceSelect?: (service: Service | null) => void;
}

export default function LaminationForm({ onServiceSelect }: LaminationFormProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<{
    unitPrice: number;
    total: number;
    breakdown: any;
  } | null>(null);
  
  const { addItem } = useCart();
  
  // Form definition
  const form = useForm<LaminationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      size: "ID Size",
      quantity: 1,
      notes: "",
    },
  });
  
  // Watch form values to recalculate price
  const size = form.watch("size");
  const quantity = form.watch("quantity");
  
  // Get services for lamination
  const { data: servicesData, isLoading } = useQuery<{ services: Service[] }>({
    queryKey: ["/api/services?category=dynamic&type=lamination"],
  });
  
  // Handle service selection
  const handleServiceSelect = (service: Service | null) => {
    setSelectedService(service);
    if (onServiceSelect) {
      onServiceSelect(service);
    }
  };
  
  // Calculate price based on form inputs and service pricing rules
  useEffect(() => {
    if (!selectedService) return;
    
    const calculation = calculateLaminationPrice(
      {
        size,
        quantity,
      },
      selectedService.pricingRules
    );
    
    setPriceCalculation(calculation);
  }, [selectedService, size, quantity]);
  
  // Form submission
  const onSubmit = (values: LaminationFormData) => {
    if (!selectedService || !priceCalculation) return;
    
    // Create description string
    const description = `${values.size}, ${values.quantity} ${values.quantity > 1 ? 'pcs' : 'pc'}`;
    
    // Add to cart
    addItem({
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceType: SERVICE_TYPES.LAMINATION,
      quantity: values.quantity,
      unitPrice: priceCalculation.unitPrice,
      amount: priceCalculation.total,
      specifications: {
        ...values,
        serviceName: selectedService.name,
        description
      }
    });
    
    // Reset form
    form.reset({
      size: "ID Size",
      quantity: 1,
      notes: "",
    });
  };
  
  return (
    <div className="space-y-6">
      <ServiceSelector 
        onServiceSelect={handleServiceSelect}
        category="dynamic"
      />
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : selectedService ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lamination Size</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LAMINATION_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel>Price Calculation</FormLabel>
                <div className="bg-neutral-50 rounded-md p-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>{formatPrice(selectedService?.basePrice || 0)} / pc</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size Multiplier ({size}):</span>
                      <span>x{priceCalculation?.breakdown.sizeMultiplier.toFixed(2) || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>x{quantity}</span>
                    </div>
                    <div className="flex justify-between font-medium mt-2 pt-2 border-t border-neutral-200">
                      <span>Unit Price:</span>
                      <span>{priceCalculation ? formatPrice(priceCalculation.unitPrice) : "—"}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t border-neutral-200">
                      <span>Total:</span>
                      <span>{priceCalculation ? formatPrice(priceCalculation.total) : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Any special instructions for this order..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={!priceCalculation}
              >
                <i className="ri-add-line mr-2"></i>
                Add to Cart
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          Please select a lamination service to continue
        </div>
      )}
    </div>
  );
}
