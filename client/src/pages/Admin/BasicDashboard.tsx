import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Juice, Order } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const BasicDashboard = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Handle notification test
  const handleTestNotification = () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications.",
      });
      return;
    }

    if (Notification.permission === 'granted') {
      toast({
        title: "Sending notification",
        description: "Check for the notification",
      });
      
      new Notification("New Order Received", {
        body: "A customer just placed an order for Tropical Blend!",
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          handleTestNotification();
        } else {
          toast({
            title: "Permission denied",
            description: "You denied notification permission.",
          });
        }
      });
    } else {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings.",
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  // Get basic data
  const { data: juices } = useQuery<Juice[]>({
    queryKey: ['/api/juices'],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
  });

  if (!isAuthenticated) {
    return null;
  }

  // Calculate basic stats
  const totalSales = orders ? orders.reduce((total, order) => total + order.total, 0) : 0;
  const totalOrders = orders ? orders.length : 0;
  const totalProducts = juices ? juices.length : 0;

  return (
    <div className="p-4 bg-white">
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-2">Admin Dashboard</h1>
        <Button 
          onClick={handleTestNotification}
          className="w-full mb-4 bg-orange-500 text-white"
        >
          Test Notification
        </Button>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="border p-2 rounded">
            <div className="text-sm text-gray-500">Total Sales</div>
            <div className="font-bold">{formatCurrency(totalSales)}</div>
          </div>
          <div className="border p-2 rounded">
            <div className="text-sm text-gray-500">Orders</div>
            <div className="font-bold">{totalOrders}</div>
          </div>
          <div className="border p-2 rounded">
            <div className="text-sm text-gray-500">Products</div>
            <div className="font-bold">{totalProducts}</div>
          </div>
          <div className="border p-2 rounded">
            <div className="text-sm text-gray-500">Subscriptions</div>
            <div className="font-bold">187</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="font-bold mb-2">Recent Orders</h2>
        {orders && orders.length > 0 ? (
          <div className="space-y-2">
            {orders.slice(0, 3).map(order => (
              <div key={order.id} className="border rounded p-2 text-sm">
                <div className="flex justify-between mb-1">
                  <span>{order.customerName}</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No orders found</div>
        )}
      </div>

      <div className="mb-4">
        <h2 className="font-bold mb-2">Products</h2>
        {juices && juices.length > 0 ? (
          <div className="space-y-2">
            {juices.slice(0, 3).map(juice => (
              <div key={juice.id} className="border rounded p-2 text-sm">
                <div className="flex justify-between mb-1">
                  <span>{juice.name}</span>
                  <span>{formatCurrency(juice.price)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>SKU: {juice.sku}</span>
                  <span>Stock: {juice.stock}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No products found</div>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <Button 
          onClick={() => navigate('/admin/products')}
          className="w-full bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          Manage Products
        </Button>
        <Button 
          onClick={() => navigate('/admin/orders')}
          className="w-full bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          Manage Orders
        </Button>
        <Button 
          onClick={() => navigate('/admin/profile')}
          className="w-full bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          Profile
        </Button>
      </div>
    </div>
  );
};

export default BasicDashboard;