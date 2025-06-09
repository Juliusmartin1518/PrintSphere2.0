import { useQuery } from "@tanstack/react-query";
import { Service } from "@/lib/types";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { SERVICE_TYPES } from "@/lib/constants";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function QuickAddServices() {
  const { addItem } = useCart();
  const { toast } = useToast();
  
  // Get all services for quick add
  const { data, isLoading } = useQuery<{ services: Service[] }>({
    queryKey: ["/api/services"],
  });
  
  // Get 4 popular services
  const popularServices = data?.services
    ?.filter(service => service.active)
    ?.slice(0, 4) || [];
  
  // Quick add service to cart
  const quickAddService = (service: Service) => {
    if (service.type === SERVICE_TYPES.STANDARD) {
      // For standard services, we can add directly with a quantity of 1
      addItem({
        serviceId: service.id,
        serviceName: service.name,
        serviceType: service.type,
        quantity: 1,
        unitPrice: service.basePrice,
        amount: service.basePrice,
        specifications: {
          serviceName: service.name,
          description: "1 pc"
        }
      });
      
      toast({
        title: "Service Added",
        description: `${service.name} added to cart.`,
      });
    } else {
      // For dynamic services, we need to show a message
      toast({
        title: "Configuration Required",
        description: "This service requires additional configuration. Please use the service form above.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Quick Add Services</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : popularServices.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularServices.map((service) => (
              <button
                key={service.id}
                onClick={() => quickAddService(service)}
                className="text-left p-3 rounded-md border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <i className={`${getServiceIcon(service.type)} text-xl text-primary-600 mb-1`}></i>
                <p className="font-medium text-neutral-900">{service.name}</p>
                <p className="text-sm text-neutral-500">{formatPrice(service.basePrice)}/{service.type === SERVICE_TYPES.DOCUMENT ? "page" : "pc"}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-neutral-500">
            <p>No quick services available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get icon for service type
function getServiceIcon(type: string): string {
  switch (type) {
    case SERVICE_TYPES.DOCUMENT:
      return "ri-file-copy-line";
    case SERVICE_TYPES.TARPAULIN:
      return "ri-artboard-line";
    case SERVICE_TYPES.LAMINATION:
      return "ri-scissors-cut-line";
    case SERVICE_TYPES.STANDARD:
      return "ri-bank-card-line";
    default:
      return "ri-file-list-line";
  }
}
