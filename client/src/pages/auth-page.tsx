import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Shield, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type EmailForm = z.infer<typeof emailSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, sendOtpMutation, verifyOtpMutation, registerMutation } = useAuth();
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [currentName, setCurrentName] = useState<string>("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", name: "" },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const handleSendOtp = async (data: EmailForm) => {
    try {
      await sendOtpMutation.mutateAsync({ email: data.email });
      setCurrentEmail(data.email);
      setShowOtpInput(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    try {
      await registerMutation.mutateAsync({ email: data.email, name: data.name });
      setCurrentEmail(data.email);
      setCurrentName(data.name);
      setShowOtpInput(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleVerifyOtp = async (data: OtpForm) => {
    try {
      await verifyOtpMutation.mutateAsync({ 
        email: currentEmail, 
        otp: data.otp,
        name: activeTab === "register" ? currentName : undefined
      });
      setLocation("/");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetToEmailInput = () => {
    setShowOtpInput(false);
    setCurrentEmail("");
    setCurrentName("");
    otpForm.reset();
  };

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Hero Section */}
        <div className="text-center lg:text-left space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Welcome to <span className="text-green-600">Sip of Eden</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Discover our premium collection of organic cold-pressed juices. 
              Fresh, nutritious, and delivered to your door.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                🧃
              </div>
              <h3 className="font-semibold text-gray-900">Organic</h3>
              <p className="text-sm text-gray-600">100% organic ingredients</p>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                🚚
              </div>
              <h3 className="font-semibold text-gray-900">Fresh</h3>
              <p className="text-sm text-gray-600">Cold-pressed daily</p>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                🎯
              </div>
              <h3 className="font-semibold text-gray-900">Delivered</h3>
              <p className="text-sm text-gray-600">Right to your door</p>
            </div>
          </div>
        </div>

        {/* Authentication Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {showOtpInput ? "Enter Verification Code" : "Get Started"}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {showOtpInput 
                  ? `We sent a 6-digit code to ${currentEmail}`
                  : "Enter your email to login or create an account"
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!showOtpInput ? (
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Login
                    </TabsTrigger>
                    <TabsTrigger value="register" className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Register
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4 mt-6">
                    <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email Address</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          {...emailForm.register("email")}
                          className="h-11"
                        />
                        {emailForm.formState.errors.email && (
                          <p className="text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11" 
                        disabled={sendOtpMutation.isPending}
                      >
                        {sendOtpMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Code...</>
                        ) : (
                          <><Mail className="w-4 h-4 mr-2" /> Send Login Code</>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4 mt-6">
                    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Full Name</Label>
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Your Name"
                          {...registerForm.register("name")}
                          className="h-11"
                        />
                        {registerForm.formState.errors.name && (
                          <p className="text-sm text-red-600">{registerForm.formState.errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email Address</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="your@email.com"
                          {...registerForm.register("email")}
                          className="h-11"
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
                        ) : (
                          <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              ) : (
                <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      {...otpForm.register("otp")}
                      className="h-11 text-center text-2xl tracking-widest"
                    />
                    {otpForm.formState.errors.otp && (
                      <p className="text-sm text-red-600">{otpForm.formState.errors.otp.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11" 
                    disabled={verifyOtpMutation.isPending}
                  >
                    {verifyOtpMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                    ) : (
                      <><Shield className="w-4 h-4 mr-2" /> Verify Code</>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>

            {showOtpInput && (
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  onClick={resetToEmailInput}
                  className="w-full"
                >
                  Back to Email Input
                </Button>
                <p className="text-sm text-gray-500 text-center">
                  Didn't receive the code? Check your spam folder or try again.
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}