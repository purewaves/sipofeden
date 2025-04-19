import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Gift, History, Star, BadgeCheck, ChevronRight } from 'lucide-react';
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

const LoyaltyPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showSignupForm, setShowSignupForm] = useState(true);
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  
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
    data: activities = [] 
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
    data: rewards = [] 
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
  
  // Create new loyalty customer
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const res = await apiRequest('POST', '/api/loyalty/customers', data);
      return res.json();
    },
    onSuccess: (data) => {
      setCustomer(data);
      setShowSignupForm(false);
      toast({
        title: 'Welcome to our Loyalty Program!',
        description: 'You\'ve been registered successfully and earned your first points.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/customers', email] });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Redeem a reward
  const redeemRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest('POST', `/api/loyalty/rewards/${rewardId}/redeem`, {
        customerId: customer?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reward Redeemed',
        description: 'Your reward has been successfully redeemed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/rewards', customer?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/customers', email] });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/activities', customer?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Redemption failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Handle form submission for registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both your name and email address.',
        variant: 'destructive',
      });
      return;
    }
    registerMutation.mutate({ email, name });
  };
  
  // Handle reward redemption
  const handleRedeemReward = (rewardId: number) => {
    redeemRewardMutation.mutate(rewardId);
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
  
  // Get icon based on tier
  const getTierIcon = (tier: string) => {
    switch(tier) {
      case 'bronze': return <Trophy className="h-5 w-5 text-amber-600" />;
      case 'silver': return <Trophy className="h-5 w-5 text-gray-400" />;
      case 'gold': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'platinum': return <Trophy className="h-5 w-5 text-teal-500" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Loyalty Program | Sip of Eden</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Sip of Eden Loyalty Program</h1>
            <p className="text-muted-foreground md:text-lg">Earn points with every purchase and enjoy exclusive rewards and benefits</p>
          </div>
          
          {showSignupForm ? (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Join Our Loyalty Program</CardTitle>
                <CardDescription>
                  Sign up to start earning points and unlock exclusive rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Your Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? 'Signing Up...' : 'Join Now'}
                  </Button>
                </form>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already a member?{' '}
                    <button 
                      className="text-primary hover:underline"
                      onClick={() => {
                        if (email) {
                          checkCustomerQuery.refetch();
                        } else {
                          toast({
                            title: 'Email Required',
                            description: 'Please enter your email address to check your loyalty status.',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      Check your status
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : customer ? (
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
                
                <TabsContent value="rewards" className="space-y-4 mt-4">
                  {rewards.length === 0 ? (
                    <div className="text-center py-8">
                      <Gift className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="mt-4 text-muted-foreground">No rewards available yet. Keep earning points!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {rewards.map((reward) => (
                        <Card key={reward.id} className={reward.isRedeemed ? 'bg-gray-50' : ''}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{reward.name}</CardTitle>
                            <CardDescription>{reward.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div className="font-medium">
                                {reward.pointsCost} points
                              </div>
                              {reward.isRedeemed ? (
                                <div className="text-sm text-muted-foreground">
                                  Redeemed {reward.redeemedAt ? formatDate(reward.redeemedAt) : ''}
                                </div>
                              ) : (
                                <Button 
                                  size="sm"
                                  onClick={() => handleRedeemReward(reward.id)}
                                  disabled={customer.points < reward.pointsCost || redeemRewardMutation.isPending}
                                >
                                  Redeem
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="history" className="mt-4">
                  <Card>
                    <CardContent className="p-0">
                      {activities.length === 0 ? (
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
          ) : (
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
                      onClick={() => checkCustomerQuery.refetch()}
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
          )}
          
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-6">Loyalty Tiers and Benefits</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {tiers.map((tier) => (
                <Card key={tier.tier} className="overflow-hidden">
                  <div className={`py-2 px-4 text-white font-medium capitalize text-center ${
                    tier.tier === 'bronze' ? 'bg-amber-600' :
                    tier.tier === 'silver' ? 'bg-gray-400' :
                    tier.tier === 'gold' ? 'bg-yellow-500' :
                    'bg-teal-500'
                  }`}>
                    {tier.tier} Tier
                  </div>
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      <div className="text-muted-foreground text-sm">Start at</div>
                      <div className="text-2xl font-bold">{tier.minimumPoints} points</div>
                    </div>
                    
                    <ul className="space-y-2">
                      {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoyaltyPage;