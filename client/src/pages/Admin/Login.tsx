import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Logo from "@/components/ui/logo";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AdminLogin = () => {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      try {
        // Use fetch directly to better handle session cookie processing
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for cookies
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 401) {
            throw new Error('Invalid username or password');
          } else if (response.status === 429) {
            throw new Error('Too many login attempts. Please try again later.');
          } else {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `Login failed (${response.status})`);
          }
        }
        
        return await response.json();
      } catch (error) {
        // Re-throw to be handled by onError
        throw error;
      }
    },
    onSuccess: (data) => {
      if (!data || !data.admin) {
        setError("Invalid response from server");
        return;
      }
      
      // Capture session ID for debugging if provided
      if (data.sessionId) {
        console.log("Login successful with session ID:", data.sessionId);
      }
      
      // Store admin data and set authenticated state
      login(data.admin);
      
      toast({
        title: "Login successful",
        description: "Welcome to the admin dashboard",
      });
      
      // Use setTimeout to ensure state updates before navigation
      // Increased timeout to allow session to be properly established
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 200);
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      setError(error.message || "Invalid username or password");
      toast({
        title: "Login failed",
        description: error.message || "Authentication failed. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setError(null);
    loginMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FFEDD5] to-[#FDBA74]">
      <Card className="bg-white p-8 rounded-lg card-shadow max-w-md w-full">
        <CardContent className="p-0">
          <div className="text-center mb-6">
            <h1 className="font-brand text-2xl font-bold mb-1">
              <Logo />
            </h1>
            <p className="text-gray-600">Admin Portal</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="admin" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 mt-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
              
              <div className="text-center mt-4">
                <a href="#" className="text-primary hover:underline text-sm">
                  Forgot password?
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
