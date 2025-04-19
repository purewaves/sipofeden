import { useEffect, useState } from 'react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Gift, Activity, Award } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import LoyaltyForm from './LoyaltyForm';
import LoyaltyRewards from './LoyaltyRewards';
import { apiRequest } from '@/lib/queryClient';

// Import types
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
  customer: LoyaltyCustomer;
}

interface LoyaltyReward {
  id: number;
  customerId: number;
  description: string;
  pointsRequired: number;
  redeemed: boolean;
  redeemedAt: string | null;
  expiresAt: string | null;
}

interface LoyaltyTier {
  tier: string;
  minimumPoints: number;
  benefits: string[];
}

const LoyaltyDashboard = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Get loyalty tiers
  const { data: tiers } = useQuery<LoyaltyTier[]>({
    queryKey: ['/api/loyalty/tiers'],
    enabled: true
  });

  // Get customer activities when customer is loaded
  const { data: activities, isLoading: activitiesLoading } = useQuery<LoyaltyActivity[]>({
    queryKey: ['/api/loyalty/activities', customer?.id],
    enabled: !!customer?.id
  });

  // Get customer rewards when customer is loaded
  const { data: rewards, isLoading: rewardsLoading } = useQuery<LoyaltyReward[]>({
    queryKey: ['/api/loyalty/rewards', customer?.id],
    enabled: !!customer?.id
  });

  // Get progress to next tier
  const getProgressToNextTier = () => {
    if (!customer || !tiers) return { progress: 0, nextTier: null, pointsNeeded: 0 };

    // Find current tier and next tier
    const sortedTiers = [...tiers].sort((a, b) => a.minimumPoints - b.minimumPoints);
    const currentTierIndex = sortedTiers.findIndex(t => t.tier === customer.tier);
    
    // If already at highest tier
    if (currentTierIndex === sortedTiers.length - 1) {
      return { progress: 100, nextTier: null, pointsNeeded: 0 };
    }
    
    const currentTier = sortedTiers[currentTierIndex];
    const nextTier = sortedTiers[currentTierIndex + 1];
    
    const pointsNeeded = nextTier.minimumPoints - customer.points;
    const totalPointsToNextTier = nextTier.minimumPoints - currentTier.minimumPoints;
    const progress = Math.min(100, Math.floor(((customer.points - currentTier.minimumPoints) / totalPointsToNextTier) * 100));
    
    return { progress, nextTier, pointsNeeded };
  };

  // Lookup customer by email
  const lookupCustomer = async () => {
    if (!email || !email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsLookingUp(true);
    try {
      const response = await apiRequest('GET', `/api/loyalty/customers/${encodeURIComponent(email.trim())}`);
      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      console.error('Error looking up customer:', error);
      toast({
        title: "Customer Not Found",
        description: "No loyalty account found with this email. Would you like to register?",
        variant: "destructive",
        action: (
          <button 
            className="bg-primary text-white px-3 py-1 rounded-md text-xs"
            onClick={() => setIsRegistering(true)}
          >
            Register
          </button>
        )
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Get tier display information
  const getTierInfo = (tier: string) => {
    switch(tier) {
      case 'bronze':
        return { color: 'bg-amber-600', icon: <Trophy className="h-6 w-6" /> };
      case 'silver':
        return { color: 'bg-gray-400', icon: <Trophy className="h-6 w-6" /> };
      case 'gold':
        return { color: 'bg-yellow-500', icon: <Trophy className="h-6 w-6" /> };
      case 'platinum':
        return { color: 'bg-teal-500', icon: <Award className="h-6 w-6" /> };
      default:
        return { color: 'bg-gray-500', icon: <Trophy className="h-6 w-6" /> };
    }
  };

  // Calculate progress
  const { progress, nextTier, pointsNeeded } = customer ? getProgressToNextTier() : { progress: 0, nextTier: null, pointsNeeded: 0 };
  const tierInfo = customer ? getTierInfo(customer.tier) : { color: '', icon: null };

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-3xl font-bold mb-6">Sip of Eden Loyalty Program</h2>
      
      {!customer ? (
        <div className="max-w-md mx-auto">
          {isRegistering ? (
            <LoyaltyForm onSuccess={(newCustomer) => {
              setCustomer(newCustomer);
              setIsRegistering(false);
              toast({
                title: "Registration Successful",
                description: "Your loyalty account has been created!",
              });
            }} 
            onCancel={() => setIsRegistering(false)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Points</CardTitle>
                <CardDescription>Earn points with every purchase and unlock rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="email"
                        type="email"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                      <button
                        className="bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 rounded-md disabled:opacity-50"
                        onClick={lookupCustomer}
                        disabled={isLookingUp}
                      >
                        {isLookingUp ? 'Looking up...' : 'Check Points'}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => setIsRegistering(true)}
                >
                  Not registered? Join our loyalty program
                </button>
              </CardFooter>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Info Card */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-2xl">{customer.name}</CardTitle>
                <CardDescription>{customer.email}</CardDescription>
              </div>
              <div className={`rounded-full ${tierInfo.color} p-2 text-white`}>
                {tierInfo.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Points</div>
                    <div className="text-3xl font-bold">{customer.points}</div>
                  </div>
                  <Badge variant="outline" className="text-lg capitalize font-semibold px-4 py-1">
                    {customer.tier} Tier
                  </Badge>
                </div>
                
                {nextTier && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to {nextTier.tier}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Earn {pointsNeeded} more points to reach {nextTier.tier} tier
                    </p>
                  </div>
                )}
                
                {/* Benefits */}
                <div className="pt-4">
                  <h3 className="font-semibold mb-2">Your Benefits</h3>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    {tiers?.find(t => t.tier === customer.tier)?.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Card */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex justify-between border-b pb-2">
                      <div>
                        <div className="text-sm font-medium">
                          {activity.type === 'earn' ? 'Earned' : 'Redeemed'} {activity.points} points
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {activity.source.replace('-', ' ')}
                          {activity.sourceId && ` #${activity.sourceId}`}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(activity.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No activity yet
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Rewards */}
          {customer && (
            <div className="md:col-span-3">
              <LoyaltyRewards customer={customer} rewards={rewards || []} isLoading={rewardsLoading} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoyaltyDashboard;