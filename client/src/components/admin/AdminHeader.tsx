import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/ui/logo";
import { Menu, X, User, LogOut } from "lucide-react";

const AdminHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    setLocation("/admin");
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="text-2xl font-brand font-bold">
                <Logo /> Admin
            </Link>
          </div>
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/admin/dashboard" className={`font-medium ${isActive("/admin/dashboard") ? "text-primary" : "hover:text-primary"} transition-colors`}>
              Dashboard
            </Link>
            <Link href="/admin/products" className={`font-medium ${isActive("/admin/products") ? "text-primary" : "hover:text-primary"} transition-colors`}>
              Products
            </Link>
            <Link href="/admin/orders" className={`font-medium ${isActive("/admin/orders") ? "text-primary" : "hover:text-primary"} transition-colors`}>
              Orders
            </Link>
            <Link href="/admin/subscriptions" className={`font-medium ${isActive("/admin/subscriptions") ? "text-primary" : "hover:text-primary"} transition-colors`}>
              Subscriptions
            </Link>
          </nav>
          
          {/* Admin Controls */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="hidden md:flex">
                Customer View
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">Admin User</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      admin@sipofeden.com
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile">
                    <div className="cursor-pointer w-full flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/admin/dashboard"
                className={`font-medium ${isActive("/admin/dashboard") ? "text-primary" : ""} hover:text-primary transition-colors`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/products"
                className={`font-medium ${isActive("/admin/products") ? "text-primary" : ""} hover:text-primary transition-colors`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link 
                href="/admin/orders"
                className={`font-medium ${isActive("/admin/orders") ? "text-primary" : ""} hover:text-primary transition-colors`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Orders
              </Link>
              <Link 
                href="/admin/subscriptions"
                className={`font-medium ${isActive("/admin/subscriptions") ? "text-primary" : ""} hover:text-primary transition-colors`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Subscriptions
              </Link>
              <Link 
                href="/admin/profile"
                className={`font-medium ${isActive("/admin/profile") ? "text-primary" : ""} hover:text-primary transition-colors`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link 
                href="/"
                className="font-medium hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Customer View
              </Link>
              <button 
                className="font-medium hover:text-primary transition-colors cursor-pointer text-left"
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
              >
                Log Out
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
