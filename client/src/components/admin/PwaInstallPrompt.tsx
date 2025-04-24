import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

// PWA installation prompt component with cross-browser compatibility
const PwaInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  const { toast } = useToast();

  // Check if already installed as PWA
  useEffect(() => {
    const checkPwaStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isAppleStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone === true;
      return isStandalone || isAppleStandalone;
    };

    setIsPwa(checkPwaStatus());
  }, []);

  // Detect platform
  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(iOS);
  }, []);

  // Listen for install event (Chrome, Edge, etc.)
  useEffect(() => {
    // Check if there's a stored event in sessionStorage
    const checkForStoredEvent = () => {
      const hasStoredEvent = sessionStorage.getItem('pwaInstallEvent');
      if (hasStoredEvent === 'available') {
        // If we have a stored flag but not the actual event, 
        // we can show our UI but will need to direct users to alternative methods
        console.log("PWA install event was previously available");
        setShowPrompt(true);
      }
    };
    
    checkForStoredEvent();
    
    const handleBeforeInstallPrompt = (e: any) => {
      // Log event capture for debugging
      console.log("beforeinstallprompt event captured", e);
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      setInstallEvent(e);
      
      // Store a flag in sessionStorage so we know install is available
      sessionStorage.setItem('pwaInstallEvent', 'available');
      
      // Show our custom install prompt
      setShowPrompt(true);
    };

    // Debugging: log if the event handler is attached
    console.log("Adding beforeinstallprompt event listener");
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Also listen for appinstalled event to know when installation is successful
    const handleAppInstalled = () => {
      console.log("App was successfully installed");
      setShowPrompt(false);
      sessionStorage.removeItem('pwaInstallEvent');
      
      toast({
        title: "Installation Complete",
        description: "The admin dashboard has been successfully installed!",
      });
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  // Also detect Safari on iOS
  useEffect(() => {
    // Only show iOS prompt if not already a PWA and is on iOS
    if (!isPwa && isIos) {
      // Wait a bit to let the page load fully
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isPwa, isIos]);

  // Handle installation for browsers that support beforeinstallprompt
  const handleInstall = async () => {
    if (!installEvent) {
      console.log("No install event available.");
      
      // For debugging - attempt manual PWA installation if no event
      try {
        // Try to show an alternative install method for browsers where
        // beforeinstallprompt event might be blocked
        toast({
          title: "Installation Hint",
          description: "Look for the install icon in your browser's address bar or menu.",
          duration: 5000,
        });
        
        // In some browsers, we can directly trigger install from manifest
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          window.location.href = manifestLink.getAttribute('href') || '';
        }
      } catch (err) {
        console.error('Manual installation attempt failed:', err);
      }
      
      return;
    }

    try {
      // Show the install prompt
      installEvent.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await installEvent.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        toast({
          title: "Installation Started",
          description: "The app is being installed...",
        });
        setShowPrompt(false);
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (err) {
      console.error('Error installing app:', err);
      toast({
        title: "Installation Failed",
        description: "There was a problem installing the app. Trying alternative method...",
        variant: "destructive",
      });
      
      // Fallback to manual installation hints
      setTimeout(() => {
        toast({
          title: "Installation Alternative",
          description: "Try using your browser's 'Add to Home Screen' option from the menu.",
          duration: 8000,
        });
      }, 2000);
    }
  };

  // Only hide if it's already installed as a PWA
  // We'll still show the prompt even without an install event to provide alternative installation methods
  if (isPwa) {
    return null;
  }

  return (
    <Sheet open={showPrompt} onOpenChange={setShowPrompt}>
      <SheetContent side="bottom" className="rounded-t-lg">
        <SheetHeader className="text-left">
          <SheetTitle>Install Admin Dashboard</SheetTitle>
          <SheetDescription>
            Install the Sip of Eden Admin Dashboard for faster access and enhanced functionality.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          {isIos ? (
            <div className="space-y-4">
              <p className="text-sm">
                To install this app on your iOS device, tap the share icon <span className="inline-block px-2 py-1 border rounded">⏏️</span> and then "Add to Home Screen".
              </p>
              <img 
                src="/pwa-install-guide-ios.png" 
                alt="iOS installation guide" 
                className="max-w-xs mx-auto rounded-lg border"
              />
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowPrompt(false)}
              >
                I'll do it later
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                Installing gives you quicker access and better performance. You can manage orders and products offline too!
              </p>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowPrompt(false)}>
                  Not now
                </Button>
                <Button 
                  onClick={handleInstall} 
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  Install App
                </Button>
              </div>
              {/* Alternative installation instructions as a fallback */}
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <p className="font-medium mb-2">Alternative installation methods:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Look for an install icon (⊕) in your browser's address bar</li>
                  <li>From your browser menu, select "Install App" or "Add to Home Screen"</li>
                  <li>On desktop, click the three dots menu → More tools → Create shortcut</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PwaInstallPrompt;