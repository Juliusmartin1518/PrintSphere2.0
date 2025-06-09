import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Inventory } from "@/lib/types";
import { INVENTORY_CATEGORIES } from "@/lib/constants";
import { USER_ROLES } from "@/lib/constants";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SearchIcon, PlusIcon } from "lucide-react";

// Form schema for adding inventory
const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  currentStock: z.coerce.number().min(0, "Stock cannot be negative"),
  lowStockThreshold: z.coerce.number().min(1, "Threshold must be at least 1"),
});

// Form schema for updating stock
const stockUpdateSchema = z.object({
  quantity: z.coerce.number().int(),
  notes: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;
type StockUpdateFormValues = z.infer<typeof stockUpdateSchema>;

export default function InventoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  
  // Forms
  const inventoryForm = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      unit: "",
      currentStock: 0,
      lowStockThreshold: 10,
    },
  });
  
  const stockUpdateForm = useForm<StockUpdateFormValues>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      quantity: 0,
      notes: "",
    },
  });
  
  // Fetch inventory
  const { data, isLoading } = useQuery<{ inventory: Inventory[] }>({
    queryKey: ["/api/inventory"],
  });
  
  // Add inventory mutation
  const addInventoryMutation = useMutation({
    mutationFn: async (values: InventoryFormValues) => {
      const res = await apiRequest("POST", "/api/inventory", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setIsAddDialogOpen(false);
      inventoryForm.reset();
      toast({
        title: "Inventory Added",
        description: "The inventory item has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add inventory item.",
      });
    },
  });
  
  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async (values: { id: number; quantity: number }) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/inventory/${values.id}/stock`,
        { quantity: values.quantity }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setIsUpdateDialogOpen(false);
      stockUpdateForm.reset();
      setSelectedItem(null);
      toast({
        title: "Stock Updated",
        description: "The inventory stock has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update stock.",
      });
    },
  });
  
  // Handle form submissions
  const onAddInventory = (values: InventoryFormValues) => {
    addInventoryMutation.mutate(values);
  };
  
  const onUpdateStock = (values: StockUpdateFormValues) => {
    if (!selectedItem) return;
    updateStockMutation.mutate({
      id: selectedItem.id,
      quantity: values.quantity,
    });
  };
  
  // Open update stock dialog
  const openUpdateDialog = (item: Inventory) => {
    setSelectedItem(item);
    stockUpdateForm.reset({
      quantity: 0,
      notes: "",
    });
    setIsUpdateDialogOpen(true);
  };
  
  // Filter inventory items
  const getFilteredInventory = () => {
    if (!data?.inventory) return [];
    
    let filtered = data.inventory;
    
    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };
  
  // Get stock status
  const getStockStatus = (current: number, threshold: number) => {
    const ratio = current / threshold;
    if (ratio <= 0.25) return { label: "Critical", color: "bg-red-100 text-red-800" };
    if (ratio <= 0.5) return { label: "Low", color: "bg-amber-100 text-amber-800" };
    return { label: "OK", color: "bg-green-100 text-green-800" };
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Inventory Management</h1>
          <p className="text-neutral-500">Track and manage inventory stock levels</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-4">
          {user?.role === USER_ROLES.ADMIN && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Inventory
            </Button>
          )}
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="relative max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-neutral-400" />
              </div>
              <Input
                type="text"
                placeholder="Search inventory..."
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
                {INVENTORY_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
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
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Restocked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredInventory().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-neutral-400 mb-2">
                          <i className="ri-inbox-line text-4xl"></i>
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-1">No inventory items found</h3>
                        <p className="text-neutral-500">
                          {searchQuery || categoryFilter !== "all"
                            ? "Try adjusting your search criteria"
                            : "Add your first inventory item to get started"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredInventory().map((item) => {
                      const status = getStockStatus(item.currentStock, item.lowStockThreshold);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-neutral-500">{item.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {INVENTORY_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                          </TableCell>
                          <TableCell>{item.currentStock} {item.unit}</TableCell>
                          <TableCell>{item.lowStockThreshold} {item.unit}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={status.color + " rounded-full text-xs font-medium"}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.lastRestocked 
                              ? new Date(item.lastRestocked).toLocaleDateString() 
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openUpdateDialog(item)}
                            >
                              Update Stock
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Inventory Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
          </DialogHeader>
          
          <Form {...inventoryForm}>
            <form onSubmit={inventoryForm.handleSubmit(onAddInventory)} className="space-y-4">
              <FormField
                control={inventoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={inventoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={inventoryForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INVENTORY_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={inventoryForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., sheets, bottles" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={inventoryForm.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stock</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={inventoryForm.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Threshold</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addInventoryMutation.isPending}
                >
                  {addInventoryMutation.isPending ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Update Stock Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Update Stock: {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...stockUpdateForm}>
            <form onSubmit={stockUpdateForm.handleSubmit(onUpdateStock)} className="space-y-4">
              <div className="bg-neutral-50 p-3 rounded-md space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Current Stock:</span>
                  <span className="font-medium">{selectedItem?.currentStock} {selectedItem?.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Low Stock Threshold:</span>
                  <span className="font-medium">{selectedItem?.lowStockThreshold} {selectedItem?.unit}</span>
                </div>
              </div>
              
              <FormField
                control={stockUpdateForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity to Add/Remove</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter positive number to add, negative to remove" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={stockUpdateForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Reason for adjustment" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUpdateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateStockMutation.isPending}
                >
                  {updateStockMutation.isPending ? "Updating..." : "Update Stock"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
