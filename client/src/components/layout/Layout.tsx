import { ReactNode } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isRouteAccessible } from "@/lib/utils";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  // Check if user has access to the current route
  if (user && !isRouteAccessible(location, user.role)) {
    return <Redirect to="/dashboard" />;
  }
  
  return (
    <div className="bg-neutral-50 h-screen flex overflow-hidden">
      <Sidebar />
      <MobileHeader />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 pt-16 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
