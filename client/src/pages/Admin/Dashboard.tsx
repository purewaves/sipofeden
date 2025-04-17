import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Juice, Order } from "@shared/schema";
import { formatCurrency, getStockStatus, getStockStatusClass } from "@/lib/utils";
import { DollarSign, ShoppingBag, Users, RefreshCcw, ArrowUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
