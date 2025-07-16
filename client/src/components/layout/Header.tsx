import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShoppingCart, MessageCircle, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toggleCart, cartItems } = useCart();
  const { user, logoutMutation } = useAuth();
  
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="text-2xl font-brand font-bold cursor-pointer">
                <Logo />
              </div>
            </Link>
          </div>
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/">
              <div className="font-medium hover:text-primary transition-colors cursor-pointer">Home</div>
            </Link>
            <Link href="/shop">
              <div className="font-medium hover:text-primary transition-colors cursor-pointer">Shop</div>
            </Link>
            <Link href="/subscribe">
              <div className="font-medium hover:text-primary transition-colors cursor-pointer">Subscribe</div>
            </Link>
            <Link href="/juice-chat">
              <div className="font-medium hover:text-primary transition-colors cursor-pointer flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" /> Juice Chat
              </div>
            </Link>
          </nav>
          
          {/* Cart, Auth, and Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={toggleCart}
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>

            {/* Authentication Actions - Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Hi, {user.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-1" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <nav className="flex flex-col space-y-3">
              <Link href="/">
                <div className="font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </div>
              </Link>
              <Link href="/shop">
                <div className="font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                  Shop
                </div>
              </Link>
              <Link href="/subscribe">
                <div className="font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                  Subscribe
                </div>
              </Link>
              <Link href="/juice-chat">
                <div className="font-medium hover:text-primary transition-colors cursor-pointer flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                  <MessageCircle className="h-4 w-4 mr-1" /> Juice Chat
                </div>
              </Link>
              <Link href="/admin">
                <div className="font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                  Admin
                </div>
              </Link>
              
              {/* Mobile Authentication */}
              {user ? (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Hi, {user.name}</div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={logoutMutation.isPending}
                    className="w-full justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-200">
                  <Link href="/auth">
                    <div className="font-medium hover:text-primary transition-colors cursor-pointer flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                      <User className="h-4 w-4 mr-1" />
                      Login
                    </div>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
