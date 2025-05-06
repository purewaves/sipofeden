import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  ClipboardList, 
  Eye, 
  PackageOpen, 
  TruckIcon 
} from 'lucide-react';

const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }) => apiRequest('PUT', `/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/orders']);
      setIsUpdateStatusDialogOpen(false);
    },
  });

  const openViewDialog = (orderId) => {
    // Fetch specific order details
    apiRequest('GET', `/api/orders/${orderId}`)
      .then((orderDetails) => {
        setCurrentOrder(orderDetails);
        setIsViewDialogOpen(true);
      })
      .catch((error) => {
        console.error('Error fetching order details:', error);
        // Handle error (show toast, etc.)
      });
  };

  const openUpdateStatusDialog = (order) => {
    setCurrentOrder(order);
    setNewStatus(order.status);
    setIsUpdateStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!currentOrder || !newStatus) return;

    updateOrderStatusMutation.mutate({
      id: currentOrder.id,
      status: newStatus,
    });
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return <div className="p-8">Loading orders...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Orders</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    {order.customerName || 'Guest Customer'}
                    <div className="text-xs text-gray-500">
                      {order.customerEmail || 'No email'}
                    </div>
                  </TableCell>
                  <TableCell>₦{(order.totalAmount / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge 
                      className={ORDER_STATUS[order.status]?.color || 'bg-gray-100 text-gray-800'}
                      variant="outline"
                    >
                      {ORDER_STATUS[order.status]?.label || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateStatusDialog(order)}
                      >
                        <ClipboardList className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {currentOrder && (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Order Information</h3>
                  <p className="mt-1"><span className="font-medium">Order ID:</span> #{currentOrder.id}</p>
                  <p><span className="font-medium">Date:</span> {formatDate(currentOrder.createdAt)}</p>
                  <p>
                    <span className="font-medium">Status: </span>
                    <Badge 
                      className={ORDER_STATUS[currentOrder.status]?.color || 'bg-gray-100'}
                      variant="outline"
                    >
                      {ORDER_STATUS[currentOrder.status]?.label || currentOrder.status}
                    </Badge>
                  </p>
                  <p><span className="font-medium">Payment Method:</span> {currentOrder.paymentMethod || 'Cash on Delivery'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
                  <p className="mt-1"><span className="font-medium">Name:</span> {currentOrder.customerName || 'Guest Customer'}</p>
                  <p><span className="font-medium">Email:</span> {currentOrder.customerEmail || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {currentOrder.customerPhone || 'N/A'}</p>
                  <p><span className="font-medium">Address:</span> {currentOrder.shippingAddress || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Order Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentOrder.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="flex items-center">
                          {item.juice?.imageUrl && (
                            <img
                              src={item.juice.imageUrl}
                              alt={item.juice.name}
                              className="h-10 w-10 mr-2 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.juice?.name || item.productName || 'Unknown Product'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₦{((item.price || item.juice?.price || 0) / 100).toFixed(2)}</TableCell>
                        <TableCell>₦{((item.price || item.juice?.price || 0) * item.quantity / 100).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between border-t pt-4">
                <div></div>
                <div className="space-y-2 text-right">
                  <p className="text-sm">
                    <span className="font-medium">Subtotal:</span> ₦{((currentOrder.totalAmount || 0) / 100).toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Shipping:</span> ₦{((currentOrder.shippingFee || 0) / 100).toFixed(2)}
                  </p>
                  <p className="text-lg font-bold">
                    <span className="font-medium">Total:</span> ₦{((currentOrder.totalAmount || 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                openUpdateStatusDialog(currentOrder);
              }}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          {currentOrder && (
            <div className="py-4">
              <p className="mb-4">
                Current Status: 
                <Badge 
                  className={`ml-2 ${ORDER_STATUS[currentOrder.status]?.color || 'bg-gray-100'}`}
                  variant="outline"
                >
                  {ORDER_STATUS[currentOrder.status]?.label || currentOrder.status}
                </Badge>
              </p>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center">
                        <PackageOpen className="h-4 w-4 mr-2" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="processing">
                      <div className="flex items-center">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Processing
                      </div>
                    </SelectItem>
                    <SelectItem value="shipped">
                      <div className="flex items-center">
                        <TruckIcon className="h-4 w-4 mr-2" />
                        Shipped
                      </div>
                    </SelectItem>
                    <SelectItem value="delivered">
                      <div className="flex items-center">
                        <TruckIcon className="h-4 w-4 mr-2" />
                        Delivered
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center">
                        <PackageOpen className="h-4 w-4 mr-2" />
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updateOrderStatusMutation.isPending || newStatus === currentOrder?.status}
            >
              {updateOrderStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders; 