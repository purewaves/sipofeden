import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LoyaltyFormProps {
  onSuccess?: (data: any) => void;
}

const LoyaltyForm = ({ onSuccess }: LoyaltyFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const res = await apiRequest('POST', '/api/loyalty/customers', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Welcome to our Loyalty Program!',
        description: "You've been registered successfully and earned your first points.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/customers'] });
      setEmail('');
      setName('');
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Our Loyalty Program</CardTitle>
        <CardDescription>
          Sign up to start earning points and unlock exclusive rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
      </CardContent>
    </Card>
  );
};

export default LoyaltyForm;