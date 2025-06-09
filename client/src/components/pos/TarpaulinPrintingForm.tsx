import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import { TarpaulinPrintingFormData, Service } from "@/lib/types";
import { calculateTarpaulinPrintingPrice } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { SERVICE_TYPES } from "@/lib/constants";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import ServiceSelector from "./ServiceSelector";

const formSchema = z.object({
  width: z.coerce.number().min(0.1, "Width must be at least 0.1 ft"),
  height: z.coerce.number().min(0.1, "Height must be at least 0.1 ft"),
  eyelets: z.coerce.number().min(0, "Eyelets must be 0 or more"),
  rope: z.boolean().default(false),
  stand: z.boolean().default(false),
  notes: z.string().optional(),
});

interface TarpaulinPrintingFormProps {
  onServiceSelect?: (service: Service | null) => void;
}

export default function TarpaulinPrintingForm({ onServiceSelect }: TarpaulinPrintingFormProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<{
    unitPrice: number;
    total: number;
    breakdown: any;
  } | null>(null);
  
  const { addItem } = useCart();
  
  // Form definition
  const form = useForm<TarpaulinPrintingFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      width: 3,
      height: 4,
      eyelets: 6,
      rope: false,
      stand: false,
      notes: "",
    },
  });
  
  // Watch form values to recalculate price
  const width = form.watch("width");
  const height = form.watch("height");
  const eyelets = form.watch("eyelets");
  const rope = form.watch("rope");
  const stand = form.watch("stand");
  
  // Get services for tarpaulin printing
  const { data: servicesData, isLoading } = useQuery<{ services: Service[] }>({
    queryKey: ["/api/services?category=dynamic&type=tarpaulin"],
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
    
    const calculation = calculateTarpaulinPrintingPrice(
      {
        width,
        height,
        eyelets,
        rope,
        stand,
      },
      selectedService.pricingRules
    );
    
    setPriceCalculation(calculation);
  }, [selectedService, width, height, eyelets, rope, stand]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Convert file to base64 for storage
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Form submission
  const onSubmit = async (values: TarpaulinPrintingFormData) => {
    if (!selectedService || !priceCalculation) return;
    
    // Create description string
    const description = `${values.width} × ${values.height} ft, ${values.eyelets} eyelets${values.rope ? ', with rope' : ''}${values.stand ? ', with stand' : ''}`;
    
    // Process file if uploaded
    let fileData = null;
    if (selectedFile) {
      try {
        fileData = await convertFileToBase64(selectedFile);
      } catch (error) {
        console.error("Error converting file to base64:", error);
      }
    }
    
    // Add to cart
    addItem({
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceType: SERVICE_TYPES.TARPAULIN,
      quantity: 1, // Tarpaulin is usually 1 piece
      unitPrice: priceCalculation.unitPrice,
      amount: priceCalculation.total,
      specifications: {
        ...values,
        fileName: selectedFile?.name,
        fileData: fileData,
        serviceName: selectedService.name,
        description
      }
    });
    
    // Reset form
    form.reset({
      width: 3,
      height: 4,
      eyelets: 6,
      rope: false,
      stand: false,
      notes: "",
    });
    setSelectedFile(null);
  };
  
  // Calculate area
  const area = width * height;
  
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
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width (ft)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (ft)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="bg-neutral-50 rounded-md p-3 text-sm">
              <div className="font-medium mb-1">Dimensions Summary</div>
              <div className="flex justify-between text-neutral-600">
                <span>Width × Height:</span>
                <span>{width} × {height} ft</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Total Area:</span>
                <span>{area.toFixed(2)} sq. ft</span>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="eyelets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Eyelets</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Eyelets are metal rings installed along the edges for hanging.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rope"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include Rope</FormLabel>
                      <FormDescription>
                        Add rope for hanging (+₱{selectedService?.pricingRules?.rope || 50})
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="stand"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include Stand</FormLabel>
                      <FormDescription>
                        Add X-stand for display (+₱{selectedService?.pricingRules?.stand || 200})
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel>Upload Design File</FormLabel>
              <label 
                htmlFor="tarpaulin-upload" 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md relative cursor-pointer hover:border-primary-500 hover:bg-neutral-50 transition-colors"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <div className="space-y-1 text-center">
                  <i className="ri-upload-2-line text-neutral-400 text-3xl"></i>
                  <div className="flex text-sm text-neutral-600">
                    <span className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                      Upload a design
                      <input 
                        id="tarpaulin-upload" 
                        name="tarpaulin-upload" 
                        type="file" 
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".jpg,.jpeg,.png,.pdf,.ai,.psd"
                      />
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {selectedFile 
                      ? `Selected: ${selectedFile.name}`
                      : "JPG, PNG, PDF, or AI files up to 50MB"
                    }
                  </p>
                </div>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel>Price Calculation</FormLabel>
                <div className="bg-neutral-50 rounded-md p-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span>{width} × {height} ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Area:</span>
                      <span>{area.toFixed(2)} sq. ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Cost ({formatPrice(selectedService?.basePrice || 0)}/sq. ft):</span>
                      <span>{priceCalculation ? formatPrice(priceCalculation.breakdown.baseCost) : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eyelets ({eyelets} × ₱{selectedService?.pricingRules?.eyelets || 10}):</span>
                      <span>{priceCalculation ? formatPrice(priceCalculation.breakdown.eyeletCost) : "—"}</span>
                    </div>
                    {rope && (
                      <div className="flex justify-between">
                        <span>Rope:</span>
                        <span>{priceCalculation ? formatPrice(priceCalculation.breakdown.ropeCost) : "—"}</span>
                      </div>
                    )}
                    {stand && (
                      <div className="flex justify-between">
                        <span>Stand:</span>
                        <span>{priceCalculation ? formatPrice(priceCalculation.breakdown.standCost) : "—"}</span>
                      </div>
                    )}
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
                disabled={!selectedFile || !priceCalculation}
              >
                <i className="ri-add-line mr-2"></i>
                Add to Cart
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          Please select a tarpaulin printing service to continue
        </div>
      )}
    </div>
  );
}
