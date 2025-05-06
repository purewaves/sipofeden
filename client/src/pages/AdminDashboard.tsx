import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { BadgeCheck, ChevronUp, ShoppingBag, Truck, Users } from 'lucide-react';

const AdminDashboard = () => {
  const { data: juices = [] } = useQuery({
    queryKey: ['/api/juices'],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Calculate some stats
  const totalJuices = juices.length;
  const totalOrders = orders.length;
  const recentOrders = orders.slice(0, 5);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  
  // Calculate revenue
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJuices}</div>
            <p className="text-xs text-muted-foreground">
              {totalJuices > 0 ? "+2 added this week" : "No products yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders > 0 ? "Requires attention" : "No pending orders"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders > 0 ? totalOrders : 0}</div>
            <p className="text-xs text-muted-foreground">
              {totalOrders > 0 ? "+3 since last week" : "No customers yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Recent customer orders for tracking and management
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer?.name || "Guest Customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{(order.totalAmount / 100).toFixed(2)}</p>
                      <p className={`text-sm ${
                        order.status === 'completed' ? 'text-green-500' : 
                        order.status === 'pending' ? 'text-yellow-500' : 
                        'text-gray-500'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>
              Order and product performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="orders">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
              </TabsList>
              <TabsContent value="orders" className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Total Orders</p>
                    <p className="font-bold">{totalOrders}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Pending</p>
                    <p className="font-medium">{pendingOrders}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Completed</p>
                    <p className="font-medium">{completedOrders}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Average Order Value</p>
                    <p className="font-medium">
                      ₦{totalOrders > 0 ? ((totalRevenue / totalOrders) / 100).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="products" className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Total Products</p>
                    <p className="font-bold">{totalJuices}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Top Selling</p>
                    <p className="font-medium">
                      {juices.length > 0 ? juices[0].name : "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Low Stock</p>
                    <p className="font-medium">
                      {juices.filter(j => j.stock < 10).length} products
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard; 