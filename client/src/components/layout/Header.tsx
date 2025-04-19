import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShoppingCart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { useCart } from "@/hooks/useCart";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toggleCart, cartItems } = useCart();
  
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
            <Link href="/loyalty">
              <div className="font-medium hover:text-primary transition-colors cursor-pointer">Loyalty</div>
            </Link>
            <Link href="/juice-chat">
              <div className="font-medium hover:text-primary transition-colors cursor-pointer flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" /> Juice Chat
              </div>
            </Link>
          </nav>
          
          {/* Cart and Mobile Menu */}
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
              <Link href="/loyalty">
                <div className="font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                  Loyalty
                </div>
              </Link>
              <Link href="/admin">
                <div className="font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                  Admin
                </div>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
