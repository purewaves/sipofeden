import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";

/**
 * A manual button to trigger PWA installation options
 * This component provides alternative installation methods for when the auto-prompt doesn't work
 */
const ManualPwaInstallButton = () => {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  const [installationMethod, setInstallationMethod] = useState<string | null>(null);
  
  // Check platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  
  const openInstallDialog = () => {
    // Determine the most likely installation method for this browser
    if (isIOS && isSafari) {
      setInstallationMethod("ios-safari");
    } else if (isAndroid && isChrome) {
      setInstallationMethod("android-chrome");
    } else if (isChrome) {
      setInstallationMethod("desktop-chrome");
    } else if (isFirefox) {
      setInstallationMethod("firefox");
    } else {
      setInstallationMethod("generic");
    }
    
    setShowDialog(true);
    
    // Also try programmatic installation
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        const manifestUrl = manifestLink.getAttribute('href') || '';
        // Log the attempt
        console.log("Attempting to trigger installation via manifest:", manifestUrl);
        
        // Create a dummy PWA installation trigger that might help in some browsers
        const dummyInstallEvent = new CustomEvent('pwa-install-attempt', { 
          detail: { 
            manifestUrl 
          }
        });
        window.dispatchEvent(dummyInstallEvent);
        
        // In some scenarios, focusing on the manifest helps trigger browser UI
        if (!isIOS) {
          // Don't navigate away on iOS as it disrupts the experience
          const manifestFrame = document.createElement('iframe');
          manifestFrame.style.display = 'none';
          manifestFrame.src = manifestUrl;
          document.body.appendChild(manifestFrame);
          setTimeout(() => {
            document.body.removeChild(manifestFrame);
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Error attempting programmatic installation:", err);
    }
  };
  
  const getInstallInstructions = () => {
    switch (installationMethod) {
      case "ios-safari":
        return (
          <ol className="list-decimal list-inside space-y-3 my-4">
            <li>Tap the <span className="px-2 py-1 border rounded">⏏️</span> share icon at the bottom of your browser</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong> in the top-right corner</li>
          </ol>
        );
        
      case "android-chrome":
        return (
          <ol className="list-decimal list-inside space-y-3 my-4">
            <li>Tap the <strong>⋮</strong> (three dots) menu in the top-right corner</li>
            <li>Select <strong>Add to Home screen</strong></li>
            <li>Tap <strong>Add</strong> when prompted</li>
          </ol>
        );
        
      case "desktop-chrome":
        return (
          <ol className="list-decimal list-inside space-y-3 my-4">
            <li>Click the <strong>⋮</strong> (three dots) menu in the top-right corner</li>
            <li>Select <strong>More tools</strong> → <strong>Create shortcut</strong></li>
            <li>Check <strong>Open as window</strong> for app-like experience</li>
            <li>Click <strong>Create</strong></li>
          </ol>
        );
        
      case "firefox":
        return (
          <ol className="list-decimal list-inside space-y-3 my-4">
            <li>Click the <strong>⋮</strong> (three dots) menu in the top-right corner</li>
            <li>Look for <strong>Install Sip of Eden Admin</strong> option</li>
            <li>If not available, use the address bar installation icon</li>
          </ol>
        );
        
      default:
        return (
          <ol className="list-decimal list-inside space-y-3 my-4">
            <li>Look for an installation icon in your browser's address bar</li>
            <li>Check your browser's menu for "Install App" or "Add to Home Screen"</li>
            <li>On most desktop browsers, use the menu → More tools → Create shortcut</li>
          </ol>
        );
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={openInstallDialog}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Install Admin App
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install the Admin Dashboard</DialogTitle>
            <DialogDescription>
              Follow these instructions to install the Sip of Eden Admin Dashboard on your device:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {getInstallInstructions()}
            
            <p className="text-sm text-gray-600">
              Installing the app will give you offline access, push notifications for new orders, 
              and a more responsive experience.
            </p>
            
            <div className="flex justify-end">
              <Button onClick={() => setShowDialog(false)}>
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManualPwaInstallButton;