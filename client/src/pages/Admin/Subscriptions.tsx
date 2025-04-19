import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Package, CalendarRange } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

// Types
interface Subscription {
  id: number;
  name: string;
  description: string;
  price: number;
  frequency: string;
  features: string[];
  createdAt: string;
}

interface Bundle {
  id: number;
  name: string;
  description: string;
  price: number;
  juiceIds: number[];
  imageUrl: string;
  createdAt: string;
}

interface SubscriptionFormData {
  name: string;
  description: string;
  price: number;
  frequency: string;
  features: string;
}

interface BundleFormData {
  name: string;
  description: string;
  price: number;
  juiceIds: string;
  imageUrl: string;
}

const AdminSubscriptions = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'subscriptions' | 'bundles'>('subscriptions');
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [isBundleDialogOpen, setIsBundleDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subscription | Bundle | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch subscriptions
  const { 
    data: subscriptions = [], 
    isLoading: isLoadingSubscriptions 
  } = useQuery<Subscription[]>({
    queryKey: ['/api/admin/subscriptions'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch bundles
  const { 
    data: bundles = [], 
    isLoading: isLoadingBundles 
  } = useQuery<Bundle[]>({
    queryKey: ['/api/admin/bundles'],
    refetchOnWindowFocus: false,
  });
  
  // Subscription form
  const subscriptionForm = useForm<SubscriptionFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      frequency: 'weekly',
      features: ''
    }
  });
  
  // Bundle form
  const bundleForm = useForm<BundleFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      juiceIds: '',
      imageUrl: ''
    }
  });
  
  // Save subscription mutation
  const saveSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData & { id?: number }) => {
      const features = data.features.split('\n').filter(f => f.trim() !== '');
      const payload = { ...data, features };
      
      if (editingItem && 'frequency' in editingItem) {
        const response = await apiRequest('PUT', `/api/admin/subscriptions/${editingItem.id}`, payload);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/admin/subscriptions', payload);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Subscription Updated" : "Subscription Created",
        description: editingItem 
          ? "The subscription has been successfully updated."
          : "The subscription has been successfully created.",
      });
      setIsSubscriptionDialogOpen(false);
      subscriptionForm.reset();
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save subscription. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Save bundle mutation
  const saveBundleMutation = useMutation({
    mutationFn: async (data: BundleFormData & { id?: number }) => {
      const juiceIds = data.juiceIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const payload = { ...data, juiceIds };
      
      if (editingItem && !('frequency' in editingItem)) {
        const response = await apiRequest('PUT', `/api/admin/bundles/${editingItem.id}`, payload);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/admin/bundles', payload);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Bundle Updated" : "Bundle Created",
        description: editingItem 
          ? "The bundle has been successfully updated."
          : "The bundle has been successfully created.",
      });
      setIsBundleDialogOpen(false);
      bundleForm.reset();
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bundles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save bundle. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Delete subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/subscriptions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Deleted",
        description: "The subscription has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Delete bundle mutation
  const deleteBundleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/bundles/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bundle Deleted",
        description: "The bundle has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bundles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bundle. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle subscription form submission
  const onSubmitSubscriptionForm = (data: SubscriptionFormData) => {
    saveSubscriptionMutation.mutate(
      editingItem && 'frequency' in editingItem 
        ? { ...data, id: editingItem.id } 
        : data
    );
  };
  
  // Handle bundle form submission
  const onSubmitBundleForm = (data: BundleFormData) => {
    saveBundleMutation.mutate(
      editingItem && !('frequency' in editingItem)
        ? { ...data, id: editingItem.id }
        : data
    );
  };
  
  // Open edit subscription dialog
  const handleEditSubscription = (subscription: Subscription) => {
    setEditingItem(subscription);
    subscriptionForm.reset({
      name: subscription.name,
      description: subscription.description,
      price: subscription.price,
      frequency: subscription.frequency,
      features: subscription.features.join('\n')
    });
    setIsSubscriptionDialogOpen(true);
  };
  
  // Open edit bundle dialog
  const handleEditBundle = (bundle: Bundle) => {
    setEditingItem(bundle);
    bundleForm.reset({
      name: bundle.name,
      description: bundle.description,
      price: bundle.price,
      juiceIds: bundle.juiceIds.join(','),
      imageUrl: bundle.imageUrl
    });
    setIsBundleDialogOpen(true);
  };
  
  // Open add subscription dialog
  const handleAddSubscription = () => {
    setEditingItem(null);
    subscriptionForm.reset({
      name: '',
      description: '',
      price: 0,
      frequency: 'weekly',
      features: ''
    });
    setIsSubscriptionDialogOpen(true);
  };
  
  // Open add bundle dialog
  const handleAddBundle = () => {
    setEditingItem(null);
    bundleForm.reset({
      name: '',
      description: '',
      price: 0,
      juiceIds: '',
      imageUrl: ''
    });
    setIsBundleDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Subscription & Bundle Management</h1>
        </div>
      
        <div className="flex flex-col space-y-4">
          {/* Tabs */}
          <div className="flex space-x-2 border-b pb-2">
            <Button
              variant={selectedTab === 'subscriptions' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('subscriptions')}
              className="flex items-center gap-2"
            >
              <CalendarRange className="h-4 w-4" />
              Subscriptions
            </Button>
            <Button
              variant={selectedTab === 'bundles' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('bundles')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Bundles
            </Button>
          </div>
          
          {/* Subscription Dialog */}
          <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem && 'frequency' in editingItem ? 'Edit Subscription' : 'Add Subscription'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem && 'frequency' in editingItem 
                    ? 'Update the details of this subscription plan.'
                    : 'Create a new subscription plan for your customers.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={subscriptionForm.handleSubmit(onSubmitSubscriptionForm)}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Weekly Detox Plan"
                      {...subscriptionForm.register('name', { required: true })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of this subscription"
                      {...subscriptionForm.register('description', { required: true })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price (₦)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        {...subscriptionForm.register('price', { 
                          required: true,
                          valueAsNumber: true,
                          min: 0
                        })}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Input
                        id="frequency"
                        placeholder="e.g. weekly, monthly"
                        {...subscriptionForm.register('frequency', { required: true })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="features">Features (one per line)</Label>
                    <Textarea
                      id="features"
                      placeholder="3 juices per week&#10;Free delivery&#10;Weekly menu selection"
                      className="min-h-[100px]"
                      {...subscriptionForm.register('features')}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={saveSubscriptionMutation.isPending}
                  >
                    {saveSubscriptionMutation.isPending ? 'Saving...' : 'Save Subscription'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Bundle Dialog */}
          <Dialog open={isBundleDialogOpen} onOpenChange={setIsBundleDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem && !('frequency' in editingItem) ? 'Edit Bundle' : 'Add Bundle'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem && !('frequency' in editingItem)
                    ? 'Update the details of this juice bundle.'
                    : 'Create a new juice bundle for your customers.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={bundleForm.handleSubmit(onSubmitBundleForm)}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bundleName">Name</Label>
                    <Input
                      id="bundleName"
                      placeholder="e.g. Weekend Cleanse Bundle"
                      {...bundleForm.register('name', { required: true })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="bundleDescription">Description</Label>
                    <Textarea
                      id="bundleDescription"
                      placeholder="Brief description of this bundle"
                      {...bundleForm.register('description', { required: true })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="bundlePrice">Price (₦)</Label>
                    <Input
                      id="bundlePrice"
                      type="number"
                      placeholder="0.00"
                      {...bundleForm.register('price', { 
                        required: true,
                        valueAsNumber: true,
                        min: 0
                      })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="bundleJuiceIds">Juice IDs (comma separated)</Label>
                    <Input
                      id="bundleJuiceIds"
                      placeholder="e.g. 1, 2, 3"
                      {...bundleForm.register('juiceIds', { required: true })}
                    />
                    <p className="text-xs text-muted-foreground">Enter the IDs of juices to include in this bundle, separated by commas</p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="bundleImageUrl">Image URL</Label>
                    <Input
                      id="bundleImageUrl"
                      placeholder="URL to bundle image"
                      {...bundleForm.register('imageUrl')}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={saveBundleMutation.isPending}
                  >
                    {saveBundleMutation.isPending ? 'Saving...' : 'Save Bundle'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Content based on selected tab */}
          {selectedTab === 'subscriptions' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Subscription Plans</CardTitle>
                  <CardDescription>
                    Manage recurring juice subscription plans
                  </CardDescription>
                </div>
                <Button onClick={handleAddSubscription} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Plan
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingSubscriptions ? (
                  <div className="text-center py-4">Loading subscriptions...</div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No subscription plans found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell className="font-medium">{subscription.name}</TableCell>
                          <TableCell>{subscription.description}</TableCell>
                          <TableCell>{formatCurrency(subscription.price)}</TableCell>
                          <TableCell className="capitalize">{subscription.frequency}</TableCell>
                          <TableCell>
                            <ul className="list-disc list-inside text-sm">
                              {subscription.features.slice(0, 2).map((feature, index) => (
                                <li key={index}>{feature}</li>
                              ))}
                              {subscription.features.length > 2 && (
                                <li className="text-muted-foreground">+{subscription.features.length - 2} more</li>
                              )}
                            </ul>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleEditSubscription(subscription)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => deleteSubscriptionMutation.mutate(subscription.id)}
                                disabled={deleteSubscriptionMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
          
          {selectedTab === 'bundles' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Juice Bundles</CardTitle>
                  <CardDescription>
                    Manage one-time purchase juice bundles
                  </CardDescription>
                </div>
                <Button onClick={handleAddBundle} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Bundle
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingBundles ? (
                  <div className="text-center py-4">Loading bundles...</div>
                ) : bundles.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No bundles found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Juices</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bundles.map((bundle) => (
                        <TableRow key={bundle.id}>
                          <TableCell className="font-medium">{bundle.name}</TableCell>
                          <TableCell>{bundle.description}</TableCell>
                          <TableCell>{formatCurrency(bundle.price)}</TableCell>
                          <TableCell>{bundle.juiceIds.length} juices</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleEditBundle(bundle)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => deleteBundleMutation.mutate(bundle.id)}
                                disabled={deleteBundleMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;