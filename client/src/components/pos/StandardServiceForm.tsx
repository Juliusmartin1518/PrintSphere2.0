import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import { StandardServiceFormData, Service } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { SERVICE_TYPES } from "@/lib/constants";

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
import { Skeleton } from "@/components/ui/skeleton";
import ServiceSelector from "./ServiceSelector";

const formSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  quantity: z.coerce.number().min(1, "At least one item is required"),
  notes: z.string().optional(),
});

export default function StandardServiceForm() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { addItem } = useCart();
  
  // Form definition
  const form = useForm<StandardServiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: "",
      quantity: 1,
      notes: "",
    },
  });
  
  // Watch form values to calculate price
  const quantity = form.watch("quantity");
  
  // Get standard services
  const { data: servicesData, isLoading } = useQuery<{ services: Service[] }>({
    queryKey: ["/api/services?category=standard"],
  });
  
  // Handle service selection
  const handleServiceSelect = (service: Service | null) => {
    setSelectedService(service);
    if (service) {
      form.setValue("serviceId", service.id.toString());
    } else {
      form.setValue("serviceId", "");
    }
  };
  
  // Form submission
  const onSubmit = (values: StandardServiceFormData) => {
    if (!selectedService) return;
    
    const unitPrice = selectedService.basePrice;
    const total = unitPrice * values.quantity;
    
    // Add to cart
    addItem({
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceType: SERVICE_TYPES.STANDARD,
      quantity: values.quantity,
      unitPrice,
      amount: total,
      specifications: {
        notes: values.notes,
        serviceName: selectedService.name,
        description: `${values.quantity} ${values.quantity > 1 ? 'pcs' : 'pc'}`
      }
    });
    
    // Reset form
    form.reset({
      serviceId: "",
      quantity: 1,
      notes: "",
    });
    setSelectedService(null);
  };
  
  // Calculate total price
  const totalPrice = selectedService ? selectedService.basePrice * quantity : 0;
  
  return (
    <div className="space-y-6">
      <ServiceSelector 
        onServiceSelect={handleServiceSelect}
        category="standard"
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
            <div className="bg-neutral-50 rounded-md p-4 mb-4">
              <h3 className="font-medium text-neutral-900 mb-2">{selectedService.name}</h3>
              {selectedService.description && (
                <p className="text-sm text-neutral-600 mb-2">{selectedService.description}</p>
              )}
              <div className="text-sm font-medium text-primary-600">
                {formatPrice(selectedService.basePrice)} per unit
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div>
                <FormLabel>Price Calculation</FormLabel>
                <div className="bg-neutral-50 rounded-md p-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Unit Price:</span>
                      <span>{formatPrice(selectedService.basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>x{quantity}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t border-neutral-200">
                      <span>Total:</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
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
            
            <div className="flex justify-end">
              <Button 
                type="submit"
              >
                <i className="ri-add-line mr-2"></i>
                Add to Cart
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          Please select a standard service to continue
        </div>
      )}
      
      {/* Display available services if none selected */}
      {!selectedService && !isLoading && servicesData?.services && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Available Standard Services:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {servicesData.services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="text-left p-3 rounded-md border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <p className="font-medium text-neutral-900">{service.name}</p>
                <p className="text-sm text-primary-600 mt-1">{formatPrice(service.basePrice)}/unit</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
