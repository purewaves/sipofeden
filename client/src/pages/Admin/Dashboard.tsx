import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Juice, Order, AdminNotificationSubscription } from "@shared/schema";
import { formatCurrency, getStockStatus, getStockStatusClass, formatDate } from "@/lib/utils";
import { DollarSign, ShoppingBag, Users, RefreshCcw, ArrowUp, ArrowDown, Truck, Package, Leaf, Bell, Trash2, Smartphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { sendTestNotification, isPwaInstalled } from "@/lib/serviceWorker";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const AdminDashboard = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isPwa, setIsPwa] = useState(false);

  // Check if running as PWA
  useEffect(() => {
    setIsPwa(isPwaInstalled());
  }, []);

  // Handle notification test
  // Enhanced notification handling with robust fallbacks
  const handleTestNotification = () => {
    // Simulate a notification if we're in an environment that doesn't support notifications
    // This function ensures a notification-like experience for all users
    const showSimulatedNotification = () => {
      // First show a toast about the simulation
      toast({
        title: "Simulated Notification",
        description: "This environment doesn't fully support native notifications. Using simulated notifications instead.",
        duration: 3000,
      });
      
      // Then after a short delay, show the actual simulated notification content
      setTimeout(() => {
        toast({
          title: "📋 New Order Received",
          description: "A customer just placed an order for Tropical Blend! Check the orders page for details.",
          duration: 5000,
        });
      }, 3500);
    };
    
    // First check if service workers are available
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported in this browser');
      showSimulatedNotification();
      return;
    }
    
    // Then check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Notifications API not supported in this browser');
      showSimulatedNotification();
      return;
    }
    
    // Check notification permission status
    if (Notification.permission === 'granted') {
      // We have permission, try to send a real notification
      sendTestNotification()
        .then(() => {
          toast({
            title: "Notification sent",
            description: "A test notification has been sent to your device!",
          });
        })
        .catch(error => {
          console.error('Error sending notification:', error);
          // Fall back to a simulated notification
          showSimulatedNotification();
        });
    } else if (Notification.permission === 'denied') {
      // Permission was explicitly denied
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings to receive order alerts.",
        variant: "destructive",
        duration: 5000,
      });
      
      // Still show a simulated notification after a delay so user sees what they're missing
      setTimeout(showSimulatedNotification, 1000);
    } else {
      // Permission hasn't been requested yet, let's ask
      Notification.requestPermission()
        .then(permission => {
          if (permission === 'granted') {
            // User granted permission, send a notification
            return sendTestNotification()
              .then(() => {
                toast({
                  title: "Notification permission granted!",
                  description: "You will now receive notifications for new orders.",
                });
              });
          } else {
            // User denied permission
            toast({
              title: "Notification permission denied",
              description: "You'll still receive simulated notifications within the app.",
              variant: "default",
            });
            
            // Show a simulated notification
            setTimeout(showSimulatedNotification, 1000);
          }
        })
        .catch(error => {
          console.error('Error requesting notification permission:', error);
          showSimulatedNotification();
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
  
  // Query for notification subscriptions
  const { data: notificationSubscriptions, isLoading: isLoadingSubscriptions, refetch: refetchSubscriptions } = useQuery<AdminNotificationSubscription[]>({
    queryKey: ['/api/admin/notifications/subscriptions'],
    enabled: isAuthenticated,
  });
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Mutation for deleting notification subscriptions
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response = await apiRequest(
        'DELETE',
        `/api/admin/notifications/subscriptions/${subscriptionId}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/subscriptions'] });
      toast({
        title: "Subscription removed",
        description: "The notification subscription has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove subscription: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle subscription deletion
  const handleDeleteSubscription = (subscriptionId: number) => {
    deleteSubscriptionMutation.mutate(subscriptionId);
  };

  if (!isAuthenticated) {
    return null;
  }

  // Calculate dashboard stats
  const totalSales = orders ? orders.reduce((total, order) => total + order.total, 0) : 0;
  const totalOrders = orders ? orders.length : 0;
  const totalCustomers = orders ? new Set(orders.map(order => order.customerEmail)).size : 0;
  const subscriptionCount = 187; // Mocked data since we don't have subscriptions in orders

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
            <Button 
              onClick={handleTestNotification}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
            >
              <Bell className="h-4 w-4" />
              Test PWA Notification
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Total Sales Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Total Sales</p>
                    {isLoadingOrders ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <h2 className="text-2xl font-semibold">{formatCurrency(totalSales)}</h2>
                    )}
                  </div>
                  <div className="text-primary text-xl">
                    <DollarSign />
                  </div>
                </div>
                <p className="text-green-500 text-sm mt-2">
                  <ArrowUp className="h-3 w-3 inline mr-1" />
                  12% from last month
                </p>
              </CardContent>
            </Card>
            
            {/* Orders Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Orders</p>
                    {isLoadingOrders ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <h2 className="text-2xl font-semibold">{totalOrders}</h2>
                    )}
                  </div>
                  <div className="text-primary text-xl">
                    <ShoppingBag />
                  </div>
                </div>
                <p className="text-green-500 text-sm mt-2">
                  <ArrowUp className="h-3 w-3 inline mr-1" />
                  8% from last month
                </p>
              </CardContent>
            </Card>
            
            {/* Customers Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Customers</p>
                    {isLoadingOrders ? (
                      <Skeleton className="h-8 w-20 mt-1" />
                    ) : (
                      <h2 className="text-2xl font-semibold">{totalCustomers}</h2>
                    )}
                  </div>
                  <div className="text-primary text-xl">
                    <Users />
                  </div>
                </div>
                <p className="text-green-500 text-sm mt-2">
                  <ArrowUp className="h-3 w-3 inline mr-1" />
                  5% from last month
                </p>
              </CardContent>
            </Card>
            
            {/* Subscriptions Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Subscriptions</p>
                    <h2 className="text-2xl font-semibold">{subscriptionCount}</h2>
                  </div>
                  <div className="text-primary text-xl">
                    <RefreshCcw />
                  </div>
                </div>
                <p className="text-green-500 text-sm mt-2">
                  <ArrowUp className="h-3 w-3 inline mr-1" />
                  15% from last month
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders Table */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-semibold mb-4">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full whitespace-nowrap">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Order ID</th>
                        <th className="px-4 py-2 text-left">Customer</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingOrders ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                          </tr>
                        ))
                      ) : orders && orders.length > 0 ? (
                        orders.slice(0, 5).map((order) => (
                          <tr key={order.id} className="border-b">
                            <td className="px-4 py-3">#{order.id}</td>
                            <td className="px-4 py-3">{order.customerName}</td>
                            <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                            <td className="px-4 py-3">
                              <span className={`
                                px-2 py-1 rounded-full text-xs
                                ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 
                                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-gray-100 text-gray-800'}
                              `}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                            No orders found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            {/* Product Inventory Table */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-semibold mb-4">Product Inventory</h2>
                <div className="overflow-x-auto">
                  <table className="w-full whitespace-nowrap">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-left">SKU</th>
                        <th className="px-4 py-2 text-left">Price</th>
                        <th className="px-4 py-2 text-left">Stock</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingJuices ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                          </tr>
                        ))
                      ) : juices && juices.length > 0 ? (
                        juices.slice(0, 5).map((juice) => (
                          <tr key={juice.id} className="border-b">
                            <td className="px-4 py-3">{juice.name}</td>
                            <td className="px-4 py-3">{juice.sku}</td>
                            <td className="px-4 py-3">{formatCurrency(juice.price)}</td>
                            <td className="px-4 py-3">{juice.stock}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStockStatusClass(juice.stock)}`}>
                                {getStockStatus(juice.stock)}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                            No products found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* PWA Notification Management Card */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Admin Notification Management</CardTitle>
                <CardDescription>Manage your order notification subscriptions for this PWA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm mb-3">
                    When installed as a PWA, the admin dashboard can receive real-time notifications about new orders and status changes. 
                    Subscribe your devices to stay informed even when you're not actively using the app.
                  </p>
                  <Button 
                    onClick={handleTestNotification}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 w-full md:w-auto"
                    variant="default"
                  >
                    <Bell className="h-4 w-4" />
                    {Notification.permission === 'granted' ? 'Test Notification' : 'Enable Notifications'}
                  </Button>
                </div>
                <div className="overflow-x-auto mt-4">
                  <h3 className="text-md font-medium mb-2">Active Device Subscriptions</h3>
                  {isLoadingSubscriptions ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-md">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <div className="flex-1">
                            <Skeleton className="h-5 w-36 mb-1" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : notificationSubscriptions && notificationSubscriptions.length > 0 ? (
                    <div className="space-y-2">
                      {notificationSubscriptions.map((subscription) => (
                        <div key={subscription.id} className="flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50">
                          <div className="rounded-md bg-gray-100 p-2">
                            <Smartphone className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{subscription.deviceName || 'Unknown Device'}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(subscription.createdAt).toLocaleDateString()} · 
                              {subscription.active ? 
                                <span className="text-green-600 ml-1">Active</span> : 
                                <span className="text-gray-500 ml-1">Inactive</span>
                              }
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubscription(subscription.id)}
                            disabled={deleteSubscriptionMutation.isPending}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 border rounded-md">
                      <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No notification subscriptions found</p>
                      <p className="text-sm mt-1">Click "Enable Notifications" to receive order notifications</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Charts Section */}
          <div className="mt-8">
            <h2 className="font-heading text-xl font-semibold mb-4">Analytics</h2>
            
            <Tabs defaultValue="sales" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="sales">Sales Trends</TabsTrigger>
                <TabsTrigger value="products">Product Performance</TabsTrigger>
                <TabsTrigger value="orders">Order Status</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sales">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Sales</CardTitle>
                    <CardDescription>Sales performance over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { month: 'Jan', sales: 320000 },
                            { month: 'Feb', sales: 450000 },
                            { month: 'Mar', sales: 410000 },
                            { month: 'Apr', sales: 480000 },
                            { month: 'May', sales: 520000 },
                            { month: 'Jun', sales: 610000 },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis 
                            tickFormatter={(value) => `₦${value/1000}k`}
                          />
                          <Tooltip 
                            formatter={(value) => [`₦${new Intl.NumberFormat('en-NG').format(value)}`, 'Sales']} 
                            labelFormatter={(label) => `Month: ${label}`}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="products">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Best Selling Juices</CardTitle>
                      <CardDescription>Top juices by sales volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Green Detox', sales: 240 },
                              { name: 'Liquid Sunset', sales: 195 },
                              { name: 'Tropical Wave', sales: 163 },
                              { name: 'Immunity Shot', sales: 120 },
                              { name: 'Zen Cleanse', sales: 87 },
                            ]}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="sales" name="Units Sold" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales by Category</CardTitle>
                      <CardDescription>Distribution of sales by juice category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Detox', value: 420 },
                                { name: 'Immunity', value: 380 },
                                { name: 'Energy Booster', value: 210 },
                                { name: 'Wellness', value: 190 },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#0088FE" />
                              <Cell fill="#00C49F" />
                              <Cell fill="#FFBB28" />
                              <Cell fill="#FF8042" />
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} units`, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                    <CardDescription>Current status of all orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Delivered', value: 63, fill: '#4ade80' },
                              { name: 'Shipped', value: 18, fill: '#60a5fa' },
                              { name: 'Processing', value: 12, fill: '#facc15' },
                              { name: 'Pending', value: 7, fill: '#94a3b8' },
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={true}
                          />
                          <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
