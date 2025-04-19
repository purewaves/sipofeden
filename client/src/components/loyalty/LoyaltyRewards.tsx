import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

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

interface LoyaltyRewardsProps {
  rewards: LoyaltyReward[];
  customerPoints: number;
  customerId: number;
}

const LoyaltyRewards = ({ rewards, customerPoints, customerId }: LoyaltyRewardsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const redeemRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest('POST', `/api/loyalty/rewards/${rewardId}/redeem`, {
        customerId,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reward Redeemed',
        description: 'Your reward has been successfully redeemed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/rewards', customerId] });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/activities', customerId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Redemption failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const handleRedeemReward = (rewardId: number) => {
    redeemRewardMutation.mutate(rewardId);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Your Rewards</CardTitle>
        <CardDescription>
          Redeem your points for exclusive rewards and benefits
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rewards.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No rewards available yet. Keep earning points!</p>
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
                        disabled={customerPoints < reward.pointsCost || redeemRewardMutation.isPending}
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
      </CardContent>
    </Card>
  );
};

export default LoyaltyRewards;