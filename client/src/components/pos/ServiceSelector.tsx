import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Service } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SERVICE_CATEGORIES, SERVICE_TYPES } from "@/lib/constants";

interface ServiceSelectorProps {
  onServiceSelect: (service: Service | null) => void;
  selectedServiceId?: number;
  category?: string;
}

export default function ServiceSelector({ 
  onServiceSelect, 
  selectedServiceId,
  category = 'dynamic'
}: ServiceSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>(selectedServiceId?.toString() || "");
  
  // Query for dynamic services with refetch interval to catch newly added services
  const { data, isLoading, error } = useQuery<{ services: Service[] }>({
    queryKey: [`/api/services?category=${category}`],
    refetchInterval: 10000, // Refetch every 10 seconds to check for new services
    refetchOnWindowFocus: true, // Refetch when window gets focus
    staleTime: 5000, // Consider data stale after 5 seconds
  });
  
  // Find the selected service in the data
  useEffect(() => {
    if (data?.services && selectedId) {
      const service = data.services.find(s => s.id.toString() === selectedId);
      onServiceSelect(service || null);
    } else {
      onServiceSelect(null);
    }
  }, [selectedId, data?.services, onServiceSelect]);
  
  // Update selectedId if selectedServiceId prop changes
  useEffect(() => {
    if (selectedServiceId !== undefined) {
      setSelectedId(selectedServiceId.toString());
    }
  }, [selectedServiceId]);
  
  const handleServiceChange = (value: string) => {
    setSelectedId(value);
  };
  
  return (
    <div>
      <Label className="block text-sm font-medium text-neutral-700 mb-1">Service Type</Label>
      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-md" />
      ) : error ? (
        <div className="text-sm text-red-500">Failed to load services</div>
      ) : (
        <Select value={selectedId} onValueChange={handleServiceChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {data?.services.map((service) => (
              <SelectItem key={service.id} value={service.id.toString()}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
