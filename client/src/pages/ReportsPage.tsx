import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SalesData } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { exportToCSV, exportToExcel, exportToJSON } from "@/lib/exportUtils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";
import { 
  DownloadIcon, 
  CalendarIcon, 
  FileIcon, 
  FileSpreadsheetIcon, 
  FileJsonIcon 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Chart colors
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

// Custom tooltip component for charts
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

export default function ReportsPage() {
  const [period, setPeriod] = useState("weekly");
  const [reportType, setReportType] = useState("sales");
  
  // Fetch sales data
  const { data: salesData, isLoading: isLoadingSales } = useQuery<{ sales: SalesData[] }>({
    queryKey: ["/api/dashboard/sales"],
  });
  
  // Fetch top services data
  const { data: topServicesData, isLoading: isLoadingTopServices } = useQuery<{ services: { name: string; sales: number; count: number }[] }>({
    queryKey: ["/api/reports/top-services"],
    // In a real app, we would have an actual API endpoint for this
    enabled: false,
  });
  
  // Fetch inventory usage data
  const { data: inventoryUsageData, isLoading: isLoadingInventory } = useQuery<{ items: { name: string; used: number; unit: string }[] }>({
    queryKey: ["/api/reports/inventory-usage"],
    // In a real app, we would have an actual API endpoint for this
    enabled: false,
  });
  
  // Fetch expense data
  const { data: expenseData, isLoading: isLoadingExpenses } = useQuery<{ expenses: { category: string; amount: number }[] }>({
    queryKey: ["/api/reports/expenses-by-category"],
    // In a real app, we would have an actual API endpoint for this
    enabled: false,
  });
  
  // Processed sales data for display
  const processedSalesData = salesData?.sales?.map(item => ({
    ...item,
    date: formatDate(item.date, "MMM d")
  })) || [];
  
  // Mock data for demonstration 
  // In a real implementation, these would come from API endpoints
  const mockTopServices = [
    { name: "Document Printing", sales: 42500, count: 350 },
    { name: "Lamination", sales: 18750, count: 250 },
    { name: "Tarpaulin Printing", sales: 65000, count: 75 },
    { name: "PVC ID", sales: 31250, count: 125 },
    { name: "Mug Printing", sales: 15000, count: 50 }
  ];
  
  const mockInventoryUsage = [
    { name: "A4 Paper", used: 1500, unit: "sheets" },
    { name: "A4 Glossy", used: 750, unit: "sheets" },
    { name: "Black Ink", used: 3, unit: "bottles" },
    { name: "Color Ink", used: 2, unit: "sets" },
    { name: "PVC Cards", used: 125, unit: "pcs" }
  ];
  
  const mockExpensesByCategory = [
    { category: "Supplies", amount: 45000 },
    { category: "Equipment", amount: 15000 },
    { category: "Utilities", amount: 8500 },
    { category: "Miscellaneous", amount: 5000 }
  ];
  
  // Get the data to display based on the selected report type
  const getReportData = () => {
    switch (reportType) {
      case "sales":
        return {
          data: processedSalesData,
          isLoading: isLoadingSales,
          emptyMessage: "No sales data available for the selected period"
        };
      case "top-services":
        return {
          data: topServicesData?.services || mockTopServices,
          isLoading: isLoadingTopServices,
          emptyMessage: "No service data available"
        };
      case "inventory":
        return {
          data: inventoryUsageData?.items || mockInventoryUsage,
          isLoading: isLoadingInventory,
          emptyMessage: "No inventory usage data available"
        };
      case "expenses":
        return {
          data: expenseData?.expenses || mockExpensesByCategory,
          isLoading: isLoadingExpenses,
          emptyMessage: "No expense data available"
        };
      default:
        return {
          data: [],
          isLoading: false,
          emptyMessage: "No data available"
        };
    }
  };
  
  const reportData = getReportData();
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reports & Analytics</h1>
          <p className="text-neutral-500">View sales, inventory, and expense reports</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="sales" value={reportType} onValueChange={setReportType}>
        <TabsList className="mb-6">
          <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          <TabsTrigger value="top-services">Top Services</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Usage</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        {/* Sales Reports Tab */}
        <TabsContent value="sales">
          <Card>
            <CardHeader className="border-b border-neutral-200 py-5 flex flex-row items-center justify-between">
              <CardTitle>Sales Report ({period})</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportToCSV(reportData.data, `sales-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`)}>
                    <FileIcon className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToExcel(reportData.data, `sales-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`)}>
                    <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToJSON(reportData.data, `sales-report-${period}-${new Date().toISOString().slice(0, 10)}.json`)}>
                    <FileJsonIcon className="h-4 w-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="h-96 p-5">
              {reportData.isLoading ? (
                <div className="h-full flex items-center justify-center bg-neutral-50">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : reportData.data.length === 0 ? (
                <div className="h-full flex items-center justify-center bg-neutral-50 text-center text-neutral-400">
                  <div>
                    <i className="ri-bar-chart-2-line text-6xl mb-4"></i>
                    <p>{reportData.emptyMessage}</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportData.data}
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
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-3xl font-bold text-neutral-900">
                    {formatPrice(reportData.data.reduce((sum, item) => sum + (item.total || 0), 0))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Daily Sales</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-3xl font-bold text-neutral-900">
                    {formatPrice(
                      reportData.data.length > 0
                        ? reportData.data.reduce((sum, item) => sum + (item.total || 0), 0) / reportData.data.length
                        : 0
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Growth</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="flex items-center">
                    <div className="text-3xl font-bold text-neutral-900">+12.5%</div>
                    <div className="ml-2 text-sm text-green-500">vs. last period</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Top Services Tab */}
        <TabsContent value="top-services">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="border-b border-neutral-200 py-5">
                <CardTitle>Top Services by Revenue</CardTitle>
              </CardHeader>
              <CardContent className="h-80 p-5">
                {reportData.isLoading ? (
                  <div className="h-full flex items-center justify-center bg-neutral-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : reportData.data.length === 0 ? (
                  <div className="h-full flex items-center justify-center bg-neutral-50 text-center text-neutral-400">
                    <div>
                      <i className="ri-pie-chart-line text-6xl mb-4"></i>
                      <p>{reportData.emptyMessage}</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="sales"
                      >
                        {reportData.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => formatPrice(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="border-b border-neutral-200 py-5">
                <CardTitle>Top Services by Quantity</CardTitle>
              </CardHeader>
              <CardContent className="h-80 p-5">
                {reportData.isLoading ? (
                  <div className="h-full flex items-center justify-center bg-neutral-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : reportData.data.length === 0 ? (
                  <div className="h-full flex items-center justify-center bg-neutral-50 text-center text-neutral-400">
                    <div>
                      <i className="ri-bar-chart-horizontal-line text-6xl mb-4"></i>
                      <p>{reportData.emptyMessage}</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.data}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 90, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        width={90}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Service Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Quantity Sold
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Avg. Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {reportData.isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-5 w-32" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-5 w-16 ml-auto" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-5 w-24 ml-auto" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-5 w-20 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : reportData.data.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-neutral-500">
                          No service data available
                        </td>
                      </tr>
                    ) : (
                      reportData.data.map((service: any, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {service.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 text-right">
                            {service.count} orders
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right font-medium">
                            {formatPrice(service.sales)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 text-right">
                            {formatPrice(service.sales / service.count)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Inventory Usage Tab */}
        <TabsContent value="inventory">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="border-b border-neutral-200 py-5">
                <CardTitle>Inventory Usage by Item</CardTitle>
              </CardHeader>
              <CardContent className="h-80 p-5">
                {reportData.isLoading ? (
                  <div className="h-full flex items-center justify-center bg-neutral-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : reportData.data.length === 0 ? (
                  <div className="h-full flex items-center justify-center bg-neutral-50 text-center text-neutral-400">
                    <div>
                      <i className="ri-stack-line text-6xl mb-4"></i>
                      <p>{reportData.emptyMessage}</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.data}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <Tooltip />
                      <Bar dataKey="used" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]}>
                        {reportData.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="border-b border-neutral-200 py-5">
                <CardTitle>Inventory Usage Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-80 p-5">
                <div className="h-full flex items-center justify-center bg-neutral-50 text-center text-neutral-400">
                  <div>
                    <i className="ri-line-chart-line text-6xl mb-4"></i>
                    <p>Trend data not available for the selected period</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Inventory Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Used
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {reportData.isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-5 w-32" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-5 w-16 ml-auto" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-5 w-16 ml-auto" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-5 w-20 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : reportData.data.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-neutral-500">
                          No inventory usage data available
                        </td>
                      </tr>
                    ) : (
                      reportData.data.map((item: any, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 text-right">
                            {item.used} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                            {/* Current stock would come from actual data */}
                            {item.used > 1000 ? "Low" : "Normal"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.used > 1000 
                                ? "bg-amber-100 text-amber-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {item.used > 1000 ? "Reorder Soon" : "Adequate"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="border-b border-neutral-200 py-5">
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-80 p-5">
                {reportData.isLoading ? (
                  <div className="h-full flex items-center justify-center bg-neutral-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : reportData.data.length === 0 ? (
                  <div className="h-full flex items-center justify-center bg-neutral-50 text-center text-neutral-400">
                    <div>
                      <i className="ri-pie-chart-line text-6xl mb-4"></i>
                      <p>{reportData.emptyMessage}</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        nameKey="category"
                      >
                        {reportData.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => formatPrice(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="border-b border-neutral-200 py-5">
                <CardTitle>Expense Trends</CardTitle>
              </CardHeader>
              <CardContent className="h-80 p-5">
                <div className="h-full flex items-center justify-center bg-neutral-50 text-center text-neutral-400">
                  <div>
                    <i className="ri-line-chart-line text-6xl mb-4"></i>
                    <p>Trend data not available for the selected period</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Expense Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {reportData.isLoading ? (
                      [...Array(4)].map((_, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-5 w-32" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-5 w-24 ml-auto" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-5 w-16 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : reportData.data.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-neutral-500">
                          No expense data available
                        </td>
                      </tr>
                    ) : (
                      <>
                        {reportData.data.map((expense: any, index) => {
                          const total = reportData.data.reduce((sum: number, e: any) => sum + e.amount, 0);
                          const percentage = (expense.amount / total) * 100;
                          
                          return (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                {expense.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right font-medium">
                                {formatPrice(expense.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 text-right">
                                {percentage.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900">
                            Total
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right font-bold">
                            {formatPrice(reportData.data.reduce((sum: number, e: any) => sum + e.amount, 0))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right font-bold">
                            100%
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
