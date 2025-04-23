import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Juice, Order } from "@shared/schema";
import { formatCurrency, getStockStatus, getStockStatusClass } from "@/lib/utils";
import { DollarSign, ShoppingBag, Users, RefreshCcw, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const MobileDashboard = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isPwa, setIsPwa] = useState(false);

  // Check if running as PWA
  useEffect(() => {
    // Simple function to check if app is installed as PWA
    const checkIfPwa = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             (window.navigator as any).standalone === true;
    };
    setIsPwa(checkIfPwa());
  }, []);

  // Simple test notification function
  const handleTestNotification = () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission === 'granted') {
      // Show a notification
      toast({
        title: "Test notification sent",
        description: "You should receive a notification now.",
      });
      
      // Create and show a simple notification
      try {
        new Notification("New Order Received", {
          body: "A customer just placed an order for Tropical Blend!",
          icon: "/logo192.png"
        });
      } catch (err) {
        console.error("Error creating notification:", err);
        toast({
          title: "Notification failed",
          description: "Could not create notification.",
          variant: "destructive",
        });
      }
    } else if (Notification.permission !== 'denied') {
      // Request permission
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          handleTestNotification();
        } else {
          toast({
            title: "Permission denied",
            description: "You denied notification permission.",
            variant: "destructive",
          });
        }
      });
    } else {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  const { data: juices, isLoading: isLoadingJuices } = useQuery<Juice[]>({
    queryKey: ['/api/juices'],
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
  });
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();

  if (!isAuthenticated) {
    return null;
  }

  // Calculate dashboard stats
  const totalSales = orders ? orders.reduce((total, order) => total + order.total, 0) : 0;
  const totalOrders = orders ? orders.length : 0;
  const totalCustomers = orders ? new Set(orders.map(order => order.customerEmail)).size : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      
      <main className="w-full px-2 py-4">
        <section className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h1 className="font-heading text-xl font-semibold">Dashboard</h1>
            <Button 
              onClick={handleTestNotification}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              <Bell className="h-4 w-4" />
              Test Notification
            </Button>
          </div>
          
          {/* Stats Grid - 2x2 on mobile, 4x1 on larger screens */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* Total Sales Card */}
            <Card className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-xs sm:text-sm">Sales</p>
                    {isLoadingOrders ? (
                      <Skeleton className="h-6 w-16 mt-1" />
                    ) : (
                      <h2 className="text-base sm:text-lg font-semibold">{formatCurrency(totalSales)}</h2>
                    )}
                  </div>
                  <div className="text-primary text-lg bg-primary/10 p-2 rounded-full">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Orders Card */}
            <Card className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-xs sm:text-sm">Orders</p>
                    {isLoadingOrders ? (
                      <Skeleton className="h-6 w-10 mt-1" />
                    ) : (
                      <h2 className="text-base sm:text-lg font-semibold">{totalOrders}</h2>
                    )}
                  </div>
                  <div className="text-primary text-lg bg-primary/10 p-2 rounded-full">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Customers Card */}
            <Card className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-xs sm:text-sm">Customers</p>
                    {isLoadingOrders ? (
                      <Skeleton className="h-6 w-10 mt-1" />
                    ) : (
                      <h2 className="text-base sm:text-lg font-semibold">{totalCustomers}</h2>
                    )}
                  </div>
                  <div className="text-primary text-lg bg-primary/10 p-2 rounded-full">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Subscriptions Card */}
            <Card className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-xs sm:text-sm">Subscriptions</p>
                    <h2 className="text-base sm:text-lg font-semibold">187</h2>
                  </div>
                  <div className="text-primary text-lg bg-primary/10 p-2 rounded-full">
                    <RefreshCcw className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Orders - Mobile Friendly List */}
          <Card className="shadow-sm mb-4">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-base">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {isLoadingOrders ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded p-2">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.slice(0, 3).map(order => (
                    <div key={order.id} className="border rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{order.customerName}</span>
                        <span className="text-sm">{formatCurrency(order.total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full
                          ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'}
                        `}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 py-2">
                  No orders found
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Product Inventory - Mobile Friendly List */}
          <Card className="shadow-sm mb-4">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-base">Product Inventory</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {isLoadingJuices ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded p-2">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : juices && juices.length > 0 ? (
                <div className="space-y-2">
                  {juices.slice(0, 3).map(juice => (
                    <div key={juice.id} className="border rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{juice.name}</span>
                        <span className="text-sm">{formatCurrency(juice.price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">SKU: {juice.sku}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStockStatusClass(juice.stock)}`}>
                          {getStockStatus(juice.stock)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 py-2">
                  No products found
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Notification Card - Simplified */}
          <Card className="shadow-sm mb-4">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-base">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <p className="text-xs mb-3">
                Enable real-time notifications to stay updated on new orders and status changes.
              </p>
              <Button 
                onClick={handleTestNotification}
                className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                size="sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                {Notification.permission === 'granted' ? 'Test Notification' : 'Enable Notifications'}
              </Button>
            </CardContent>
          </Card>
          
          {/* Simple Sales Chart - Just one for mobile */}
          <Card className="shadow-sm">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-base">Weekly Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'W1', amount: 240000 },
                      { name: 'W2', amount: 180000 },
                      { name: 'W3', amount: 320000 },
                      { name: 'W4', amount: 350000 },
                    ]}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis 
                      tickFormatter={(value: number) => `₦${value/1000}K`}
                      fontSize={10}
                      width={40}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} />
                    <Tooltip 
                      formatter={(value: ValueType, name: NameType) => [`₦${value.toLocaleString()}`, 'Sales']}
                      labelFormatter={(label: string) => `Week ${label.substring(1)}`}
                    />
                    <Bar dataKey="amount" fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default MobileDashboard;