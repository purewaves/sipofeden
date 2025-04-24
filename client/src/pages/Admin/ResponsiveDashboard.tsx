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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ResponsiveDashboard = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  
  // Check notification status
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Handle test notification
  const handleTestNotification = () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive"
      });
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification("New Order Received", {
        body: "A customer just placed an order for Tropical Blend!",
        icon: "/icons/icon-192x192.png"
      });
      toast({
        title: "Notification sent",
        description: "Check your notification panel",
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationEnabled(true);
          new Notification("Notifications Enabled", {
            body: "You will now receive alerts for new orders",
            icon: "/icons/icon-192x192.png"
          });
          toast({
            title: "Notifications enabled",
            description: "You will now receive alerts for new orders",
          });
        } else {
          toast({
            title: "Permission denied",
            description: "You won't receive notifications",
            variant: "destructive"
          });
        }
      });
    } else {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  // Data queries
  const { data: juices, isLoading: isLoadingJuices } = useQuery<Juice[]>({
    queryKey: ['/api/juices'],
    enabled: isAuthenticated,
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  // Calculate stats
  const totalSales = orders ? orders.reduce((total, order) => total + order.total, 0) : 0;
  const totalOrders = orders ? orders.length : 0;
  const totalCustomers = orders ? new Set(orders.map(order => order.customerEmail)).size : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      
      <main className="px-3 py-4 md:container md:mx-auto md:px-4 md:py-8">
        <section>
          {/* Header with Title and Notification Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
            <Button 
              onClick={handleTestNotification}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              <Bell className="h-4 w-4 mr-2" />
              {notificationEnabled ? 'Test Notification' : 'Enable Notifications'}
            </Button>
          </div>
          
          {/* Stats Cards - 2x2 on mobile, 4x1 on larger screens */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* Total Sales Card */}
            <Card className="shadow-sm">
              <CardContent className="pt-6 pb-4 px-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Sales</p>
                    {isLoadingOrders ? (
                      <Skeleton className="h-6 w-16 mt-1" />
                    ) : (
                      <h2 className="text-base sm:text-lg font-bold">{formatCurrency(totalSales)}</h2>
                    )}
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Orders Card */}
            <Card className="shadow-sm">
              <CardContent className="pt-6 pb-4 px-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Orders</p>
                    {isLoadingOrders ? (
                      <Skeleton className="h-6 w-10 mt-1" />
                    ) : (
                      <h2 className="text-base sm:text-lg font-bold">{totalOrders}</h2>
                    )}
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Customers Card */}
            <Card className="shadow-sm">
              <CardContent className="pt-6 pb-4 px-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Customers</p>
                    {isLoadingOrders ? (
                      <Skeleton className="h-6 w-10 mt-1" />
                    ) : (
                      <h2 className="text-base sm:text-lg font-bold">{totalCustomers}</h2>
                    )}
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Subscriptions Card */}
            <Card className="shadow-sm">
              <CardContent className="pt-6 pb-4 px-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Subscriptions</p>
                    <h2 className="text-base sm:text-lg font-bold">187</h2>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <RefreshCcw className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Orders - Mobile Friendly Cards */}
          <Card className="shadow-sm mb-4">
            <CardHeader className="pb-0 pt-4 px-4">
              <CardTitle className="text-base md:text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoadingOrders ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded-md p-3">
                      <Skeleton className="h-5 w-28 mb-2" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 3).map(order => (
                    <div key={order.id} className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer" 
                         onClick={() => navigate(`/admin/orders/${order.id}`)}>
                      <div className="flex justify-between mb-1.5">
                        <span className="font-medium">{order.customerName}</span>
                        <span className="font-semibold">{formatCurrency(order.total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full
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
                  <div className="text-center pt-2">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/admin/orders')}>
                      View All Orders
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No orders found</p>
                  <p className="text-sm mt-1">Orders will appear here when customers make purchases</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Products Overview */}
          <Card className="shadow-sm mb-4">
            <CardHeader className="pb-0 pt-4 px-4">
              <CardTitle className="text-base md:text-lg">Products Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoadingJuices ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded-md p-3">
                      <Skeleton className="h-5 w-28 mb-2" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : juices && juices.length > 0 ? (
                <div className="space-y-3">
                  {juices.slice(0, 3).map(juice => (
                    <div key={juice.id} className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                         onClick={() => navigate(`/admin/products#${juice.id}`)}>
                      <div className="flex justify-between mb-1.5">
                        <span className="font-medium">{juice.name}</span>
                        <span className="font-semibold">{formatCurrency(juice.price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">SKU: {juice.sku}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full ${getStockStatusClass(juice.stock)}`}>
                          {getStockStatus(juice.stock)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/admin/products')}>
                      Manage Products
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No products found</p>
                  <p className="text-sm mt-1">Add products to your store inventory</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Weekly Sales Chart - Mobile-optimized */}
          <Card className="shadow-sm mb-4">
            <CardHeader className="pb-0 pt-4 px-4">
              <CardTitle className="text-base md:text-lg">Weekly Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'W1', amount: 240000 },
                      { name: 'W2', amount: 180000 },
                      { name: 'W3', amount: 320000 },
                      { name: 'W4', amount: 350000 },
                    ]}
                    margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis 
                      tickFormatter={(value: number) => `₦${value/1000}K`}
                      fontSize={12}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Sales']}
                      labelFormatter={(label: string) => `Week ${label.substring(1)}`}
                    />
                    <Bar dataKey="amount" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions Section */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white" 
              onClick={() => navigate('/admin/orders')}
            >
              View All Orders
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/products')}
            >
              Manage Products
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/profile')}
            >
              Profile Settings
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ResponsiveDashboard;