import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Expense } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentExpensesCard() {
  const { data, isLoading, error } = useQuery<{ expenses: Expense[] }>({
    queryKey: ["/api/dashboard/recent-expenses?limit=3"],
  });
  
  const getCategoryText = (category: string) => {
    switch (category) {
      case "supplies": return "Supplies";
      case "equipment": return "Equipment";
      case "utilities": return "Utilities";
      case "misc": return "Miscellaneous";
      default: return category;
    }
  };
  
  const getRelativeTime = (date: string) => {
    const now = new Date();
    const expenseDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(date, "MMM d, yyyy");
  };
  
  return (
    <Card>
      <CardHeader className="border-b border-neutral-200 flex flex-row items-center justify-between py-5">
        <CardTitle className="text-lg font-medium text-neutral-900">Recent Expenses</CardTitle>
        <Link href="/expenses">
          <div className="text-sm text-primary-600 hover:underline cursor-pointer">Add expense</div>
        </Link>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-neutral-200">
        {isLoading ? (
          // Skeleton loading state
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="p-4">
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="p-4 text-center text-neutral-500">
            Failed to load expense data
          </div>
        ) : data?.expenses && data.expenses.length > 0 ? (
          data.expenses.map((expense) => (
            <div key={expense.id} className="p-4 hover:bg-neutral-50">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{expense.title}</p>
                  <p className="text-sm text-neutral-500">
                    {getCategoryText(expense.category)} • {getRelativeTime(expense.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-neutral-900">{formatPrice(expense.amount)}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-neutral-500">
            No recent expenses found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
