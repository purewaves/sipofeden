import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Home, Package, ShoppingCart, Users, BarChart3, LogOut } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { isAuthenticated, logout } = useAuth();
  const [location, navigate] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/admin");
  };
  
  // If not authenticated, don't render the layout
  if (!isAuthenticated) {
    return null;
  }
  
  // Navigation items
  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <Home className="h-5 w-5" /> },
    { label: "Products", href: "/admin/products", icon: <Package className="h-5 w-5" /> },
    { label: "Orders", href: "/admin/orders", icon: <ShoppingCart className="h-5 w-5" /> },
    { label: "Loyalty", href: "/admin/loyalty", icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <Link href="/admin/dashboard">
              <div className="flex items-center gap-2 cursor-pointer">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Admin Panel</h1>
              </div>
            </Link>
          </div>
          <div className="flex flex-col flex-grow">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <div className={`mr-3 ${isActive ? "text-primary" : ""}`}>
                        {item.icon}
                      </div>
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center py-2"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm py-2 px-4 flex items-center justify-between">
        <Link href="/admin/dashboard">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin</h1>
          </div>
        </Link>
        <div className="flex space-x-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`p-2 rounded-md ${
                  location === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600"
                }`}
              >
                {item.icon}
              </div>
            </Link>
          ))}
          <button
            className="p-2 text-gray-600 rounded-md hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;