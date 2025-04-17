import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShoppingCart } from "lucide-react";
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
              <a className="text-2xl font-brand font-bold">
                <Logo />
              </a>
            </Link>
          </div>
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/">
              <a className="font-medium hover:text-primary transition-colors">Home</a>
            </Link>
            <Link href="/shop">
              <a className="font-medium hover:text-primary transition-colors">Shop</a>
            </Link>
            <Link href="/subscribe">
              <a className="font-medium hover:text-primary transition-colors">Subscribe</a>
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
                <a className="font-medium hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </a>
              </Link>
              <Link href="/shop">
                <a className="font-medium hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Shop
                </a>
              </Link>
              <Link href="/subscribe">
                <a className="font-medium hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Subscribe
                </a>
              </Link>
              <Link href="/admin">
                <a className="font-medium hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Admin
                </a>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
