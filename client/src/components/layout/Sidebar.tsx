import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { APP_NAME, USER_ROLES } from "@/lib/constants";

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  roles: string[];
  userRole: string;
}

function NavItem({ href, icon, label, active, roles, userRole }: NavItemProps) {
  // Check if the current user has access to this item
  if (!roles.includes(userRole)) return null;
  
  return (
    <li>
      <Link href={href}>
        <div className={cn(
          "flex items-center p-2 rounded-md group cursor-pointer",
          active 
            ? "bg-primary-800 text-white" 
            : "hover:bg-neutral-800 text-white"
        )}>
          <i className={`${icon} mr-3 text-lg`}></i>
          <span>{label}</span>
        </div>
      </Link>
    </li>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  
  if (!user) return null;
  
  const navItems = [
    { 
      href: "/dashboard", 
      icon: "ri-dashboard-line", 
      label: "Dashboard",
      roles: [USER_ROLES.ADMIN, USER_ROLES.CASHIER, USER_ROLES.STAFF]
    },
    { 
      href: "/pos", 
      icon: "ri-shopping-cart-line", 
      label: "POS",
      roles: [USER_ROLES.ADMIN, USER_ROLES.CASHIER]
    },
    { 
      href: "/orders", 
      icon: "ri-file-list-3-line", 
      label: "Orders",
      roles: [USER_ROLES.ADMIN, USER_ROLES.CASHIER, USER_ROLES.STAFF]
    },
    { 
      href: "/inventory", 
      icon: "ri-stack-line", 
      label: "Inventory",
      roles: [USER_ROLES.ADMIN, USER_ROLES.STAFF]
    },
    { 
      href: "/services", 
      icon: "ri-settings-3-line", 
      label: "Services",
      roles: [USER_ROLES.ADMIN]
    }
  ];
  
  const managementItems = [
    { 
      href: "/users", 
      icon: "ri-user-line", 
      label: "Users",
      roles: [USER_ROLES.ADMIN]
    },
    {
      href: "/customers",
      icon: "ri-user-star-line",
      label: "Customers",
      roles: [USER_ROLES.ADMIN, USER_ROLES.CASHIER]
    },
    { 
      href: "/expenses", 
      icon: "ri-money-dollar-circle-line", 
      label: "Expenses",
      roles: [USER_ROLES.ADMIN]
    },
    { 
      href: "/reports", 
      icon: "ri-bar-chart-line", 
      label: "Reports",
      roles: [USER_ROLES.ADMIN]
    }
  ];
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <aside className="w-64 bg-neutral-900 text-white hidden md:flex flex-col flex-shrink-0 overflow-y-auto">
      <div className="p-4 flex items-center space-x-2 border-b border-neutral-700">
        <div className="bg-primary-600 p-2 rounded-md">
          <i className="ri-printer-line text-lg"></i>
        </div>
        <div>
          <h1 className="font-bold">{APP_NAME}</h1>
          <div className="text-xs text-neutral-400">{user.role}</div>
        </div>
      </div>
      
      <nav className="p-4 flex-1">
        <div className="mb-4">
          <p className="text-xs uppercase text-neutral-500 font-medium mb-2">Main</p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={location === item.href}
                roles={item.roles}
                userRole={user.role}
              />
            ))}
          </ul>
        </div>
        
        {/* Show management section for admin or cashier (for customer management) */}
        {(user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.CASHIER) && (
          <div className="mb-4">
            <p className="text-xs uppercase text-neutral-500 font-medium mb-2">Management</p>
            <ul className="space-y-1">
              {managementItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={location === item.href}
                  roles={item.roles}
                  userRole={user.role}
                />
              ))}
            </ul>
          </div>
        )}
      </nav>
      
      <div className="p-4 mt-auto border-t border-neutral-700">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-neutral-700 flex items-center justify-center">
            <i className="ri-user-line text-white"></i>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-neutral-400">{user.role}</div>
          </div>
          <button 
            className="text-neutral-400 hover:text-white"
            onClick={handleLogout}
            aria-label="Logout"
            >
           <i className="ri-logout-box-r-line text-lg" />
          </button>
        </div>
      </div>
    </aside>
  );
}
