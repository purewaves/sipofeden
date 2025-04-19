import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Gift, Zap, ArrowRight } from 'lucide-react';

// Types
interface LoyaltyCustomer {
  id: number;
  email: string;
  name: string;
  points: number;
  tier: string;
  createdAt: string;
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

interface LoyaltyRewardsProps {
  customer: LoyaltyCustomer;
  rewards: LoyaltyReward[];
  isLoading: boolean;
}

const LoyaltyRewards = ({ customer, rewards, isLoading }: LoyaltyRewardsProps) => {
  const { toast } = useToast();
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  // Generate available rewards based on points
  const availableRewards = [
    {
      description: "Free juice on your next visit",
      pointsRequired: 500,
      id: null
    },
    {
      description: "₦2,000 off your next order",
      pointsRequired: 1000,
      id: null
    },
    {
      description: "One day juice cleanse (50% off)",
      pointsRequired: 2500,
      id: null
    },
    {
      description: "One week of free delivery",
      pointsRequired: 5000,
      id: null
    },
  ];

  // Redeem a reward
  const redeemReward = async (reward: { description: string, pointsRequired: number }) => {
    if (customer.points < reward.pointsRequired) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.pointsRequired - customer.points} more points to redeem this reward.`,
        variant: "destructive"
      });
      return;
    }

    try {
      // First create the reward
      const createResponse = await apiRequest('POST', '/api/loyalty/rewards', {
        customerId: customer.id,
        description: reward.description,
        pointsRequired: reward.pointsRequired,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Expires in 30 days
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create reward");
      }

      const newReward = await createResponse.json();
      setRedeemingId(newReward.id);

      // Then redeem it
      const redeemResponse = await apiRequest('POST', `/api/loyalty/rewards/${newReward.id}/redeem`);
      if (!redeemResponse.ok) {
        throw new Error("Failed to redeem reward");
      }

      await redeemResponse.json();

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/rewards', customer.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/activities', customer.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/customers', customer.email] });

      toast({
        title: "Reward Redeemed",
        description: "Your reward has been successfully redeemed!",
      });
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast({
        title: "Redemption Failed",
        description: "Failed to redeem your reward. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="h-6 w-6" />
          Rewards
        </h3>
        <p className="text-muted-foreground">Redeem your points for exclusive rewards</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading rewards...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Available rewards */}
          {availableRewards.map((reward, index) => {
            const isRedeemed = rewards.some(r => 
              r.description === reward.description && 
              r.pointsRequired === reward.pointsRequired &&
              r.redeemed
            );
            
            const isRedeeming = redeemingId === reward.id;
            const canRedeem = customer.points >= reward.pointsRequired;
            
            return (
              <Card key={index} className={`relative overflow-hidden ${isRedeemed ? 'opacity-70' : ''}`}>
                {isRedeemed && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 text-xs font-bold">
                    REDEEMED
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{reward.pointsRequired} Points</span>
                    <Zap className={`h-5 w-5 ${canRedeem ? 'text-yellow-500' : 'text-gray-400'}`} />
                  </CardTitle>
                  <CardDescription>Reward</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p>{reward.description}</p>
                    <Button 
                      className="w-full"
                      disabled={isRedeemed || isRedeeming || !canRedeem}
                      onClick={() => redeemReward(reward)}
                    >
                      {isRedeeming 
                        ? 'Redeeming...' 
                        : isRedeemed 
                          ? 'Redeemed' 
                          : canRedeem 
                            ? 'Redeem Reward' 
                            : `Need ${reward.pointsRequired - customer.points} more points`
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Already redeemed rewards */}
      {rewards.length > 0 && (
        <div className="mt-8">
          <h4 className="text-xl font-semibold mb-4">Your Redeemed Rewards</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.filter(r => r.redeemed).map((reward) => (
              <Card key={reward.id} className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{reward.pointsRequired} Points</CardTitle>
                  <CardDescription>Redeemed Reward</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p>{reward.description}</p>
                    {reward.redeemedAt && (
                      <p className="text-xs text-muted-foreground">
                        Redeemed on {new Date(reward.redeemedAt).toLocaleDateString()}
                      </p>
                    )}
                    {reward.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        Expires on {new Date(reward.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <Button variant="outline" className="flex items-center gap-2">
          <span>Earn more points with your next purchase</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default LoyaltyRewards;