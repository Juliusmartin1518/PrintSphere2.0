import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { APP_NAME, USER_ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function MobileMenu() {
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
  
  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-2">
         <button
          onClick={toggleMenu}
          className="text-neutral-500 hover:text-neutral-700"
          title="Toggle menu"
           aria-label="Toggle menu"
>
  <i className="ri-menu-line text-xl"></i>
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
                {/* Dashboard */}
                <li>
                  <Link href="/dashboard">
                    <div 
                      className={cn(
                        "flex items-center p-2 rounded-md group cursor-pointer",
                        location === "/dashboard" 
                          ? "bg-primary-800 text-white" 
                          : "hover:bg-neutral-800 text-white"
                      )}
                      onClick={closeMenu}
                    >
                      <i className="ri-dashboard-line mr-3 text-lg"></i>
                      <span>Dashboard</span>
                    </div>
                  </Link>
                </li>
                
                {/* POS - for admin and cashier */}
                {(user.role === "admin" || user.role === "cashier") && (
                  <li>
                    <Link href="/pos">
                      <div 
                        className={cn(
                          "flex items-center p-2 rounded-md group cursor-pointer",
                          location === "/pos" 
                            ? "bg-primary-800 text-white" 
                            : "hover:bg-neutral-800 text-white"
                        )}
                        onClick={closeMenu}
                      >
                        <i className="ri-shopping-cart-line mr-3 text-lg"></i>
                        <span>POS</span>
                      </div>
                    </Link>
                  </li>
                )}
                
                {/* Orders - for all roles */}
                <li>
                  <Link href="/orders">
                    <div 
                      className={cn(
                        "flex items-center p-2 rounded-md group cursor-pointer",
                        location === "/orders" 
                          ? "bg-primary-800 text-white" 
                          : "hover:bg-neutral-800 text-white"
                      )}
                      onClick={closeMenu}
                    >
                      <i className="ri-file-list-3-line mr-3 text-lg"></i>
                      <span>Orders</span>
                    </div>
                  </Link>
                </li>
                
                {/* Inventory - for admin and staff */}
                {(user.role === "admin" || user.role === "staff") && (
                  <li>
                    <Link href="/inventory">
                      <div 
                        className={cn(
                          "flex items-center p-2 rounded-md group cursor-pointer",
                          location === "/inventory" 
                            ? "bg-primary-800 text-white" 
                            : "hover:bg-neutral-800 text-white"
                        )}
                        onClick={closeMenu}
                      >
                        <i className="ri-stack-line mr-3 text-lg"></i>
                        <span>Inventory</span>
                      </div>
                    </Link>
                  </li>
                )}
                
                {/* Services - admin only */}
                {user.role === "admin" && (
                  <li>
                    <Link href="/services">
                      <div 
                        className={cn(
                          "flex items-center p-2 rounded-md group cursor-pointer",
                          location === "/services" 
                            ? "bg-primary-800 text-white" 
                            : "hover:bg-neutral-800 text-white"
                        )}
                        onClick={closeMenu}
                      >
                        <i className="ri-settings-3-line mr-3 text-lg"></i>
                        <span>Services</span>
                      </div>
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            
            {/* Management section - admin or cashier */}
            {(user.role === "admin" || user.role === "cashier") && (
              <div className="mb-4">
                <p className="text-xs uppercase text-neutral-500 font-medium mb-2">Management</p>
                <ul className="space-y-1">
                  {/* Users - admin only */}
                  {user.role === "admin" && (
                    <li>
                      <Link href="/users">
                        <div 
                          className={cn(
                            "flex items-center p-2 rounded-md group cursor-pointer",
                            location === "/users" 
                              ? "bg-primary-800 text-white" 
                              : "hover:bg-neutral-800 text-white"
                          )}
                          onClick={closeMenu}
                        >
                          <i className="ri-user-line mr-3 text-lg"></i>
                          <span>Users</span>
                        </div>
                      </Link>
                    </li>
                  )}
                  
                  {/* Customers - admin and cashier */}
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
                  
                  {/* Expenses - admin only */}
                  {user.role === "admin" && (
                    <li>
                      <Link href="/expenses">
                        <div 
                          className={cn(
                            "flex items-center p-2 rounded-md group cursor-pointer",
                            location === "/expenses" 
                              ? "bg-primary-800 text-white" 
                              : "hover:bg-neutral-800 text-white"
                          )}
                          onClick={closeMenu}
                        >
                          <i className="ri-money-dollar-circle-line mr-3 text-lg"></i>
                          <span>Expenses</span>
                        </div>
                      </Link>
                    </li>
                  )}
                  
                  {/* Reports - admin only */}
                  {user.role === "admin" && (
                    <li>
                      <Link href="/reports">
                        <div 
                          className={cn(
                            "flex items-center p-2 rounded-md group cursor-pointer",
                            location === "/reports" 
                              ? "bg-primary-800 text-white" 
                              : "hover:bg-neutral-800 text-white"
                          )}
                          onClick={closeMenu}
                        >
                          <i className="ri-bar-chart-line mr-3 text-lg"></i>
                          <span>Reports</span>
                        </div>
                      </Link>
                    </li>
                  )}
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
              title="Logout"
              aria-label="Logout"
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