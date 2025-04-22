import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X, Download, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
}

const PwaInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Force show the prompt for admin users (for testing purposes)
  // Remove this in production when the real install prompt is working
  useEffect(() => {
    // Check if we're in the admin section
    const isAdminPage = window.location.pathname.startsWith('/admin');
    
    // Check if the app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    // Don't show install prompt if already installed
    if (isAppInstalled) {
      return;
    }

    if (isAdminPage) {
      // Show prompt automatically after 3 seconds for admin users
      const timer = setTimeout(() => {
        // Only show if we're not already showing it from the event handler
        if (!isVisible) {
          setIsVisible(true);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Regular PWA install prompt handling
  useEffect(() => {
    // Store the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Enhanced install button click with better fallbacks
  const handleInstall = async () => {
    if (installPrompt) {
      // We have a stored prompt from the beforeinstallprompt event
      try {
        // Show the install prompt
        await installPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const choiceResult = await installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          toast({
            title: "Installation successful!",
            description: "You can now access the admin dashboard from your home screen.",
          });
          
          // Hide the prompt after successful installation
          setIsVisible(false);
        } else {
          toast({
            title: "Installation dismissed",
            description: "You can install the app later from the menu.",
            variant: "default",
          });
          
          // Keep prompt visible for a while longer in case user wants to reconsider
          setTimeout(() => setIsVisible(false), 5000);
        }
      } catch (err) {
        console.error('Error during installation:', err);
        toast({
          title: "Installation error",
          description: "There was a problem installing the app. Please try again.",
          variant: "destructive",
        });
        
        // Keep visible in case of error so user can try again
        setTimeout(() => {
          toast({
            title: "Try manual installation",
            description: "Try installing from your browser's menu if automatic installation fails",
            duration: 6000,
          });
        }, 2000);
      }
      
      // Reset the prompt variable
      setInstallPrompt(null);
    } else {
      // Provide detailed browser-specific instructions for manual installation
      const browser = detectBrowser();
      let installInstructions = "In your browser menu, look for 'Install' or 'Add to Home Screen' option";
      
      // Provide more specific instructions based on detected browser
      if (browser === 'chrome') {
        installInstructions = "Click the menu (⋮) in the top right, then select 'Install Sip of Eden Admin'";
      } else if (browser === 'edge') {
        installInstructions = "Click the menu (...) in the top right, then select 'Apps' → 'Install this site as an app'";
      } else if (browser === 'firefox') {
        installInstructions = "Look for the home icon in the address bar and click it to install";
      } else if (browser === 'safari') {
        installInstructions = "Tap the share icon, then scroll down and tap 'Add to Home Screen'";
      }
      
      toast({
        title: "Manual installation required",
        description: installInstructions,
        duration: 8000,
      });
      
      // Show a second toast after a delay with the benefits
      setTimeout(() => {
        toast({
          title: "Benefits of installation",
          description: "Installing gives you offline access and notifications for new orders",
          duration: 6000,
        });
      }, 8500);
      
      // Keep visible but update state to show we've provided instructions
      setIsVisible(true);
    }
  };
  
  // Simple browser detection function
  const detectBrowser = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.indexOf('chrome') > -1 && userAgent.indexOf('edge') === -1) {
      return 'chrome';
    } else if (userAgent.indexOf('edge') > -1 || userAgent.indexOf('edg') > -1) {
      return 'edge';
    } else if (userAgent.indexOf('firefox') > -1) {
      return 'firefox';
    } else if (userAgent.indexOf('safari') > -1 && userAgent.indexOf('chrome') === -1) {
      return 'safari';
    } else {
      return 'other';
    }
  };

  // Skip the installation
  const handleDismiss = () => {
    setIsVisible(false);
    
    // Save to localStorage to avoid showing again in this session
    localStorage.setItem('pwaInstallPromptDismissed', Date.now().toString());
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-right-5 duration-500">
      <Card className="w-[320px] bg-white shadow-xl border-orange-200">
        <CardHeader className="pb-2 relative">
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
          <CardTitle className="text-lg font-semibold text-orange-600 flex items-center gap-2">
            <Download className="h-5 w-5" /> Install Admin App
          </CardTitle>
          <CardDescription>Get quick access to the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-start gap-4">
            <div className="bg-orange-100 p-2 rounded-full">
              <Bell className="h-6 w-6 text-orange-500" />
            </div>
            <p className="text-sm text-gray-600">
              Install this application on your device to get quick access and receive real-time order notifications!
            </p>
          </div>
          <div className="mt-4 space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-orange-400 rounded-full"></span>
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-orange-400 rounded-full"></span>
              <span>Push notifications for new orders</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-orange-400 rounded-full"></span>
              <span>No browser tabs needed</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleDismiss} className="w-1/2">
            Later
          </Button>
          <Button className="w-1/2 bg-orange-500 hover:bg-orange-600" size="sm" onClick={handleInstall}>
            Install Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PwaInstallPrompt;