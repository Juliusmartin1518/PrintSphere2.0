import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SalesData } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-neutral-200 rounded shadow-sm">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-primary-600">{formatPrice(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function SalesChart() {
  const { data, isLoading, error } = useQuery<{ sales: SalesData[] }>({
    queryKey: ["/api/dashboard/sales"],
  });
  
  // Process sales data for display
  const processedData = data?.sales?.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })) || [];
  
  return (
    <Card>
      <CardHeader className="border-b border-neutral-200 py-5">
        <CardTitle className="text-lg font-medium text-neutral-900">Sales Overview</CardTitle>
      </CardHeader>
      <CardContent className="h-80 p-5">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-neutral-50">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center bg-neutral-50 text-center text-neutral-400">
            <div>
              <i className="ri-error-warning-line text-6xl mb-4"></i>
              <p>Failed to load sales data</p>
            </div>
          </div>
        ) : processedData.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-neutral-50 text-center text-neutral-400">
            <div>
              <i className="ri-bar-chart-2-line text-6xl mb-4"></i>
              <p>No sales data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `₱${value}`}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="total" 
                fill="hsl(var(--chart-1))" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
