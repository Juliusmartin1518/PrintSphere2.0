import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OnlineStoreLayout from "@/components/online-store/OnlineStoreLayout";
import HeroSection from "@/components/online-store/HeroSection";
import ServicesShowcase from "@/components/online-store/ServicesShowcase";
import CustomerDetailsForm from "@/components/online-store/CustomerDetailsForm";

export default function OnlineStorePage() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      if (!res.ok) throw new Error("Failed to create order");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order Placed Successfully!",
        description: `Your order ${data.order.orderNumber} has been received. We'll contact you soon!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setShowOrderForm(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: err.message || "Failed to place order. Please try again.",
      });
    },
  });

  const handleCustomerSubmit = (customerData: any) => {
    const orderData = {
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      customerAddress: customerData.address,
      notes: customerData.notes,
      total: 0,
      status: "pending",
      paymentMethod: "pending",
      paymentStatus: "unpaid",
      createdBy: 1, // System/online order
      items: []
    };

    orderMutation.mutate(orderData);
  };

  return (
    <OnlineStoreLayout>
      {!showOrderForm ? (
        <>
          <HeroSection />
          <ServicesShowcase />
          
          {/* Call to Action Section */}
          <section className="py-16 bg-blue-50">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Place an Order?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Fill out your details and we'll get started on your printing project right away
              </p>
              <button
                onClick={() => setShowOrderForm(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Your Order
              </button>
            </div>
          </section>
        </>
      ) : (
        <section className="py-16 bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Place Your Order</h1>
              <p className="text-lg text-gray-600">
                Provide your details and we'll contact you to discuss your printing needs
              </p>
            </div>
            
            <CustomerDetailsForm 
              onSubmit={handleCustomerSubmit}
              isLoading={orderMutation.isPending}
            />
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowOrderForm(false)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Services
              </button>
            </div>
          </div>
        </section>
      )}
    </OnlineStoreLayout>
  );
}