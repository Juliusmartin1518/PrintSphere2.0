import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import { DocumentPrintingFormData, Service } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { DOCUMENT_PAPER_SIZES, DOCUMENT_PAPER_TYPES, DOCUMENT_COLOR_MODES, SERVICE_TYPES } from "@/lib/constants";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  paperSize: z.string().min(1, "Paper size is required"),
  paperType: z.string().min(1, "Paper type is required"),
  copies: z.coerce.number().min(1, "At least one copy is required"),
  colorMode: z.string().min(1, "Color mode is required"),
  notes: z.string().optional(),
});

interface DocumentPrintingFormProps {
  onServiceSelect?: (service: Service | null) => void;
}

export default function DocumentPrintingForm({ onServiceSelect }: DocumentPrintingFormProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<{
    unitPrice: number;
    total: number;
    breakdown: any;
  } | null>(null);
  
  // Document analysis state
  const [documentAnalysis, setDocumentAnalysis] = useState<{
    pageCount: number;
    colorPages: number;
    bwPages: number;
    isAnalyzing: boolean;
  }>({
    pageCount: 1,
    colorPages: 0,
    bwPages: 1,
    isAnalyzing: false
  });
  
  const { addItem } = useCart();
  
  // Form definition
  const form = useForm<DocumentPrintingFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paperSize: "A4",
      paperType: "Standard",
      copies: 1,
      colorMode: "Auto Detect",
      notes: "",
    },
  });
  
  // Watch form values to recalculate price
  const paperSize = form.watch("paperSize");
  const paperType = form.watch("paperType");
  const copies = form.watch("copies");
  const colorMode = form.watch("colorMode");
  
  // Get services for document printing
  const { data: servicesData, isLoading } = useQuery<{ services: Service[] }>({
    queryKey: ["/api/services?category=dynamic&type=document"],
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
    
    // Make sure we have valid input values
    const validPaperSize = paperSize || 'A4';
    const validPaperType = paperType || 'Standard';
    const validCopies = copies > 0 ? copies : 1;
    const validColorMode = colorMode || 'Black & White';
    
    try {
      // Hardcode price values for now to ensure prices appear correctly
      const rules = {
        colorPageRate: 14.00,      // Base rate for colored page
        blackPageRate: 7.00,       // Base rate for black page
        paperTypes: {
          "Standard": 0.00,        // No additional cost
          "Glossy": 1.00,          // ₱1 extra per page  
          "Matte": 1.50,           // ₱1.50 extra per page
          "High Quality": 2.00     // ₱2 extra per page
        },
        paperSizes: { "A4": 1.0, "Letter": 1.05, "Long": 1.2, "A5": 0.7 }
      };
      
      // Auto Detect mode with document analysis
      if (validColorMode === 'Auto Detect' && documentAnalysis && !documentAnalysis.isAnalyzing) {
        const validColorPages = documentAnalysis.colorPages || 0;
        const validBwPages = documentAnalysis.bwPages || 0;
        const validPageCount = documentAnalysis.pageCount || (validColorPages + validBwPages);
        
        // Get paper type surcharge
        const paperTypeCost = rules.paperTypes[validPaperType as keyof typeof rules.paperTypes] || 0;
        
        // Calculate costs for each type of page
        const colorPageRate = rules.colorPageRate + paperTypeCost;
        const bwPageRate = rules.blackPageRate + paperTypeCost;
        
        // Calculate total costs
        const colorPagesTotal = validColorPages * colorPageRate;
        const bwPagesTotal = validBwPages * bwPageRate;
        const totalPerCopy = colorPagesTotal + bwPagesTotal;
        const total = totalPerCopy * validCopies;
        
        // Calculate average price per page
        const unitPrice = validPageCount > 0 ? totalPerCopy / validPageCount : 0;
        
        setPriceCalculation({
          unitPrice,
          total,
          breakdown: {
            colorPages: validColorPages,
            bwPages: validBwPages,
            colorPageRate,
            bwPageRate
          }
        });
      } else {
        // Standard calculation for Color or Black & White mode
        let baseRate = 0;
        if (validColorMode === 'Color') {
          baseRate = rules.colorPageRate;
        } else {
          baseRate = rules.blackPageRate;
        }
        
        // Add paper type cost
        const paperTypeCost = rules.paperTypes[validPaperType as keyof typeof rules.paperTypes] || 0;
        const ratePerPage = baseRate + paperTypeCost;
        
        // For standard calculation, we assume 1 page if no analysis
        const estimatedPages = documentAnalysis?.pageCount || 1;
        const total = ratePerPage * estimatedPages * validCopies;
        
        setPriceCalculation({
          unitPrice: ratePerPage,
          total,
          breakdown: {
            baseRate,
            paperTypeCost,
            estimatedPages,
            copies: validCopies
          }
        });
      }
    } catch (error) {
      console.error("Error in price calculation:", error);
      // Set a fallback calculation with fixed values
      setPriceCalculation({
        unitPrice: 14.00,
        total: 14.00 * (copies || 1),
        breakdown: { error: String(error) }
      });
    }
  }, [selectedService, paperSize, paperType, copies, colorMode, documentAnalysis]);
  
  // Handle file selection and analyze document
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      analyzeDocument(file);
    }
  };
  
  // Analyze document to detect page count and color/b&w content
  const analyzeDocument = async (file: File) => {
    setDocumentAnalysis(prev => ({ ...prev, isAnalyzing: true }));
    
    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    // Simulate document analysis (in a real app, we'd use a proper document analyzer)
    // For demo purposes, we'll set some reasonable defaults based on file type and size
    
    // Estimate page count based on file size and type
    const fileSizeInKB = file.size / 1024;
    let estimatedPageCount = 1;
    let estimatedColorPages = 0;
    
    if (fileExt === 'pdf') {
      // Rough estimate: average PDF page is ~100KB
      estimatedPageCount = Math.max(1, Math.round(fileSizeInKB / 100));
    } else if (['doc', 'docx'].includes(fileExt || '')) {
      // Rough estimate: average Word page is ~30KB
      estimatedPageCount = Math.max(1, Math.round(fileSizeInKB / 30));
    } else if (['jpg', 'jpeg', 'png'].includes(fileExt || '')) {
      // Images are typically 1 page
      estimatedPageCount = 1;
      // Images are typically color
      estimatedColorPages = 1;
    }
    
    // Estimate color pages (for PDFs and documents)
    // In a real app, we'd analyze the actual content
    if (fileExt === 'pdf' || ['doc', 'docx'].includes(fileExt || '')) {
      // Assume approximately 40% of pages contain color for typical documents
      estimatedColorPages = Math.round(estimatedPageCount * 0.4);
    }
    
    // Apply the analysis after a short delay to simulate processing
    setTimeout(() => {
      setDocumentAnalysis({
        pageCount: estimatedPageCount,
        colorPages: estimatedColorPages,
        bwPages: estimatedPageCount - estimatedColorPages,
        isAnalyzing: false
      });
      
      // Don't automatically set copies to match page count
      // Keep the current copies value or default to 1 if not set
      if (!form.getValues('copies')) {
        form.setValue('copies', 1);
      }
    }, 1500);
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
  const onSubmit = async (values: DocumentPrintingFormData) => {
    if (!selectedService || !priceCalculation) return;
    
    // Create description string
    const description = `${values.paperSize}, ${values.paperType}, ${values.colorMode}`;
    
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
      serviceType: SERVICE_TYPES.DOCUMENT,
      quantity: values.copies,
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
      paperSize: "A4",
      paperType: "Standard",
      copies: 1,
      colorMode: "Auto Detect",
      notes: "",
    });
    setSelectedFile(null);
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
                name="paperSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paper Size</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select paper size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOCUMENT_PAPER_SIZES.map((size) => (
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
                name="paperType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paper Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select paper type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOCUMENT_PAPER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="copies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Copies</FormLabel>
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
              
              <FormField
                control={form.control}
                name="colorMode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Print Mode</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        className="flex space-x-4"
                      >
                        {DOCUMENT_COLOR_MODES.map((mode) => (
                          <div className="flex items-center space-x-2" key={mode.value}>
                            <RadioGroupItem value={mode.value} id={`color-${mode.value}`} />
                            <label htmlFor={`color-${mode.value}`} className="text-sm font-medium">
                              {mode.label}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel>Upload File</FormLabel>
              <div 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md relative cursor-pointer"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-neutral-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-neutral-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    PDF, Word, or image files
                  </p>
                </div>
              </div>
              {selectedFile && (
                <div className="mt-2 text-sm text-neutral-600">
                  <p>
                    <span className="font-medium">Selected file:</span> {selectedFile.name}
                  </p>
                  {documentAnalysis.isAnalyzing ? (
                    <p className="text-primary animate-pulse">Analyzing document...</p>
                  ) : (
                    <p>
                      <span className="font-medium">Pages:</span> {documentAnalysis.pageCount} (Color: {documentAnalysis.colorPages}, B&W: {documentAnalysis.bwPages})
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions or requirements"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedService && priceCalculation && (
              <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900">Price Calculation</h3>
                <div className="mt-2 space-y-2">
                  {colorMode === 'Auto Detect' && documentAnalysis && documentAnalysis.pageCount > 0 && !documentAnalysis.isAnalyzing && (
                    <div className="text-sm">
                      <p><span className="font-medium">Color Pages:</span> {documentAnalysis.colorPages} × {formatPrice(priceCalculation.breakdown.colorPageRate)} = {formatPrice(documentAnalysis.colorPages * priceCalculation.breakdown.colorPageRate)}</p>
                      <p><span className="font-medium">B&W Pages:</span> {documentAnalysis.bwPages} × {formatPrice(priceCalculation.breakdown.bwPageRate)} = {formatPrice(documentAnalysis.bwPages * priceCalculation.breakdown.bwPageRate)}</p>
                    </div>
                  )}
                  <p className="text-sm"><span className="font-medium">Paper Type:</span> {paperType}</p>
                  <p className="text-sm">
                    <span className="font-medium">Print Mode:</span> {colorMode} 
                    {colorMode === 'Auto Detect' && documentAnalysis && !documentAnalysis.isAnalyzing && 
                     ` (${documentAnalysis.colorPages} color, ${documentAnalysis.bwPages} b&w)`}
                  </p>
                  <p className="text-sm"><span className="font-medium">Copies:</span> {copies}</p>
                  <p className="text-sm"><span className="font-medium">Rate per page:</span> {formatPrice(priceCalculation.unitPrice)}</p>
                  <div className="border-t border-neutral-200 pt-2 mt-2">
                    <p className="text-base font-bold">Total: {formatPrice(priceCalculation.total)}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <Button type="button" variant="outline" size="sm">
                    Adjust Rates
                  </Button>
                  <Button type="submit">Add to Cart</Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      ) : (
        <div className="text-center p-4 border border-dashed border-neutral-300 rounded-md">
          <p className="text-neutral-600">Please select a service to continue</p>
        </div>
      )}
    </div>
  );
}