import { useState, useEffect } from "react";
import { Customer, InsertCustomer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusCircle, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Customer form schema
const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerSelectorProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  allowCreate?: boolean;
}

export default function CustomerSelector({
  value,
  onChange,
  allowCreate = true,
}: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customersData, isLoading } = useQuery<{
    customers: Customer[];
  }>({
    queryKey: ["/api/customers"],
  });

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: (data: CustomerFormData) =>
      apiRequest("POST", "/api/customers", data),
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer added",
        description: "The customer has been added successfully.",
      });
      setIsCreateDialogOpen(false);
      onChange(data.customer);
    },
    onError: (error) => {
      toast({
        title: "Failed to add customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
  });

  // Filter customers based on search term - only show if user has typed something
  const filteredCustomers = searchTerm
    ? customersData?.customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.phone && customer.phone.includes(searchTerm)) ||
          (customer.email &&
            customer.email.toLowerCase().includes(searchTerm.toLowerCase())),
      ) || []
    : [];

  // Reset form when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      form.reset();
    }
  }, [isCreateDialogOpen, form]);

  return (
    <div className="relative w-full">
      <Command className="border rounded-md">
        <CommandInput
          value={searchTerm}
          onValueChange={(value) => {
            setSearchTerm(value);
            if (value) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        />

        {isOpen && (
          <CommandList className="absolute z-50 w-full bg-white shadow-md rounded-md border mt-1 max-h-64 overflow-y-auto">
            <CommandInput
          placeholder="Search customers..."
          value={searchTerm}
          onValueChange={(value) => {
          setSearchTerm(value);
          if (value) setIsOpen(true);
           }}
             onFocus={() => setIsOpen(true)}
           className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />

            <CommandGroup>
              {filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => {
                    onChange(customer);
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <User size={16} className="mr-2 text-gray-500" />
                    <span>{customer.name}</span>
                  </div>
                  {customer.phone && (
                    <span className="text-xs text-gray-500">
                      {customer.phone}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            {allowCreate && searchTerm && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                    // Add a small delay to ensure the dialog opens properly
                    setTimeout(() => {
                      setIsCreateDialogOpen(true);
                      form.setValue("name", searchTerm);
                    }, 100);
                  }}
                >
                  <PlusCircle size={16} />
                  <span>Create "{searchTerm}"</span>
                </Button>
              </div>
            )}
          </CommandList>
        )}
      </Command>

      {value && (
        <div className="mt-2 flex items-center justify-between p-2 rounded-md bg-gray-50">
          <div>
            <p className="text-sm font-medium">{value.name}</p>
            {value.phone && (
              <p className="text-xs text-gray-500">{value.phone}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Change
          </Button>
        </div>
      )}

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = form.getValues();
                addCustomerMutation.mutate(data);
              }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={addCustomerMutation.isPending}>
                  {addCustomerMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Customer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
