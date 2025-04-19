import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import Logo from "@/components/ui/logo";

const Footer = () => {
  return (
    <footer className="bg-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-brand text-xl font-bold mb-4">
              <Logo />
            </h3>
            <p className="text-gray-600 mb-4">
              Bringing nature's goodness to your doorstep, for now.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              <li><Link href="/shop"><div className="text-gray-600 hover:text-primary transition-colors cursor-pointer">All Juices</div></Link></li>
              <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Bundles</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Juice Cards (coming soon)</a></li>
              <li><Link href="/loyalty"><div className="text-gray-600 hover:text-primary transition-colors cursor-pointer">Loyalty Program</div></Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold mb-4">Help</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold mb-4">About</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Our Story</a></li>
              <li><Link href="/admin"><div className="text-gray-600 hover:text-primary transition-colors cursor-pointer">Admin</div></Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Sip of Eden. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
