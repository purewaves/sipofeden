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
              <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">iPhone Installation Guide</h3>
                <p className="text-sm mb-3">
                  Follow these steps to install the admin dashboard on your iOS device:
                </p>
                <ol className="list-decimal list-inside space-y-3 text-sm text-amber-800">
                  <li className="flex items-start">
                    <span className="mr-2">Tap the share icon</span>
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                      </svg>
                    </div>
                    <span className="ml-2">in Safari's bottom menu bar</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">Scroll down and tap</span>
                    <div className="inline-flex items-center px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      <span className="ml-1 text-xs">Add to Home Screen</span>
                    </div>
                  </li>
                  <li>
                    On the next screen, tap <span className="font-semibold">Add</span> in the top-right corner
                  </li>
                </ol>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => window.location.href='/'}
                  className="w-1/2 bg-transparent border-amber-500 hover:bg-amber-50 text-amber-600"
                >
                  Get Help
                </Button>
                <Button 
                  variant="outline" 
                  className="w-1/2" 
                  onClick={() => setShowPrompt(false)}
                >
                  I'll do it later
                </Button>
              </div>
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