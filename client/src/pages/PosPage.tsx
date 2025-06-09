import { useState } from "react";
import { CartProvider } from "@/hooks/useCart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

import DocumentPrintingForm from "@/components/pos/DocumentPrintingForm";
import TarpaulinPrintingForm from "@/components/pos/TarpaulinPrintingForm";
import LaminationForm from "@/components/pos/LaminationForm";
import StandardServiceForm from "@/components/pos/StandardServiceForm";
import ShoppingCart from "@/components/pos/ShoppingCart";
import QuickAddServices from "@/components/pos/QuickAddServices";
import CheckoutModal from "@/components/pos/CheckoutModal";

import { Service } from "@/lib/types";
import { SERVICE_TYPES } from "@/lib/constants";

export default function PosPage() {
  const [activeTab, setActiveTab] = useState<string>("dynamic");
  const [dynamicServiceType, setDynamicServiceType] = useState<string>(SERVICE_TYPES.DOCUMENT);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  
  const handleServiceSelect = (service: Service | null) => {
    setSelectedService(service);
    if (service && service.type !== SERVICE_TYPES.STANDARD) {
      setDynamicServiceType(service.type);
    }
  };
  
  return (
    <CartProvider>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Point of Sale</h1>
            <p className="text-neutral-500">Create and process new orders</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Selection Panel */}
          <div className="lg:col-span-2 grid grid-cols-1 gap-6">
            {/* Service Category Tabs */}
            <Card>
              <Tabs 
                defaultValue="dynamic" 
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <div className="border-b border-neutral-200">
                  <TabsList className="bg-transparent h-auto p-0">
                    <TabsTrigger 
                      value="dynamic" 
                      className="px-4 py-3 text-sm font-medium data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=inactive]:text-neutral-500 data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent rounded-none"
                    >
                      Dynamic Services
                    </TabsTrigger>
                    <TabsTrigger 
                      value="standard" 
                      className="px-4 py-3 text-sm font-medium data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=inactive]:text-neutral-500 data-[state=inactive]:border-b-2 data-[state=inactive]:border-transparent rounded-none"
                    >
                      Standard Services
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <CardContent className="p-5">
                  <TabsContent value="dynamic" className="mt-0 p-0">
                    {dynamicServiceType === SERVICE_TYPES.DOCUMENT && (
                      <DocumentPrintingForm 
                        onServiceSelect={handleServiceSelect}
                      />
                    )}
                    
                    {dynamicServiceType === SERVICE_TYPES.TARPAULIN && (
                      <TarpaulinPrintingForm 
                        onServiceSelect={handleServiceSelect}
                      />
                    )}
                    
                    {dynamicServiceType === SERVICE_TYPES.LAMINATION && (
                      <LaminationForm 
                        onServiceSelect={handleServiceSelect}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="standard" className="mt-0 p-0">
                    <StandardServiceForm />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
            
            {/* Quick Add Services */}
            <QuickAddServices />
          </div>
          
          {/* Shopping Cart */}
          <ShoppingCart 
            onCheckout={() => setIsCheckoutModalOpen(true)}
          />
        </div>
        
        {/* Checkout Modal */}
        <CheckoutModal 
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
        />
      </div>
    </CartProvider>
  );
}
