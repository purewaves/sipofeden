import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

/**
 * A manual PWA installation button that provides detailed instructions
 * for installing the app on different devices and browsers.
 * This is particularly useful for iOS where the standard install prompt may not work.
 */
const ManualPwaInstallButton = () => {
  const [open, setOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  const { toast } = useToast();

  // Detect platform and check if already installed as PWA
  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const android = /android/i.test(ua);
    
    setIsIos(iOS);
    setIsAndroid(android);
    
    // Check if already running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isAppleStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone === true;
    setIsPwa(isStandalone || isAppleStandalone);
  }, []);

  const handleManualInstall = () => {
    try {
      // For browsers that might support adding to home screen via the manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        const manifestUrl = manifestLink.getAttribute('href') || '';
        console.log("Attempting to trigger installation via manifest:", manifestUrl);
        
        // On some browsers, navigating to the manifest might trigger the install
        setTimeout(() => {
          // Show the installation dialog after attempting the manifest approach
          setOpen(true);
        }, 500);
      } else {
        setOpen(true);
      }
    } catch (err) {
      console.error('Error during manual install attempt:', err);
      setOpen(true);
    }
  };

  // Don't show if already running as PWA
  if (isPwa) {
    return null;
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="flex items-center gap-2 text-sm" 
        onClick={handleManualInstall}
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Install Admin Dashboard</DialogTitle>
            <DialogDescription>
              Follow these device-specific instructions to install the Sip of Eden Admin Dashboard
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            {isIos && (
              <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">iPhone Installation Steps</h3>
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
            )}
            
            {isAndroid && (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Android Installation Steps</h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-green-800">
                  <li>
                    Look for the install prompt at the bottom of your screen
                  </li>
                  <li className="flex items-start">
                    <span>If no prompt appears, tap the menu icon</span>
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm mx-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                      </svg>
                    </div>
                    <span>in Chrome</span>
                  </li>
                  <li>
                    Select <span className="font-semibold">Install app</span> or <span className="font-semibold">Add to Home screen</span>
                  </li>
                </ol>
              </div>
            )}
            
            {!isIos && !isAndroid && (
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Desktop Installation Steps</h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span>Look for the install icon</span>
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm mx-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                    </div>
                    <span>in your browser's address bar</span>
                  </li>
                  <li>
                    Click on it and select <span className="font-semibold">Install</span>
                  </li>
                  <li>
                    Alternatively, from Chrome menu <span className="font-semibold">⋮</span> select:
                    <div className="ml-6 mt-1">
                      More tools → Create shortcut → <span className="font-semibold">✓</span> Open as window → Create
                    </div>
                  </li>
                </ol>
              </div>
            )}
            
            <div className="mt-4 border-t pt-4">
              <p className="text-sm text-gray-500 mb-3">
                After installation, you can access the app directly from your home screen 
                or desktop without opening a browser.
              </p>
              <Button className="w-full" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManualPwaInstallButton;