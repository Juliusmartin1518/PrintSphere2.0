import { Badge } from "@/components/ui/badge";
import { getStatusText, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export default function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const statusColor = getStatusColor(status);
  const displayText = getStatusText(status);
  
  const getStatusClasses = () => {
    switch (statusColor) {
      case "green":
        return "bg-green-100 text-green-800";
      case "blue":
        return "bg-blue-100 text-blue-800";
      case "amber":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        "font-medium",
        getStatusClasses(),
        className
      )}
    >
      {displayText}
    </Badge>
  );
}
