import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Service } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { SERVICE_CATEGORIES, SERVICE_TYPES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, SearchIcon } from "lucide-react";

// Basic service schema
const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  type: z.string().min(1, "Type is required"),
  basePrice: z.coerce.number().min(0, "Price cannot be negative"),
  active: z.boolean().default(true),
  pricingRules: z.any().optional(), // This would be more specifically typed in a real app
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function ServicesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Form
  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      category: SERVICE_CATEGORIES.DYNAMIC,
      type: SERVICE_TYPES.DOCUMENT,
      basePrice: 0,
      active: true,
      pricingRules: {},
    },
  });
  
  // Fetch services
  const { data, isLoading } = useQuery<{ services: Service[] }>({
    queryKey: ["/api/services"],
  });
  
  // Add service mutation
  const addServiceMutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      const res = await apiRequest("POST", "/api/services", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsAddDialogOpen(false);
      serviceForm.reset();
      toast({
        title: "Service Added",
        description: "The service has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add service.",
      });
    },
  });
  
  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (values: ServiceFormValues & { id: number }) => {
      const { id, ...serviceData } = values;
      const res = await apiRequest("PATCH", `/api/services/${id}`, serviceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsEditDialogOpen(false);
      setSelectedService(null);
      toast({
        title: "Service Updated",
        description: "The service has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update service.",
      });
    },
  });
  
  // Handle form submissions
  const onAddService = (values: ServiceFormValues) => {
    addServiceMutation.mutate(values);
  };
  
  const onUpdateService = (values: ServiceFormValues) => {
    if (!selectedService) return;
    updateServiceMutation.mutate({
      ...values,
      id: selectedService.id,
    });
  };
  
  // Open edit dialog
  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    serviceForm.reset({
      name: service.name,
      description: service.description || "",
      category: service.category,
      type: service.type,
      basePrice: service.basePrice,
      active: service.active,
      pricingRules: service.pricingRules || {},
    });
    setIsEditDialogOpen(true);
  };
  
  // Filter services
  const getFilteredServices = () => {
    if (!data?.services) return [];
    
    let filtered = data.services;
    
    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(service => service.type === activeTab);
    }
    
    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(service => service.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(query) ||
        (service.description && service.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };
  
  // Get the label for service type
  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case SERVICE_TYPES.DOCUMENT: return "Document Printing";
      case SERVICE_TYPES.TARPAULIN: return "Tarpaulin Printing";
      case SERVICE_TYPES.LAMINATION: return "Lamination";
      case SERVICE_TYPES.STANDARD: return "Standard Service";
      default: return type;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Services Management</h1>
          <p className="text-neutral-500">Manage pricing and availability of services</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-4">
          <Button onClick={() => {
            serviceForm.reset({
              name: "",
              description: "",
              category: SERVICE_CATEGORIES.DYNAMIC,
              type: SERVICE_TYPES.DOCUMENT,
              basePrice: 0,
              active: true,
              pricingRules: {},
            });
            setIsAddDialogOpen(true);
          }}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Services</TabsTrigger>
              <TabsTrigger value={SERVICE_TYPES.DOCUMENT}>Document</TabsTrigger>
              <TabsTrigger value={SERVICE_TYPES.TARPAULIN}>Tarpaulin</TabsTrigger>
              <TabsTrigger value={SERVICE_TYPES.LAMINATION}>Lamination</TabsTrigger>
              <TabsTrigger value={SERVICE_TYPES.STANDARD}>Standard</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="relative max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-neutral-400" />
              </div>
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value={SERVICE_CATEGORIES.DYNAMIC}>Dynamic</SelectItem>
                <SelectItem value={SERVICE_CATEGORIES.STANDARD}>Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredServices().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-neutral-400 mb-2">
                          <i className="ri-settings-3-line text-4xl"></i>
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-1">No services found</h3>
                        <p className="text-neutral-500">
                          {searchQuery || categoryFilter !== "all" || activeTab !== "all"
                            ? "Try adjusting your search criteria"
                            : "Add your first service to get started"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredServices().map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-neutral-500">{service.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getServiceTypeLabel(service.type)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-medium">
                            {service.category === SERVICE_CATEGORIES.DYNAMIC ? "Dynamic" : "Standard"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatPrice(service.basePrice)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={service.active 
                              ? "bg-green-100 text-green-800" 
                              : "bg-neutral-100 text-neutral-800"
                            }
                          >
                            {service.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(service)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Service Dialog */}
      {(isAddDialogOpen || isEditDialogOpen) && (
        <Dialog 
          open={isAddDialogOpen || isEditDialogOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isAddDialogOpen ? "Add New Service" : "Edit Service"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...serviceForm}>
              <form 
                onSubmit={serviceForm.handleSubmit(isAddDialogOpen ? onAddService : onUpdateService)} 
                className="space-y-4"
              >
                <FormField
                  control={serviceForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter service name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={serviceForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter service description" 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={serviceForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={SERVICE_CATEGORIES.DYNAMIC}>Dynamic</SelectItem>
                            <SelectItem value={SERVICE_CATEGORIES.STANDARD}>Standard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Dynamic services have variable pricing based on specifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={serviceForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={SERVICE_TYPES.DOCUMENT}>Document Printing</SelectItem>
                            <SelectItem value={SERVICE_TYPES.TARPAULIN}>Tarpaulin Printing</SelectItem>
                            <SelectItem value={SERVICE_TYPES.LAMINATION}>Lamination</SelectItem>
                            <SelectItem value={SERVICE_TYPES.STANDARD}>Standard Service</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={serviceForm.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-neutral-500 sm:text-sm">₱</span>
                            </div>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-7"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {serviceForm.watch("category") === SERVICE_CATEGORIES.DYNAMIC 
                            ? "Starting price before modifiers" 
                            : "Fixed price per unit"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={serviceForm.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Show this service in the POS system
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Pricing rules would go here in a full implementation */}
                {/* This would be different based on the service type */}
                
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setIsEditDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAddDialogOpen ? addServiceMutation.isPending : updateServiceMutation.isPending}
                  >
                    {isAddDialogOpen
                      ? (addServiceMutation.isPending ? "Adding..." : "Add Service")
                      : (updateServiceMutation.isPending ? "Updating..." : "Update Service")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
