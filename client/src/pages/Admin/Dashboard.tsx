import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Juice, Order } from "@shared/schema";
import { formatCurrency, getStockStatus, getStockStatusClass, formatDate } from "@/lib/utils";
import { DollarSign, ShoppingBag, Users, RefreshCcw, ArrowUp, ArrowDown, Truck, Package, Leaf } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const AdminDashboard = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

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
          <h1 className="font-heading text-2xl font-semibold mb-6">Dashboard</h1>
          
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
