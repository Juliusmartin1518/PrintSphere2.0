import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  change?: {
    value: string | number;
    label: string;
    isPositive?: boolean;
  };
  actionLink?: {
    label: string;
    href: string;
  };
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  change,
  actionLink,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-neutral-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-neutral-900 mt-1">
            {typeof value === "number" && title.includes("Sales") 
              ? formatPrice(value) 
              : value}
          </h3>
        </div>
        <div className={cn("p-2 rounded-md", iconBgColor)}>
          <i className={cn(icon, "text-xl", iconColor)}></i>
        </div>
      </div>
      <div className="mt-2">
        {change ? (
          <div className="flex items-center">
            <span 
              className={cn(
                "text-sm flex items-center",
                change.isPositive ? "text-green-500" : "text-red-500"
              )}
            >
              <i className={cn(
                "mr-1",
                change.isPositive ? "ri-arrow-up-line" : "ri-arrow-down-line"  
              )}></i>
              {change.value}
            </span>
            <span className="text-neutral-500 text-sm ml-2">{change.label}</span>
          </div>
        ) : actionLink ? (
          <a href={actionLink.href} className="text-primary-600 text-sm hover:underline">
            {actionLink.label}
          </a>
        ) : null}
      </div>
    </div>
  );
}
