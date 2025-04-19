import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Gift, History, Star, BadgeCheck } from 'lucide-react';
import LoyaltyForm from './LoyaltyForm';
import LoyaltyRewards from './LoyaltyRewards';
import { formatDate } from '@/lib/utils';

// Define types for our loyalty data
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
  points: number;
  type: string;
  source: string;
  sourceId: string | null;
  createdAt: string;
}

interface LoyaltyReward {
  id: number;
  customerId: number;
  name: string;
  description: string;
  pointsCost: number;
  isRedeemed: boolean;
  redeemedAt: string | null;
  createdAt: string;
}

interface LoyaltyTier {
  tier: string;
  minimumPoints: number;
  benefits: string[];
}

interface LoyaltyDashboardProps {
  initialEmail?: string;
}

const LoyaltyDashboard = ({ initialEmail = '' }: LoyaltyDashboardProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [showSignupForm, setShowSignupForm] = useState(false);
  
  // Fetch loyalty tiers for information display
  const { data: tiers = [] } = useQuery<LoyaltyTier[]>({
    queryKey: ['/api/loyalty/tiers'],
  });
  
  // Check if customer exists when email is provided
  const checkCustomerQuery = useQuery<LoyaltyCustomer | undefined>({
    queryKey: ['/api/loyalty/customers', email],
    queryFn: async () => {
      if (!email) return undefined;
      const res = await fetch(`/api/loyalty/customers/${encodeURIComponent(email)}`);
      if (!res.ok) return undefined;
      return res.json();
    },
    enabled: !!email && email.includes('@'),
  });
  
  // If customer data changes from the query, update our state
  useEffect(() => {
    if (checkCustomerQuery.data) {
      setCustomer(checkCustomerQuery.data);
      setShowSignupForm(false);
    }
  }, [checkCustomerQuery.data]);
  
  // Fetch loyalty activities if customer exists
  const { 
    data: activities = [],
    isLoading: isLoadingActivities 
  } = useQuery<LoyaltyActivity[]>({
    queryKey: ['/api/loyalty/activities', customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const res = await fetch(`/api/loyalty/activities/${customer.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!customer?.id,
  });
  
  // Fetch loyalty rewards if customer exists
  const { 
    data: rewards = [],
    isLoading: isLoadingRewards 
  } = useQuery<LoyaltyReward[]>({
    queryKey: ['/api/loyalty/rewards', customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const res = await fetch(`/api/loyalty/rewards/${customer.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!customer?.id,
  });
  
  // Handle email submission to check customer status
  const handleCheckStatus = () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to check your loyalty status.",
        variant: "destructive",
      });
      return;
    }
    checkCustomerQuery.refetch();
  };
  
  // Get tier icon
  const getTierIcon = (tier: string) => {
    switch(tier) {
      case 'bronze': return <Trophy className="h-5 w-5 text-amber-600" />;
      case 'silver': return <Trophy className="h-5 w-5 text-gray-400" />;
      case 'gold': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'platinum': return <Trophy className="h-5 w-5 text-teal-500" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };
  
  // Render tier progress bar
  const renderTierProgress = () => {
    if (!customer) return null;
    
    // Find current and next tier
    const currentTier = tiers.find(t => t.tier === customer.tier);
    const nextTierIndex = tiers.findIndex(t => t.tier === customer.tier) + 1;
    const nextTier = nextTierIndex < tiers.length ? tiers[nextTierIndex] : null;
    
    if (!currentTier) return null;
    
    // Calculate progress
    const pointsInCurrentTier = customer.points - currentTier.minimumPoints;
    const pointsToNextTier = nextTier 
      ? nextTier.minimumPoints - currentTier.minimumPoints 
      : 0;
    const progress = nextTier 
      ? Math.min(100, (pointsInCurrentTier / pointsToNextTier) * 100) 
      : 100;
    
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {getTierIcon(customer.tier)}
            <span className="font-medium capitalize">{customer.tier} Tier</span>
          </div>
          {nextTier && (
            <div className="text-sm text-muted-foreground">
              {pointsToNextTier - pointsInCurrentTier} points to {nextTier.tier}
            </div>
          )}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="h-2.5 rounded-full bg-primary" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {currentTier.benefits.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Your Benefits:</h4>
            <ul className="space-y-1">
              {currentTier.benefits.map((benefit, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  // Handle successful signup
  const handleSignupSuccess = (newCustomer: any) => {
    setCustomer(newCustomer);
    setShowSignupForm(false);
  };
  
  // Show customer lookup form if no customer found
  if (!customer && !showSignupForm) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="mb-4">Please enter your email to find your loyalty account</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button 
                onClick={handleCheckStatus}
                disabled={!email || checkCustomerQuery.isFetching}
              >
                {checkCustomerQuery.isFetching ? 'Checking...' : 'Check'}
              </Button>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              Not a member yet?{' '}
              <button 
                className="text-primary hover:underline"
                onClick={() => setShowSignupForm(true)}
              >
                Sign up now
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show signup form if requested
  if (showSignupForm) {
    return <LoyaltyForm onSuccess={handleSignupSuccess} />;
  }
  
  // Show customer dashboard if customer exists
  if (customer) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  {customer.name}'s Loyalty Account
                </CardTitle>
                <CardDescription>{customer.email}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{customer.points}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderTierProgress()}
          </CardContent>
        </Card>
        
        <Tabs defaultValue="rewards">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="h-4 w-4" /> Available Rewards
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" /> Points History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="rewards" className="mt-4">
            {isLoadingRewards ? (
              <div className="text-center py-6">Loading rewards...</div>
            ) : (
              <LoyaltyRewards 
                rewards={rewards} 
                customerPoints={customer.points}
                customerId={customer.id}
              />
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Points Activity</CardTitle>
                <CardDescription>
                  History of your loyalty points earned and redeemed
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingActivities ? (
                  <div className="text-center py-6">Loading activities...</div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No activity history yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {activities.map((activity) => (
                      <div key={activity.id} className="py-4 px-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium capitalize">
                              {activity.source.replace('-', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(activity.createdAt)}
                            </div>
                          </div>
                          <div className={`font-medium ${
                            activity.type === 'earn' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {activity.type === 'earn' ? '+' : '-'}{activity.points} points
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  // Fallback - shouldn't reach here in normal flow
  return null;
};

export default LoyaltyDashboard;