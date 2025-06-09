import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { APP_NAME, USER_ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function MobileHeader() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  if (!user) return null;
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  const handleLogout = async () => {
    await logout();
    closeMenu();
  };
  
  // Skip debug logs
  
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
  
  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-2">
           <button
            onClick={toggleMenu}
            className="text-neutral-500 hover:text-neutral-700"
            title="Open menu"
            aria-label="Open menu"
>
            <i className="ri-menu-line text-xl" />
            </button>
    
            <div className="text-lg font-bold text-neutral-900">{APP_NAME}</div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
              <i className="ri-user-line text-neutral-700"></i>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <div 
        className={cn(
          "fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden",
          menuOpen ? "block" : "hidden"
        )}
        onClick={closeMenu}
      >
        <div 
          className={cn(
            "w-64 h-full bg-neutral-900 text-white overflow-y-auto transform transition-transform duration-300",
            menuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Logo and user info */}
          <div className="p-4 flex items-center space-x-2 border-b border-neutral-700">
            <div className="bg-primary-600 p-2 rounded-md">
              <i className="ri-printer-line text-lg"></i>
            </div>
            <div>
              <h1 className="font-bold">{APP_NAME}</h1>
              <div className="text-xs text-neutral-400">{user.role}</div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="p-4">
            <div className="mb-4">
              <p className="text-xs uppercase text-neutral-500 font-medium mb-2">Main</p>
              <ul className="space-y-1">
                {navItems.filter(item => item.roles.includes(user.role)).map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <div 
                        className={cn(
                          "flex items-center p-2 rounded-md group cursor-pointer",
                          location === item.href 
                            ? "bg-primary-800 text-white" 
                            : "hover:bg-neutral-800 text-white"
                        )}
                        onClick={closeMenu}
                      >
                        <i className={`${item.icon} mr-3 text-lg`}></i>
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Management section for admin or cashier */}
            {(user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.CASHIER) && (
              <div className="mb-4">
                <p className="text-xs uppercase text-neutral-500 font-medium mb-2">Management</p>
                <ul className="space-y-1">
                  
                  {/* Special case for Customers - always show for cashiers */}
                  {user.role === USER_ROLES.CASHIER && (
                    <li>
                      <Link href="/customers">
                        <div 
                          className={cn(
                            "flex items-center p-2 rounded-md group cursor-pointer",
                            location === "/customers" 
                              ? "bg-primary-800 text-white" 
                              : "hover:bg-neutral-800 text-white"
                          )}
                          onClick={closeMenu}
                        >
                          <i className="ri-user-star-line mr-3 text-lg"></i>
                          <span>Customers</span>
                        </div>
                      </Link>
                    </li>
                  )}
                  
                  {/* Other management items filtered by role */}
                 
                </ul>
              </div>
            )}
          </nav>
          
          {/* User info and logout */}
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
              aria-label="Log out"
              title="Log out"
              >
               <i className="ri-logout-box-r-line text-lg"></i>
              </button>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
