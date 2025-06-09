import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <LoginForm />
    </div>
  );
}
