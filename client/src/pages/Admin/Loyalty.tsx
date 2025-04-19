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
import { useForm } from 'react-hook-form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Award, Users, Activity, PlusCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// Types
interface LoyaltyCustomer {
  id: number;
  email: string;
  name: string;
  points: number;
  tier: string;
  createdAt: string;
}

interface LoyaltyActivity {
  id: number;
  customerId: number;
  customer: LoyaltyCustomer;
  points: number;
  type: string;
  source: string;
  sourceId: string | null;
  createdAt: string;
}

interface PointsAdjustmentFormData {
  email: string;
  points: number;
  type: 'earn' | 'redeem';
  reason: string;
}

const AdminLoyalty = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'customers' | 'activities'>('customers');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch loyalty customers
  const { 
    data: customers = [], 
    isLoading: isLoadingCustomers 
  } = useQuery<LoyaltyCustomer[]>({
    queryKey: ['/api/admin/loyalty/customers'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch loyalty activities
  const { 
    data: activities = [], 
    isLoading: isLoadingActivities 
  } = useQuery<LoyaltyActivity[]>({
    queryKey: ['/api/admin/loyalty/activities'],
    refetchOnWindowFocus: false,
  });
  
  // Form for adjusting points
  const pointsForm = useForm<PointsAdjustmentFormData>({
    defaultValues: {
      email: '',
      points: 100,
      type: 'earn',
      reason: ''
    }
  });
  
  // Mutation for adjusting points
  const adjustPointsMutation = useMutation({
    mutationFn: async (data: PointsAdjustmentFormData) => {
      const response = await apiRequest('POST', '/api/admin/loyalty/adjust-points', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Points Adjusted",
        description: "The customer's points have been successfully adjusted.",
      });
      setIsAdjustDialogOpen(false);
      pointsForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty/activities'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to adjust points. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmitPointsForm = (data: PointsAdjustmentFormData) => {
    adjustPointsMutation.mutate(data);
  };
  
  // Get tier icon
  const getTierIcon = (tier: string) => {
    switch(tier) {
      case 'bronze': return <Trophy className="h-4 w-4 text-amber-600" />;
      case 'silver': return <Trophy className="h-4 w-4 text-gray-400" />;
      case 'gold': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'platinum': return <Award className="h-4 w-4 text-teal-500" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Loyalty Program Management</h1>
        </div>
      
        <div className="flex flex-col space-y-4">
          {/* Tabs */}
          <div className="flex space-x-2 border-b pb-2">
            <Button
              variant={selectedTab === 'customers' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('customers')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Customers
            </Button>
            <Button
              variant={selectedTab === 'activities' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('activities')}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Activities
            </Button>
          </div>
          
          {/* Adjust Points Dialog */}
          <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
            <DialogTrigger asChild>
              <Button className="self-end flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Adjust Points
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adjust Customer Points</DialogTitle>
                <DialogDescription>
                  Add or remove points from a customer's loyalty account.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={pointsForm.handleSubmit(onSubmitPointsForm)}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      placeholder="customer@example.com"
                      className="col-span-3"
                      {...pointsForm.register('email', { required: true })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="points" className="text-right">
                      Points
                    </Label>
                    <Input
                      id="points"
                      type="number"
                      className="col-span-3"
                      {...pointsForm.register('points', { 
                        required: true,
                        valueAsNumber: true,
                        min: 1
                      })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Type
                    </Label>
                    <Select
                      defaultValue="earn"
                      onValueChange={(value) => pointsForm.setValue('type', value as 'earn' | 'redeem')}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earn">Add Points</SelectItem>
                        <SelectItem value="redeem">Remove Points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">
                      Reason
                    </Label>
                    <Input
                      id="reason"
                      placeholder="Reason for adjustment"
                      className="col-span-3"
                      {...pointsForm.register('reason', { required: true })}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={adjustPointsMutation.isPending}
                  >
                    {adjustPointsMutation.isPending ? 'Adjusting...' : 'Adjust Points'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Content based on selected tab */}
          {selectedTab === 'customers' && (
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Customers</CardTitle>
                <CardDescription>
                  Manage customer loyalty accounts and points
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCustomers ? (
                  <div className="text-center py-4">Loading customers...</div>
                ) : customers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No loyalty customers found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell className="flex items-center gap-1 capitalize">
                            {getTierIcon(customer.tier)} {customer.tier}
                          </TableCell>
                          <TableCell className="text-right">{customer.points}</TableCell>
                          <TableCell>{formatDate(customer.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
          
          {selectedTab === 'activities' && (
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Activities</CardTitle>
                <CardDescription>
                  Recent point earn and redemption activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? (
                  <div className="text-center py-4">Loading activities...</div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No loyalty activities found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">
                            {activity.customer.name}
                            <div className="text-xs text-muted-foreground">{activity.customer.email}</div>
                          </TableCell>
                          <TableCell className={activity.type === 'earn' ? 'text-green-600' : 'text-red-600'}>
                            {activity.type === 'earn' ? 'Added' : 'Redeemed'}
                          </TableCell>
                          <TableCell>{activity.points}</TableCell>
                          <TableCell>
                            <div className="capitalize">{activity.source.replace('-', ' ')}</div>
                            {activity.sourceId && (
                              <div className="text-xs text-muted-foreground">ID: {activity.sourceId}</div>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(activity.createdAt)}</TableCell>
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

export default AdminLoyalty;